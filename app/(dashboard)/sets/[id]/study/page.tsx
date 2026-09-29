import { getCardsDueForReview } from "@/lib/actions/study";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import StudySession from "./study-session";

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const set = await prisma.set.findUnique({ where: { id } });
  if (!set) notFound();
  const dueCards = await getCardsDueForReview(id, "FLASHCARD");

  if (dueCards.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg">🎉 Không còn thẻ nào cần ôn hôm nay!</p>
      </div>
    );
  }

  return <StudySession setId={set.id} cards={dueCards} skill="FLASHCARD" />;
}