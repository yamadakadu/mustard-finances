import type { TipoConta } from "@/lib/api";

export const TIPO_CONTA_LABEL: Record<TipoConta, string> = {
  corrente: "Conta corrente",
  caixinha: "Caixinha",
  cartao_credito: "Cartão de crédito",
  saldo_separado: "Saldo separado",
};

export const TIPO_CONTA_OPTIONS: { value: TipoConta; label: string }[] = (
  Object.keys(TIPO_CONTA_LABEL) as TipoConta[]
).map((value) => ({ value, label: TIPO_CONTA_LABEL[value] }));
