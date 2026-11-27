/** Mensagens de cadastro controladas: nunca reproduzir erros técnicos ou dados pessoais na URL. */
export type ErroCadastro =
  | "dados"
  | "limite-email"
  | "limite-requisicoes"
  | "email-invalido"
  | "senha-fraca"
  | "conta-existente"
  | "cadastro-desativado"
  | "cadastro";

type ErroAuth = { code?: string; status?: number; message?: string };

export function classificarErroCadastro(error: ErroAuth): ErroCadastro {
  const codigo = error.code?.toLowerCase() ?? "";
  const mensagem = error.message ?? "";
  if (
    codigo === "over_email_send_rate_limit" ||
    codigo === "email_rate_limit_exceeded" ||
    (error.status === 429 && /email|only request this after/i.test(mensagem))
  ) return "limite-email";
  if (error.status === 429 || codigo === "over_request_rate_limit" || codigo === "over_signup_rate_limit") {
    return "limite-requisicoes";
  }
  if (codigo === "weak_password") return "senha-fraca";
  if (codigo === "email_address_invalid" || codigo === "email_address_not_authorized") return "email-invalido";
  if (codigo === "user_already_exists" || codigo === "email_exists") return "conta-existente";
  if (codigo === "signup_disabled" || codigo === "email_provider_disabled") return "cadastro-desativado";
  return "cadastro";
}

export function mensagemErroCadastro(erro?: string): string | null {
  switch (erro) {
    case "dados":
      return "Confira o e-mail e crie uma senha de pelo menos 8 caracteres.";
    case "limite-email":
      return "O envio de e-mails foi limitado temporariamente. Se você já se cadastrou, confira a caixa de entrada e o spam. Aguarde pelo menos 1 minuto antes de pedir outro e-mail; não é necessário criar uma nova conta.";
    case "limite-requisicoes":
      return "Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.";
    case "email-invalido":
      return "O endereço de e-mail foi recusado pelo provedor de autenticação. Confira o endereço e tente novamente.";
    case "senha-fraca":
      return "Essa senha não atende aos requisitos de segurança. Escolha uma senha mais forte.";
    case "conta-existente":
      return "Já existe uma conta para esse e-mail. Entre com sua senha ou confirme o cadastro pelo link enviado.";
    case "cadastro-desativado":
      return "O cadastro está temporariamente indisponível. Tente novamente mais tarde.";
    case "cadastro":
      return "Não foi possível criar a conta neste momento. Tente novamente mais tarde.";
    default:
      return null;
  }
}
