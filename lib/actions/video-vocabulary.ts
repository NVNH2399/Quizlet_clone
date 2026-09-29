"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Lấy danh sách Set của user, lọc đúng ngôn ngữ video đang học,
// để dropdown chọn nơi lưu chỉ hiện Set phù hợp (Set tiếng Anh không lẫn Set tiếng Trung)
export async function getUserSetsForLanguage(language: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  return prisma.set.findMany({
    where: { userId, language },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function saveWordToSet(params: {
  sentenceId: string;
  setId: string;
  term: string;
  definition: string;
  example?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const set = await prisma.set.findUnique({ where: { id: params.setId } });
  if (!set || set.userId !== userId) throw new Error("Không có quyền lưu vào bộ từ vựng này");

  // Kiểm tra trùng: tìm Card có term giống hệt (không phân biệt hoa/thường) trong Set này —
  // đúng yêu cầu "nếu từ đã tồn tại thì không tạo duplicate"
  let card = await prisma.card.findFirst({
    where: { setId: params.setId, term: { equals: params.term, mode: "insensitive" } },
  });

  if (!card) {
    const lastCard = await prisma.card.findFirst({
      where: { setId: params.setId },
      orderBy: { order: "desc" },
    });
    card = await prisma.card.create({
      data: {
        setId: params.setId,
        term: params.term,
        definition: params.definition,
        example: params.example || null,
        order: (lastCard?.order ?? -1) + 1,
      },
    });
  }

  // Liên kết sentence ↔ card. Nếu đã liên kết trước đó (unique constraint ở schema),
  // bắt lỗi và bỏ qua thay vì làm hỏng luồng — user bấm lưu 2 lần không nên bị báo lỗi
  try {
    await prisma.videoVocabulary.create({
      data: { sentenceId: params.sentenceId, cardId: card.id },
    });
  } catch {
    // Đã tồn tại liên kết này rồi — im lặng bỏ qua, coi như thành công
  }

  revalidatePath("/videos");
  return { cardId: card.id, setTitle: set.title };
}