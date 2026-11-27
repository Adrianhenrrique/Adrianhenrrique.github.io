/** Regras puras do catálogo — também usadas no CSV. Dinheiro nunca é calculado com float. */
export const unidades = ["un", "kg", "g", "l", "ml", "cx", "pct"] as const;
export type UnidadeProduto = (typeof unidades)[number];
export const LIMITE_CENTAVOS = 99_999_999_999;
export const LIMITE_CSV_LINHAS = 200;
export const LIMITE_CSV_BYTES = 150_000;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CatalogoInvalido extends Error {
  readonly motivo: "dados" | "preco" | "categoria" | "csv" | "csv_linhas" | "csv_tamanho" | "csv_repetido";
  constructor(motivo: "dados" | "preco" | "categoria" | "csv" | "csv_linhas" | "csv_tamanho" | "csv_repetido") {
    super(motivo);
    this.motivo = motivo;
  }
}

/** Aceita 12,30 / 1.234,56 ou 12.30 (CSV). Todos os cálculos são inteiros. */
export function centavosEntrada(raw: string): number {
  let value = raw.trim().replace(/^R\$\s*/i, "").replace(/[\u00a0\u202f\s]/g, "");
  if (/^\d+\.\d{1,2}$/.test(value)) value = value.replace(".", ",");
  if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(value)) throw new CatalogoInvalido("preco");
  const [inteiros, decimal = ""] = value.split(",");
  const reais = BigInt(inteiros.replaceAll(".", ""));
  const centavos = reais * 100n + BigInt(decimal.padEnd(2, "0") || "0");
  if (centavos > BigInt(LIMITE_CENTAVOS)) throw new CatalogoInvalido("preco");
  return Number(centavos);
}

export type ProdutoEntrada = {
  nome: string;
  codigo: string | null;
  descricao: string;
  unidade: UnidadeProduto;
  preco_venda_centavos: number;
  custo_centavos: number;
  categoria_id: string | null;
  ativo: boolean;
};

export function validarProduto(input: {
  nome: string;
  codigo?: string;
  descricao?: string;
  unidade?: string;
  preco_venda: string;
  custo?: string;
  categoria_id?: string;
  ativo?: boolean;
}): ProdutoEntrada {
  const nome = input.nome.trim().replace(/\s+/g, " ");
  const codigo = (input.codigo ?? "").trim();
  const descricao = (input.descricao ?? "").trim();
  const unidade = input.unidade ?? "un";
  if (nome.length < 2 || nome.length > 150 || codigo.length > 40 || descricao.length > 1000 || !unidades.includes(unidade as UnidadeProduto)) {
    throw new CatalogoInvalido("dados");
  }
  const categoria_id = (input.categoria_id ?? "").trim();
  if (categoria_id && !UUID_RE.test(categoria_id)) throw new CatalogoInvalido("categoria");
  return {
    nome,
    codigo: codigo || null,
    descricao,
    unidade: unidade as UnidadeProduto,
    preco_venda_centavos: centavosEntrada(input.preco_venda),
    custo_centavos: centavosEntrada(input.custo?.trim() || "0"),
    categoria_id: categoria_id || null,
    ativo: input.ativo ?? true,
  };
}

export type LinhaCsv = ProdutoEntrada & { categoria_nome: string };
/** CSV rigoroso com aspas duplas escapadas e linhas CRLF. Vírgula ou ponto-e-vírgula. */
function lerLinhas(texto: string, separador: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], value = "", aspas = false, fechado = false;
  const content = texto.replace(/^\uFEFF/, "");
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      if (aspas && content[i + 1] === '"') { value += '"'; i++; }
      else if (!aspas && value.length === 0 && !fechado) aspas = true;
      else if (aspas) { aspas = false; fechado = true; }
      else throw new CatalogoInvalido("csv");
      continue;
    }
    if (!aspas && (char === separador || char === "\n" || char === "\r")) {
      row.push(value.trim()); value = ""; fechado = false;
      if (char !== separador) {
        if (row.some(x => x !== "")) rows.push(row);
        row = [];
        if (char === "\r" && content[i + 1] === "\n") i++;
        if (rows.length > LIMITE_CSV_LINHAS + 1) throw new CatalogoInvalido("csv_linhas");
      }
      continue;
    }
    if (fechado || (!aspas && (char === "\0"))) throw new CatalogoInvalido("csv");
    value += char;
  }
  if (aspas) throw new CatalogoInvalido("csv");
  if (value !== "" || row.length) { row.push(value.trim()); if (row.some(x => x !== "")) rows.push(row); }
  return rows;
}

export function lerProdutosCsv(input: string): LinhaCsv[] {
  if (new TextEncoder().encode(input).byteLength > LIMITE_CSV_BYTES) throw new CatalogoInvalido("csv_tamanho");
  const first = input.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  const separador = (first.match(/;/g)?.length ?? 0) >= (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows = lerLinhas(input, separador);
  if (rows.length < 2) throw new CatalogoInvalido("csv");
  const normalize = (s: string) => s.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const head = rows.shift()!.map(normalize);
  const required = ["nome", "sku", "categoria", "preco_venda", "custo", "unidade", "descricao"];
  if (head.length !== required.length || head.some((val, index) => val !== required[index])) throw new CatalogoInvalido("csv");
  if (rows.length > LIMITE_CSV_LINHAS) throw new CatalogoInvalido("csv_linhas");
  const seen = new Set<string>();
  return rows.map((cols) => {
    if (cols.length !== required.length) throw new CatalogoInvalido("csv");
    const [nome, sku, categoria, preco_venda, custo, unidade, descricao] = cols;
    const entry = validarProduto({ nome, codigo: sku, categoria_id: "", preco_venda, custo, unidade: unidade || "un", descricao, ativo: true });
    const categoria_nome = categoria.trim();
    if (categoria_nome.length > 80) throw new CatalogoInvalido("categoria");
    if (entry.codigo) {
      const key = entry.codigo.toLocaleLowerCase("pt-BR");
      if (seen.has(key)) throw new CatalogoInvalido("csv_repetido");
      seen.add(key);
    }
    return { ...entry, categoria_nome };
  });
}

export const avisosCatalogo: Record<string, string> = {
  unidade_estoque: "Não foi possível mudar a unidade: limpe o estoque mínimo antes; produtos com histórico devem manter a unidade original.",
  salvo: "Produto salvo com sucesso.",
  atualizado: "Produto atualizado.",
  categoria_salva: "Categoria cadastrada.",
  categoria_atualizada: "Categoria atualizada.",
  dados: "Confira o nome, SKU, unidade e descrição do produto.",
  preco: "Preço inválido. Use, por exemplo, 12,90 (sem valores negativos).",
  categoria: "Selecione uma categoria cadastrada nesta empresa ou deixe em branco.",
  duplicado: "Já existe um produto com este SKU nesta empresa.",
  categoria_duplicada: "Já existe uma categoria com este nome nesta empresa.",
  permissao: "Apenas o dono desta empresa pode alterar o catálogo.",
  banco: "Não foi possível salvar. Tente novamente ou confira sua conexão.",
  csv: "CSV inválido. Utilize o modelo com as sete colunas indicadas.",
  csv_tamanho: "O arquivo ultrapassou o limite de 150 KB.",
  csv_linhas: "Importe no máximo 200 produtos por arquivo.",
  csv_repetido: "O CSV contém SKUs duplicados. Corrija antes de importar.",
};
