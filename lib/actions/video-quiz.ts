"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateVideoQuiz } from "@/lib/ai";

async function checkLessonOwnership(lessonId: string, userId: string) {
  const lesson = await prisma.videoLesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.userId !== userId) {
    throw new Error("Không có quyền thao tác trên bài học này");
  }
  return lesson;
}

// Ghép toàn bộ câu trong transcript thành 1 đoạn văn để đưa AI phân tích tổng thể,
// thay vì gửi từng câu rời rạc (AI cần ngữ cảnh liên kết để ra câu hỏi có ý nghĩa)
export async function generateQuizForLesson(lessonId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");
  await checkLessonOwnership(lessonId, userId);

  const sentences = await prisma.videoSentence.findMany({
    where: { videoLessonId: lessonId },
    orderBy: { order: "asc" },
  });

  if (sentences.length === 0) throw new Error("Video chưa có transcript để tạo quiz");

  const fullText = sentences.map((s) => s.text).join(" ");
  const questions = await generateVideoQuiz(fullText);

  await prisma.videoQuizQuestion.createMany({
    data: questions.map((q) => ({
      videoLessonId: lessonId,
      type: q.type,
      question: q.question,
      options: q.options,
      answer: q.answer,
    })),
  });

  revalidatePath(`/videos/${lessonId}/quiz`);
}

export async function deleteQuiz(lessonId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");
  await checkLessonOwnership(lessonId, userId);

  await prisma.videoQuizQuestion.deleteMany({ where: { videoLessonId: lessonId } });
  revalidatePath(`/videos/${lessonId}/quiz`);
}

// Chấm điểm — không lưu attempt vào DB (Quiz video hiện chỉ chấm tại chỗ,
// giống cách ReadingQuiz đang làm, không có bảng lưu lịch sử riêng)
export async function submitVideoQuiz(
  lessonId: string,
  answers: Record<string, string>
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const questions = await prisma.videoQuizQuestion.findMany({ where: { videoLessonId: lessonId } });

  let correctCount = 0;
  const results = questions.map((q) => {
    const isCorrect = answers[q.id] === q.answer;
    if (isCorrect) correctCount++;
    return { questionId: q.id, isCorrect, correctAnswer: q.answer };
  });

  return { total: questions.length, correctCount, results };
}