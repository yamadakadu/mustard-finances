"""SQLModel table models.

Importing every model here ensures SQLModel's class registry is fully
populated before the app runs, so the string-based relationships
(e.g. "Conta", "Movimentacao") resolve correctly.
"""

from .banco import Banco
from .categoria import Categoria
from .conta import Conta, TipoConta
from .fatura import Fatura
from .movimentacao import (
    Movimentacao,
    TipoMovimentacao,
    RecorrenciaMovimentacao,
)

__all__ = [
    "Banco",
    "Categoria",
    "Conta",
    "TipoConta",
    "Fatura",
    "Movimentacao",
    "TipoMovimentacao",
    "RecorrenciaMovimentacao",
]
