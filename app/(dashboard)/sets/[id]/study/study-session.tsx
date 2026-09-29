"use client";

import { useState } from "react";
import { submitAnswer } from "@/lib/actions/study";
import { Skill } from "@prisma/client";
import { useRouter } from "next/navigation";

type Card = {
  id: string;
  term: string;
  definition: string;
  example: string | null;
};

export default function StudySession({
  setId,
  cards,
  skill,
}: {
  setId: string;
  cards: Card[];
  skill: Skill;
}) {
  const router = useRouter();

  // queue: danh sách thẻ còn phải học trong phiên này
  // Khi trả lời "Không nhớ" (quality 0), thẻ đó bị đẩy xuống cuối queue
  // để user gặp lại nó ngay trong phiên học hiện tại, thay vì phải đợi qua ngày mai
  const [queue, setQueue] = useState<Card[]>(cards);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  const currentCard = queue[0];
  const totalCards = cards.length;

  async function handleAnswer(quality: 0 | 1 | 2 | 3) {
    if (!currentCard || submitting) return;
    setSubmitting(true);

    await submitAnswer(currentCard.id, skill, quality);

    setQueue((prev) => {
      const rest = prev.slice(1);
      // Chỉ đẩy thẻ xuống cuối queue nếu trả lời sai (quality 0)
      // Trả lời đúng thì bỏ hẳn khỏi phiên học hiện tại
      if (quality === 0) {
        return [...rest, currentCard];
      }
      return rest;
    });

    if (quality !== 0) setDoneCount((c) => c + 1);
    setFlipped(false);
    setSubmitting(false);
  }

  // Hết queue = học xong phiên này
  if (!currentCard) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg font-semibold">🎉 Hoàn thành phiên học!</p>
        <p className="text-gray-500">{totalCards} thẻ đã ôn xong</p>
        <button
          onClick={() => router.push(`/sets/${setId}`)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Quay lại set
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      {/* Thanh tiến độ */}
      <div className="mb-4">
        <div className="h-2 bg-gray-200 rounded">
          <div
            className="h-2 bg-blue-600 rounded transition-all"
            style={{ width: `${(doneCount / totalCards) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {doneCount} / {totalCards}
        </p>
      </div>

      {/* Thẻ lật */}
      <div
  onClick={() => setFlipped(!flipped)}
  className={`flip-card cursor-pointer select-none ${flipped ? "flipped" : ""}`}
>
  <div className="flip-card-inner">
    <div className="flip-card-front bg-white border-2 border-gray-100 shadow-sm text-2xl font-semibold px-8 text-center">
      {currentCard.term}
    </div>
    <div className="flip-card-back bg-brand-light border-2 border-brand text-xl px-8 text-center">
      <div>
        <p>{currentCard.definition}</p>
        {currentCard.example && (
          <p className="text-sm text-gray-500 mt-2 italic">{currentCard.example}</p>
        )}
      </div>
    </div>
  </div>
</div>
      <p className="text-center text-sm text-gray-400 mt-2">
        {flipped ? "" : "Bấm vào thẻ để xem nghĩa"}
      </p>

      {/* Nút đánh giá — chỉ hiện sau khi đã lật thẻ */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2 mt-6">
          <button
            onClick={() => handleAnswer(0)}
            disabled={submitting}
            className="bg-red-100 text-red-700 py-2 rounded disabled:opacity-50"
          >
            Không nhớ
          </button>
          <button
            onClick={() => handleAnswer(1)}
            disabled={submitting}
            className="bg-orange-100 text-orange-700 py-2 rounded disabled:opacity-50"
          >
            Khó
          </button>
          <button
            onClick={() => handleAnswer(2)}
            disabled={submitting}
            className="bg-green-100 text-green-700 py-2 rounded disabled:opacity-50"
          >
            Nhớ
          </button>
          <button
            onClick={() => handleAnswer(3)}
            disabled={submitting}
            className="bg-blue-100 text-blue-700 py-2 rounded disabled:opacity-50"
          >
            Dễ
          </button>
        </div>
      )}
    </div>
  );
}