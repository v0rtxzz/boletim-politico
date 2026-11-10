"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Leitor em voz alta do boletim.
 * - Modo "neural": toca o áudio gerado com voz neural (continua com a tela bloqueada,
 *   aparece na tela de bloqueio). O destaque segue o tempo de cada trecho.
 * - Modo "aparelho": voz do próprio celular (Web Speech API), usada quando o áudio
 *   neural não está disponível.
 * Em ambos: pausar, velocidade, pular seção/trecho, barra de posição e tocar num trecho para ler dali.
 */

type T = { texto: string; secao: string };
type Manifesto = { url: string; offsets: number[]; duracao: number };
type Status = "verificando" | "pronto" | "gerar" | "indisponivel";
type Modo = "neural" | "aparelho";

const VELOCIDADES = [1, 1.25, 1.5, 0.85];

/** WAV silencioso minúsculo: tocado no toque para "destravar" o áudio no iPhone. */
function silencio(): string {
  const n = 2400, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 24000, true); v.setUint32(28, 48000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, "data"); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}

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

function escolherVoz(): SpeechSynthesisVoice | null {
  const vozes = window.speechSynthesis.getVoices();
  const pt = vozes.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("pt-br"));
  const pref = ["luciana (aprimorada)", "luciana (premium)", "luciana", "francisca", "thalita", "google português do brasil", "felipe"];
  for (const p of pref) {
    const v = pt.find((x) => x.name.toLowerCase().includes(p));
    if (v) return v;
  }
  return pt[0] ?? null;
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

/**
 * iPhone: a voz do aparelho é tratada como som "de ambiente" e fica muda com a chave lateral no silencioso.
 * Pedimos ao sistema a categoria "reprodução" (Audio Session API) e mantemos um áudio silencioso tocando,
 * o que faz o iOS liberar o som. Precisa acontecer dentro do toque.
 */
