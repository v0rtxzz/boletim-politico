"use client";
import { useEffect, useState } from "react";

/** Faixa discreta quando o aparelho está sem internet. */
export default function StatusRede() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const atualizar = () => setOffline(!navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => { window.removeEventListener("online", atualizar); window.removeEventListener("offline", atualizar); };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="mx-auto max-w-[42rem] px-5 pb-4">
      <p className="rounded-xl bg-[var(--acento-fundo)] px-4 py-2.5 text-sm">
        Sem internet. Você está lendo a versão salva no aparelho.
      </p>
    </div>
  );
}
