"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { calculateSRS } from "@/lib/srs";
import { Skill } from "@prisma/client";

// Gọi mỗi khi user trả lời 1 thẻ trong bất kỳ chế độ học nào
// (flashcard, listening, writing, speaking đều dùng chung hàm này,
// chỉ khác nhau ở giá trị "skill" truyền vào)
export async function submitAnswer(cardId: string, skill: Skill, quality: 0 | 1 | 2 | 3) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  // Tìm progress hiện tại, nếu chưa có (lần đầu học thẻ này) thì dùng giá trị mặc định
  const existing = await prisma.userCardProgress.findUnique({
    where: { userId_cardId_skill: { userId, cardId, skill } },
  });

  const current = existing ?? { easeFactor: 2.5, interval: 1, repetitions: 0 };
  const result = calculateSRS(current, quality);

  await prisma.userCardProgress.upsert({
    where: { userId_cardId_skill: { userId, cardId, skill } },
    update: {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReview: result.nextReview,
      lastReview: new Date(),
    },
    create: {
      userId,
      cardId,
      skill,
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReview: result.nextReview,
      lastReview: new Date(),
    },
  });

  return result;
}

// Lấy danh sách thẻ cần ôn hôm nay cho 1 set + 1 skill cụ thể
// Logic: thẻ chưa có progress (chưa học lần nào) HOẶC nextReview <= hôm nay
export async function getCardsDueForReview(setId: string, skill: Skill) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const cards = await prisma.card.findMany({
    where: {
      setId,
      OR: [
        { progress: { none: { userId, skill } } }, // chưa học bao giờ
        { progress: { some: { userId, skill, nextReview: { lte: new Date() } } } }, // đến hạn ôn
      ],
    },
    orderBy: { order: "asc" },
  });

  return cards;
}