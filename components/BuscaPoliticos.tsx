"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import FotoPolitico from "./FotoPolitico";
import { IconeBusca } from "./Icones";

type P = { id: string; casa: "camara" | "senado"; nome: string; partido_sigla: string | null; uf: string | null; foto_url: string | null };
const sa = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Lista pesquisável de parlamentares. Ordem alfabética, mesmo layout para todos. */
export default function BuscaPoliticos({ politicos, partidos, ocultarPartido = false, casaInicial = "" }: {
  politicos: P[]; partidos?: string[]; ocultarPartido?: boolean; casaInicial?: "" | "camara" | "senado";
}) {
  const [q, setQ] = useState("");
  const [casa, setCasa] = useState<"" | "camara" | "senado">(casaInicial);
  const [partido, setPartido] = useState("");
  const [uf, setUf] = useState("");
  const ufs = useMemo(() => [...new Set(politicos.map((p) => p.uf).filter(Boolean) as string[])].sort(), [politicos]);
  const filtrados = useMemo(() => {
    const t = sa(q.trim());
    return politicos.filter((p) =>
      (!t || sa(`${p.nome} ${p.partido_sigla ?? ""} ${p.uf ?? ""}`).includes(t)) &&
      (!casa || p.casa === casa) && (!partido || p.partido_sigla === partido) && (!uf || p.uf === uf));
  }, [politicos, q, casa, partido, uf]);
  const nDep = politicos.filter((p) => p.casa === "camara").length;
  const nSen = politicos.length - nDep;

  const chip = (ativo: boolean) => `shrink-0 rounded-full border px-3.5 py-2 text-sm transition-colors cursor-pointer ${ativo ? "border-[var(--tinta)] bg-[var(--tinta)] text-[var(--papel)]" : "border-[var(--fio)] hover:bg-[var(--acento-fundo)]"}`;
  const select = "rounded-full border border-[var(--fio)] bg-transparent px-3.5 py-2 text-sm cursor-pointer";

  return (
    <div>
      <div className="relative">
        <label htmlFor="busca-politicos" className="sr-only">Buscar político</label>
        <IconeBusca className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--suave)] pointer-events-none" />
        <input id="busca-politicos" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, partido ou estado"
          className="w-full rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] pl-12 pr-4 py-3.5 text-base outline-none placeholder:text-[var(--suave)] focus-visible:outline-2 focus-visible:outline-[var(--acento)]" />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5" role="group" aria-label="Casa legislativa">
        <button type="button" className={chip(!casa)} onClick={() => setCasa("")} aria-pressed={!casa}>Todos</button>
        {nDep > 0 && <button type="button" className={chip(casa === "camara")} onClick={() => setCasa("camara")} aria-pressed={casa === "camara"}>Deputados <span className="num opacity-70">{nDep}</span></button>}
        {nSen > 0 && <button type="button" className={chip(casa === "senado")} onClick={() => setCasa("senado")} aria-pressed={casa === "senado"}>Senadores <span className="num opacity-70">{nSen}</span></button>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {!ocultarPartido && partidos && (
          <select aria-label="Partido" value={partido} onChange={(e) => setPartido(e.target.value)} className={select}>
            <option value="">Todos os partidos</option>
            {partidos.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        <select aria-label="Estado" value={uf} onChange={(e) => setUf(e.target.value)} className={select}>
          <option value="">Todos os estados</option>
          {ufs.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <p className="mt-4 text-sm text-[var(--suave)]" aria-live="polite"><span className="num">{filtrados.length}</span> {filtrados.length === 1 ? "parlamentar" : "parlamentares"}</p>
      {filtrados.length === 0 ? (
        <p className="mt-6 text-[var(--suave)]">Ninguém encontrado com esses filtros.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-1 min-[440px]:grid-cols-2 gap-2.5">
          {filtrados.map((p) => (
            <li key={p.id}>
              <Link href={`/politicos/${p.id}`} className="flex items-center gap-3 rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] px-3 py-3 hover:bg-[var(--acento-fundo)] transition-colors">
                <FotoPolitico src={p.foto_url} nome={p.nome} tamanho={52} />
                <span className="min-w-0">
                  <span className="block font-medium leading-snug truncate">{p.nome}</span>
                  <span className="block text-sm text-[var(--suave)]">
                    {p.casa === "camara" ? "Deputado(a)" : "Senador(a)"}
                    {!ocultarPartido && p.partido_sigla ? `, ${p.partido_sigla}` : ""}{p.uf ? `-${p.uf}` : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
