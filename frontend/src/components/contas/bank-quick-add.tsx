"use client";

import * as React from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, type Banco } from "@/lib/api";
import { useCreateBanco } from "@/lib/queries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (banco: Banco) => void;
}

export function BankQuickAdd({ open, onOpenChange, onCreated }: Props) {
  const create = useCreateBanco();
  const [nome, setNome] = React.useState("");

  React.useEffect(() => {
    if (open) setNome("");
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) return;
    try {
      const banco = await create.mutateAsync(trimmed);
      toast.success("Banco criado");
      onCreated?.(banco);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar banco");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Novo banco</DialogTitle>
          <DialogDescription>Adicione uma instituição (ex.: Nubank).</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="bank-name">Nome</Label>
            <Input
              id="bank-name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Nubank"
              maxLength={15}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending || !nome.trim()}>
              {create.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
