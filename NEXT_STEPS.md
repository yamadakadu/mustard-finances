# Mustard Finances — Next Steps Checklist

Roadmap to take the app from "read-only dashboard + CRUD API" to a fully
functional, usable personal finance app. Ordered by priority.

## Current state (done)
- [x] Backend: FastAPI, bigger-applications layout (`backend/` package)
- [x] Models: `banco, conta, categoria, fatura, movimentacao` (+ transfer pair)
- [x] Full CRUD routers + soft-delete + `POST /movimentacoes/transferencia`
- [x] Report endpoints: `/relatorios/resumo`, `/relatorios/gastos-por-categoria`, `?limit` on movimentações
- [x] Integrity errors return 409 (not 500); session rollback on error
- [x] `scripts/smoke_test.py` HTTP life-check (16 checks)
- [x] Frontend: Next.js 16 + TS + Tailwind v4 + shadcn/ui + Recharts
- [x] Dashboard (read-only): KPI cards, spending donut, recent movements
- [x] Mustard warm theme (light/dark), pt-BR formatting, app shell + nav

---

## 0. Unblock — get the database running (do first)
- [x] Add `docker-compose.yml` (MySQL via mysql:oraclelinux9 + named volume + auto-load `db_create.sql`)
- [x] `docker compose up -d`; MySQL reachable on 3306 (backend `/relatorios/resumo` returns 200)
- [x] `.env` (backend) + `frontend/.env.local` point at `http://localhost:8000`
- [ ] Seed real banks + categories once (DB currently empty)

## 1. Core functionality — the write UI (highest value)
- [x] Adopt **TanStack Query** (caching, mutations, auto-refetch after writes)
- [x] Add shadcn `form` + `react-hook-form` + `zod` + `sonner` (toasts)
- [x] **Movimentações** screen — list + client-side filters, add/edit form, transfer flow, soft-delete
- [x] **Contas** screen — cards w/ per-account balance, add/edit, soft-delete (blocked if it has movements); inline bank create + bank→accounts view
- [x] **Categorias** screen — parent/child tree, add/edit, cycle-prevented; delete reparents children to root
- [ ] **Faturas** screen — credit-card invoices + their movements + derived total  ← next (build high, review ultra)
- [ ] Remove "em breve" badges as each screen ships (Movimentações done)

> Note: the frontend uses **Base UI** (`@base-ui/react`), not Radix — shadcn components
> use the `render` prop (not `asChild`) and Select needs an `items` map to show labels.

## 2. Round out the backend for those screens
- [x] Per-account balance (`saldo_atual` on GET /contas + /contas/{id})
- [ ] Filtering + pagination on `GET /movimentacoes` (date range, account, category)
- [ ] Surface 409 / 422 responses as friendly toasts in the UI

## 3. Make it safe to rely on
- [ ] Auth — add `usuario` table + FastAPI OAuth2/JWT (or sessions); protect routes; token in API client
- [ ] Deployment — extend compose to backend + frontend (or Vercel + Railway/PlanetScale)
- [ ] Automated backups (`mysqldump` on a schedule)

## Cross-cutting (do alongside)
- [ ] Mobile nav — sidebar `Sheet` drawer + hamburger (currently hidden on small screens)
- [ ] Tests — promote `smoke_test.py` to `pytest`; a few frontend component tests
- [ ] Remove temp `.claude/launch.json` reliance / document how to run via Preview

---

## How to run (current)
```powershell
# 1. start MySQL (docker compose up -d, once #0 is done)
# 2. backend
cd mustard-finances ; fastapi dev backend/main.py        # :8000
# 3. frontend (new terminal)
cd mustard-finances/frontend ; npm run dev               # :3000
```

## Recommended next action
**#0 (docker-compose)** → then **#1 Movimentações screen** (add + transfer + list),
since logging transactions is the daily-use core.
