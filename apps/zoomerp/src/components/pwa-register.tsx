"use client";

import { useEffect } from "react";

/** O SW só guarda assets públicos; nenhuma página privada ou resposta Auth é cacheada. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // PWA opcional: falha no registro não pode impedir a navegação do ERP.
    });
  }, []);
  return null;
}
