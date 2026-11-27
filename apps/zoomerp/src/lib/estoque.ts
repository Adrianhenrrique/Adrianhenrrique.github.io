export function quantidadeEstoque(value: string, tipo: string): string {
  const normalized = value.trim().replace(",", ".");
  if (!/^(?:0|[1-9]\d{0,14})(?:\.\d{1,3})?$/.test(normalized))
    throw new Error("quantidade");
  if (tipo !== "ajuste" && !/[1-9]/.test(normalized)) throw new Error("quantidade");
  return normalized;
}

export function formatQuantidade(value: string | number): string {
  const [whole, fraction = ""] = String(value).split(".");
  const decimals = fraction.replace(/0+$/, "");
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (decimals ? "," + decimals : "");
}

export const tiposEstoque: Record<string,string> = {
  entrada:"Entrada", saida:"Saída", ajuste:"Ajuste", estorno:"Estorno"
};

export const errosEstoque: Record<string,string> = {
  dados:"Confira os dados informados.", permissao:"Você não tem permissão para movimentar este estoque.",
  quantidade:"Informe uma quantidade válida, com até três casas decimais.",
  ESTOQUE_QUANTIDADE_INTEIRA:"Este produto aceita apenas quantidades inteiras.",
  ESTOQUE_INSUFICIENTE:"Saldo insuficiente para esta operação.",
  ESTOQUE_ESTORNO_INVALIDO:"Movimentação já estornada ou inválida.",
  ESTOQUE_ARQUIVADO:"Produto arquivado. Apenas estornos são permitidos.",
  ESTOQUE_SEM_ALTERACAO:"O saldo informado é igual ao atual.",
  ESTOQUE_REQUISICAO_CONFLITO:"Operação repetida com dados diferentes. Atualize a página.",
  banco:"Não foi possível registrar a movimentação. Confira o histórico antes de tentar novamente."
};

/** Campo vazio desativa o alerta; zero continua sendo um limite válido. */
export function validarEstoqueMinimo(value: string): string | null {
  return value.trim() === "" ? null : quantidadeEstoque(value,"ajuste");
}
