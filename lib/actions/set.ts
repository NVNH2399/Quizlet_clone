"use server"; // bắt buộc — đánh dấu toàn bộ file này là Server Action

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Tạo Set mới
export async function createSet(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const language = formData.get("language") as string;

  if (!title || !language) {
    throw new Error("Thiếu tên set hoặc ngôn ngữ");
  }

  const set = await prisma.set.create({
    data: {
      title,
      description,
      language,
      userId,
    },
  });

  // Làm mới lại cache của trang danh sách set, để set mới hiện ra ngay
  revalidatePath("/sets");
  redirect(`/sets/${set.id}`);
}

// Sửa Set — kiểm tra quyền sở hữu trước khi cho update
export async function updateSet(setId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const set = await prisma.set.findUnique({ where: { id: setId } });
  if (!set || set.userId !== userId) {
    throw new Error("Không có quyền sửa set này");
  }

  await prisma.set.update({
    where: { id: setId },
    data: {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      language: formData.get("language") as string,
    },
  });

  revalidatePath(`/sets/${setId}`);
}

// Xóa Set — Prisma tự động xóa Card liên quan nhờ onDelete: Cascade trong schema
export async function deleteSet(setId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const set = await prisma.set.findUnique({ where: { id: setId } });
  if (!set || set.userId !== userId) {
    throw new Error("Không có quyền xóa set này");
  }

  await prisma.set.delete({ where: { id: setId } });
  revalidatePath("/sets");
}