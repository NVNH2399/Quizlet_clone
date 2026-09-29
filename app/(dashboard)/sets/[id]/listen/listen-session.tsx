"use client";

import { useState, useMemo, useEffect } from "react";
import { useSpeech, getLangCode } from "@/lib/hooks/useSpeech";
import { submitAnswer } from "@/lib/actions/study";

type Card = { id: string; term: string; definition: string };

export default function ListenSession({ cards, language }: { cards: Card[]; language: string }) {
  const { speak, speaking } = useSpeech();
  const [queue, setQueue] = useState(cards);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = queue[0];
  const langCode = getLangCode(language);

  // Tự sinh 3 đáp án nhiễu (distractor) từ các thẻ khác trong set, cộng với đáp án đúng = 4 lựa chọn
  // useMemo để không random lại mỗi lần re-render, chỉ random lại khi đổi thẻ
  const options = useMemo(() => {
    if (!current) return [];
    const others = cards.filter((c) => c.id !== current.id);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [current, ...shuffledOthers].sort(() => Math.random() - 0.5);
    return allOptions.map((c) => c.definition);
  }, [current, cards]);

  // Tự động đọc từ ngay khi chuyển sang thẻ mới
  useEffect(() => {
    if (current) speak(current.term, langCode);
  }, [current, langCode, speak]);

  async function handleSelect(option: string) {
    if (selected || submitting) return; // đã chọn rồi thì không cho chọn lại
    setSelected(option);
    setSubmitting(true);

    const isCorrect = option === current.definition;
    await submitAnswer(current.id, "LISTENING", isCorrect ? 2 : 0);

    setSubmitting(false);
  }

  function handleNext() {
    setQueue((prev) => {
      const rest = prev.slice(1);
      const wasCorrect = selected === current.definition;
      return wasCorrect ? rest : [...rest, current];
    });
    setSelected(null);
  }

  if (!current) {
    return <div className="p-6 text-center">🎉 Hoàn thành phần Nghe!</div>;
  }

  return (
    <div className="p-6 max-w-lg mx-auto text-center">
      <p className="text-sm text-gray-500 mb-2">Nghe và chọn nghĩa đúng</p>

      <button
        onClick={() => speak(current.term, langCode)}
        disabled={speaking}
        className="w-20 h-20 rounded-full bg-blue-600 text-white text-2xl mb-6 disabled:opacity-50"
      >
        🔊
      </button>

      <div className="space-y-2">
        {options.map((option) => {
          const isThisCorrect = option === current.definition;
          const isThisSelected = option === selected;

          // Chỉ tô màu sau khi đã chọn: đáp án đúng luôn xanh, đáp án sai user chọn thì đỏ
          let className = "w-full border rounded p-3 text-left";
          if (selected) {
            if (isThisCorrect) className += " bg-green-100 border-green-500";
            else if (isThisSelected) className += " bg-red-100 border-red-500";
          }

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
              className={className}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selected && (
        <button onClick={handleNext} className="mt-6 bg-blue-600 text-white px-4 py-2 rounded">
          Tiếp tục
        </button>
      )}
    </div>
  );
}