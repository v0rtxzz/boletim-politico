import Link from "next/link";
export default function NaoEncontrado() {
  return (
    <div className="py-16 text-center">
      <p className="font-serif text-xl">Boletim não encontrado.</p>
      <Link href="/arquivo" className="mt-3 inline-block text-sm text-[var(--suave)] underline underline-offset-4">Ver arquivo</Link>
    </div>
  );
}
