"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight, Boxes, Ellipsis, House, Menu,
  Moon, PackagePlus, Plus, ReceiptText, ShoppingCart, Sun,
  Wallet, X,
} from "lucide-react";

type Role = "dono" | "funcionario";
const items = [
  { label: "Início", href: "/inicio", icon: House },
  { label: "Vender", href: "/vender", icon: ShoppingCart },
  { label: "Estoque", href: "/estoque", icon: Boxes },
  { label: "Caixa", href: "/caixa", icon: Wallet },
  { label: "Mais", href: "/mais", icon: Ellipsis },
];

export function AppShell({
  children, title, description, companyId, companyName, role,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  companyId: string;
  companyName: string;
  role: Role;
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [quickOpen, setQuickOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem("zoomerp-theme") === "light") setTheme("light");
    } catch { /* Tema padrão quando armazenamento estiver indisponível. */ }
  }, []);
  function changeTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { window.localStorage.setItem("zoomerp-theme", next); } catch { /* Sem persistência. */ }
  }

  const url = (path: string) => `${path}?empresa=${encodeURIComponent(companyId)}`;
  const navigation = (context: "bottom" | "sidebar") => (
    <nav aria-label={context === "bottom" ? "Navegação inferior" : "Navegação principal"} className={context === "bottom" ? "erp-tabs" : "erp-side-nav"}>
      {items.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href === "/mais" && pathname === "/equipe");
        return (
          <Link key={href} href={url(href)} aria-current={active ? "page" : undefined} className={`erp-nav-item ${active ? "is-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Icon size={context === "bottom" ? 21 : 19} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="erp-app" data-theme={theme}>
      <aside className={`erp-sidebar ${menuOpen ? "is-open" : ""}`}>
        <Link href="/inicio" className="erp-brand" aria-label="ZoomERP - início">
          <span className="erp-brand-icon">Z</span><span>Zoom<strong>ERP</strong></span>
        </Link>
        <div className="erp-side-section">MENU PRINCIPAL</div>
        {navigation("sidebar")}
        <div className="erp-sidebar-foot">
          <span className="erp-dot" /> Versão 0.3 · Fundação
        </div>
      </aside>

      {menuOpen && <button type="button" className="erp-drawer-cover" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <div className="erp-content">
        <header className="erp-topbar">
          <div className="erp-top-left">
            <button type="button" className="erp-menu-toggle" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <span className="erp-mobile-symbol" aria-hidden="true">Z</span>
            <div className="erp-company">
              <span className="erp-eyebrow">SEU NEGÓCIO</span>
              <strong title={companyName}>{companyName}</strong>
            </div>
          </div>
          <div className="erp-top-right">
            <span className="erp-role">{role === "dono" ? "Dono" : "Funcionário"}</span>
            <button type="button" className="erp-theme-toggle" aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"} title={theme === "dark" ? "Tema claro" : "Tema escuro"} onClick={changeTheme}>
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        <main className="erp-main" id="conteudo">
          <div className="erp-page-heading">
            <div><p className="erp-kicker">ZOOMERP / {role === "dono" ? "PAINEL DO DONO" : "PAINEL DO FUNCIONÁRIO"}</p><h1>{title}</h1>{description && <p className="erp-subtitle">{description}</p>}</div>
            <span className="erp-dev-label">Em desenvolvimento</span>
          </div>
          {children}
        </main>
        <footer className="erp-main-footer">ZoomERP · Controle gerencial · Não emite nota fiscal</footer>
      </div>
      {navigation("bottom")}
      <div className="erp-quick-wrap">
        {quickOpen && <div className="erp-quick-panel" id="erp-quick-actions">
          <p>Ações rápidas <span>· Disponíveis na Fase 1</span></p>
          <Link href={url("/vender")} onClick={() => setQuickOpen(false)}><ShoppingCart size={18} /> Nova venda <ArrowRight size={16} /></Link>
          <Link href={url("/estoque")} onClick={() => setQuickOpen(false)}><PackagePlus size={18} /> Entrada de estoque <ArrowRight size={16} /></Link>
          <Link href={url("/caixa")} onClick={() => setQuickOpen(false)}><ReceiptText size={18} /> Lançar despesa <ArrowRight size={16} /></Link>
        </div>}
        <button type="button" className="erp-quick-button" aria-expanded={quickOpen} aria-controls="erp-quick-actions" aria-label={quickOpen ? "Fechar ações rápidas" : "Abrir ações rápidas"} onClick={() => setQuickOpen(!quickOpen)}>
          {quickOpen ? <X size={25} /> : <Plus size={27} />}
        </button>
      </div>
    </div>
  );
}
