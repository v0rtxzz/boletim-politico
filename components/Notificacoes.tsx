"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Estado = "carregando" | "sem-suporte" | "instalar" | "bloqueado" | "desligado" | "ligado";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function chaveBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const bin = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function ehIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function instalado() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

const Sino = ({ ativo }: { ativo: boolean }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill={ativo ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9.5a6 6 0 1 1 12 0c0 3.6 1.2 5.6 2 6.5H4c.8-.9 2-2.9 2-6.5z" />
    <path d="M10 19.5a2 2 0 0 0 4 0" fill="none" />
  </svg>
);

export default function Notificacoes() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState("");
  const painel = useRef<HTMLDivElement>(null);

  const verificar = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setEstado(ehIOS() && !instalado() ? "instalar" : "sem-suporte");
      return;
    }
    if (Notification.permission === "denied") { setEstado("bloqueado"); return; }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setEstado(sub && Notification.permission === "granted" ? "ligado" : "desligado");
    } catch { setEstado("desligado"); }
  };

  useEffect(() => { verificar(); }, []);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!painel.current?.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);

  const ativar = async () => {
    setOcupado(true); setMsg("");
    try {
      // O pedido de permissão precisa sair direto do toque (exigência do iPhone).
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") { setEstado(permissao === "denied" ? "bloqueado" : "desligado"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveBytes(VAPID) }));
      const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const { error } = await supabase.rpc("registrar_push", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
      if (error) throw new Error(error.message);
      setEstado("ligado");
      const r = await fetch("/api/push/teste", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(j) });
      setMsg(r.ok ? "Pronto. Enviamos um aviso de teste agora." : "Ativado, mas o aviso de teste falhou. O aviso diário pode funcionar mesmo assim.");
    } catch (e) {
      console.error(e);
      setMsg("Não consegui ativar. Tente de novo em instantes.");
      verificar();
    } finally { setOcupado(false); }
  };

  const desativar = async () => {
    setOcupado(true); setMsg("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.rpc("remover_push", { p_endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setEstado("desligado");
      setMsg("Avisos desligados neste aparelho.");
    } finally { setOcupado(false); }
  };

  if (estado === "carregando" || estado === "sem-suporte") return null;

  return (
    <div className="relative" ref={painel}>
      <button type="button" onClick={() => setAberto((a) => !a)} aria-expanded={aberto} aria-haspopup="dialog"
        aria-label={estado === "ligado" ? "Avisos ativados" : "Ativar avisos do boletim"}
        className="relative w-11 h-11 grid place-items-center rounded-full text-[var(--suave)] hover:text-[var(--tinta)] hover:bg-[var(--acento-fundo)] transition-colors cursor-pointer">
        <Sino ativo={estado === "ligado"} />
        {estado === "desligado" && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--tinta)]" aria-hidden />}
      </button>

      {aberto && (
        <div role="dialog" aria-label="Avisos do boletim"
          className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl bg-[var(--superficie)] border border-[var(--fio)] shadow-[0_12px_40px_-8px_rgb(0_0_0/0.35)] p-4 player-entrada">
          {estado === "instalar" && (
            <>
              <p className="font-semibold">Instale o app para receber avisos</p>
              <p className="mt-1.5 text-sm text-[var(--suave)] leading-relaxed">
                No iPhone, os avisos só funcionam no app da Tela de Início. Toque em <strong className="text-[var(--tinta)]">Compartilhar</strong>, depois em <strong className="text-[var(--tinta)]">Adicionar à Tela de Início</strong>, abra o app por lá e toque neste sino de novo.
              </p>
            </>
          )}
          {estado === "bloqueado" && (
            <>
              <p className="font-semibold">Avisos bloqueados</p>
              <p className="mt-1.5 text-sm text-[var(--suave)] leading-relaxed">
                A permissão foi negada antes. No iPhone, libere em <strong className="text-[var(--tinta)]">Ajustes → Notificações → Boletim</strong>. No computador, libere nas permissões do site, no navegador. Depois volte aqui.
              </p>
            </>
          )}
          {estado === "desligado" && (
            <>
              <p className="font-semibold">Aviso quando o boletim sair</p>
              <p className="mt-1.5 text-sm text-[var(--suave)] leading-relaxed">Uma notificação por dia, por volta das 06:00, com a manchete e o link da edição.</p>
              <button type="button" onClick={ativar} disabled={ocupado}
                className="mt-3 w-full rounded-xl bg-[var(--tinta)] text-[var(--papel)] py-3 font-medium cursor-pointer disabled:opacity-60">
                {ocupado ? "Ativando…" : "Ativar notificações"}
              </button>
            </>
          )}
          {estado === "ligado" && (
            <>
              <p className="font-semibold">Avisos ativados</p>
              <p className="mt-1.5 text-sm text-[var(--suave)] leading-relaxed">Você recebe uma notificação assim que cada boletim é publicado.</p>
              <button type="button" onClick={desativar} disabled={ocupado}
                className="mt-3 w-full rounded-xl border border-[var(--fio)] py-3 font-medium cursor-pointer hover:bg-[var(--acento-fundo)] disabled:opacity-60">
                {ocupado ? "Desligando…" : "Desligar avisos"}
              </button>
            </>
          )}
          {msg && <p role="status" className="mt-3 text-sm">{msg}</p>}
        </div>
      )}
    </div>
  );
}
