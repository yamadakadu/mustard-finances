# Mustard Finances — Project Context

Personal finance manager (study + real use). **Backend:** FastAPI + SQLModel + MySQL.
**Frontend:** Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui + Recharts. UI is **pt-BR**.

> **Where we are / what's next: see [`NEXT_STEPS.md`](./NEXT_STEPS.md)** (the living roadmap).
> Done so far: backend CRUD + reports, read-only **Dashboard**, and the **Movimentações** screen
> (list, filters, add/edit, transfer, soft-delete). Next up: the **Contas** screen.

## Layout
```
finances-workspace/
├── db_create.sql              # MySQL schema (source of truth)
├── tests.sql                  # seed + verification queries
├── docker-compose.yml         # MySQL (mysql:oraclelinux9), port 3306, root pw "password123"
└── mustard-finances/          # the git repo
    ├── backend/               # FastAPI package (entrypoint backend.main:app)
    │   ├── main.py            # app + CORS + lifespan + IntegrityError->409 handler
    │   ├── config.py          # pydantic-settings, reads .env
    │   ├── database.py        # engine + get_session/SessionDep
    │   ├── models/            # one SQLModel per entity (+ __init__ imports all)
    │   ├── schemas/           # Create/Update/Public per entity
    │   └── routers/           # bancos, contas, categorias, faturas, movimentacoes, relatorios
    ├── frontend/              # Next.js app (src/app, src/components, src/lib)
    ├── scripts/smoke_test.py  # HTTP life-check against a running server
    └── NEXT_STEPS.md          # roadmap checklist
```

## How to run
```powershell
# 1. DB
cd finances-workspace ; docker compose up -d        # MySQL on :3306
# 2. backend (needs `cryptography` installed for MySQL 9 caching_sha2 auth)
cd mustard-finances ; fastapi dev backend/main.py    # :8000  -> /docs
# 3. frontend
cd mustard-finances/frontend ; npm run dev           # :3000
```
Backend `.env`: `DB_PASSWORD=password123`, `DB_NAME=movimentacoes` (others default).
Frontend reads `NEXT_PUBLIC_API_URL` from `frontend/.env.local` (default `http://localhost:8000`).

## Conventions & gotchas (READ before editing)
- **Money** = `DECIMAL(14,2)` in DB, **string** over the wire (never `float`). Format with `brl()` (pt-BR).
- **Soft delete** everywhere via `deleted_at`; list endpoints filter it out. `banco` is hard-deleted.
- **Transfer** = a linked saída+entrada pair via `id_movimentacao_par` (self-FK, `post_update=True`).
  Exclude `id_movimentacao_par IS NOT NULL` to avoid double-counting in expense reports.
- **SQLModel relationships**: do NOT use `from __future__ import annotations` (breaks them).
  To-one relations use `Optional["X"]`, not `"X | None"`. Cross-file refs via `TYPE_CHECKING`.
- **DB errors** (bad FK / duplicate) return **409** via the global handler in `main.py` — not 500.
- **Frontend uses Base UI (`@base-ui/react`), NOT Radix.** shadcn components here:
  - use the **`render` prop**, not `asChild`.
  - `Select` needs an **`items` map** (`{value,label}[]`) on the root for `SelectValue` to show labels.
- **Data layer**: TanStack Query (`src/lib/queries.ts`); forms use react-hook-form + zod; toasts via sonner.
- API client + types: `src/lib/api.ts`. Formatters: `src/lib/format.ts`.

## Verify
- Backend: `python scripts/smoke_test.py` (against a running server). Build check: `cd frontend ; npm run build`.
- A `.claude/launch.json` (in the workspace root, outside the repo) wires the Preview tool to run both servers.

## Git
Commit only when asked. Branch off `main` for non-trivial work if collaborating.
Co-author trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
