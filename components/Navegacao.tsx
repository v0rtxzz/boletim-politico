"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeArquivo, IconeGlossario, IconeHoje, IconePartidos, IconeTema } from "./Icones";
import Notificacoes from "./Notificacoes";
import PreferenciasTexto from "./PreferenciasTexto";

const itens = [
  { href: "/", rotulo: "Hoje", Icone: IconeHoje, ativo: (p: string) => p === "/" },
  { href: "/arquivo", rotulo: "Arquivo", Icone: IconeArquivo, ativo: (p: string) => p.startsWith("/arquivo") || p.startsWith("/boletim") || p.startsWith("/retrospectiva") },
  { href: "/politica", rotulo: "Política", Icone: IconePartidos, ativo: (p: string) => ["/politica", "/partidos", "/politicos", "/stf"].some((x) => p.startsWith(x)) },
  { href: "/glossario", rotulo: "Glossário", Icone: IconeGlossario, ativo: (p: string) => p.startsWith("/glossario") },
];

function alternarTema() {
  const raiz = document.documentElement;
  const atual = raiz.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const novo = atual === "dark" ? "light" : "dark";
  raiz.dataset.theme = novo;
  try { localStorage.setItem("tema", novo); } catch {}
  document.querySelector('meta[name="theme-color"]:not([media])')?.setAttribute("content", novo === "dark" ? "#0f1114" : "#eef0ee");
}

export function Topo() {
  const p = usePathname();
  return (
    <header className="pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-[42rem] px-5 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-[1.2rem] font-semibold tracking-[-0.01em] [font-variation-settings:'opsz'_36]">
          Boletim Político
        </Link>
        <div className="flex items-center gap-1">
          <nav aria-label="Principal" className="hidden sm:flex items-center gap-1 mr-1">
            {itens.map((i) => (
              <Link key={i.href} href={i.href} aria-current={i.ativo(p) ? "page" : undefined}
                className="px-3 py-2 rounded-lg text-[0.95rem] text-[var(--suave)] hover:text-[var(--tinta)] aria-[current=page]:text-[var(--tinta)] aria-[current=page]:bg-[var(--acento-fundo)] transition-colors">
                {i.rotulo}
              </Link>
            ))}
          </nav>
          <PreferenciasTexto />
          <Notificacoes />
          <button type="button" onClick={alternarTema} aria-label="Alternar tema claro ou escuro"
            className="w-11 h-11 grid place-items-center rounded-full text-[var(--suave)] hover:text-[var(--tinta)] hover:bg-[var(--acento-fundo)] transition-colors cursor-pointer">
            <IconeTema />
          </button>
        </div>
      </div>
    </header>
  );
}

export function BarraInferior() {
  const p = usePathname();
  return (
    <nav aria-label="Principal" className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-[var(--fio)] bg-[color-mix(in_oklab,var(--papel)_88%,transparent)] backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-4">
        {itens.map(({ href, rotulo, Icone, ativo }) => {
          const on = ativo(p);
          return (
            <li key={href}>
              <Link href={href} aria-current={on ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 pt-2.5 pb-2 text-[0.72rem] font-medium transition-colors active:scale-95 ${on ? "text-[var(--tinta)]" : "text-[var(--suave)]"}`}>
                <Icone />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
