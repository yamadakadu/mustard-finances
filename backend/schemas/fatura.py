from datetime import date, datetime

from sqlmodel import SQLModel


class FaturaBase(SQLModel):
    id_conta: int | None = None
    mes_referencia: date | None = None
    data_fechamento: date | None = None
    data_vencimento: date | None = None


class FaturaCreate(FaturaBase):
    pass


class FaturaUpdate(SQLModel):
    id_conta: int | None = None
    mes_referencia: date | None = None
    data_fechamento: date | None = None
    data_vencimento: date | None = None


class FaturaPublic(FaturaBase):
    id_fatura: int
    created_at: datetime | None = None
