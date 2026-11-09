"use client";
import { useEffect } from "react";
import { lerLeitura, salvarLeitura } from "@/lib/leitura";

/** Registra até onde você leu (sem nada visível) e atende ao link "?continuar". */
function primeiroVisivel(): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>("#corpo-boletim [data-bloco]")) {
    if (el.getBoundingClientRect().top >= 90) return el;
  }
  return null;
}

export function irParaBloco(bloco: number) {
  const el = document.querySelector<HTMLElement>(`[data-bloco="${bloco}"]`);
  if (!el) return;
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 110, behavior: reduzido ? "auto" : "smooth" });
}

export default function RastreioLeitura({ data, titulo, total }: { data: string; titulo: string; total: number }) {
  useEffect(() => {
    // Vindo do "Continuar lendo" do Arquivo: vai direto ao ponto salvo.
    const params = new URLSearchParams(location.search);
    if (params.has("continuar")) {
      const l = lerLeitura(data);
      if (l) setTimeout(() => irParaBloco(l.bloco), 150);
      history.replaceState(null, "", location.pathname);
    }

    let t: ReturnType<typeof setTimeout> | undefined;
    const montadoEm = Date.now();
    const salvar = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (Date.now() - montadoEm < 1500) return; // rolagem automática ao reabrir
        const todos = document.querySelectorAll<HTMLElement>("#corpo-boletim [data-bloco]");
        const el = primeiroVisivel() ?? todos[todos.length - 1];
        if (!el) return;
        const bloco = Number(el.dataset.bloco);
        // Progresso: último trecho que já passou do meio da tela; no fim da página, tudo lido.
        let alcance = bloco;
        for (const b of document.querySelectorAll<HTMLElement>("#corpo-boletim [data-bloco]")) {
          if (b.getBoundingClientRect().top < window.innerHeight * 0.6) alcance = Math.max(alcance, Number(b.dataset.bloco));
        }
        const corpo = document.getElementById("corpo-boletim")!.getBoundingClientRect();
        if (corpo.bottom < window.innerHeight + 40) alcance = total - 1;
        const antes = lerLeitura(data);
        // "Onde parou" = ponto mais avançado alcançado: voltar ao topo ou reler algo não o desfaz.
        if (antes && antes.bloco >= bloco && antes.max >= alcance) return;
        const avancou = !antes || bloco >= antes.bloco;
        const alvo = avancou ? el : document.querySelector<HTMLElement>(`[data-bloco="${antes!.bloco}"]`) ?? el;
        const secao = alvo.closest("section")?.querySelector("h2 span:last-child")?.textContent ?? "Abertura";
        salvarLeitura({
          data, titulo, total,
          bloco: avancou ? bloco : antes!.bloco,
          max: Math.max(alcance, antes?.max ?? 0),
          secao, quando: Date.now(),
        });
      }, 400);
    };
    window.addEventListener("scroll", salvar, { passive: true });
    return () => { window.removeEventListener("scroll", salvar); clearTimeout(t); };
  }, [data, titulo, total]);
  return null;
}
