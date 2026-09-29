"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isYouTubeUrl } from "@/lib/video-utils";

type SentenceInput = { text: string; translation?: string; startTime: number; endTime: number };

// Kiểm tra quyền sở hữu — tái dùng đúng pattern đã có ở lib/actions/card.ts, lib/actions/reading.ts
async function checkLessonOwnership(lessonId: string, userId: string) {
  const lesson = await prisma.videoLesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.userId !== userId) {
    throw new Error("Không có quyền thao tác trên bài học này");
  }
  return lesson;
}

export async function createVideoLesson(
  data: {
    title: string;
    description: string;
    videoUrl: string;
    level: string;
    category: string;
    language: string;
  },
  sentences: SentenceInput[]
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  if (!data.title.trim() || !data.videoUrl.trim()) {
    throw new Error("Thiếu tiêu đề hoặc URL video");
  }
  if (sentences.length === 0) {
    throw new Error("Cần ít nhất 1 câu trong transcript");
  }

  // Tự nhận diện nguồn video: YouTube hay file upload trực tiếp (Blob URL)
  const videoSource = isYouTubeUrl(data.videoUrl) ? "YOUTUBE" : "UPLOAD";

  // Dùng transaction giống pattern đã áp dụng ở createPassageManual —
  // đảm bảo lesson + toàn bộ sentence cùng tạo thành công hoặc cùng rollback
  const lesson = await prisma.$transaction(async (tx) => {
    const l = await tx.videoLesson.create({
      data: {
        userId,
        title: data.title,
        description: data.description || null,
        videoUrl: data.videoUrl,
        videoSource,
        level: data.level || null,
        category: data.category || null,
        language: data.language,
      },
    });

    await tx.videoSentence.createMany({
      data: sentences.map((s, i) => ({
        videoLessonId: l.id,
        text: s.text,
        translation: s.translation || null,
        startTime: s.startTime,
        endTime: s.endTime,
        order: i,
      })),
    });

    return l;
  });

  revalidatePath("/videos");
  return lesson.id;
}

export async function deleteVideoLesson(lessonId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");
  await checkLessonOwnership(lessonId, userId);

  await prisma.videoLesson.delete({ where: { id: lessonId } });
  revalidatePath("/videos");
}