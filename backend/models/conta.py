from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, Integer, DateTime, ForeignKey, func

if TYPE_CHECKING:
    from .banco import Banco
    from .fatura import Fatura
    from .movimentacao import Movimentacao


class TipoConta(str, Enum):
    corrente = "corrente"
    caixinha = "caixinha"
    cartao_credito = "cartao_credito"
    saldo_separado = "saldo_separado"


class Conta(SQLModel, table=True):
    __tablename__ = "conta"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id_conta: int | None = Field(default=None, primary_key=True)
    nome_conta: str | None = Field(default=None, max_length=45)
    tipo: TipoConta
    moeda: str = Field(default="BRL", max_length=3)
    saldo_inicial: Decimal = Field(default=0, max_digits=14, decimal_places=2)

    id_banco: int | None = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("banco.id_banco", ondelete="SET NULL", onupdate="CASCADE"),
        ),
    )

    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime, server_default=func.now(), nullable=False),
    )
    deleted_at: datetime | None = Field(default=None)

    banco: Optional["Banco"] = Relationship(back_populates="contas")
    faturas: list["Fatura"] = Relationship(back_populates="conta")
    movimentacoes: list["Movimentacao"] = Relationship(back_populates="conta")
