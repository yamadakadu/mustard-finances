// pt-BR formatting helpers. Money values arrive from the API as strings
// (Decimal serialized as a string), so these accept string | number.

const toNumber = (v: string | number): number =>
  typeof v === "string" ? parseFloat(v) : v;

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function brl(value: string | number): string {
  const n = toNumber(value);
  return brlFormatter.format(Number.isFinite(n) ? n : 0);
}

const dateShort = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

export function formatData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateShort.format(d);
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function nomeMes(mes: number): string {
  return MESES[(mes - 1 + 12) % 12] ?? "";
}
