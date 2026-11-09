import Link from "next/link";
import BoletimView from "@/components/BoletimView";
import { getUltimoBoletim } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const boletim = await getUltimoBoletim();
  if (!boletim) {
    return (
      <div className="py-20">
        <p className="font-serif text-[1.8rem] leading-tight font-medium">O primeiro boletim está a caminho.</p>
        <p className="mt-3 text-[var(--suave)] max-w-[32ch]">Ele é publicado todo dia às 06:00. Enquanto isso, você pode consultar o glossário.</p>
        <Link href="/glossario" className="mt-6 inline-flex rounded-xl bg-[var(--tinta)] text-[var(--papel)] px-5 py-3 font-medium">Abrir glossário</Link>
      </div>
    );
  }
  return <BoletimView boletim={boletim} atual />;
}
