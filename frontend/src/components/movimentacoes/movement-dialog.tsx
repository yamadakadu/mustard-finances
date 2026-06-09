"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ApiError,
  type Categoria,
  type Conta,
  type Movimentacao,
  type MovimentacaoInput,
} from "@/lib/api";
import { useCreateMovimentacao, useUpdateMovimentacao } from "@/lib/queries";

const NONE = "__none__";

const schema = z.object({
  tipo: z.enum(["entrada", "saida"]),
  valor: z
    .string()
    .min(1, "Informe o valor")
    .refine((v) => {
      const n = Number(v.replace(",", "."));
      return Number.isFinite(n) && n > 0;
    }, "Valor inválido"),
  id_conta: z.string().min(1, "Selecione a conta"),
  id_categoria: z.string().optional(),
  recorrencia: z.string().optional(),
  descricao: z.string().max(100, "Máximo 100 caracteres").optional(),
  data_movimentacao: z.string().min(1, "Informe a data"),
});

type FormValues = z.infer<typeof schema>;

function toLocalInput(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contas: Conta[];
  categorias: Categoria[];
  movement?: Movimentacao | null;
}

export function MovementDialog({ open, onOpenChange, contas, categorias, movement }: Props) {
  const isEdit = !!movement;
  const create = useCreateMovimentacao();
  const update = useUpdateMovimentacao();
  const saving = create.isPending || update.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: "saida",
      valor: "",
      id_conta: "",
      id_categoria: NONE,
      recorrencia: NONE,
      descricao: "",
      data_movimentacao: toLocalInput(null),
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(
      movement
        ? {
            tipo: movement.tipo,
            valor: movement.valor,
            id_conta: movement.id_conta ? String(movement.id_conta) : "",
            id_categoria: movement.id_categoria ? String(movement.id_categoria) : NONE,
            recorrencia: movement.recorrencia ?? NONE,
            descricao: movement.descricao ?? "",
            data_movimentacao: toLocalInput(movement.data_movimentacao),
          }
        : {
            tipo: "saida",
            valor: "",
            id_conta: "",
            id_categoria: NONE,
            recorrencia: NONE,
            descricao: "",
            data_movimentacao: toLocalInput(null),
          },
    );
  }, [open, movement, form]);

  async function onSubmit(values: FormValues) {
    const payload: MovimentacaoInput = {
      tipo: values.tipo,
      valor: values.valor.replace(",", "."),
      id_conta: Number(values.id_conta),
      id_categoria:
        values.id_categoria && values.id_categoria !== NONE
          ? Number(values.id_categoria)
          : null,
      recorrencia:
        values.recorrencia && values.recorrencia !== NONE
          ? (values.recorrencia as "fixo" | "variavel")
          : null,
      descricao: values.descricao?.trim() || null,
      data_movimentacao: values.data_movimentacao,
    };
    try {
      if (isEdit && movement) {
        await update.mutateAsync({ id: movement.id_movimentacao, data: payload });
        toast.success("Movimentação atualizada");
      } else {
        await create.mutateAsync(payload);
        toast.success("Movimentação criada");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao salvar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar movimentação" : "Nova movimentação"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do lançamento." : "Registre uma entrada ou saída."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={[
                        { value: "saida", label: "Saída" },
                        { value: "entrada", label: "Entrada" },
                      ]}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="saida">Saída</SelectItem>
                        <SelectItem value="entrada">Entrada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="id_conta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={contas.map((c) => ({
                      value: String(c.id_conta),
                      label: c.nome_conta ?? `Conta #${c.id_conta}`,
                    }))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contas.map((c) => (
                        <SelectItem key={c.id_conta} value={String(c.id_conta)}>
                          {c.nome_conta ?? `Conta #${c.id_conta}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id_categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={[
                      { value: NONE, label: "Sem categoria" },
                      ...categorias.map((c) => ({
                        value: String(c.id_categoria),
                        label: c.nome_categoria ?? `Categoria #${c.id_categoria}`,
                      })),
                    ]}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sem categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Sem categoria</SelectItem>
                      {categorias.map((c) => (
                        <SelectItem key={c.id_categoria} value={String(c.id_categoria)}>
                          {c.nome_categoria ?? `Categoria #${c.id_categoria}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_movimentacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recorrencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recorrência</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={[
                        { value: NONE, label: "Nenhuma" },
                        { value: "fixo", label: "Fixo" },
                        { value: "variavel", label: "Variável" },
                      ]}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Nenhuma</SelectItem>
                        <SelectItem value="fixo">Fixo</SelectItem>
                        <SelectItem value="variavel">Variável</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Mercado do mês" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
