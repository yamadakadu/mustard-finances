from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from .config import settings
from . import models  # noqa: F401  (import registers all SQLModel tables)
from .routers import bancos, contas, categorias, faturas, movimentacoes, relatorios


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


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    """Turn DB constraint violations (bad foreign key, duplicate unique value)
    into a clean 409 instead of an unhandled 500 / leaked stack trace."""
    return JSONResponse(
        status_code=409,
        content={
            "detail": (
                "Violação de integridade: a referência informada não existe "
                "ou o valor viola uma restrição do banco de dados."
            )
        },
    )

for module in (bancos, contas, categorias, faturas, movimentacoes, relatorios):
    app.include_router(module.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
