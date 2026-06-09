import type { Categoria } from "@/lib/api";

export interface CategoriaNode extends Categoria {
  filhos: CategoriaNode[];
}

function childrenMap(categorias: Categoria[]): Map<number | null, number[]> {
  const map = new Map<number | null, number[]>();
  for (const c of categorias) {
    const arr = map.get(c.id_pai) ?? [];
    arr.push(c.id_categoria);
    map.set(c.id_pai, arr);
  }
  return map;
}

/** All descendant ids of `id` (for cycle prevention in the parent picker). */
export function descendantIds(categorias: Categoria[], id: number): Set<number> {
  const map = childrenMap(categorias);
  const out = new Set<number>();
  const stack = [...(map.get(id) ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (out.has(cur)) continue;
    out.add(cur);
    stack.push(...(map.get(cur) ?? []));
  }
  return out;
}

/** Build a sorted parent → children tree from a flat list. */
export function buildTree(categorias: Categoria[]): CategoriaNode[] {
  const byId = new Map<number, CategoriaNode>();
  categorias.forEach((c) => byId.set(c.id_categoria, { ...c, filhos: [] }));

  const roots: CategoriaNode[] = [];
  for (const node of byId.values()) {
    const parent = node.id_pai != null ? byId.get(node.id_pai) : undefined;
    if (parent) parent.filhos.push(node);
    else roots.push(node);
  }

  const sortRec = (nodes: CategoriaNode[]) => {
    nodes.sort((a, b) =>
      (a.nome_categoria ?? "").localeCompare(b.nome_categoria ?? "", "pt-BR"),
    );
    nodes.forEach((n) => sortRec(n.filhos));
  };
  sortRec(roots);
  return roots;
}
