import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import QuizView from "./quiz-view";

export default async function VideoQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();

  const lesson = await prisma.videoLesson.findUnique({
    where: { id },
    include: { quizQuestions: true },
  });

  if (!lesson) notFound();
  const isOwner = lesson.userId === userId;

  return <QuizView lesson={lesson} isOwner={isOwner} />;
}