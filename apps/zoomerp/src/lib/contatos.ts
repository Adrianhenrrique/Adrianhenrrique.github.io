import { documentoValido, somenteDigitos } from "./documento.ts";

export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"] as const;
export const tiposContatos = { clientes: "cliente", fornecedores: "fornecedor" } as const;
export type GrupoContato = keyof typeof tiposContatos;
export function grupoContato(value: string): GrupoContato | null {
  return value === "clientes" || value === "fornecedores" ? value : null;
}
export const contatoErros: Record<string,string> = {
  nome: "Informe um nome de 2 a 150 caracteres.",
  documento: "Informe um CPF ou CNPJ numérico válido.",
  telefone: "Informe um telefone válido com 8 a 15 dígitos.",
  email: "Informe um e-mail válido.",
  cep: "Informe um CEP com 8 dígitos.",
  uf: "Selecione uma UF válida.",
  tamanho: "Confira o tamanho dos campos.",
  duplicado: "Já existe um cadastro com esse documento neste grupo. Consulte também os arquivados.",
  banco: "Não foi possível salvar o cadastro. Tente novamente.",
  permissao: "Você não tem permissão para editar este cadastro.",
};
export class ContatoInvalido extends Error {
  readonly codigo: string;
  constructor(codigo: string) { super(codigo); this.codigo = codigo; }
}
export function validarContato(input: Record<string, unknown>) {
  const val = (key:string) => typeof input[key] === "string" ? (input[key] as string).trim() : "";
  const nome = val("nome").replace(/\s+/g," ");
  const documentoBruto=val("documento"), telefoneBruto=val("telefone"), cepBruto=val("cep");
  const documento = somenteDigitos(documentoBruto) || null;
  const telefone = somenteDigitos(telefoneBruto) || null;
  const cep = somenteDigitos(cepBruto) || null;
  const email = val("email").toLowerCase() || null;
  const endereco = val("endereco"), cidade = val("cidade"), uf = val("uf").toUpperCase() || null, observacoes=val("observacoes");
  if(nome.length<2||nome.length>150) throw new ContatoInvalido("nome");
  if(documentoBruto && (!/^[\d.\/\s-]+$/.test(documentoBruto)||!documento||!documentoValido(documento))) throw new ContatoInvalido("documento");
  if(telefoneBruto&&(!/^[\d+()\s.-]+$/.test(telefoneBruto)||!telefone||!/^\d{8,15}$/.test(telefone))) throw new ContatoInvalido("telefone");
  if(cepBruto&&(!/^[\d\s-]+$/.test(cepBruto)||!cep||!/^\d{8}$/.test(cep))) throw new ContatoInvalido("cep");
  if(email&&(email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||email.split("@").length!==2)) throw new ContatoInvalido("email");
  if(uf&&!UFS.some(x=>x===uf)) throw new ContatoInvalido("uf");
  if(endereco.length>250||cidade.length>100||observacoes.length>1000) throw new ContatoInvalido("tamanho");
  return {nome,documento,telefone,email,cep,endereco,cidade,uf,observacoes,ativo:input.ativo===true};
}
export function buscaContato(value:string) {
  // Não interpolar metacaracteres do filtro PostgREST (.or), nem curingas.
  const q=value.trim().replace(/[^\p{L}\p{N} @.+()\/\-]/gu,"").slice(0,80);
  const texto=q.replace(/[()./]/g," ").trim().replace(/\s+/g," ");
  const digitos=/^[\d+()./\s-]+$/.test(q)?somenteDigitos(q):"";
  // E-mail pode conter ponto, mas nenhum separador de filtro é permitido.
  const email=q.replace(/[^\p{L}\p{N}@.+-]/gu,"");
  return {q,texto,digitos,email};
}

export type ContatoFormState = { erro: string | null };
export const contatoAvisos: Record<string,string> = {
  salvo: "Cadastro realizado com sucesso.",
  atualizado: "Cadastro atualizado com sucesso.",
  arquivado: "Cadastro arquivado com sucesso.",
  reativado: "Cadastro reativado com sucesso.",
};
export function avisoContato(anterior: boolean | null, ativo: boolean) {
  if (anterior === null) return ativo ? "salvo" : "arquivado";
  return anterior === ativo ? "atualizado" : ativo ? "reativado" : "arquivado";
}
export function formatarTelefone(value: string): string {
  const d = somenteDigitos(value);
  if(d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if(d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  if(d.length === 13 && d.startsWith("55")) return "+55 " + formatarTelefone(d.slice(2));
  if(d.length === 12 && d.startsWith("55")) return "+55 " + formatarTelefone(d.slice(2));
  if(d.length === 8 || d.length === 9) return d.slice(0,-4) + "-" + d.slice(-4);
  return value;
}
