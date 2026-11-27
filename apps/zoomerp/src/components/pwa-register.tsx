"use client";

import { useEffect } from "react";

/** Aguarda tempo ocioso antes de iniciar instalação/atualização do PWA. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // A atualização do PWA é opcional; não impede a navegação do ERP.
      });
    };
    if ("requestIdleCallback" in window) {
      const idle = window.requestIdleCallback(register, { timeout: 3500 });
      return () => window.cancelIdleCallback(idle);
    }
    const timeout = setTimeout(register, 1500);
    return () => clearTimeout(timeout);
  }, []);
  return null;
}
