import type { Metadata } from "next";
import Link from "next/link";
import { formatarData, listarGlossario } from "@/lib/supabase";

export const metadata: Metadata = { title: "Glossário" };
export const dynamic = "force-dynamic";

function inicial(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0).toUpperCase();
}

export default async function Glossario() {
  const termos = await listarGlossario();
  termos.sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR", { sensitivity: "base" }));
  const letras = [...new Set(termos.map((t) => inicial(t.termo)))];

  return (
    <div className="pt-6">
      <h1 className="font-serif text-[1.65rem] font-semibold">Glossário</h1>
      <p className="mt-2 text-[var(--suave)]">
        Termos políticos, jurídicos e econômicos que apareceram nos boletins, explicados de forma didática.
      </p>

      {termos.length === 0 ? (
        <p className="mt-10 text-center text-[var(--suave)]">O glossário será preenchido a partir dos boletins.</p>
      ) : (
        <>
          <nav aria-label="Índice alfabético" className="mt-5 flex flex-wrap gap-1.5">
            {letras.map((l) => (
              <a key={l} href={`#letra-${l}`} className="w-8 h-8 grid place-items-center rounded-md border border-[var(--linha)] text-sm hover:border-[var(--suave)]">
                {l}
              </a>
            ))}
          </nav>
          {letras.map((l) => (
            <section key={l} id={`letra-${l}`} className="mt-8 scroll-mt-16">
              <h2 className="text-xs font-semibold tracking-[0.14em] uppercase text-[var(--suave)]">{l}</h2>
              <dl className="mt-2 divide-y divide-[var(--linha)] border-y border-[var(--linha)]">
                {termos.filter((t) => inicial(t.termo) === l).map((t) => (
                  <div key={t.id} className="py-4">
                    <dt className="font-serif text-[1.15rem] font-semibold">{t.termo}</dt>
                    <dd className="mt-1 font-serif text-[1.05rem] leading-relaxed">{t.definicao}</dd>
                    {t.exemplo && (
                      <dd className="mt-2 text-sm leading-relaxed text-[var(--suave)] border-l-2 border-[var(--linha)] pl-3">
                        <span className="font-medium">Exemplo:</span> {t.exemplo}
                      </dd>
                    )}
                    {t.boletins?.data && (
                      <dd className="mt-2 text-xs text-[var(--suave)]">
                        Apareceu em{" "}
                        <Link href={`/boletim/${t.boletins.data}`} className="underline underline-offset-4">
                          {formatarData(t.boletins.data, false)}
                        </Link>
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
