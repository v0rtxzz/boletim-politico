"use client";
import { useEffect } from "react";

/** Registra o service worker e pede para deixar salvas as páginas principais + arquivos usados. */
export default function RegistrarSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    const preSalvar = () => {
      navigator.serviceWorker.ready.then((reg) => {
        const data = document.querySelector<HTMLElement>("article[data-data]")?.dataset.data;
        const recursos = performance.getEntriesByType("resource")
          .map((r) => new URL(r.name))
          .filter((u) => u.origin === location.origin && u.pathname.startsWith("/_next/static/"))
          .map((u) => u.pathname);
        const urls = ["/", "/arquivo", "/glossario", location.pathname, ...(data ? [`/boletim/${data}`] : []), ...recursos];
        reg.active?.postMessage({ tipo: "pre-salvar", urls });
      }).catch(() => {});
    };
    if (document.readyState === "complete") preSalvar();
    else window.addEventListener("load", preSalvar, { once: true });
  }, []);
  return null;
}
