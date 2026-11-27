"use server";

import { destinoSeguro } from "@/lib/auth/next-path";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cadastroSchema, conviteSchema, emailSchema, empresaSchema, loginSchema } from "./schemas";
import { classificarErroCadastro } from "./signup-errors";

function field(form: FormData, key: string): string { return String(form.get(key) ?? "").trim(); }

export async function cadastrar(form: FormData): Promise<void> {
  const parsed = cadastroSchema.safeParse({ email: field(form,"email"), senha: field(form,"senha") });
  if (!parsed.success) redirect("/cadastro?erro=dados");
  const supabase = await createClient();
  const origin = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const next = destinoSeguro(field(form,"next"));
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.senha,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    console.warn("[ZoomERP Auth] Falha no cadastro", { codigo: error.code, status: error.status });
    redirect(`/cadastro?erro=${classificarErroCadastro(error)}`);
  }
  redirect(`/login?aviso=confirmacao&next=${encodeURIComponent(next)}`);
}

export async function entrar(form: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({ email: field(form,"email"), senha: field(form,"senha") });
  if (!parsed.success) redirect("/login?erro=credenciais");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.senha });
  if (error) redirect(error.code === "email_not_confirmed" ? "/login?erro=nao-confirmado" : "/login?erro=credenciais");
  redirect(destinoSeguro(field(form,"next")));
}


/** A confirmação pode ser reenviada sem recriar a conta nem revelar se o e-mail existe. */
export async function reenviarConfirmacao(form: FormData): Promise<void> {
  const parsed = emailSchema.safeParse(field(form, "email"));
  if (!parsed.success) redirect("/reenviar-confirmacao?erro=dados");
  const supabase = await createClient();
  const origin = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    console.warn("[ZoomERP Auth] Falha no reenvio da confirmação", { codigo: error.code, status: error.status });
    redirect(`/reenviar-confirmacao?erro=${classificarErroCadastro(error)}`);
  }
  redirect("/reenviar-confirmacao?aviso=enviado");
}

export async function sair(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function configurarEmpresa(form: FormData): Promise<void> {
  const parsed = empresaSchema.safeParse({ nome: field(form,"nome"), documento: field(form,"documento"), ramo: field(form,"ramo") });
  if (!parsed.success) redirect("/configurar?erro=dados");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { error } = await supabase.rpc("criar_empresa", {
    p_nome: parsed.data.nome,
    p_documento: parsed.data.documento,
    p_ramo: parsed.data.ramo,
  });
  if (error) redirect("/configurar?erro=servidor");
  redirect("/inicio");
}

/** Ao criar convite, o token é devolvido à sessão do dono. Nenhum e-mail é enviado pelo sistema. */
export async function gerarConvite(_prev: { url: string; erro: string }, form: FormData): Promise<{ url: string; erro: string }> {
  const email = conviteSchema.safeParse({ email: field(form,"email") });
  const empresa_id = field(form,"empresa_id");
  if (!email.success || !/^[0-9a-f-]{36}$/.test(empresa_id)) return { url: "", erro: "Confira o e-mail informado." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { url:"", erro:"Faça login novamente." };
  const { data, error } = await supabase.rpc("criar_convite_funcionario", { p_empresa: empresa_id, p_email: email.data.email });
  if (error || typeof data !== "string") return { url:"", erro:"Não foi possível criar o convite. Verifique se você é o dono e se o e-mail já pertence à empresa." };
  const origin = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return { url:`${origin}/convite/${data}`, erro:"" };
}

export async function aceitarConvite(form: FormData): Promise<void> {
  const token = field(form,"token");
  if (!/^[0-9a-f]{64}$/.test(token)) redirect("/inicio?erro=convite");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || !emailSchema.safeParse(auth.user.email).success) redirect("/login");
  const { error } = await supabase.rpc("aceitar_convite", { p_token: token });
  if (error) redirect(`/convite/${token}?erro=convite`);
  redirect("/inicio?aviso=convite");
}
