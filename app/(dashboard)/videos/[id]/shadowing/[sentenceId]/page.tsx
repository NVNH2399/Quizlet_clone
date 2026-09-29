import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ShadowingSession from "./shadowing-session";

export default async function ShadowingPage({
  params,
}: {
  params: Promise<{ id: string; sentenceId: string }>;
}) {
  const { sentenceId } = await params;

  const sentence = await prisma.videoSentence.findUnique({
    where: { id: sentenceId },
    include: { videoLesson: { select: { language: true, title: true } } },
  });

  if (!sentence) notFound();

  return <ShadowingSession sentence={sentence} />;
}