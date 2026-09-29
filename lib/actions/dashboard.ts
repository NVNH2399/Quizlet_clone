"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Skill } from "@prisma/client";

export async function getDashboardStats() {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  // Chạy song song nhiều query độc lập để giảm tổng thời gian chờ,
  // thay vì await tuần tự từng cái một
  const [totalSets, totalCards, progressBySkill, dueToday, recentAttempts] =
    await Promise.all([
      // Tổng số set user đã tạo
      prisma.set.count({ where: { userId } }),

      // Tổng số card trong tất cả set của user
      prisma.card.count({ where: { set: { userId } } }),

      // Đếm số card "đã thuộc" (repetitions >= 3, coi như thuộc lâu dài) theo từng skill
      prisma.userCardProgress.groupBy({
        by: ["skill"],
        where: { userId, repetitions: { gte: 3 } },
        _count: { id: true },
      }),

      // Tổng số card đến hạn ôn hôm nay, gộp cả 4 skill
      prisma.userCardProgress.count({
        where: { userId, nextReview: { lte: new Date() } },
      }),

      // 5 lần luyện tập gần nhất (Viết/Nói) để hiển thị hoạt động gần đây
      prisma.studyAttemptLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { card: { select: { term: true } } },
      }),
    ]);

  // Quy đổi kết quả groupBy (mảng) thành object dễ tra cứu theo skill trong UI
  const masteredBySkill: Record<Skill, number> = {
    FLASHCARD: 0,
    LISTENING: 0,
    WRITING: 0,
    SPEAKING: 0,
  };
  for (const row of progressBySkill) {
    masteredBySkill[row.skill] = row._count.id;
  }

  return {
    totalSets,
    totalCards,
    masteredBySkill,
    dueToday,
    recentAttempts,
  };
}