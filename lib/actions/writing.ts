"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { checkWritingAnswer } from "@/lib/levenshtein";
import { calculateSRS } from "@/lib/srs";

export async function submitWritingAnswer(cardId: string, userInput: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Không tìm thấy thẻ");

  const { score, isCorrect } = checkWritingAnswer(userInput, card.term);

  // Ghi log lần thử này — dùng để user xem lại lịch sử, và để sau này
  // tinh chỉnh lại CORRECT_THRESHOLD nếu thấy chấm sai nhiều
  await prisma.studyAttemptLog.create({
    data: {
      userId,
      cardId,
      skill: "WRITING",
      userInput,
      isCorrect,
      score,
    },
  });

  // Quy đổi kết quả đúng/sai sang quality 0-3 để tái sử dụng luôn thuật toán SRS
  // đã viết ở bước trước — không cần viết SRS riêng cho từng skill
  const quality: 0 | 1 | 2 | 3 = isCorrect ? (score === 1 ? 3 : 2) : 0;

  const existing = await prisma.userCardProgress.findUnique({
    where: { userId_cardId_skill: { userId, cardId, skill: "WRITING" } },
  });
  const current = existing ?? { easeFactor: 2.5, interval: 1, repetitions: 0 };
  const srsResult = calculateSRS(current, quality);

  await prisma.userCardProgress.upsert({
    where: { userId_cardId_skill: { userId, cardId, skill: "WRITING" } },
    update: { ...srsResult, lastReview: new Date() },
    create: { userId, cardId, skill: "WRITING", ...srsResult, lastReview: new Date() },
  });

  return { isCorrect, score, correctAnswer: card.term };
}