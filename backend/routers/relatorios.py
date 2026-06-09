from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter
from sqlalchemy import func, extract
from sqlmodel import SQLModel, select

from ..database import SessionDep
from ..models import Conta, Movimentacao, Categoria, TipoMovimentacao

router = APIRouter(prefix="/relatorios", tags=["relatorios"])


class ResumoPublic(SQLModel):
    saldo_total: Decimal
    entradas_mes: Decimal
    saidas_mes: Decimal
    num_contas: int
    ano: int
    mes: int


class GastoCategoria(SQLModel):
    id_categoria: int
    nome_categoria: str
    total: Decimal


def _sum(session, *where) -> Decimal:
    stmt = select(func.coalesce(func.sum(Movimentacao.valor), 0)).join(
        Conta, Conta.id_conta == Movimentacao.id_conta
    ).where(Movimentacao.deleted_at == None, Conta.deleted_at == None, *where)  # noqa: E711
    return Decimal(str(session.exec(stmt).one()))


@router.get("/resumo", response_model=ResumoPublic)
def resumo(session: SessionDep, ano: int | None = None, mes: int | None = None):
    """Dashboard headline numbers: total balance across accounts, plus this
    month's real income/expense (transfers excluded so they don't double-count)."""
    now = datetime.now()
    ano = ano or now.year
    mes = mes or now.month

    saldo_inicial = session.exec(
        select(func.coalesce(func.sum(Conta.saldo_inicial), 0)).where(
            Conta.deleted_at == None  # noqa: E711
        )
    ).one()

    total_entradas = _sum(session, Movimentacao.tipo == TipoMovimentacao.entrada)
    total_saidas = _sum(session, Movimentacao.tipo == TipoMovimentacao.saida)
    saldo_total = Decimal(str(saldo_inicial)) + total_entradas - total_saidas

    mes_filter = (
        extract("year", Movimentacao.data_movimentacao) == ano,
        extract("month", Movimentacao.data_movimentacao) == mes,
        Movimentacao.id_movimentacao_par == None,  # exclude transfer halves  # noqa: E711
    )
    entradas_mes = _sum(session, Movimentacao.tipo == TipoMovimentacao.entrada, *mes_filter)
    saidas_mes = _sum(session, Movimentacao.tipo == TipoMovimentacao.saida, *mes_filter)

    num_contas = session.exec(
        select(func.count()).select_from(Conta).where(Conta.deleted_at == None)  # noqa: E711
    ).one()

    return ResumoPublic(
        saldo_total=saldo_total,
        entradas_mes=entradas_mes,
        saidas_mes=saidas_mes,
        num_contas=num_contas,
        ano=ano,
        mes=mes,
    )


@router.get("/gastos-por-categoria", response_model=list[GastoCategoria])
def gastos_por_categoria(session: SessionDep, ano: int | None = None, mes: int | None = None):
    """Spending grouped by category for the given month (default: current),
    transfers excluded, biggest first."""
    now = datetime.now()
    ano = ano or now.year
    mes = mes or now.month

    stmt = (
        select(
            Categoria.id_categoria,
            Categoria.nome_categoria,
            func.coalesce(func.sum(Movimentacao.valor), 0).label("total"),
        )
        .join(Movimentacao, Movimentacao.id_categoria == Categoria.id_categoria)
        .where(
            Movimentacao.tipo == TipoMovimentacao.saida,
            Movimentacao.deleted_at == None,  # noqa: E711
            Movimentacao.id_movimentacao_par == None,  # noqa: E711
            extract("year", Movimentacao.data_movimentacao) == ano,
            extract("month", Movimentacao.data_movimentacao) == mes,
        )
        .group_by(Categoria.id_categoria, Categoria.nome_categoria)
        .order_by(func.sum(Movimentacao.valor).desc())
    )
    rows = session.exec(stmt).all()
    return [
        GastoCategoria(id_categoria=r[0], nome_categoria=r[1], total=Decimal(str(r[2])))
        for r in rows
    ]
