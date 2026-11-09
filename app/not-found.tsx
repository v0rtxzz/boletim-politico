import Link from "next/link";
export default function NaoEncontrado() {
  return (
    <div className="py-20">
      <p className="font-serif text-[1.8rem] leading-tight font-medium">Não há boletim para esta data.</p>
      <p className="mt-2 text-[var(--suave)]">Confira as edições publicadas no arquivo.</p>
      <Link href="/arquivo" className="mt-6 inline-flex rounded-xl bg-[var(--tinta)] text-[var(--papel)] px-5 py-3 font-medium">Abrir arquivo</Link>
    </div>
  );
}
