from datetime import datetime

from sqlmodel import SQLModel, Field


class CategoriaBase(SQLModel):
    nome_categoria: str | None = Field(default=None, max_length=45)
    id_pai: int | None = None


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(SQLModel):
    nome_categoria: str | None = None
    id_pai: int | None = None


class CategoriaPublic(CategoriaBase):
    id_categoria: int
    created_at: datetime | None = None
