from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from ..database import SessionDep
from ..models import Movimentacao, TipoMovimentacao
from ..schemas.movimentacao import (
    MovimentacaoCreate,
    MovimentacaoUpdate,
    MovimentacaoPublic,
    TransferenciaCreate,
)

router = APIRouter(prefix="/movimentacoes", tags=["movimentacoes"])


@router.post("", response_model=MovimentacaoPublic, status_code=201)
def create_movimentacao(data: MovimentacaoCreate, session: SessionDep):
    mov = Movimentacao.model_validate(data)
    session.add(mov)
    session.commit()
    session.refresh(mov)
    return mov


@router.post("/transferencia", response_model=list[MovimentacaoPublic], status_code=201)
def criar_transferencia(data: TransferenciaCreate, session: SessionDep):
    """Create a linked saída/entrada pair representing a transfer between accounts."""
    if data.id_conta_origem == data.id_conta_destino:
        raise HTTPException(status_code=400, detail="Origem e destino devem ser contas diferentes")

    saida = Movimentacao(
        id_conta=data.id_conta_origem,
        id_categoria=data.id_categoria,
        tipo=TipoMovimentacao.saida,
        valor=data.valor,
        descricao=data.descricao,
        data_movimentacao=data.data_movimentacao or datetime.now(),
    )
    entrada = Movimentacao(
        id_conta=data.id_conta_destino,
        id_categoria=data.id_categoria,
        tipo=TipoMovimentacao.entrada,
        valor=data.valor,
        descricao=data.descricao,
        data_movimentacao=data.data_movimentacao or datetime.now(),
    )
    # link both halves (post_update on the relationship handles the circular FK)
    saida.par = entrada
    entrada.par = saida

    session.add_all([saida, entrada])
    session.commit()
    session.refresh(saida)
    session.refresh(entrada)
    return [saida, entrada]


@router.get("", response_model=list[MovimentacaoPublic])
def list_movimentacoes(session: SessionDep, limit: int | None = None):
    """List movements, most recent first. Pass ?limit=N for the latest N
    (used by the dashboard's 'recent movements' list)."""
    stmt = (
        select(Movimentacao)
        .where(Movimentacao.deleted_at == None)  # noqa: E711
        .order_by(
            Movimentacao.data_movimentacao.desc(),
            Movimentacao.id_movimentacao.desc(),
        )
    )
    if limit is not None:
        stmt = stmt.limit(limit)
    return session.exec(stmt).all()


@router.get("/{id_movimentacao}", response_model=MovimentacaoPublic)
def get_movimentacao(id_movimentacao: int, session: SessionDep):
    mov = session.get(Movimentacao, id_movimentacao)
    if not mov or mov.deleted_at:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")
    return mov


@router.patch("/{id_movimentacao}", response_model=MovimentacaoPublic)
def update_movimentacao(id_movimentacao: int, data: MovimentacaoUpdate, session: SessionDep):
    mov = session.get(Movimentacao, id_movimentacao)
    if not mov or mov.deleted_at:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(mov, key, value)
    session.add(mov)
    session.commit()
    session.refresh(mov)
    return mov


@router.delete("/{id_movimentacao}", status_code=204)
def soft_delete_movimentacao(id_movimentacao: int, session: SessionDep):
    mov = session.get(Movimentacao, id_movimentacao)
    if not mov or mov.deleted_at:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")
    mov.deleted_at = datetime.now()
    session.add(mov)
    session.commit()
