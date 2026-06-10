"use client";

import * as React from "react";
import { ArrowLeftRight, Plus, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { ApiError, type Movimentacao } from "@/lib/api";
import { brl, nomeMes } from "@/lib/format";
import {
  useCategorias,
  useContas,
  useCreateMovimentacao,
  useDeleteMovimentacao,
  useMovimentacoes,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MovementDialog } from "@/components/movimentacoes/movement-dialog";
import { TransferDialog } from "@/components/movimentacoes/transfer-dialog";
import { MovementsTable } from "@/components/movimentacoes/movements-table";

const ALL = "all";

export default function MovimentacoesPage() {
  const contasQ = useContas();
  const categoriasQ = useCategorias();
  const movQ = useMovimentacoes();
  const del = useDeleteMovimentacao();
  const create = useCreateMovimentacao();

  const contas = React.useMemo(() => contasQ.data ?? [], [contasQ.data]);
  const categorias = React.useMemo(() => categoriasQ.data ?? [], [categoriasQ.data]);
  const movimentacoes = React.useMemo(() => movQ.data ?? [], [movQ.data]);

  const contaNome = React.useCallback(
    (id: number | null) =>
      contas.find((c) => c.id_conta === id)?.nome_conta ?? "—",
    [contas],
  );
  const categoriaNome = React.useCallback(
    (id: number | null) =>
      categorias.find((c) => c.id_categoria === id)?.nome_categoria ?? "—",
    [categorias],
  );

  // ---- filters (client-side) ----
  const [mes, setMes] = React.useState(ALL);
  const [conta, setConta] = React.useState(ALL);
  const [categoria, setCategoria] = React.useState(ALL);
  const [tipo, setTipo] = React.useState(ALL);

  const meses = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of movimentacoes) {
      if (m.data_movimentacao) set.add(m.data_movimentacao.slice(0, 7)); // YYYY-MM
    }
    return Array.from(set).sort().reverse();
  }, [movimentacoes]);

  const filtered = React.useMemo(
    () =>
      movimentacoes.filter((m) => {
        if (mes !== ALL && (m.data_movimentacao?.slice(0, 7) ?? "") !== mes) return false;
        if (conta !== ALL && String(m.id_conta) !== conta) return false;
        if (categoria !== ALL && String(m.id_categoria) !== categoria) return false;
        if (tipo !== ALL && m.tipo !== tipo) return false;
        return true;
      }),
    [movimentacoes, mes, conta, categoria, tipo],
  );

  // ---- dialogs ----
  const [movOpen, setMovOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Movimentacao | null>(null);
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<Movimentacao | null>(null);

  const openNew = () => {
    setEditing(null);
    setMovOpen(true);
  };
  const openEdit = (m: Movimentacao) => {
    setEditing(m);
    setMovOpen(true);
  };

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id_movimentacao);
      toast.success("Movimentação excluída");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao excluir");
    } finally {
      setToDelete(null);
    }
  }

  async function handleDuplicate(m: Movimentacao) {
    if (m.id_conta == null) return;
    try {
      await create.mutateAsync({
        id_conta: m.id_conta,
        id_categoria: m.id_categoria,
        id_fatura: m.id_fatura,
        tipo: m.tipo,
        valor: m.valor,
        descricao: m.descricao ? `${m.descricao} - Duplicado` : "Movimentação - Duplicado",
        recorrencia: m.recorrencia,
        data_movimentacao: m.data_movimentacao,
      });
      toast.success("Movimentação duplicada");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao duplicar");
    }
  }

  const offline =
    movQ.error instanceof ApiError && movQ.error.status === 0;
  const loading = movQ.isLoading || contasQ.isLoading || categoriasQ.isLoading;
  const semContas = !contasQ.isLoading && contas.length === 0;

  const total = filtered.reduce(
    (acc, m) => acc + (m.tipo === "entrada" ? 1 : -1) * parseFloat(m.valor),
    0,
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Movimentações</h1>
          <p className="text-sm text-muted-foreground">
            Entradas, saídas e transferências
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTransferOpen(true)} disabled={semContas}>
            <ArrowLeftRight />
            Transferência
          </Button>
          <Button onClick={openNew} disabled={semContas}>
            <Plus />
            Nova movimentação
          </Button>
        </div>
      </div>

      {offline && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <WifiOff className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">API indisponível</p>
              <p className="text-muted-foreground">
                Verifique se o backend (FastAPI) e o MySQL estão rodando.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {semContas && !offline && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Você ainda não tem contas. Crie uma pela API (<code>/docs</code>) — a
            tela de Contas vem em breve.
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterSelect
          value={mes}
          onChange={setMes}
          placeholder="Mês"
          options={[
            { value: ALL, label: "Todos os meses" },
            ...meses.map((m) => {
              const [y, mm] = m.split("-");
              return { value: m, label: `${nomeMes(Number(mm))} de ${y}` };
            }),
          ]}
        />
        <FilterSelect
          value={conta}
          onChange={setConta}
          placeholder="Conta"
          options={[
            { value: ALL, label: "Todas as contas" },
            ...contas.map((c) => ({
              value: String(c.id_conta),
              label: c.nome_conta ?? `Conta #${c.id_conta}`,
            })),
          ]}
        />
        <FilterSelect
          value={categoria}
          onChange={setCategoria}
          placeholder="Categoria"
          options={[
            { value: ALL, label: "Todas as categorias" },
            ...categorias.map((c) => ({
              value: String(c.id_categoria),
              label: c.nome_categoria ?? `Categoria #${c.id_categoria}`,
            })),
          ]}
        />
        <FilterSelect
          value={tipo}
          onChange={setTipo}
          placeholder="Tipo"
          options={[
            { value: ALL, label: "Todos os tipos" },
            { value: "entrada", label: "Entradas" },
            { value: "saida", label: "Saídas" },
          ]}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-lg" />
              ))}
            </div>
          ) : (
            <MovementsTable
              items={filtered}
              contaNome={contaNome}
              categoriaNome={categoriaNome}
              onEdit={openEdit}
              onDuplicate={handleDuplicate}
              onDelete={setToDelete}
            />
          )}
        </CardContent>
      </Card>

      {!loading && filtered.length > 0 && (
        <p className="text-right text-sm text-muted-foreground">
          {filtered.length} movimentaç{filtered.length === 1 ? "ão" : "ões"} · saldo
          do filtro:{" "}
          <span
            className={
              total >= 0 ? "font-medium text-success" : "font-medium text-destructive"
            }
          >
            {brl(total)}
          </span>
        </p>
      )}

      {/* Dialogs */}
      <MovementDialog
        open={movOpen}
        onOpenChange={setMovOpen}
        contas={contas}
        categorias={categorias}
        movement={editing}
      />
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} contas={contas} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.descricao
                ? `"${toDelete.descricao}" será removida.`
                : "Esta movimentação será removida."}{" "}
              Esta ação pode ser desfeita apenas no banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? ALL)} items={options}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
