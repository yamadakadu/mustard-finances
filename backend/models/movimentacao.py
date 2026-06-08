from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, Integer, DateTime, ForeignKey, func, Index

if TYPE_CHECKING:
    from .conta import Conta
    from .categoria import Categoria
    from .fatura import Fatura


class TipoMovimentacao(str, Enum):
    entrada = "entrada"
    saida = "saida"


class RecorrenciaMovimentacao(str, Enum):
    fixo = "fixo"
    variavel = "variavel"


class Movimentacao(SQLModel, table=True):
    __tablename__ = "movimentacao"
    __table_args__ = (
        Index("idx_mov_data", "id_conta", "data_movimentacao"),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
    )

    id_movimentacao: int | None = Field(default=None, primary_key=True)

    id_conta: int | None = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("conta.id_conta", ondelete="RESTRICT", onupdate="CASCADE"),
        ),
    )
    id_categoria: int | None = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("categoria.id_categoria", ondelete="SET NULL", onupdate="CASCADE"),
        ),
    )
    id_fatura: int | None = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("fatura.id_fatura", ondelete="SET NULL", onupdate="CASCADE"),
        ),
    )
    id_movimentacao_par: int | None = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("movimentacao.id_movimentacao", ondelete="SET NULL", onupdate="CASCADE"),
        ),
    )

    tipo: TipoMovimentacao
    valor: Decimal = Field(max_digits=14, decimal_places=2)
    descricao: str | None = Field(default=None, max_length=100)
    recorrencia: RecorrenciaMovimentacao | None = Field(default=None)
    data_movimentacao: datetime | None = Field(default=None)

    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime, server_default=func.now(), nullable=False),
    )
    deleted_at: datetime | None = Field(default=None)

    conta: Optional["Conta"] = Relationship(back_populates="movimentacoes")
    categoria: Optional["Categoria"] = Relationship(back_populates="movimentacoes")
    fatura: Optional["Fatura"] = Relationship(back_populates="movimentacoes")

    # the other half of a transfer (self-referential, one-to-one).
    # post_update=True lets the two mutually-referencing rows be inserted first,
    # then linked with an UPDATE — avoiding a circular-dependency error.
    par: Optional["Movimentacao"] = Relationship(
        sa_relationship_kwargs={
            "remote_side": "Movimentacao.id_movimentacao",
            "foreign_keys": "Movimentacao.id_movimentacao_par",
            "uselist": False,
            "post_update": True,
        },
    )
