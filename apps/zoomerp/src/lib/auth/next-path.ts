/** Somente caminhos internos de convite podem ser usados como redirecionamento pós-login. */
export function destinoSeguro(value: unknown): string {
  if (typeof value === "string" && /^\/convite\/[0-9a-f]{64}$/.test(value)) return value;
  return "/inicio";
}
