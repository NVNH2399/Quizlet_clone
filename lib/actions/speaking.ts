"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { checkWritingAnswer } from "@/lib/levenshtein"; // dùng lại y hệt logic chấm của phần Viết
import { calculateSRS } from "@/lib/srs";

export async function submitSpeakingAnswer(cardId: string, transcript: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Không tìm thấy thẻ");

  // Threshold nới lỏng hơn phần Viết (0.7 thay vì 0.85) vì STT thường
  // nhận diện sai vài ký tự do nhiễu âm thanh, không phải lỗi của user
  const normalizedScore = checkWritingAnswer(transcript, card.term);
  const isCorrect = normalizedScore.score >= 0.7;

  await prisma.studyAttemptLog.create({
    data: {
      userId,
      cardId,
      skill: "SPEAKING",
      userInput: transcript,
      isCorrect,
      score: normalizedScore.score,
    },
  });

  const quality: 0 | 1 | 2 | 3 = isCorrect ? 2 : 0;

  const existing = await prisma.userCardProgress.findUnique({
    where: { userId_cardId_skill: { userId, cardId, skill: "SPEAKING" } },
  });
  const current = existing ?? { easeFactor: 2.5, interval: 1, repetitions: 0 };
  const srsResult = calculateSRS(current, quality);

  await prisma.userCardProgress.upsert({
    where: { userId_cardId_skill: { userId, cardId, skill: "SPEAKING" } },
    update: { ...srsResult, lastReview: new Date() },
    create: { userId, cardId, skill: "SPEAKING", ...srsResult, lastReview: new Date() },
  });

  return { isCorrect, score: normalizedScore.score, transcript, correctAnswer: card.term };
}