let manterVivo: HTMLAudioElement | null = null;
function destravarAudioIOS(silencioUrl: string) {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {}
  try {
    if (!manterVivo) { manterVivo = new Audio(silencioUrl); manterVivo.loop = true; manterVivo.volume = 0.01; }
    manterVivo.play().catch(() => {});
  } catch {}
}
function soltarAudioIOS() { try { manterVivo?.pause(); } catch {} }
const ehIOS = () => typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
const instalado = () => typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function LeitorVoz({ data, trechos }: { data: string; trechos: T[] }) {
  const total = trechos.length;
  const [status, setStatus] = useState<Status>("verificando");
  const [manifesto, setManifesto] = useState<Manifesto | null>(null);
  const [modo, setModo] = useState<Modo>("neural");
  const [gerando, setGerando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [tocando, setTocando] = useState(false);
  const [indice, setIndice] = useState(0);
  const [vel, setVel] = useState(1);
  const [aviso, setAviso] = useState("");
  const [tempo, setTempo] = useState(0);
  const [semSom, setSemSom] = useState(false);
  const [retomar, setRetomar] = useState<number | null>(null); // trecho onde a escuta parou

  const audio = useRef<HTMLAudioElement | null>(null);
  const idxRef = useRef(0);
  const velRef = useRef(1);
  const modoRef = useRef<Modo>("neural");
  const geracao = useRef(0);
  const voz = useRef<SpeechSynthesisVoice | null>(null);
  const comecou = useRef(false);
  const silencioUrl = useRef("");

  useEffect(() => { modoRef.current = modo; }, [modo]);

  // Retoma a escuta de onde parou (guardado no aparelho por 7 dias).
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(`ouvir:${data}`) ?? "null") as { idx: number; quando: number } | null;
      if (v && v.idx > 1 && v.idx < total - 1 && Date.now() - v.quando < 7 * 864e5) {
        idxRef.current = v.idx; setIndice(v.idx); setRetomar(v.idx);
      }
    } catch {}
  }, [data, total]);

  // Descobre se já há áudio neural pronto para este boletim.
  useEffect(() => {
    let vivo = true;
    fetch(`/api/audio/${data}`).then((r) => r.json()).then((j) => {
      if (!vivo) return;
      if (j.status === "pronto") { setManifesto(j); setStatus("pronto"); }
      else setStatus(j.status === "gerar" ? "gerar" : "indisponivel");
    }).catch(() => vivo && setStatus("indisponivel"));
    const a = new Audio();
    a.preload = "none";
    audio.current = a;
    silencioUrl.current = silencio();
    let carregar: (() => void) | null = null;
    if ("speechSynthesis" in window) {
      carregar = () => { voz.current = escolherVoz(); };
      carregar();
      window.speechSynthesis.addEventListener?.("voiceschanged", carregar);
    }
    return () => {
      vivo = false;
      a.pause(); a.removeAttribute("src");
      geracao.current++;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        if (carregar) window.speechSynthesis.removeEventListener?.("voiceschanged", carregar);
      }
      document.querySelectorAll(".lendo").forEach((e) => e.classList.remove("lendo"));
    };
  }, [data]);

  const marcar = useCallback((i: number, rolar = true) => {
    if (i === idxRef.current && document.querySelector(".lendo")) return;
    document.querySelectorAll(".lendo").forEach((e) => e.classList.remove("lendo"));
    idxRef.current = i;
    setIndice(i);
    try { localStorage.setItem(`ouvir:${data}`, JSON.stringify({ idx: i, quando: Date.now() })); } catch {}
    const el = document.querySelector<HTMLElement>(`[data-bloco="${i}"]`);
    if (!el) return;
    el.classList.add("lendo");
    if (!rolar) return;
    const r = el.getBoundingClientRect();
    if (r.top < 110 || r.bottom > window.innerHeight - 220) {
      const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: window.scrollY + r.top - window.innerHeight * 0.3, behavior: reduzido ? "auto" : "smooth" });
    }
  }, [data]);

  // ---------- Modo neural (arquivo de áudio) ----------
  useEffect(() => {
    const a = audio.current;
    if (!a || !manifesto) return;
    const { offsets } = manifesto;
    const onTime = () => {
      if (!a.src || a.src.startsWith("blob:")) return;
      setTempo(a.currentTime);
      const t = a.currentTime + 0.08;
      let lo = 0, hi = offsets.length - 1;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (offsets[m] <= t) lo = m; else hi = m - 1; }
      marcar(lo);
    };
    const onPlay = () => { if (!a.src.startsWith("blob:")) setTocando(true); };
    const onPause = () => setTocando(false);
    const onEnded = () => {
      if (a.src.startsWith("blob:")) return;
      setTocando(false);
      document.querySelectorAll(".lendo").forEach((e) => e.classList.remove("lendo"));
      try { localStorage.removeItem(`ouvir:${data}`); } catch {}
      idxRef.current = 0;
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime); a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause); a.removeEventListener("ended", onEnded);
    };
  }, [manifesto, marcar, data]);

  const tocarNeural = useCallback((m: Manifesto, i?: number) => {
    const a = audio.current!;
    if (a.src !== m.url) { a.src = m.url; a.preload = "auto"; }
    a.playbackRate = velRef.current;
    if (i !== undefined) {
      const ir = () => { a.currentTime = m.offsets[i] ?? 0; };
      if (a.readyState >= 1) ir(); else a.addEventListener("loadedmetadata", ir, { once: true });
      marcar(i);
    }
    a.play().catch((e) => setAviso(`Não consegui tocar o áudio (${e?.name ?? "erro"}). Toque em reproduzir de novo.`));
    if ("mediaSession" in navigator) {
      const [y, mo, d] = data.split("-");
      navigator.mediaSession.metadata = new MediaMetadata({ title: `Boletim de ${d}/${mo}/${y}`, artist: "Boletim Político Diário", artwork: [{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }] });
    }
  }, [data, marcar]);

  // ---------- Modo aparelho (Web Speech) ----------
  const falar = useCallback((i: number, parte = 0) => {
    const synth = window.speechSynthesis;
    const g = ++geracao.current;
    if (synth.speaking || synth.pending) synth.cancel();
    const t = trechos[i];
    if (!t) {
      setTocando(false);
      document.querySelectorAll(".lendo").forEach((e) => e.classList.remove("lendo"));
      try { localStorage.removeItem(`ouvir:${data}`); } catch {}
      idxRef.current = 0;
      return;
    }
    marcar(i);
    const partes = fatiar(t.texto);
    if (!voz.current) voz.current = escolherVoz();
    const u = new SpeechSynthesisUtterance(partes[parte]);
    u.lang = "pt-BR";
    if (voz.current) u.voice = voz.current;
    u.rate = velRef.current;
    u.onstart = () => { if (g === geracao.current) { comecou.current = true; setAviso(""); } };
    u.onend = () => { if (g === geracao.current) { if (parte + 1 < partes.length) falar(i, parte + 1); else falar(i + 1, 0); } };
    u.onerror = (e) => {
      if (g !== geracao.current || e.error === "interrupted" || e.error === "canceled") return;
      setTocando(false);
      setAviso(`A voz falhou (${e.error}). Toque em reproduzir para tentar de novo.`);
    };
    setTocando(true);
    if (!comecou.current && parte === 0) {
      // Aquecimento exigido por algumas versões do iOS: uma fala vazia libera as seguintes.
      try { const aquece = new SpeechSynthesisUtterance(" "); aquece.volume = 0; synth.speak(aquece); } catch {}
    }
    synth.speak(u);
    if (synth.paused) synth.resume();
    if (!comecou.current) setTimeout(() => {
      if (g === geracao.current && !comecou.current) {
        setAviso(ehIOS() && instalado()
          ? "O iPhone não liberou a voz do aparelho no app instalado. Toque em \"Abrir no Safari\" abaixo, ou ative a voz natural."
          : "Nenhum som começou. Confira o volume e se a chave lateral do iPhone não está no silencioso.");
        setSemSom(true);
      }
    }, 4000);
  }, [trechos, marcar, data]);

  const pararAparelho = () => { geracao.current++; if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };

  // ---------- Ações ----------
  const usarAparelho = (i = idxRef.current) => {
    destravarAudioIOS(silencioUrl.current);
    audio.current?.pause();
    setModo("aparelho"); modoRef.current = "aparelho";
    setGerando(false);
    if ("speechSynthesis" in window) falar(i);
    else setAviso("Este navegador não tem leitura em voz alta.");
  };

  const iniciar = async (doInicio = false) => {
    if (doInicio) idxRef.current = 0;
    setRetomar(null);
    setAberto(true);
    setAviso("");
    if (status === "pronto" && manifesto) { setModo("neural"); tocarNeural(manifesto, idxRef.current); return; }
    if (status !== "gerar") { usarAparelho(); return; }
    // Destrava o áudio dentro do toque; o arquivo chega depois.
    const a = audio.current!;
    a.src = silencioUrl.current;
    a.play().catch(() => {});
    setModo("neural"); modoRef.current = "neural";
    setGerando(true);
    try {
      const r = await fetch(`/api/audio/${data}`, { method: "POST" });
      const j = await r.json();
      if (j.status !== "pronto") throw new Error(j.erro ?? j.status);
      setManifesto(j); setStatus("pronto"); setGerando(false);
      if (modoRef.current === "neural") tocarNeural(j, idxRef.current);
    } catch (e) {
      console.error(e);
      setStatus("indisponivel");
      if (modoRef.current === "neural") {
        setAviso("Não consegui preparar a voz natural agora. Usando a voz do aparelho.");
        usarAparelho();
      } else setGerando(false);
    }
  };

  const pausar = () => { if (modo === "neural") audio.current?.pause(); else { pararAparelho(); setTocando(false); soltarAudioIOS(); } };
  const continuar = () => {
    if (modo === "aparelho") destravarAudioIOS(silencioUrl.current);
    if (modo === "neural" && manifesto) tocarNeural(manifesto);
    else if (modo === "aparelho") falar(idxRef.current);
  };
  const alternar = () => (tocando ? pausar() : continuar());

  const irPara = useCallback((i: number) => {
    const alvo = Math.max(0, Math.min(total - 1, i));
    if (modo === "neural" && manifesto) {
      audio.current!.currentTime = manifesto.offsets[alvo] ?? 0;
      marcar(alvo);
    } else if (modo === "aparelho" && tocando) falar(alvo);
    else marcar(alvo);
  }, [modo, manifesto, tocando, total, marcar, falar]);

  const pularSecao = useCallback((dir: 1 | -1) => {
    const atual = trechos[idxRef.current]?.secao;
    let i = idxRef.current + dir;
    while (i > 0 && i < total && trechos[i].secao === atual) i += dir;
    if (dir === -1) { const s = trechos[Math.max(i, 0)]?.secao; while (i > 0 && trechos[i - 1].secao === s) i--; }
    irPara(i);
  }, [trechos, total, irPara]);

  const fechar = () => {
    soltarAudioIOS();
    audio.current?.pause();
    pararAparelho();
    setTocando(false);
    setAberto(false);
    document.querySelectorAll(".lendo").forEach((e) => e.classList.remove("lendo"));
  };
  const trocarVel = () => {
    const n = VELOCIDADES[(VELOCIDADES.indexOf(vel) + 1) % VELOCIDADES.length];
    setVel(n); velRef.current = n;
    if (modo === "neural" && audio.current) audio.current.playbackRate = n;
    else if (tocando) falar(idxRef.current);
  };

  // Controles na tela de bloqueio / fones.
  useEffect(() => {
    if (!("mediaSession" in navigator) || modo !== "neural") return;
    const ms = navigator.mediaSession;
    const acoes: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => { audio.current?.play(); }],
      ["pause", () => audio.current?.pause()],
      ["previoustrack", () => pularSecao(-1)],
      ["nexttrack", () => pularSecao(1)],
      ["seekbackward", () => { if (audio.current) audio.current.currentTime -= 15; }],
      ["seekforward", () => { if (audio.current) audio.current.currentTime += 15; }],
    ];
    for (const [a, h] of acoes) { try { ms.setActionHandler(a, h); } catch {} }
    return () => { for (const [a] of acoes) { try { ms.setActionHandler(a, null); } catch {} } };
  }, [modo, pularSecao]);

  // Com o leitor aberto, tocar num trecho do texto começa a ler dali.
  useEffect(() => {
    if (!aberto) return;
    document.body.classList.add("modo-voz");
    const onClick = (e: MouseEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("a, button, summary, input, [role=region]")) return;
      const el = alvo.closest<HTMLElement>("[data-bloco]");
      if (!el) return;
      const i = Number(el.dataset.bloco);
      if (modo === "neural" && manifesto) tocarNeural(manifesto, i);
      else if (modo === "aparelho") falar(i);
    };
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("click", onClick); document.body.classList.remove("modo-voz"); };
  }, [aberto, modo, manifesto, falar, tocarNeural]);

  if (!aberto) {
    const secaoRetomar = retomar !== null ? trechos[retomar]?.secao : null;
    return (
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <button type="button" onClick={() => iniciar()}
          className="inline-flex items-center gap-2.5 rounded-full bg-[var(--tinta)] text-[var(--papel)] pl-4 pr-5 py-3 font-medium cursor-pointer active:scale-[0.97] transition-transform">
          <Icone d={FONE} size={20} />
          {secaoRetomar ? "Continuar ouvindo" : "Ouvir o boletim"}
        </button>
        {secaoRetomar ? (
          <span className="text-sm text-[var(--suave)]">
            Parou em {secaoRetomar}.{" "}
            <button type="button" onClick={() => iniciar(true)} className="underline underline-offset-4 text-[var(--tinta)] cursor-pointer">Ouvir do início</button>
          </span>
        ) : status === "pronto" && manifesto ? (
          <span className="text-sm text-[var(--suave)]">Voz natural, <span className="num">{fmt(manifesto.duracao)}</span></span>
        ) : null}
      </div>
    );
  }

  const secao = trechos[indice]?.secao ?? "";
  const pct = total > 1 ? (indice / (total - 1)) * 100 : 0;
  const estado = gerando ? "Preparando a voz natural. Na 1ª vez de cada boletim leva até 1 minuto." : tocando ? "Lendo" : "Pausado";

  return (
    <div role="region" aria-label="Leitura em voz alta"
      className="fixed z-40 inset-x-3 bottom-[calc(4.4rem+env(safe-area-inset-bottom))] sm:bottom-5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[40rem] rounded-2xl bg-[var(--superficie)] shadow-[0_12px_40px_-8px_rgb(0_0_0/0.35)] border border-[var(--fio)] px-4 pt-3 pb-3 player-entrada">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {aviso && <p role="alert" className="text-xs font-medium mb-0.5">{aviso}</p>}
          {semSom && ehIOS() && instalado() && (
            <a href={typeof window !== "undefined" ? window.location.href : "/"} target="_blank" rel="noopener"
              className="mb-1 inline-flex rounded-lg bg-[var(--tinta)] text-[var(--papel)] px-3 py-1.5 text-xs font-semibold">Abrir no Safari</a>
          )}
          <p className="text-[0.95rem] font-semibold truncate">{secao}</p>
          <p className="text-xs text-[var(--suave)]">
            {estado}
            {!gerando && (
              <>
                {" "}<span className="num">{indice + 1}</span> de <span className="num">{total}</span>
                {modo === "neural" && manifesto && <>, <span className="num">{fmt(tempo)}</span> de <span className="num">{fmt(manifesto.duracao)}</span></>}
                {modo === "aparelho" && <>, voz do aparelho</>}
              </>
            )}
          </p>
          {gerando && (
            <button type="button" onClick={() => usarAparelho()} className="mt-1 text-xs underline underline-offset-4 cursor-pointer">
              Ouvir agora com a voz do aparelho
            </button>
          )}
        </div>
        <button type="button" onClick={fechar} aria-label="Fechar leitor" className="w-10 h-10 -mr-2 grid place-items-center rounded-full text-[var(--suave)] hover:bg-[var(--acento-fundo)] cursor-pointer">
          <Icone d={FECHAR} size={20} />
        </button>
      </div>

      <label className="sr-only" htmlFor="posicao-voz">Ponto da leitura</label>
      <input id="posicao-voz" type="range" min={0} max={Math.max(total - 1, 0)} value={indice} disabled={gerando}
        onChange={(e) => irPara(Number(e.target.value))}
        aria-valuetext={`${secao}, trecho ${indice + 1} de ${total}`}
        className="barra-voz mt-2 w-full disabled:opacity-40" style={{ ["--pct" as string]: `${pct}%` }} />

      <div className="mt-1 flex items-center justify-between">
        <button type="button" onClick={trocarVel} aria-label={`Velocidade ${vel}x, tocar para mudar`}
          className="w-14 h-11 rounded-xl text-sm font-semibold num hover:bg-[var(--acento-fundo)] cursor-pointer">
          {String(vel).replace(".", ",")}×
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => pularSecao(-1)} aria-label="Seção anterior" className="w-11 h-11 grid place-items-center rounded-full hover:bg-[var(--acento-fundo)] cursor-pointer">
            <Icone d={ANTERIOR} />
          </button>
          <button type="button" onClick={alternar} disabled={gerando} aria-label={tocando ? "Pausar" : "Continuar"}
            className="w-14 h-14 grid place-items-center rounded-full bg-[var(--tinta)] text-[var(--papel)] cursor-pointer active:scale-95 transition-transform disabled:opacity-50">
            {gerando
              ? <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin motion-reduce:animate-none" aria-hidden />
              : <Icone d={tocando ? PAUSA : PLAY} size={26} />}
          </button>
          <button type="button" onClick={() => pularSecao(1)} aria-label="Próxima seção" className="w-11 h-11 grid place-items-center rounded-full hover:bg-[var(--acento-fundo)] cursor-pointer">
            <Icone d={PROXIMO} />
          </button>
        </div>
        <div className="flex">
          <button type="button" onClick={() => irPara(indice - 1)} aria-label="Trecho anterior" className="w-10 h-11 rounded-xl text-[var(--suave)] hover:bg-[var(--acento-fundo)] cursor-pointer text-lg">‹</button>
          <button type="button" onClick={() => irPara(indice + 1)} aria-label="Próximo trecho" className="w-10 h-11 rounded-xl text-[var(--suave)] hover:bg-[var(--acento-fundo)] cursor-pointer text-lg">›</button>
        </div>
      </div>
    </div>
  );
}
