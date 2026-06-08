from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, Integer, DateTime, ForeignKey, func

if TYPE_CHECKING:
    from .conta import Conta
    from .movimentacao import Movimentacao


class Fatura(SQLModel, table=True):
    __tablename__ = "fatura"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id_fatura: int | None = Field(default=None, primary_key=True)

    id_conta: int | None = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("conta.id_conta", ondelete="SET NULL", onupdate="CASCADE"),
        ),
    )

    mes_referencia: date | None = Field(default=None)
    data_fechamento: date | None = Field(default=None)
    data_vencimento: date | None = Field(default=None)

    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime, server_default=func.now(), nullable=False),
    )
    deleted_at: datetime | None = Field(default=None)

    conta: Optional["Conta"] = Relationship(back_populates="faturas")
    movimentacoes: list["Movimentacao"] = Relationship(back_populates="fatura")
