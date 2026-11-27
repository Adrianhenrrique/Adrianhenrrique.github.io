import Link from "next/link";
import { ArrowLeft, Boxes, ShoppingCart, Wallet } from "lucide-react";

const screens = {
  vender: { title: "Venda rápida", description: "Aqui você vai buscar ou escanear produtos, montar o carrinho e receber pelo Pix, dinheiro ou cartão.", icon: ShoppingCart, next: "Cadastro de produtos e movimentações de estoque" },
  estoque: { title: "Estoque", description: "Cadastro de produtos, entradas, saídas e alertas de reposição ficarão reunidos aqui.", icon: Boxes, next: "Cadastro de produtos, depois ledger de estoque" },
  caixa: { title: "Seu dinheiro", description: "Você verá entradas, despesas e o saldo financeiro, sem precisar fazer contas de cabeça.", icon: Wallet, next: "Vendas automáticas e lançamentos de caixa" },
} as const;

export function FeaturePending({ section, companyId }: { section: keyof typeof screens; companyId: string }) {
  const data = screens[section];
  const Icon = data.icon;
  return (
    <section className="erp-pending" aria-labelledby="pending-title">
      <div className="erp-pending-icon"><Icon size={30} /></div>
      <span className="erp-tag">PRÓXIMA FASE</span>
      <h2 id="pending-title">{data.title} está a caminho</h2>
      <p>{data.description}</p>
      <div className="erp-pending-next"><strong>Próxima entrega</strong><span>{data.next}</span></div>
      <p className="erp-note">Esta tela é uma prévia. Nenhum produto, venda ou valor financeiro pode ser registrado nesta etapa.</p>
      <Link href={`/inicio?empresa=${encodeURIComponent(companyId)}`} className="erp-link"><ArrowLeft size={17}/> Voltar ao início</Link>
    </section>
  );
}
