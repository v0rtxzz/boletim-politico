"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Leitor em voz alta do boletim (Web Speech API, voz pt-BR do aparelho).
 * - Lê bloco a bloco (títulos, parágrafos, itens de lista, linhas de tabela).
 * - Destaca o bloco em leitura e acompanha a rolagem.
 * - Pausar / continuar, voltar / avançar, barra para escolher o ponto,
 *   ou tocar em qualquer trecho do texto para começar dali.
 */

type Bloco = { el: HTMLElement; partes: string[]; secao: string };

const SELETOR = [
  "#corpo-boletim section > h2",
  "#corpo-boletim .prosa > p",
  "#corpo-boletim .prosa > h3",
  "#corpo-boletim .prosa > h4",
  "#corpo-boletim .prosa > blockquote",
  "#corpo-boletim .prosa li:not(.campo-fonte)",
  "#corpo-boletim .prosa tr",
].join(",");

const VELOCIDADES = [1, 1.25, 1.5, 0.85];

function limpar(t: string) {
  return t
    .replace(/\s*·\s*/g, ", ")
    .replace(/\s+—\s+/g, ", ")
    .replace(/\bSTF\b/g, "S T F")
    .replace(/\bTSE\b/g, "T S E")
    .replace(/\bTCU\b/g, "T C U")
    .replace(/\bEUA\b/g, "Estados Unidos")
    .replace(/\s+/g, " ")
    .trim();
}

/** Quebra textos longos em frases (alguns navegadores cortam falas longas). */
function fatiar(t: string): string[] {
  const frases = t.match(/[^.!?;:]+[.!?;:]*\s*/g) ?? [t];
  const out: string[] = [];
  let atual = "";
  for (const f of frases) {
    if ((atual + f).length > 220 && atual) { out.push(atual.trim()); atual = ""; }
    atual += f;
  }
  if (atual.trim()) out.push(atual.trim());
  return out;
}

function textoDoBloco(el: HTMLElement): string {
  if (el.tagName === "H2") {
    const partes = [...el.querySelectorAll("span")].map((s) => s.textContent ?? "");
    return partes.length === 2 ? `Seção ${partes[0]}. ${partes[1]}.` : `${el.textContent}.`;
  }
  if (el.tagName === "TR") {
    return [...el.children].map((c) => c.textContent?.trim()).filter(Boolean).join(", ") + ".";
  }
  // Rótulos ("O que aconteceu", "Confirmado"…) ganham uma pausa antes do texto.
  const rotulo = el.querySelector<HTMLElement>(":scope > .rotulo, :scope > .selo, :scope > p > .rotulo, :scope > p > .selo");
  let t = el.textContent ?? "";
  if (rotulo?.textContent) {
    const r = rotulo.textContent.trim();
    t = `${r}. ${t.replace(r, "").trim()}`;
  }
  return /[.!?:]$/.test(t.trim()) ? t : `${t}.`;
}

function escolherVoz(): SpeechSynthesisVoice | null {
  const vozes = window.speechSynthesis.getVoices();
  const pt = vozes.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("pt-br"));
  const pref = ["luciana", "francisca", "thalita", "google português do brasil", "microsoft francisca", "felipe"];
  for (const p of pref) {
    const v = pt.find((x) => x.name.toLowerCase().includes(p));
    if (v) return v;
  }
  return pt.find((v) => v.localService) ?? pt[0] ?? vozes.find((v) => v.lang.toLowerCase().startsWith("pt")) ?? null;
}

