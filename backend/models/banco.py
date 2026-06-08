from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .conta import Conta


class Banco(SQLModel, table=True):
    __tablename__ = "banco"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"}

    id_banco: int | None = Field(default=None, primary_key=True)
    nome_banco: str | None = Field(default=None, max_length=15)

    contas: list["Conta"] = Relationship(back_populates="banco")
