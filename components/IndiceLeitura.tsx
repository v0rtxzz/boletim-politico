"use client";
import { useEffect, useState } from "react";
import { EVENTO, apagarLeitura, fracao, haQuanto, lerLeitura, terminado, type Leitura } from "@/lib/leitura";
import { irParaBloco } from "./RastreioLeitura";

type Secao = { id: string; numero: string | null; nome: string; inicio: number; fim: number };

/** Índice das seções que também mostra seu progresso: lidas, onde parou e quanto falta. */
export default function IndiceLeitura({ data, secoes, total }: { data: string; secoes: Secao[]; total: number }) {
  const [l, setL] = useState<Leitura | null>(null);

  useEffect(() => {
    const atualizar = () => setL(lerLeitura(data));
    atualizar();
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener("storage", atualizar);
    return () => { window.removeEventListener(EVENTO, atualizar); window.removeEventListener("storage", atualizar); };
  }, [data]);

  const iniciado = l && l.max > 1;
  const pct = l ? Math.round(fracao(l) * 100) : 0;
  const fim = l ? terminado(l) : false;
  // Seção em que parou = última cujo início é <= bloco salvo.
  const atual = l ? [...secoes].reverse().find((s) => s.inicio <= l.bloco)?.id : undefined;

  return (
    <nav id="indice" aria-label="Seções do boletim e seu progresso" className="rounded-2xl bg-[var(--superficie)] shadow-[var(--sombra)] p-2">
      {iniciado && (
        <div className="px-3 pt-3 pb-3.5 mb-1 border-b border-[var(--fio)]">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-semibold">{fim ? "Você leu este boletim" : "Sua leitura"}</p>
            <p className="text-sm text-[var(--suave)]"><span className="num">{pct}%</span> lido, {haQuanto(l!.quando)}</p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[var(--fio)] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Quanto você já leu">
            <div className="h-full rounded-full bg-[var(--acento)]" style={{ width: `${pct}%` }} />
          </div>
          {!fim ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm min-w-0">Parou em <span className="font-medium">{l!.secao}</span></p>
              <button type="button" onClick={() => irParaBloco(l!.bloco)}
                className="shrink-0 rounded-xl bg-[var(--tinta)] text-[var(--papel)] px-4 py-2.5 text-sm font-semibold cursor-pointer active:scale-[0.97] transition-transform">
                Continuar
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => { apagarLeitura(data); window.scrollTo({ top: 0 }); }} className="mt-3 text-sm underline underline-offset-4 cursor-pointer">
              Marcar como não lido
            </button>
          )}
        </div>
      )}
      <ol>
        {secoes.map((s) => {
          const lida = !!l && l.max >= s.fim;
          const aqui = !fim && iniciado && s.id === atual;
          return (
            <li key={s.id}>
              <a href={`#${s.id}`} aria-current={aqui ? "location" : undefined}
                className={`flex items-center gap-4 rounded-xl px-3 py-3 transition-colors ${aqui ? "bg-[var(--acento-fundo)]" : "hover:bg-[var(--acento-fundo)]"}`}>
                <span className="num w-4 text-sm text-[var(--suave)]">{s.numero}</span>
                <span className={`flex-1 text-[1.02rem] ${lida && !aqui ? "text-[var(--suave)]" : ""}`}>{s.nome}</span>
                {aqui ? (
                  <span className="shrink-0 text-xs font-semibold">Você parou aqui</span>
                ) : lida ? (
                  <svg className="shrink-0 text-[var(--suave)]" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-label="Lida"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                ) : null}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
