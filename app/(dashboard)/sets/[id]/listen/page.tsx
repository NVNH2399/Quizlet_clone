import { getCardsDueForReview } from "@/lib/actions/study";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ListenSession from "./listen-session";

export default async function ListenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const set = await prisma.set.findUnique({ where: { id } });
  if (!set) notFound();
  const dueCards = await getCardsDueForReview(id, "LISTENING");

  if (dueCards.length === 0) {
    return <div className="p-6 text-center">🎉 Không còn thẻ nào cần ôn hôm nay!</div>;
  }

  return <ListenSession cards={dueCards} language={set.language} />;
}