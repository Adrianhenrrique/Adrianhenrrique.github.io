"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export function InstallPwa() {
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    setIos(/iPhone|iPad|iPod/i.test(window.navigator.userAgent));
    const media = window.matchMedia("(display-mode: standalone)");
    setInstalled(media.matches || ("standalone" in window.navigator && Boolean((window.navigator as Navigator & {standalone?: boolean}).standalone)));
    const onPrompt = (event: Event) => { event.preventDefault(); setPromptEvent(event as InstallPrompt); };
    const onInstalled = () => { setInstalled(true); setPromptEvent(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }
  return <section className="erp-card erp-install">
    <div className="erp-icon-frame"><Smartphone size={22}/></div>
    <h2>ZoomERP no seu celular</h2>
    <p>Abra como aplicativo, direto pela tela inicial. É necessário ter internet para acessar sua empresa.</p>
    {installed ? <span className="erp-tag">Aplicativo instalado</span> :
      promptEvent ? <button type="button" className="erp-action" onClick={install}><Download size={18}/> Instalar ZoomERP</button> :
      <p className="erp-install-tip">{ios ? "No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início." : "No navegador, abra o menu e procure Instalar aplicativo ou Adicionar à tela inicial."}</p>}
  </section>;
}
