import Link from "next/link";
import { Save, ArrowLeft } from "lucide-react";
import { salvarProduto } from "@/lib/catalogo-actions";
import type { UnidadeProduto } from "@/lib/catalogo";

export type CategoriaItem = { id: string; nome: string };
export type ProdutoItem = {
  id: string; nome: string; codigo: string | null; descricao: string;
  unidade: UnidadeProduto; preco_venda_centavos: number; custo_centavos: number;
  categoria_id: string | null; ativo: boolean;
};

function precoInput(value: number) {
  return `${Math.floor(value / 100)},${String(value % 100).padStart(2, "0")}`;
}
const unidades = [
  { value: "un", label: "Unidade (un)" }, { value: "kg", label: "Quilo (kg)" },
  { value: "g", label: "Grama (g)" }, { value: "l", label: "Litro (L)" },
  { value: "ml", label: "Mililitro (mL)" }, { value: "cx", label: "Caixa (cx)" },
  { value: "pct", label: "Pacote (pct)" },
];

export function ProdutoForm({ empresa, categorias, produto, erro }: {
  empresa: string; categorias: CategoriaItem[]; produto?: ProdutoItem | null; erro?: string;
}) {
  return <div className="catalog-panel">
    {erro && <p role="alert" className="catalog-error">{erro}</p>}
    <form action={salvarProduto} className="catalog-form">
      <input type="hidden" name="empresa" value={empresa}/>
      {produto && <input type="hidden" name="produto_id" value={produto.id}/>}
      <div className="catalog-grid-two">
        <label className="catalog-field"><span>Nome do produto *</span>
          <input autoFocus name="nome" placeholder="Ex.: Café torrado 500 g" minLength={2} maxLength={150} defaultValue={produto?.nome ?? ""} required/>
        </label>
        <label className="catalog-field"><span>SKU / código interno</span>
          <input name="codigo" maxLength={40} placeholder="Ex.: CAFE-500" defaultValue={produto?.codigo ?? ""}/>
        </label>
        <label className="catalog-field"><span>Categoria</span>
          <select name="categoria_id" defaultValue={produto?.categoria_id ?? ""}>
            <option value="">Sem categoria</option>
            {categorias.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <small>Precisa de outra? <Link href={`/categorias?empresa=${encodeURIComponent(empresa)}`}>Gerenciar categorias</Link>.</small>
        </label>
        <label className="catalog-field"><span>Unidade de venda</span>
          <select name="unidade" defaultValue={produto?.unidade ?? "un"}>
            {unidades.map(u=><option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </label>
        <label className="catalog-field"><span>Preço de venda (R$) *</span>
          <input name="preco_venda" type="text" inputMode="decimal" autoComplete="off" placeholder="Ex.: 19,90" defaultValue={precoInput(produto?.preco_venda_centavos ?? 0)} required/>
          <small>Use vírgula para os centavos.</small>
        </label>
        <label className="catalog-field"><span>Preço de custo (R$)</span>
          <input name="custo" type="text" inputMode="decimal" autoComplete="off" placeholder="Ex.: 12,50" defaultValue={precoInput(produto?.custo_centavos ?? 0)}/>
        </label>
      </div>
      <label className="catalog-field"><span>Descrição (opcional)</span>
        <textarea rows={3} maxLength={1000} name="descricao" placeholder="Detalhes para identificar o produto..." defaultValue={produto?.descricao ?? ""}/>
      </label>
      <label className="catalog-check"><input type="checkbox" name="ativo" defaultChecked={produto?.ativo ?? true}/><span><strong>Produto ativo</strong><small>Desmarque para arquivar. O histórico do produto será preservado.</small></span></label>
      <div className="catalog-form-actions">
        <button type="submit" className="catalog-btn catalog-primary"><Save size={18}/> {produto ? "Salvar alterações" : "Cadastrar produto"}</button>
        <Link href={`/estoque?empresa=${encodeURIComponent(empresa)}`} className="catalog-btn catalog-secondary"><ArrowLeft size={18}/> Cancelar</Link>
      </div>
    </form>
  </div>;
}
