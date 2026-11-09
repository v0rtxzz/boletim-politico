"use client";
import { useRef, useState } from "react";

const SITE = "https://boletim-politico.vercel.app";

/** Junta o título da notícia, o resumo e os links de fonte do item ao qual o botão pertence. */
function montar(botao: HTMLElement) {
  const h3 = botao.closest("h3")!;
  const titulo = (h3.querySelector(".titulo-item")?.textContent ?? h3.textContent ?? "").trim();
  const partes: string[] = [];
  const links: string[] = [];
  let el = h3.nextElementSibling;
  while (el && !/^H[23]$/.test(el.tagName)) {
    const itens = el.tagName === "UL" || el.tagName === "OL" ? [...el.children] : [el];
    for (const it of itens) {
      const rotulo = it.querySelector(".rotulo")?.textContent?.toLowerCase() ?? "";
      if (rotulo.startsWith("fonte")) {
        it.querySelectorAll<HTMLAnchorElement>("a[href^='http']").forEach((a) => links.push(a.href));
        continue;
      }
      const t = (it.textContent ?? "").replace(it.querySelector(".rotulo")?.textContent ?? "", "").trim();
      if (t && partes.join(" ").length < 420 && (!rotulo || rotulo.startsWith("o que"))) partes.push(t);
      it.querySelectorAll<HTMLAnchorElement>("a[href^='http']").forEach((a) => links.push(a.href));
    }
    el = el.nextElementSibling;
  }
  let resumo = partes.join(" ");
  if (resumo.length > 450) resumo = resumo.slice(0, 447).replace(/\s+\S*$/, "") + "…";
  const data = document.querySelector<HTMLElement>("article[data-data]")?.dataset.data ?? "";
  const [, m, d] = data.split("-");
  const url = `${SITE}/boletim/${data}#${h3.id}`;
  const fontes = [...new Set(links)].slice(0, 2);
  const texto = [
    `*${titulo}*`,
    resumo,
    fontes.length ? `Fonte: ${fontes.join("\n")}` : "",
    `Boletim Político de ${d}/${m}: ${url}`,
  ].filter(Boolean).join("\n\n");
  return { titulo, texto };
}

export default function BotaoCompartilhar() {
  const ref = useRef<HTMLButtonElement>(null);
  const [ok, setOk] = useState(false);

  const compartilhar = async () => {
    const { titulo, texto } = montar(ref.current!);
    if (navigator.share) {
      try { await navigator.share({ title: titulo, text: texto }); return; }
      catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    setOk(true); setTimeout(() => setOk(false), 1500);
  };

  return (
    <button ref={ref} type="button" onClick={compartilhar} aria-label="Compartilhar esta notícia"
      className="botao-compartilhar ml-1.5 inline-grid place-items-center w-9 h-9 -my-2 align-middle rounded-full text-[var(--suave)] hover:text-[var(--tinta)] hover:bg-[var(--acento-fundo)] transition-colors cursor-pointer">
      {ok ? (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
      ) : (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" /><path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12" />
        </svg>
      )}
    </button>
  );
}
