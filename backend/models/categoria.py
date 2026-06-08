from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, Integer, DateTime, ForeignKey, func

if TYPE_CHECKING:
    from .movimentacao import Movimentacao


class Categoria(SQLModel, table=True):
    __tablename__ = "categoria"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id_categoria: int | None = Field(default=None, primary_key=True)
    nome_categoria: str | None = Field(default=None, max_length=45)

    id_pai: int | None = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("categoria.id_categoria", ondelete="SET NULL", onupdate="CASCADE"),
        ),
    )

    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime, server_default=func.now(), nullable=False),
    )
    deleted_at: datetime | None = Field(default=None)

    # self-referential hierarchy
    pai: Optional["Categoria"] = Relationship(
        back_populates="filhos",
        sa_relationship_kwargs={"remote_side": "Categoria.id_categoria"},
    )
    filhos: list["Categoria"] = Relationship(back_populates="pai")

    movimentacoes: list["Movimentacao"] = Relationship(back_populates="categoria")
