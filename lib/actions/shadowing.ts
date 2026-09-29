"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { calculateAccuracy } from "@/lib/scoring";

export async function submitShadowingAttempt(sentenceId: string, transcript: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const sentence = await prisma.videoSentence.findUnique({ where: { id: sentenceId } });
  if (!sentence) throw new Error("Không tìm thấy câu");

  const accuracyScore = calculateAccuracy(transcript, sentence.text);

  await prisma.shadowingAttempt.create({
    data: {
      userId,
      sentenceId,
      transcript, // đúng tên field thật trong schema
      accuracyScore,
      // pronunciationScore, fluencyScore: không truyền, giữ null theo đúng thiết kế Phase 2
    },
  });

  return { accuracyScore, transcript, targetText: sentence.text };
}