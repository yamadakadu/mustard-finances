from datetime import datetime
from decimal import Decimal

from sqlmodel import SQLModel, Field

from ..models.movimentacao import TipoMovimentacao, RecorrenciaMovimentacao


class MovimentacaoBase(SQLModel):
    id_conta: int | None = None
    id_categoria: int | None = None
    id_fatura: int | None = None
    tipo: TipoMovimentacao
    valor: Decimal = Field(max_digits=14, decimal_places=2)
    descricao: str | None = Field(default=None, max_length=100)
    recorrencia: RecorrenciaMovimentacao | None = None
    data_movimentacao: datetime | None = None


class MovimentacaoCreate(MovimentacaoBase):
    pass


class MovimentacaoUpdate(SQLModel):
    id_conta: int | None = None
    id_categoria: int | None = None
    id_fatura: int | None = None
    tipo: TipoMovimentacao | None = None
    valor: Decimal | None = None
    descricao: str | None = None
    recorrencia: RecorrenciaMovimentacao | None = None
    data_movimentacao: datetime | None = None


class MovimentacaoPublic(MovimentacaoBase):
    id_movimentacao: int
    id_movimentacao_par: int | None = None
    created_at: datetime | None = None


class TransferenciaCreate(SQLModel):
    """Move money between two accounts as a single linked pair."""

    id_conta_origem: int
    id_conta_destino: int
    valor: Decimal = Field(max_digits=14, decimal_places=2)
    descricao: str | None = Field(default=None, max_length=100)
    id_categoria: int | None = None
    data_movimentacao: datetime | None = None
