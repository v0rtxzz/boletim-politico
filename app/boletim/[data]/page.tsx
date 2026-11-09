import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BoletimView from "@/components/BoletimView";
import { formatarData, getBoletimPorData } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ data: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return {};
  return { title: formatarData(data, false) };
}

export default async function BoletimDoDia({ params }: Props) {
  const { data } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) notFound();
  const boletim = await getBoletimPorData(data);
  if (!boletim) notFound();
  return <BoletimView boletim={boletim} />;
}
