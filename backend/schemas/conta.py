from datetime import datetime
from decimal import Decimal

from sqlmodel import SQLModel, Field

from ..models.conta import TipoConta


class ContaBase(SQLModel):
    nome_conta: str | None = Field(default=None, max_length=45)
    tipo: TipoConta
    moeda: str = Field(default="BRL", max_length=3)
    saldo_inicial: Decimal = Field(default=0, max_digits=14, decimal_places=2)
    id_banco: int | None = None


class ContaCreate(ContaBase):
    pass


class ContaUpdate(SQLModel):
    nome_conta: str | None = None
    tipo: TipoConta | None = None
    moeda: str | None = None
    saldo_inicial: Decimal | None = None
    id_banco: int | None = None


class ContaPublic(ContaBase):
    id_conta: int
    created_at: datetime | None = None


class ContaComSaldo(ContaPublic):
    # saldo_inicial + entradas - saidas (non-deleted movements)
    saldo_atual: Decimal
