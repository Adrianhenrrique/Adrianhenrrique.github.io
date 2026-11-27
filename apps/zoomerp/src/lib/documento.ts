/** Mantém documentos como texto; nunca os converta para Number. */
export function somenteDigitos(value: string): string {
  return value.replace(/\D/g, "");
}

export function documentoValido(value: string): boolean {
  const d = somenteDigitos(value);
  if (!d) return true; // Cadastro opcional.
  if (!/^\d{11}$|^\d{14}$/.test(d) || /^(\d)\1+$/.test(d)) return false;
  const digito = (weights: number[]) => {
    const total = weights.reduce((sum, weight, i) => sum + Number(d[i]) * weight, 0);
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  if (d.length === 11) {
    const first = (d.slice(0, 9).split("").reduce((s, n, i) => s + Number(n) * (10 - i), 0) * 10) % 11;
    const firstDigit = first === 10 ? 0 : first;
    const second = (d.slice(0, 10).split("").reduce((s, n, i) => s + Number(n) * (11 - i), 0) * 10) % 11;
    return firstDigit === Number(d[9]) && (second === 10 ? 0 : second) === Number(d[10]);
  }
  return digito([5,4,3,2,9,8,7,6,5,4,3,2]) === Number(d[12]) &&
    digito([6,5,4,3,2,9,8,7,6,5,4,3,2]) === Number(d[13]);
}

export function formatarDocumento(value: string): string {
  const digits = somenteDigitos(value);
  if (digits.length === 11) return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  if (digits.length === 14) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return value;
}
