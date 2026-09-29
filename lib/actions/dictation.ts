"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { normalize } from "@/lib/scoring";

export async function submitDictationAttempt(
  sentenceId: string,
  correctAnswer: string,
  userAnswer: string
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const isCorrect = normalize(userAnswer) === normalize(correctAnswer);

  await prisma.dictationAttempt.create({
    data: { userId, sentenceId, userAnswer, isCorrect },
  });

  return { isCorrect, correctAnswer };
}