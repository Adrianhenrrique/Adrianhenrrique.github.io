import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZoomERP | Gestão simples para quem empreende",
  description: "ZoomERP: venda rápida, estoque e caixa para MEIs e pequenos negócios. Em construção.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09131d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 font-sans antialiased">{children}</body>
    </html>
  );
}
