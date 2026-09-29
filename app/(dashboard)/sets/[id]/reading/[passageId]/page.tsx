import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ReadingQuiz from "./reading-quiz";

export default async function ReadingPage({
  params,
}: {
  params: Promise<{ id: string; passageId: string }>;
}) {
  const { passageId } = await params;
  const passage = await prisma.readingPassage.findUnique({
    where: { id: passageId },
    include: { questions: true },
  });

  if (!passage) notFound();

  return <ReadingQuiz passage={passage} />;
}