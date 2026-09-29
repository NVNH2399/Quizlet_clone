"use client";

import { useState } from "react";
import { submitReadingQuiz } from "@/lib/actions/reading";

type Question = { id: string; type: string; question: string; options: string[]; answer: string };
type Passage = { id: string; title: string; content: string; questions: Question[] };

export default function ReadingQuiz({ passage }: { passage: Passage }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    total: number;
    correctCount: number;
    results: { questionId: string; isCorrect: boolean; correctAnswer: string }[];
  } | null>(null);

  const allAnswered = passage.questions.every((q) => answers[q.id]);

  async function handleSubmit() {
    const res = await submitReadingQuiz(passage.id, answers);
    setResult(res);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{passage.title}</h1>

      {/* Nội dung bài đọc, giữ nguyên xuống dòng bằng whitespace-pre-line */}
      <div className="border rounded p-4 mb-6 whitespace-pre-line leading-relaxed">
        {passage.content}
      </div>

      <div className="space-y-6">
        {passage.questions.map((q, idx) => {
          const questionResult = result?.results.find((r) => r.questionId === q.id);

          return (
            <div key={q.id} className="border rounded p-4">
              <p className="font-medium mb-2">
                {idx + 1}. {q.question}
              </p>
              <div className="space-y-1">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt;
                  let className = "block w-full text-left border rounded p-2";

                  // Sau khi nộp bài mới tô màu, trước đó chỉ highlight lựa chọn đang chọn
                  if (result && questionResult) {
                    if (opt === questionResult.correctAnswer) className += " bg-green-100 border-green-500";
                    else if (isSelected) className += " bg-red-100 border-red-500";
                  } else if (isSelected) {
                    className += " bg-blue-50 border-blue-500";
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
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Nộp bài
        </button>
      ) : (
        <div className="mt-6 border rounded p-4 bg-gray-50">
          <p className="font-semibold">
            Kết quả: {result.correctCount}/{result.total} câu đúng
          </p>
        </div>
      )}
    </div>
  );
}