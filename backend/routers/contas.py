from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, HTTPException
from sqlalchemy import case, func
from sqlmodel import select

from ..database import SessionDep
from ..models import Conta, Movimentacao, TipoMovimentacao
from ..schemas.conta import ContaCreate, ContaUpdate, ContaPublic, ContaComSaldo

router = APIRouter(prefix="/contas", tags=["contas"])


def _net_por_conta(session, id_conta: int | None = None) -> dict[int, Decimal]:
    """Net movement (entradas - saidas) per account, ignoring soft-deleted rows."""
    signed = case(
        (Movimentacao.tipo == TipoMovimentacao.entrada, Movimentacao.valor),
        else_=-Movimentacao.valor,
    )
    stmt = (
        select(Movimentacao.id_conta, func.coalesce(func.sum(signed), 0))
        .where(Movimentacao.deleted_at == None)  # noqa: E711
        .group_by(Movimentacao.id_conta)
    )
    if id_conta is not None:
        stmt = stmt.where(Movimentacao.id_conta == id_conta)
    return {row[0]: Decimal(str(row[1])) for row in session.exec(stmt).all()}


def _com_saldo(conta: Conta, net: Decimal) -> ContaComSaldo:
    return ContaComSaldo(**conta.model_dump(), saldo_atual=conta.saldo_inicial + net)


@router.post("", response_model=ContaPublic, status_code=201)
def create_conta(data: ContaCreate, session: SessionDep):
    conta = Conta.model_validate(data)
    session.add(conta)
    session.commit()
    session.refresh(conta)
    return conta


@router.get("", response_model=list[ContaComSaldo])
def list_contas(session: SessionDep):
    contas = session.exec(
        select(Conta).where(Conta.deleted_at == None)  # noqa: E711
    ).all()
    net = _net_por_conta(session)
    return [_com_saldo(c, net.get(c.id_conta, Decimal(0))) for c in contas]


@router.get("/{id_conta}", response_model=ContaComSaldo)
def get_conta(id_conta: int, session: SessionDep):
    conta = session.get(Conta, id_conta)
    if not conta or conta.deleted_at:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    net = _net_por_conta(session, id_conta).get(id_conta, Decimal(0))
    return _com_saldo(conta, net)


@router.patch("/{id_conta}", response_model=ContaPublic)
def update_conta(id_conta: int, data: ContaUpdate, session: SessionDep):
    conta = session.get(Conta, id_conta)
    if not conta or conta.deleted_at:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(conta, key, value)
    session.add(conta)
    session.commit()
    session.refresh(conta)
    return conta


@router.delete("/{id_conta}", status_code=204)
def soft_delete_conta(id_conta: int, session: SessionDep):
    conta = session.get(Conta, id_conta)
    if not conta or conta.deleted_at:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    # Don't orphan history: refuse if the account still has movements
    # (mirrors the DB's ON DELETE RESTRICT intent).
    tem_mov = session.exec(
        select(Movimentacao.id_movimentacao).where(
            Movimentacao.id_conta == id_conta,
            Movimentacao.deleted_at == None,  # noqa: E711
        ).limit(1)
    ).first()
    if tem_mov is not None:
        raise HTTPException(
            status_code=409,
            detail="Conta possui movimentações e não pode ser excluída",
        )
    conta.deleted_at = datetime.now()
    session.add(conta)
    session.commit()
