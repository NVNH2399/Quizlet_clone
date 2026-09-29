"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { QuestionType } from "@prisma/client";
import { generateReadingQuestions } from "@/lib/ai";

async function checkSetOwnership(setId: string, userId: string) {
  const set = await prisma.set.findUnique({ where: { id: setId } });
  if (!set || set.userId !== userId) throw new Error("Không có quyền thao tác trên set này");
  return set;
}

export async function createPassageWithAI(setId: string, title: string, content: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");
  await checkSetOwnership(setId, userId);

  const passage = await prisma.readingPassage.create({
    data: { setId, title, content },
  });

  const questions = await generateReadingQuestions(content);

  await prisma.readingQuestion.createMany({
    data: questions.map((q) => ({
      passageId: passage.id,
      type: "MULTIPLE_CHOICE" as const,
      question: q.question,
      options: q.options,
      answer: q.answer,
    })),
  });

  revalidatePath(`/sets/${setId}/reading`);
  return passage.id;
}

export async function createPassage(setId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");
  await checkSetOwnership(setId, userId);

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  if (!title || !content) throw new Error("Thiếu tiêu đề hoặc nội dung bài đọc");

  const passage = await prisma.readingPassage.create({
    data: { setId, title, content },
  });

  revalidatePath(`/sets/${setId}`);
  return passage.id;
}

// Thêm câu hỏi cho bài đọc — options là mảng, nhận từ input dạng "A|B|C|D" rồi tách ra
export async function createQuestion(passageId: string, setId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");
  await checkSetOwnership(setId, userId);

  const type = formData.get("type") as QuestionType;
  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;
  const optionsRaw = formData.get("options") as string;

  if (!question || !answer) throw new Error("Thiếu câu hỏi hoặc đáp án");

  // TRUE_FALSE thì options cố định, MULTIPLE_CHOICE thì tách từ input người dùng nhập
  const options =
    type === "TRUE_FALSE"
      ? ["Đúng", "Sai"]
      : optionsRaw.split("|").map((o) => o.trim()).filter(Boolean);

  if (type === "MULTIPLE_CHOICE" && options.length < 2) {
    throw new Error("Câu trắc nghiệm cần ít nhất 2 lựa chọn");
  }
  if (!options.includes(answer)) {
    throw new Error("Đáp án phải khớp với 1 trong các lựa chọn");
  }

  await prisma.readingQuestion.create({
    data: { passageId, type, question, options, answer },
  });

  revalidatePath(`/sets/${setId}`);
}

export async function deletePassage(passageId: string, setId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");
  await checkSetOwnership(setId, userId);

  await prisma.readingPassage.delete({ where: { id: passageId } });
  revalidatePath(`/sets/${setId}`);
}


//Hàm chấm điểm cho bài đọc, tính số câu đúng và điểm trung bình
export async function submitReadingQuiz(
  passageId: string,
  answers: Record<string, string> // { questionId: đáp án user chọn }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");

  const questions = await prisma.readingQuestion.findMany({ where: { passageId } });

  let correctCount = 0;
  const results = questions.map((q) => {
    const isCorrect = answers[q.id] === q.answer;
    if (isCorrect) correctCount++;
    return { questionId: q.id, isCorrect, correctAnswer: q.answer };
  });

  return {
    total: questions.length,
    correctCount,
    results,
  };
}

// Kiểu dữ liệu 1 câu hỏi từ form thủ công — dùng correctIndex thay vì gõ lại đáp án,
// tránh lỗi gõ sai chính tả khiến answer không khớp option nào
type ManualQuestion = {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  question: string;
  options: string[];
  correctIndex: number;
};

// Tạo bài đọc + toàn bộ câu hỏi trong 1 lần submit, thay vì tạo passage
// rồi phải load lại trang để thêm từng câu hỏi như luồng cũ
export async function createPassageManual(
  setId: string,
  title: string,
  content: string,
  questions: ManualQuestion[]
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Chưa đăng nhập");
  await checkSetOwnership(setId, userId);

  if (!title.trim() || !content.trim()) throw new Error("Thiếu tiêu đề hoặc nội dung bài đọc");
  if (questions.length === 0) throw new Error("Cần ít nhất 1 câu hỏi");

  // Kiểm tra mỗi câu hỏi có đủ lựa chọn và đã chọn đáp án đúng chưa,
  // báo lỗi rõ câu số mấy để user dễ sửa thay vì lỗi chung chung
  questions.forEach((q, i) => {
    if (!q.question.trim()) throw new Error(`Câu ${i + 1}: thiếu nội dung câu hỏi`);
    if (q.options.filter((o) => o.trim()).length < 2) {
      throw new Error(`Câu ${i + 1}: cần ít nhất 2 lựa chọn`);
    }
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      throw new Error(`Câu ${i + 1}: chưa chọn đáp án đúng`);
    }
  });

  // Dùng transaction để đảm bảo tạo passage + questions cùng thành công hoặc cùng thất bại,
  // tránh trường hợp tạo passage xong nhưng lỗi giữa chừng lúc tạo câu hỏi để lại bài đọc rỗng
  const passage = await prisma.$transaction(async (tx) => {
    const p = await tx.readingPassage.create({ data: { setId, title, content } });

    await tx.readingQuestion.createMany({
      data: questions.map((q) => ({
        passageId: p.id,
        type: q.type,
        question: q.question.trim(),
        options: q.options.filter((o) => o.trim()),
        answer: q.options[q.correctIndex].trim(),
      })),
    });

    return p;
  });

  revalidatePath(`/sets/${setId}/reading`);
  return passage.id;
}