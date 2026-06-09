"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

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
import { ApiError, type Conta, type TransferenciaInput } from "@/lib/api";
import { useCriarTransferencia } from "@/lib/queries";

const schema = z
  .object({
    id_conta_origem: z.string().min(1, "Selecione a origem"),
    id_conta_destino: z.string().min(1, "Selecione o destino"),
    valor: z
      .string()
      .min(1, "Informe o valor")
      .refine((v) => {
        const n = Number(v.replace(",", "."));
        return Number.isFinite(n) && n > 0;
      }, "Valor inválido"),
    descricao: z.string().max(100, "Máximo 100 caracteres").optional(),
    data_movimentacao: z.string().min(1, "Informe a data"),
  })
  .refine((d) => d.id_conta_origem !== d.id_conta_destino, {
    message: "Origem e destino devem ser diferentes",
    path: ["id_conta_destino"],
  });

type FormValues = z.infer<typeof schema>;

function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contas: Conta[];
}

export function TransferDialog({ open, onOpenChange, contas }: Props) {
  const transferir = useCriarTransferencia();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id_conta_origem: "",
      id_conta_destino: "",
      valor: "",
      descricao: "",
      data_movimentacao: nowLocalInput(),
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        id_conta_origem: "",
        id_conta_destino: "",
        valor: "",
        descricao: "",
        data_movimentacao: nowLocalInput(),
      });
    }
  }, [open, form]);

  async function onSubmit(values: FormValues) {
    const payload: TransferenciaInput = {
      id_conta_origem: Number(values.id_conta_origem),
      id_conta_destino: Number(values.id_conta_destino),
      valor: values.valor.replace(",", "."),
      descricao: values.descricao?.trim() || null,
      data_movimentacao: values.data_movimentacao,
    };
    try {
      await transferir.mutateAsync(payload);
      toast.success("Transferência registrada");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao transferir");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nova transferência</DialogTitle>
          <DialogDescription>
            Move um valor entre duas contas (não conta como receita ou despesa).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <FormField
                control={form.control}
                name="id_conta_origem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>De</FormLabel>
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
                          <SelectValue placeholder="Origem" />
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
                  </FormItem>
                )}
              />
              <ArrowRight className="mb-2.5 size-4 shrink-0 text-muted-foreground" />
              <FormField
                control={form.control}
                name="id_conta_destino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Para</FormLabel>
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
                          <SelectValue placeholder="Destino" />
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
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="id_conta_destino"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Reserva de emergência" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={transferir.isPending}>
                {transferir.isPending ? "Transferindo..." : "Transferir"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
