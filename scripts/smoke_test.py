"""Life check / smoke test for the Mustard Finances API.

Runs against a LIVE, running server over HTTP. It first confirms the app is
alive (GET /health), then exercises a full create -> read -> transfer ->
soft-delete flow and a couple of negative cases, and finally cleans up the
records it created.

Usage (server must be running, e.g. `fastapi dev backend/main.py`):

    python scripts/smoke_test.py
    python scripts/smoke_test.py http://localhost:8000
    BASE_URL=http://127.0.0.1:8000 python scripts/smoke_test.py

Exit codes:
    0  all checks passed
    1  one or more checks failed (or a critical step aborted the flow)
    2  server unreachable / not alive (liveness gate failed)
"""

import os
import sys

import httpx

BASE_URL = (
    sys.argv[1]
    if len(sys.argv) > 1
    else os.environ.get("BASE_URL", "http://localhost:8000")
)

_passed = 0
_failed = 0


class SmokeAbort(Exception):
    """Raised when a critical step fails so the dependent flow stops cleanly."""


def _record(ok: bool, name: str, detail: str = "") -> None:
    global _passed, _failed
    if ok:
        _passed += 1
        print(f"[PASS] {name}")
    else:
        _failed += 1
        print(f"[FAIL] {name}  {detail}".rstrip())


def _safe_json(resp: httpx.Response):
    try:
        return resp.json()
    except ValueError:
        return None


def check(condition: bool, name: str, detail: str = "") -> None:
    """Non-critical assertion: record and keep going."""
    _record(bool(condition), name, detail)


def require(resp: httpx.Response, name: str, expected: int = 201) -> dict:
    """Critical step: must return `expected` with a JSON body, else abort the
    dependent flow (cleanup still runs)."""
    if resp.status_code != expected:
        _record(False, name, f"-> {resp.status_code} {resp.text[:160]}")
        raise SmokeAbort(name)
    data = _safe_json(resp)
    if data is None:
        _record(False, name, "response body was not valid JSON")
        raise SmokeAbort(name)
    _record(True, name)
    return data


def main() -> int:
    created = {"banco": None, "contas": [], "categorias": [], "movs": []}

    with httpx.Client(base_url=BASE_URL, timeout=10.0) as c:
        # ---- liveness gate -------------------------------------------------
        print(f"== Liveness ({BASE_URL}) ==")
        try:
            r = c.get("/health")
        except httpx.HTTPError as exc:
            print(f"[FATAL] cannot reach {BASE_URL}: {exc}")
            return 2
        body = _safe_json(r) or {}
        check(r.status_code == 200 and body.get("status") == "ok",
              "GET /health -> 200 {status: ok}", r.text[:160])
        if r.status_code != 200:
            print("[FATAL] server is not healthy; aborting.")
            return 2

        try:
            # ---- create flow ----------------------------------------------
            print("\n== Create ==")
            banco = require(c.post("/bancos", json={"nome_banco": "Smoke Bank"}),
                            "POST /bancos")
            created["banco"] = banco["id_banco"]

            corrente = require(c.post("/contas", json={
                "nome_conta": "Smoke Corrente", "tipo": "corrente",
                "saldo_inicial": "1000.00", "id_banco": banco["id_banco"]}),
                "POST /contas (corrente)")
            created["contas"].append(corrente["id_conta"])

            reserva = require(c.post("/contas", json={
                "nome_conta": "Smoke Reserva", "tipo": "caixinha"}),
                "POST /contas (caixinha)")
            created["contas"].append(reserva["id_conta"])

            categoria = require(c.post("/categorias", json={"nome_categoria": "Smoke Cat"}),
                                "POST /categorias")
            created["categorias"].append(categoria["id_categoria"])

            mov = require(c.post("/movimentacoes", json={
                "id_conta": corrente["id_conta"], "id_categoria": categoria["id_categoria"],
                "tipo": "saida", "valor": "350.50", "descricao": "Smoke compra",
                "data_movimentacao": "2026-05-06T19:30:00"}),
                "POST /movimentacoes")
            created["movs"].append(mov["id_movimentacao"])

            # ---- read flow ------------------------------------------------
            print("\n== Read ==")
            check(c.get("/bancos").status_code == 200, "GET /bancos")
            check(c.get(f"/contas/{corrente['id_conta']}").status_code == 200,
                  "GET /contas/{id}")
            check(c.get("/movimentacoes").status_code == 200, "GET /movimentacoes")

            # ---- transfer (linked pair) -----------------------------------
            print("\n== Transfer ==")
            pair = require(c.post("/movimentacoes/transferencia", json={
                "id_conta_origem": corrente["id_conta"],
                "id_conta_destino": reserva["id_conta"],
                "valor": "300.00", "descricao": "Smoke transfer"}),
                "POST /movimentacoes/transferencia")
            created["movs"].extend(m["id_movimentacao"] for m in pair)
            a, b = pair
            check(a["id_movimentacao_par"] == b["id_movimentacao"]
                  and b["id_movimentacao_par"] == a["id_movimentacao"],
                  "transfer pair cross-references both ways", str(pair))

            # ---- negative cases -------------------------------------------
            print("\n== Negative cases ==")
            check(c.post("/contas", json={"nome_conta": "X", "tipo": "corrente",
                  "id_banco": 999999}).status_code == 409,
                  "POST /contas bad id_banco -> 409")
            check(c.post("/movimentacoes/transferencia", json={
                  "id_conta_origem": corrente["id_conta"],
                  "id_conta_destino": corrente["id_conta"], "valor": "1.00"}
                  ).status_code == 400, "POST /transferencia same account -> 400")
            check(c.get("/contas/999999").status_code == 404, "GET /contas/999999 -> 404")

            # ---- soft delete ----------------------------------------------
            print("\n== Soft delete ==")
            check(c.delete(f"/contas/{reserva['id_conta']}").status_code == 204,
                  "DELETE /contas/{id} -> 204")
            listed = _safe_json(c.get("/contas")) or []
            check(reserva["id_conta"] not in [x["id_conta"] for x in listed],
                  "soft-deleted conta hidden from list")
            if reserva["id_conta"] in created["contas"]:
                created["contas"].remove(reserva["id_conta"])

        except SmokeAbort as exc:
            print(f"\n[ABORT] critical step failed ({exc}); stopping the flow.")
        except httpx.HTTPError as exc:
            print(f"\n[ABORT] lost connection to server: {exc}")
        finally:
            # ---- best-effort cleanup (never crashes) ----------------------
            print("\n== Cleanup ==")
            try:
                for mid in created["movs"]:
                    c.delete(f"/movimentacoes/{mid}")
                for cid in created["contas"]:
                    c.delete(f"/contas/{cid}")
                for cat in created["categorias"]:
                    c.delete(f"/categorias/{cat}")
                if created["banco"]:
                    c.delete(f"/bancos/{created['banco']}")
                print("  cleanup done (soft-deleted rows remain in DB by design)")
            except httpx.HTTPError as exc:
                print(f"  cleanup skipped (server unreachable): {exc}")

    print(f"\n==== {_passed} passed, {_failed} failed ====")
    return 0 if _failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
