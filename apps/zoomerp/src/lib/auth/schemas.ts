import { z } from "zod";
import { documentoValido, somenteDigitos } from "@/lib/documento";

export const emailSchema = z.email("Digite um e-mail válido.").max(254);
export const senhaSchema = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(128);
export const cadastroSchema = z.object({ email: emailSchema, senha: senhaSchema });
export const loginSchema = z.object({ email: emailSchema, senha: z.string().min(1) });
export const empresaSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  documento: z.string().trim().max(30).refine(documentoValido, "CPF ou CNPJ inválido."),
  ramo: z.enum(["mercado", "varejo", "oficina", "alimentacao", "distribuidora", "servicos", "outros"]),
}).transform((value) => ({ ...value, documento: somenteDigitos(value.documento) || null }));
export const conviteSchema = z.object({ email: emailSchema });
