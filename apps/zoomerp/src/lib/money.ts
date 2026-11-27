/**
 * Todos os valores são inteiros de centavos. Nunca calculamos dinheiro com floats.
 * A formatação é feita por partes, para evitar arredondamento de frações.
 */
export function assertCentavos(value: number): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Valor monetário deve ser um inteiro seguro de centavos.");
  }
  return value;
}

export function parseBRL(input: string): number {
  const normalized = input.trim().replace(/^R\$\s*/i, "").replace(/ /g, "");
  if (!/^-?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(normalized)) {
    throw new Error("Valor inválido. Use, por exemplo, 1.234,56.");
  }

  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [reais, centavos = ""] = unsigned.split(",");
  const intPart = Number(reais.replaceAll(".", ""));
  const fractionalPart = Number(centavos.padEnd(2, "0") || "0");
  const result = intPart * 100 + fractionalPart;
  return assertCentavos(negative ? -result : result);
}

export function formatBRL(value: number): string {
  const cents = Math.abs(assertCentavos(value));
  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, "0");
  const grouped = new Intl.NumberFormat("pt-BR", {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(whole);
  return `${value < 0 ? "-" : ""}R$ ${grouped},${fraction}`;
}

export function sumCentavos(...values: number[]): number {
  return values.reduce((acc, value) => assertCentavos(acc + assertCentavos(value)), 0);
}
