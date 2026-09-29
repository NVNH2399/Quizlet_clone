"use client";

import { useState } from "react";
import { submitWritingAnswer } from "@/lib/actions/writing";

type Card = { id: string; term: string; definition: string };

export default function WriteSession({ cards }: { cards: Card[] }) {
  const [queue, setQueue] = useState(cards);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = queue[0];

  async function handleSubmit() {
    if (!current || !input.trim() || submitting) return;
    setSubmitting(true);

    const res = await submitWritingAnswer(current.id, input);
    setResult(res);
    setSubmitting(false);
  }

  function handleNext() {
    setQueue((prev) => {
      const rest = prev.slice(1);
      // Sai thì đẩy xuống cuối để gặp lại trong phiên, giống logic Flashcard
      return result?.isCorrect ? rest : [...rest, current];
    });
    setInput("");
    setResult(null);
  }

  if (!current) {
    return <div className="p-6 text-center">🎉 Hoàn thành phần Viết!</div>;
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <p className="text-lg mb-4">Gõ từ tiếng Anh có nghĩa là:</p>
      <p className="text-xl font-semibold mb-4">{current.definition}</p>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={!!result}
        onKeyDown={(e) => e.key === "Enter" && !result && handleSubmit()}
        className="w-full border rounded p-3"
        placeholder="Gõ đáp án..."
        autoFocus
      />

      {!result ? (
        <button
          onClick={handleSubmit}
          disabled={submitting || !input.trim()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Kiểm tra
        </button>
      ) : (
        <div className="mt-4">
          <p className={result.isCorrect ? "text-green-600" : "text-red-600"}>
            {result.isCorrect ? "✓ Chính xác!" : `✗ Sai rồi. Đáp án đúng: ${result.correctAnswer}`}
          </p>
          <button
            onClick={handleNext}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Tiếp tục
          </button>
        </div>
      )}
    </div>
  );
}