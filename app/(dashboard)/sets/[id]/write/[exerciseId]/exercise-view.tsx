"use client";

import { useState } from "react";
import { submitWritingAttempt } from "@/lib/actions/writing-exercise";

type Exercise = {
  id: string;
  type: string;
  title: string;
  exerciseText: string | null;
  topic: string | null;
  suggestions: string[];
};

export default function WriteExerciseView({ exercise }: { exercise: Exercise }) {
  const [answer, setAnswer] = useState(
    exercise.type === "ERROR_CORRECTION" ? exercise.exerciseText ?? "" : ""
  );
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheck() {
    setLoading(true);
    const res = await submitWritingAttempt(exercise.id, answer);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-2">{exercise.title}</h1>

      {exercise.type === "ERROR_CORRECTION" ? (
        <p className="text-sm text-gray-500 mb-4">
          Đoạn văn dưới đây có vài lỗi ngữ pháp/chính tả — sửa lại trực tiếp trong ô rồi bấm kiểm tra.
        </p>
      ) : (
        <div className="mb-4">
          <p className="text-sm text-gray-500">Chủ đề:</p>
          <p className="font-medium mb-2">{exercise.topic}</p>
          <ul className="text-sm text-gray-500 list-disc pl-5">
            {exercise.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={10}
        disabled={!!result}
        className="w-full border rounded-lg p-3"
      />

      {!result ? (
        <button
          onClick={handleCheck}
          disabled={loading || !answer.trim()}
          className="mt-3 bg-brand text-white px-4 py-2 rounded-full font-semibold disabled:opacity-50"
        >
          {loading ? "AI đang chấm..." : "Kiểm tra"}
        </button>
      ) : (
        <div className="mt-4 border rounded-lg p-4 bg-gray-50">
          <p className="font-semibold">Điểm: {result.score}/10</p>
          <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{result.feedback}</p>
        </div>
      )}
    </div>
  );
}