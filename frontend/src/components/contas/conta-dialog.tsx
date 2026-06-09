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
import { ApiError, type Banco, type Conta, type ContaInput } from "@/lib/api";
import { TIPO_CONTA_OPTIONS } from "@/lib/contas";
import { useCreateConta, useUpdateConta } from "@/lib/queries";

const NONE = "__none__";

const schema = z.object({
  nome_conta: z.string().min(1, "Informe o nome").max(45, "Máximo 45 caracteres"),
  tipo: z.enum(["corrente", "caixinha", "cartao_credito", "saldo_separado"]),
  saldo_inicial: z
    .string()
    .min(1, "Informe o saldo inicial")
    .refine((v) => Number.isFinite(Number(v.replace(",", "."))), "Valor inválido"),
  id_banco: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bancos: Banco[];
  conta?: Conta | null;
}

export function ContaDialog({ open, onOpenChange, bancos, conta }: Props) {
  const isEdit = !!conta;
  const create = useCreateConta();
  const update = useUpdateConta();
  const saving = create.isPending || update.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome_conta: "", tipo: "corrente", saldo_inicial: "0", id_banco: NONE },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(
      conta
        ? {
            nome_conta: conta.nome_conta ?? "",
            tipo: conta.tipo,
            saldo_inicial: conta.saldo_inicial,
            id_banco: conta.id_banco ? String(conta.id_banco) : NONE,
          }
        : { nome_conta: "", tipo: "corrente", saldo_inicial: "0", id_banco: NONE },
    );
  }, [open, conta, form]);

  const bancoItems = [
    { value: NONE, label: "Sem banco" },
    ...bancos.map((b) => ({
      value: String(b.id_banco),
      label: b.nome_banco ?? `Banco #${b.id_banco}`,
    })),
  ];

  async function onSubmit(values: FormValues) {
    const payload: ContaInput = {
      nome_conta: values.nome_conta.trim(),
      tipo: values.tipo,
      saldo_inicial: values.saldo_inicial.replace(",", "."),
      id_banco: values.id_banco && values.id_banco !== NONE ? Number(values.id_banco) : null,
    };
    try {
      if (isEdit && conta) {
        await update.mutateAsync({ id: conta.id_conta, data: payload });
        toast.success("Conta atualizada");
      } else {
        await create.mutateAsync(payload);
        toast.success("Conta criada");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao salvar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar conta" : "Nova conta"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados da conta."
              : "Crie uma conta corrente, caixinha ou cartão."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_conta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Nubank Corrente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      items={TIPO_CONTA_OPTIONS}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPO_CONTA_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
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
                name="saldo_inicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo inicial (R$)</FormLabel>
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
              name="id_banco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={bancoItems}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sem banco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bancoItems.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
