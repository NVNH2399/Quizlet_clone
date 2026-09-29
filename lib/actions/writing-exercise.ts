"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  generateErrorCorrectionText,
  checkErrorCorrection,
  generateWritingTopic,
  checkFreeWriting,
} from "@/lib/ai";

// Tạo bài luyện "tìm lỗi sai" từ đoạn văn đúng user đã có sẵn
export async function createErrorCorrectionExercise(setId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const title = formData.get("title") as string;
  const originalText = formData.get("originalText") as string;
  if (!title || !originalText) throw new Error("Thiếu tiêu đề hoặc nội dung");

  const { exerciseText } = await generateErrorCorrectionText(originalText);

  await prisma.writingExercise.create({
    data: { setId, type: "ERROR_CORRECTION", title, originalText, exerciseText },
  });

  revalidatePath(`/sets/${setId}/write`);
}

// Tạo bài viết tự do — AI tự sinh chủ đề + gợi ý ngẫu nhiên
export async function createFreeWriteExercise(setId: string, language: string, title: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const { topic, suggestions } = await generateWritingTopic(language);

  const exercise = await prisma.writingExercise.create({
    data: { setId, type: "FREE_WRITE", title: title || topic, topic, suggestions },
  });

  revalidatePath(`/sets/${setId}/write`);
  return exercise.id;
}

// Nộp bài — dùng chung cho cả 2 loại, tự rẽ nhánh chấm điểm theo type
export async function submitWritingAttempt(exerciseId: string, userAnswer: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const exercise = await prisma.writingExercise.findUnique({ where: { id: exerciseId } });
  if (!exercise) throw new Error("Không tìm thấy bài tập");

  let score: number;
  let feedback: string;

  if (exercise.type === "ERROR_CORRECTION") {
    const result = await checkErrorCorrection(exercise.originalText!, userAnswer);
    score = result.score;
    feedback = result.feedback;
  } else {
    const result = await checkFreeWriting(exercise.topic!, userAnswer);
    score = result.score;
    feedback = result.feedback;
  }

  await prisma.writingAttempt.create({
    data: { userId, exerciseId, userAnswer, score, feedback },
  });

  return { score, feedback };
}