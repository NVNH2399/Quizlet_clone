"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// Tính streak: số ngày liên tiếp có hoạt động học (Shadowing hoặc Dictation),
// tính lùi từ hôm nay hoặc hôm qua (cho phép chưa học hôm nay mà vẫn giữ streak tới hết ngày)
function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Quy về chuỗi "YYYY-MM-DD" duy nhất, sắp giảm dần để duyệt từ gần nhất
  const uniqueDays = Array.from(
    new Set(dates.map((d) => d.toISOString().slice(0, 10)))
  ).sort((a, b) => (a < b ? 1 : -1));

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Nếu ngày gần nhất không phải hôm nay/hôm qua, streak coi như đã đứt
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const current = new Date(uniqueDays[i]);
    const next = new Date(uniqueDays[i + 1]);
    const diffDays = Math.round((current.getTime() - next.getTime()) / 86400000);

    if (diffDays === 1) {
      streak++;
    } else {
      break; // đứt quãng, dừng đếm
    }
  }

  return streak;
}

export async function getVideoProgressStats() {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const [
    totalLessons,
    shadowingSentenceIds,
    shadowingAgg,
    dictationAttempts,
    vocabularySaved,
    shadowingDates,
    dictationDates,
  ] = await Promise.all([
    prisma.videoLesson.count({ where: { userId } }),

    // Số câu duy nhất đã từng luyện Shadowing ít nhất 1 lần
    prisma.shadowingAttempt.findMany({
      where: { userId },
      select: { sentenceId: true },
      distinct: ["sentenceId"],
    }),

    prisma.shadowingAttempt.aggregate({
      where: { userId },
      _count: { id: true },
      _avg: { accuracyScore: true },
    }),

    prisma.dictationAttempt.findMany({
      where: { userId },
      select: { isCorrect: true },
    }),

    // Đi qua Card → Set → userId vì VideoVocabulary không lưu userId trực tiếp
    // (từ vựng được gắn vào Card thuộc Set của user, không cần cột userId riêng)
    prisma.videoVocabulary.count({
      where: { card: { set: { userId } } },
    }),

    prisma.shadowingAttempt.findMany({ where: { userId }, select: { createdAt: true } }),
    prisma.dictationAttempt.findMany({ where: { userId }, select: { createdAt: true } }),
  ]);

  // Video "đã hoàn thành" = tất cả câu trong video đó đều đã luyện Shadowing ít nhất 1 lần
  const lessons = await prisma.videoLesson.findMany({
    where: { userId },
    select: { id: true, sentences: { select: { id: true } } },
  });
  const practicedSentenceIdSet = new Set(shadowingSentenceIds.map((s) => s.sentenceId));
  const lessonsCompleted = lessons.filter((l) =>
    l.sentences.length > 0 && l.sentences.every((s) => practicedSentenceIdSet.has(s.id))
  ).length;

  const dictationTotal = dictationAttempts.length;
  const dictationCorrect = dictationAttempts.filter((a) => a.isCorrect).length;

  const allActivityDates = [
    ...shadowingDates.map((d) => d.createdAt),
    ...dictationDates.map((d) => d.createdAt),
  ];
  const streak = calculateStreak(allActivityDates);

  return {
    totalLessons,
    lessonsCompleted,
    sentencesPracticed: shadowingSentenceIds.length,
    shadowingCount: shadowingAgg._count.id,
    avgShadowingAccuracy: shadowingAgg._avg.accuracyScore ?? 0,
    dictationTotal,
    dictationAccuracy: dictationTotal > 0 ? dictationCorrect / dictationTotal : 0,
    vocabularySaved,
    streak,
  };
}