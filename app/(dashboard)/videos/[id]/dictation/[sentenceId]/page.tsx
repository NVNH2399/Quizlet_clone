import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import DictationSession from "./dictation-session";

export default async function DictationPage({
  params,
}: {
  params: Promise<{ id: string; sentenceId: string }>;
}) {
  const { sentenceId } = await params;

  const sentence = await prisma.videoSentence.findUnique({
    where: { id: sentenceId },
    include: { videoLesson: { select: { language: true } } },
  });

  if (!sentence) notFound();

  return <DictationSession sentence={sentence} />;
}