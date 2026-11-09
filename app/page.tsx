import BoletimView from "@/components/BoletimView";
import { getUltimoBoletim } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const boletim = await getUltimoBoletim();
  if (!boletim) {
    return (
      <div className="py-16 text-center text-[var(--suave)]">
        <p className="font-serif text-xl text-[var(--texto)]">Nenhum boletim publicado ainda.</p>
        <p className="mt-2 text-sm">O primeiro boletim aparecerá aqui após a próxima execução diária.</p>
      </div>
    );
  }
  return <BoletimView boletim={boletim} atual />;
}