const Icone = ({ d, size = 22 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
);
const PLAY = "M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z";
const PAUSA = "M7 5h3.2v14H7zM13.8 5H17v14h-3.2z";
const ANTERIOR = "M6 5h2v14H6zM19 6.2v11.6a.8.8 0 0 1-1.25.66L9.6 12.66a.8.8 0 0 1 0-1.32l8.15-5.8A.8.8 0 0 1 19 6.2z";
const PROXIMO = "M16 5h2v14h-2zM5 6.2v11.6a.8.8 0 0 0 1.25.66l8.15-5.8a.8.8 0 0 0 0-1.32L6.25 5.54A.8.8 0 0 0 5 6.2z";
const FECHAR = "M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z";
const FONE = "M12 3a8 8 0 0 0-8 8v6a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H6v-2a6 6 0 1 1 12 0v2h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-6a8 8 0 0 0-8-8z";

export default function LeitorVoz({ titulo }: { titulo: string }) {
  const [suportado, setSuportado] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [tocando, setTocando] = useState(false);
  const [indice, setIndice] = useState(0);
  const [total, setTotal] = useState(0);
  const [secao, setSecao] = useState("");
  const [vel, setVel] = useState(1);

  const blocos = useRef<Bloco[]>([]);
  const geracao = useRef(0); // invalida callbacks de falas canceladas
  const idxRef = useRef(0);
  const velRef = useRef(1);
  const voz = useRef<SpeechSynthesisVoice | null>(null);
  const comecou = useRef(false); // alguma fala já tocou nesta sessão?
  const [aviso, setAviso] = useState("");

  // Monta a lista de blocos a partir do texto renderizado.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { setSuportado(false); return; }
    // Itens de lista aninhados são lidos junto com o item pai.
    const els = [...document.querySelectorAll<HTMLElement>(SELETOR)].filter(
      (el) => !(el.tagName === "LI" && el.parentElement?.closest("li")),
    );
    let secaoAtual = "Abertura";
    const lista: Bloco[] = [{ el: document.querySelector("article h1") as HTMLElement, partes: fatiar(limpar(`Boletim Político Diário. ${titulo}.`)), secao: "Abertura" }];
    for (const el of els) {
      if (el.tagName === "H2") secaoAtual = el.textContent?.replace(/^\d+\s*/, "").trim() ?? secaoAtual;
      const txt = limpar(textoDoBloco(el));
      if (!txt || txt === ".") continue;
      lista.push({ el, partes: fatiar(txt), secao: secaoAtual });
    }
    blocos.current = lista.filter((b) => b.el);
    blocos.current.forEach((b, i) => { b.el.dataset.bloco = String(i); });
    setTotal(blocos.current.length);
    setSecao(blocos.current[0]?.secao ?? "");

    const carregar = () => { voz.current = escolherVoz(); };
    carregar();
    window.speechSynthesis.addEventListener?.("voiceschanged", carregar);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", carregar);
      geracao.current++;
      window.speechSynthesis.cancel();
      document.querySelectorAll(".lendo").forEach((e) => e.classList.remove("lendo"));
    };
  }, [titulo]);

  const marcar = useCallback((i: number) => {
    document.querySelectorAll(".lendo").forEach((e) => e.classList.remove("lendo"));
    const b = blocos.current[i];
    if (!b) return;
    b.el.classList.add("lendo");
    setIndice(i);
    setSecao(b.secao);
    const r = b.el.getBoundingClientRect();
    const topoLivre = 110, baseLivre = window.innerHeight - 200;
    if (r.top < topoLivre || r.bottom > baseLivre) {
      const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: window.scrollY + r.top - window.innerHeight * 0.3, behavior: reduzido ? "auto" : "smooth" });
    }
  }, []);

  const falar = useCallback((i: number, parte = 0) => {
    const synth = window.speechSynthesis;
    const g = ++geracao.current;
    // Só cancela se houver algo falando: no Safari, cancel() seguido de speak() pode descartar a fala.
    if (synth.speaking || synth.pending) synth.cancel();
    const b = blocos.current[i];
    if (!b) { setTocando(false); document.querySelectorAll(".lendo").forEach((e) => e.classList.remove("lendo")); return; }
    idxRef.current = i;
    marcar(i);
    if (!voz.current) voz.current = escolherVoz();
    const u = new SpeechSynthesisUtterance(b.partes[parte]);
    u.lang = "pt-BR";
    if (voz.current) u.voice = voz.current;
    u.rate = velRef.current;
    u.onstart = () => { if (g === geracao.current) { comecou.current = true; setAviso(""); } };
    u.onend = () => {
      if (g !== geracao.current) return;
      if (parte + 1 < b.partes.length) falar(i, parte + 1);
      else falar(i + 1, 0);
    };
    u.onerror = (e) => {
      if (g !== geracao.current || e.error === "interrupted" || e.error === "canceled") return;
      setTocando(false);
      setAviso(e.error === "not-allowed"
        ? "O navegador bloqueou o áudio. Toque no botão de reproduzir para tentar de novo."
        : `A voz falhou (${e.error}). Toque no botão de reproduzir para tentar de novo.`);
    };
    setTocando(true);
    // speak() precisa acontecer no mesmo instante do toque: o iPhone recusa fala iniciada depois.
    synth.speak(u);
    if (synth.paused) synth.resume();
    // Se nada começar em 4 s, avisa em vez de ficar mudo sem explicação.
    if (!comecou.current) {
      setTimeout(() => {
        if (g === geracao.current && !comecou.current) {
          setAviso("Nenhum som começou. No iPhone, confira se a chave lateral não está no modo silencioso e se o volume está alto.");
        }
      }, 4000);
    }
  }, [marcar]);

  const pausar = useCallback(() => {
    geracao.current++;
    window.speechSynthesis.cancel();
    setTocando(false);
  }, []);

  const iniciar = () => { setAberto(true); falar(idxRef.current); };
  const alternar = () => (tocando ? pausar() : falar(idxRef.current));
  const irPara = (i: number) => {
    const alvo = Math.max(0, Math.min(total - 1, i));
    idxRef.current = alvo;
    if (tocando) falar(alvo); else marcar(alvo);
  };
  const proximaSecao = (dir: 1 | -1) => {
    const atual = blocos.current[idxRef.current]?.secao;
    let i = idxRef.current + dir;
    while (i > 0 && i < total && blocos.current[i].secao === atual) i += dir;
    if (dir === -1) { const s = blocos.current[Math.max(i, 0)]?.secao; while (i > 0 && blocos.current[i - 1].secao === s) i--; }
    irPara(i);
  };
  const fechar = () => {
    pausar();
    setAberto(false);
    document.querySelectorAll(".lendo").forEach((e) => e.classList.remove("lendo"));
  };
  const trocarVel = () => {
    const n = VELOCIDADES[(VELOCIDADES.indexOf(vel) + 1) % VELOCIDADES.length];
    setVel(n); velRef.current = n;
    if (tocando) falar(idxRef.current);
  };

  // Com o leitor aberto, tocar num trecho do texto começa a ler dali.
  useEffect(() => {
    if (!aberto) return;
    document.body.classList.add("modo-voz");
    const onClick = (e: MouseEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("a, button, summary, input")) return;
      const el = alvo.closest<HTMLElement>("[data-bloco]");
      if (!el) return;
      falar(Number(el.dataset.bloco));
    };
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("click", onClick); document.body.classList.remove("modo-voz"); };
  }, [aberto, falar]);

  if (!suportado) return null;

  if (!aberto) {
    return (
      <button type="button" onClick={iniciar}
        className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-[var(--tinta)] text-[var(--papel)] pl-4 pr-5 py-3 font-medium cursor-pointer active:scale-[0.97] transition-transform">
        <Icone d={FONE} size={20} />
        Ouvir o boletim
      </button>
    );
  }

  const pct = total > 1 ? (indice / (total - 1)) * 100 : 0;
  return (
    <>
      <div role="region" aria-label="Leitura em voz alta"
        className="fixed z-40 inset-x-3 bottom-[calc(4.4rem+env(safe-area-inset-bottom))] sm:bottom-5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[40rem] rounded-2xl bg-[var(--superficie)] shadow-[0_12px_40px_-8px_rgb(0_0_0/0.35)] border border-[var(--fio)] px-4 pt-3 pb-3 player-entrada">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.95rem] font-semibold truncate">{secao}</p>
            {aviso && <p role="alert" className="text-xs font-medium text-[var(--tinta)] mb-0.5">{aviso}</p>}
            <p className="text-xs text-[var(--suave)]">
              {tocando ? "Lendo" : "Pausado"} <span className="num">{indice + 1}</span> de <span className="num">{total}</span>. Toque num trecho para ler dali.
            </p>
          </div>
          <button type="button" onClick={fechar} aria-label="Fechar leitor" className="w-10 h-10 -mr-2 grid place-items-center rounded-full text-[var(--suave)] hover:bg-[var(--acento-fundo)] cursor-pointer">
            <Icone d={FECHAR} size={20} />
          </button>
        </div>

        <label className="sr-only" htmlFor="posicao-voz">Ponto da leitura</label>
        <input id="posicao-voz" type="range" min={0} max={Math.max(total - 1, 0)} value={indice}
          onChange={(e) => irPara(Number(e.target.value))}
          aria-valuetext={`${secao}, trecho ${indice + 1} de ${total}`}
          className="barra-voz mt-2 w-full" style={{ ["--pct" as string]: `${pct}%` }} />

        <div className="mt-1 flex items-center justify-between">
          <button type="button" onClick={trocarVel} aria-label={`Velocidade ${vel}x, tocar para mudar`}
            className="w-14 h-11 rounded-xl text-sm font-semibold num hover:bg-[var(--acento-fundo)] cursor-pointer">
            {String(vel).replace(".", ",")}×
          </button>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => proximaSecao(-1)} aria-label="Seção anterior" className="w-11 h-11 grid place-items-center rounded-full hover:bg-[var(--acento-fundo)] cursor-pointer">
              <Icone d={ANTERIOR} />
            </button>
            <button type="button" onClick={alternar} aria-label={tocando ? "Pausar" : "Continuar"}
              className="w-14 h-14 grid place-items-center rounded-full bg-[var(--tinta)] text-[var(--papel)] cursor-pointer active:scale-95 transition-transform">
              <Icone d={tocando ? PAUSA : PLAY} size={26} />
            </button>
            <button type="button" onClick={() => proximaSecao(1)} aria-label="Próxima seção" className="w-11 h-11 grid place-items-center rounded-full hover:bg-[var(--acento-fundo)] cursor-pointer">
              <Icone d={PROXIMO} />
            </button>
          </div>
          <div className="flex">
            <button type="button" onClick={() => irPara(indice - 1)} aria-label="Trecho anterior" className="w-10 h-11 rounded-xl text-[var(--suave)] hover:bg-[var(--acento-fundo)] cursor-pointer text-lg">‹</button>
            <button type="button" onClick={() => irPara(indice + 1)} aria-label="Próximo trecho" className="w-10 h-11 rounded-xl text-[var(--suave)] hover:bg-[var(--acento-fundo)] cursor-pointer text-lg">›</button>
          </div>
        </div>
      </div>
    </>
  );
}
