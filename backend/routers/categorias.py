from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from ..database import SessionDep
from ..models import Categoria
from ..schemas.categoria import CategoriaCreate, CategoriaUpdate, CategoriaPublic

router = APIRouter(prefix="/categorias", tags=["categorias"])


def _descendentes(session, id_categoria: int) -> set[int]:
    """All (active) descendants of a category, for cycle detection."""
    rows = session.exec(
        select(Categoria.id_categoria, Categoria.id_pai).where(
            Categoria.deleted_at == None  # noqa: E711
        )
    ).all()
    filhos: dict[int | None, list[int]] = {}
    for cid, pai in rows:
        filhos.setdefault(pai, []).append(cid)
    out: set[int] = set()
    stack = list(filhos.get(id_categoria, []))
    while stack:
        cur = stack.pop()
        if cur in out:
            continue
        out.add(cur)
        stack.extend(filhos.get(cur, []))
    return out


@router.post("", response_model=CategoriaPublic, status_code=201)
def create_categoria(data: CategoriaCreate, session: SessionDep):
    categoria = Categoria.model_validate(data)
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria


@router.get("", response_model=list[CategoriaPublic])
def list_categorias(session: SessionDep):
    return session.exec(
        select(Categoria).where(Categoria.deleted_at == None)  # noqa: E711
    ).all()


@router.get("/{id_categoria}", response_model=CategoriaPublic)
def get_categoria(id_categoria: int, session: SessionDep):
    categoria = session.get(Categoria, id_categoria)
    if not categoria or categoria.deleted_at:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return categoria


@router.patch("/{id_categoria}", response_model=CategoriaPublic)
def update_categoria(id_categoria: int, data: CategoriaUpdate, session: SessionDep):
    categoria = session.get(Categoria, id_categoria)
    if not categoria or categoria.deleted_at:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    payload = data.model_dump(exclude_unset=True)
    novo_pai = payload.get("id_pai")
    if "id_pai" in payload and novo_pai is not None:
        if novo_pai == id_categoria:
            raise HTTPException(
                status_code=400, detail="Uma categoria não pode ser pai de si mesma"
            )
        if novo_pai in _descendentes(session, id_categoria):
            raise HTTPException(
                status_code=400, detail="Isso criaria um ciclo na hierarquia"
            )
    for key, value in payload.items():
        setattr(categoria, key, value)
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria


@router.delete("/{id_categoria}", status_code=204)
def soft_delete_categoria(id_categoria: int, session: SessionDep):
    categoria = session.get(Categoria, id_categoria)
    if not categoria or categoria.deleted_at:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    # Promote active children to top-level so they aren't orphaned under a
    # hidden parent (mirrors the FK's ON DELETE SET NULL).
    filhos = session.exec(
        select(Categoria).where(
            Categoria.id_pai == id_categoria,
            Categoria.deleted_at == None,  # noqa: E711
        )
    ).all()
    for f in filhos:
        f.id_pai = None
        session.add(f)
    categoria.deleted_at = datetime.now()
    session.add(categoria)
    session.commit()
