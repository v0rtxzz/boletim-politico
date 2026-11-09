import { TIPOS, type TipoNoticia } from "@/lib/partidos";

/** Tipo da notícia, codificado por forma (não só por cor), igual aos selos dos Bastidores. */
const FORMA: Record<TipoNoticia, string> = {
  fato_confirmado: "selo-confirmado",
  declaracao: "selo-declaracao",
  investigacao: "selo-apuracao",
  analise: "selo-analise",
};

export default function SeloTipo({ tipo }: { tipo: TipoNoticia }) {
  return <span className={`selo ${FORMA[tipo]}`}>{TIPOS[tipo]}</span>;
}
