from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from . import models  # noqa: F401  (import registers all SQLModel tables)
from .routers import bancos, contas, categorias, faturas, movimentacoes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is managed by db_create.sql (source of truth). Add Alembic later
    # for migrations. Nothing to create here.
    yield


app = FastAPI(title="Mustard Finances", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (bancos, contas, categorias, faturas, movimentacoes):
    app.include_router(module.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
