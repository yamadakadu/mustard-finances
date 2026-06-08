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
    1  one or more checks failed
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


def check(condition: bool, name: str, detail: str = "") -> None:
    global _passed, _failed
    if condition:
        _passed += 1
        print(f"[PASS] {name}")
    else:
        _failed += 1
        print(f"[FAIL] {name}  {detail}")


def main() -> int:
    created = {"banco": None, "contas": [], "categorias": [], "faturas": [], "movs": []}

    with httpx.Client(base_url=BASE_URL, timeout=10.0) as c:
        # ---- liveness gate -------------------------------------------------
        print(f"== Liveness ({BASE_URL}) ==")
        try:
            r = c.get("/health")
        except httpx.HTTPError as exc:
            print(f"[FATAL] cannot reach {BASE_URL}: {exc}")
            return 2
        check(r.status_code == 200 and r.json().get("status") == "ok",
              "GET /health -> 200 {status: ok}", r.text)
        if r.status_code != 200:
            return 2

        try:
            # ---- create flow ----------------------------------------------
            print("\n== Create ==")
            r = c.post("/bancos", json={"nome_banco": "Smoke Bank"})
            check(r.status_code == 201, "POST /bancos", r.text)
            banco = r.json(); created["banco"] = banco["id_banco"]

            r = c.post("/contas", json={
                "nome_conta": "Smoke Corrente", "tipo": "corrente",
                "saldo_inicial": "1000.00", "id_banco": banco["id_banco"]})
            check(r.status_code == 201, "POST /contas (corrente)", r.text)
            corrente = r.json(); created["contas"].append(corrente["id_conta"])

            r = c.post("/contas", json={"nome_conta": "Smoke Reserva", "tipo": "caixinha"})
            check(r.status_code == 201, "POST /contas (caixinha)", r.text)
            reserva = r.json(); created["contas"].append(reserva["id_conta"])

            r = c.post("/categorias", json={"nome_categoria": "Smoke Cat"})
            check(r.status_code == 201, "POST /categorias", r.text)
            categoria = r.json(); created["categorias"].append(categoria["id_categoria"])

            r = c.post("/movimentacoes", json={
                "id_conta": corrente["id_conta"], "id_categoria": categoria["id_categoria"],
                "tipo": "saida", "valor": "350.50", "descricao": "Smoke compra",
                "data_movimentacao": "2026-05-06T19:30:00"})
            check(r.status_code == 201, "POST /movimentacoes", r.text)
            created["movs"].append(r.json()["id_movimentacao"])

            # ---- read flow ------------------------------------------------
            print("\n== Read ==")
            check(c.get("/bancos").status_code == 200, "GET /bancos")
            check(c.get(f"/contas/{corrente['id_conta']}").status_code == 200, "GET /contas/{id}")
            check(c.get("/movimentacoes").status_code == 200, "GET /movimentacoes")

            # ---- transfer (linked pair) -----------------------------------
            print("\n== Transfer ==")
            r = c.post("/movimentacoes/transferencia", json={
                "id_conta_origem": corrente["id_conta"],
                "id_conta_destino": reserva["id_conta"],
                "valor": "300.00", "descricao": "Smoke transfer"})
            check(r.status_code == 201, "POST /movimentacoes/transferencia", r.text)
            if r.status_code == 201:
                pair = r.json()
                created["movs"].extend(m["id_movimentacao"] for m in pair)
                a, b = pair
                check(a["id_movimentacao_par"] == b["id_movimentacao"]
                      and b["id_movimentacao_par"] == a["id_movimentacao"],
                      "transfer pair cross-references both ways", str(pair))

            # ---- negative cases -------------------------------------------
            print("\n== Negative cases ==")
            r = c.post("/contas", json={"nome_conta": "X", "tipo": "corrente", "id_banco": 999999})
            check(r.status_code == 409, "POST /contas bad id_banco -> 409", r.text)

            r = c.post("/movimentacoes/transferencia", json={
                "id_conta_origem": corrente["id_conta"],
                "id_conta_destino": corrente["id_conta"], "valor": "1.00"})
            check(r.status_code == 400, "POST /transferencia same account -> 400", r.text)

            check(c.get("/contas/999999").status_code == 404, "GET /contas/999999 -> 404")

            # ---- soft delete ----------------------------------------------
            print("\n== Soft delete ==")
            r = c.delete(f"/contas/{reserva['id_conta']}")
            check(r.status_code == 204, "DELETE /contas/{id} -> 204", r.text)
            listed = [x["id_conta"] for x in c.get("/contas").json()]
            check(reserva["id_conta"] not in listed, "soft-deleted conta hidden from list")
            created["contas"].remove(reserva["id_conta"])

        finally:
            # ---- best-effort cleanup --------------------------------------
            print("\n== Cleanup ==")
            for mid in created["movs"]:
                c.delete(f"/movimentacoes/{mid}")
            for cid in created["contas"]:
                c.delete(f"/contas/{cid}")
            for cat in created["categorias"]:
                c.delete(f"/categorias/{cat}")
            if created["banco"]:
                c.delete(f"/bancos/{created['banco']}")
            print("  cleanup done (soft-deleted rows remain in DB by design)")

    print(f"\n==== {_passed} passed, {_failed} failed ====")
    return 0 if _failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
