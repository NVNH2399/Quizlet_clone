"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Kiểm tra user có phải chủ sở hữu set này không — dùng lại ở nhiều hàm bên dưới
// nên tách riêng thành hàm helper, tránh lặp code
async function checkSetOwnership(setId: string, userId: string) {
  const set = await prisma.set.findUnique({ where: { id: setId } });
  if (!set || set.userId !== userId) {
    throw new Error("Không có quyền thao tác trên set này");
  }
  return set;
}

// Thêm 1 thẻ đơn lẻ
export async function createCard(setId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");
  await checkSetOwnership(setId, userId);

  const term = formData.get("term") as string;
  const definition = formData.get("definition") as string;
  const example = formData.get("example") as string;

  if (!term || !definition) throw new Error("Thiếu từ hoặc nghĩa");

  // Lấy order lớn nhất hiện tại để thẻ mới nối tiếp phía sau
  const lastCard = await prisma.card.findFirst({
    where: { setId },
    orderBy: { order: "desc" },
  });

  await prisma.card.create({
    data: {
      setId,
      term,
      definition,
      example: example || null,
      order: (lastCard?.order ?? -1) + 1,
    },
  });

  revalidatePath(`/sets/${setId}`);
}

// Thêm nhiều thẻ cùng lúc từ text dán vào
// Định dạng mỗi dòng: "từ<TAB>nghĩa" hoặc "từ - nghĩa" (giống Quizlet cho phép cả 2 kiểu)
export async function bulkCreateCards(setId: string, rawText: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");
  await checkSetOwnership(setId, userId);

  const lines = rawText.split("\n").filter((line) => line.trim() !== "");

  const lastCard = await prisma.card.findFirst({
    where: { setId },
    orderBy: { order: "desc" },
  });
  let nextOrder = (lastCard?.order ?? -1) + 1;

  const cardsToCreate: { setId: string; term: string; definition: string; order: number }[] = [];

  for (const line of lines) {
    // Ưu tiên tách bằng tab trước (giống Quizlet copy từ Excel/Sheets),
    // nếu không có tab thì thử tách bằng dấu " - "
    let parts: string[];
    if (line.includes("\t")) {
      parts = line.split("\t");
    } else {
      parts = line.split(" - ");
    }

    if (parts.length < 2) continue; // dòng không đúng định dạng, bỏ qua

    const term = parts[0].trim();
    const definition = parts.slice(1).join(" - ").trim(); // phòng trường hợp nghĩa có chứa dấu "-"

    if (!term || !definition) continue;

    cardsToCreate.push({ setId, term, definition, order: nextOrder });
    nextOrder++;
  }

  if (cardsToCreate.length === 0) {
    throw new Error("Không tách được thẻ nào, kiểm tra lại định dạng (từ - nghĩa, mỗi dòng 1 thẻ)");
  }

  await prisma.card.createMany({ data: cardsToCreate });
  revalidatePath(`/sets/${setId}`);

  return cardsToCreate.length; // trả về số thẻ đã tạo để hiện thông báo
}

export async function updateCard(cardId: string, setId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");
  await checkSetOwnership(setId, userId);

  await prisma.card.update({
    where: { id: cardId },
    data: {
      term: formData.get("term") as string,
      definition: formData.get("definition") as string,
      example: (formData.get("example") as string) || null,
    },
  });

  revalidatePath(`/sets/${setId}`);
}

export async function deleteCard(cardId: string, setId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");
  await checkSetOwnership(setId, userId);

  await prisma.card.delete({ where: { id: cardId } });
  revalidatePath(`/sets/${setId}`);
}