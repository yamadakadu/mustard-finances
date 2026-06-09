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
import { ApiError, type Categoria, type CategoriaInput } from "@/lib/api";
import { descendantIds } from "@/lib/categorias";
import { useCreateCategoria, useUpdateCategoria } from "@/lib/queries";

const NONE = "__none__";

const schema = z.object({
  nome_categoria: z.string().min(1, "Informe o nome").max(45, "Máximo 45 caracteres"),
  id_pai: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorias: Categoria[];
  categoria?: Categoria | null;
}

export function CategoriaDialog({ open, onOpenChange, categorias, categoria }: Props) {
  const isEdit = !!categoria;
  const create = useCreateCategoria();
  const update = useUpdateCategoria();
  const saving = create.isPending || update.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome_categoria: "", id_pai: NONE },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      nome_categoria: categoria?.nome_categoria ?? "",
      id_pai: categoria?.id_pai ? String(categoria.id_pai) : NONE,
    });
  }, [open, categoria, form]);

  // a category can't be parented to itself or any of its descendants
  const disallowed = React.useMemo(() => {
    if (!categoria) return new Set<number>();
    return new Set<number>([
      categoria.id_categoria,
      ...descendantIds(categorias, categoria.id_categoria),
    ]);
  }, [categoria, categorias]);

  const paiItems = [
    { value: NONE, label: "Nenhuma (categoria raiz)" },
    ...categorias
      .filter((c) => !disallowed.has(c.id_categoria))
      .map((c) => ({
        value: String(c.id_categoria),
        label: c.nome_categoria ?? `Categoria #${c.id_categoria}`,
      })),
  ];

  async function onSubmit(values: FormValues) {
    const payload: CategoriaInput = {
      nome_categoria: values.nome_categoria.trim(),
      id_pai: values.id_pai && values.id_pai !== NONE ? Number(values.id_pai) : null,
    };
    try {
      if (isEdit && categoria) {
        await update.mutateAsync({ id: categoria.id_categoria, data: payload });
        toast.success("Categoria atualizada");
      } else {
        await create.mutateAsync(payload);
        toast.success("Categoria criada");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao salvar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            Categorias podem ter uma categoria-pai (hierarquia).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Mercado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id_pai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria-pai</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={paiItems}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma (categoria raiz)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paiItems.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
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
