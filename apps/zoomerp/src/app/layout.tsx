import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";
import "./erp.css";
import "./catalogo.css";

export const metadata: Metadata = {
  title: "ZoomERP | Gestão simples para quem empreende",
  description: "Controle gerencial para MEIs: vendas, estoque e caixa. Em desenvolvimento.",
  applicationName: "ZoomERP",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ZoomERP", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icons/zoomerp-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/zoomerp-apple-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1422",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 font-sans antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
