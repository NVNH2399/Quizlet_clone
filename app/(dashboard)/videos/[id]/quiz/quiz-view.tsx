"use client";

import { useState } from "react";
import { generateQuizForLesson, submitVideoQuiz, deleteQuiz } from "@/lib/actions/video-quiz";

type Question = { id: string; type: string; question: string; options: string[]; answer: string };
type Lesson = { id: string; title: string; quizQuestions: Question[] };

export default function QuizView({ lesson, isOwner }: { lesson: Lesson; isOwner: boolean }) {
  const [questions, setQuestions] = useState(lesson.quizQuestions);
  const [generating, setGenerating] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    total: number;
    correctCount: number;
    results: { questionId: string; isCorrect: boolean; correctAnswer: string }[];
  } | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    await generateQuizForLesson(lesson.id);
    // Reload trang để lấy câu hỏi mới từ Server Component thay vì tự quản lý state phức tạp
    window.location.reload();
  }

  async function handleDelete() {
    if (!confirm("Xóa toàn bộ quiz hiện tại để tạo lại?")) return;
    await deleteQuiz(lesson.id);
    window.location.reload();
  }

  async function handleSubmit() {
    const res = await submitVideoQuiz(lesson.id, answers);
    setResult(res);
  }

  const allAnswered = questions.every((q) => answers[q.id]);

  if (questions.length === 0) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <h1 className="text-xl font-bold mb-2">{lesson.title} — Quiz</h1>
        <p className="text-gray-400 text-sm mb-4">Chưa có câu hỏi nào cho video này.</p>
        {isOwner && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-brand text-white px-5 py-2.5 rounded-full font-semibold disabled:opacity-50"
          >
            {generating ? "AI đang tạo câu hỏi..." : "✨ Tạo quiz bằng AI"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{lesson.title} — Quiz</h1>
        {isOwner && !result && (
          <button onClick={handleDelete} className="text-xs text-red-500 underline">
            Tạo lại quiz
          </button>
        )}
      </div>

      <div className="space-y-5">
        {questions.map((q, idx) => {
          const qResult = result?.results.find((r) => r.questionId === q.id);

          return (
            <div key={q.id} className="border rounded-xl p-4 bg-white">
              <p className="font-medium mb-2">
                {idx + 1}. {q.question}
              </p>
              <div className="space-y-1.5">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt;
                  let className = "block w-full text-left border rounded-lg p-2 text-sm";

                  if (result && qResult) {
                    if (opt === qResult.correctAnswer) className += " bg-green-100 border-green-500";
                    else if (isSelected) className += " bg-red-100 border-red-500";
                  } else if (isSelected) {
                    className += " bg-brand-light border-brand";
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => !result && setAnswers({ ...answers, [q.id]: opt })}
                      disabled={!!result}
                      className={className}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!result ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="mt-6 bg-brand text-white px-5 py-2.5 rounded-full font-semibold disabled:opacity-50"
        >
          Nộp bài
        </button>
      ) : (
        <div className="mt-6 border rounded-xl p-4 bg-gray-50 text-center">
          <p className="font-semibold text-lg">
            Kết quả: {result.correctCount}/{result.total} câu đúng
          </p>
        </div>
      )}
    </div>
  );
}