from sqlmodel import SQLModel, Field


class BancoBase(SQLModel):
    nome_banco: str | None = Field(default=None, max_length=15)


class BancoCreate(BancoBase):
    pass


class BancoUpdate(SQLModel):
    nome_banco: str | None = None


class BancoPublic(BancoBase):
    id_banco: int
