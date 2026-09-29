"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export type SearchResult = {
  id: string;
  title: string;
  type: "set" | "video";
  subtitle: string;
};

// Tìm đồng thời trong Set và VideoLesson của user, giới hạn 5 kết quả mỗi loại
// để dropdown gợi ý không quá dài
export async function searchAll(query: string): Promise<SearchResult[]> {
  const { userId } = await auth();
  if (!userId || query.trim().length < 2) return [];

  const [sets, videos] = await Promise.all([
    prisma.set.findMany({
      where: {
        userId,
        title: { contains: query, mode: "insensitive" },
      },
      select: { id: true, title: true, language: true },
      take: 5,
    }),
    prisma.videoLesson.findMany({
      where: {
        userId,
        title: { contains: query, mode: "insensitive" },
      },
      select: { id: true, title: true, level: true },
      take: 5,
    }),
  ]);

  const setResults: SearchResult[] = sets.map((s) => ({
    id: s.id,
    title: s.title,
    type: "set",
    subtitle: s.language === "en" ? "Bộ từ vựng · Tiếng Anh" : "Bộ từ vựng · Tiếng Trung",
  }));

  const videoResults: SearchResult[] = videos.map((v) => ({
    id: v.id,
    title: v.title,
    type: "video",
    subtitle: `Video${v.level ? " · " + v.level : ""}`,
  }));

  return [...setResults, ...videoResults];
}