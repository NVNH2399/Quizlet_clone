"use client";

import { useState } from "react";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";
import { useSpeech, getLangCode } from "@/lib/hooks/useSpeech";
import { submitSpeakingAnswer } from "@/lib/actions/speaking";

type Card = { id: string; term: string; definition: string };

export default function SpeakSession({ cards, language }: { cards: Card[]; language: string }) {
  const langCode = getLangCode(language);
  const { speak } = useSpeech();
  const { startListening, listening, transcript, error, isSupported } = useSpeechRecognition();

  const [queue, setQueue] = useState(cards);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = queue[0];

  // Không hỗ trợ trình duyệt → báo ngay, không cho vào chế độ này
  if (!isSupported) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">
          Trình duyệt này chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome trên máy tính.
        </p>
      </div>
    );
  }

  async function handleResult(text: string) {
    if (!text || submitting) return;
    setSubmitting(true);
    const res = await submitSpeakingAnswer(current.id, text);
    setResult(res);
    setSubmitting(false);
  }

  function handleNext() {
    setQueue((prev) => {
      const rest = prev.slice(1);
      return result?.isCorrect ? rest : [...rest, current];
    });
    setResult(null);
  }

  if (!current) {
    return <div className="p-6 text-center">🎉 Hoàn thành phần Nói!</div>;
  }

  return (
    <div className="p-6 max-w-lg mx-auto text-center">
      <p className="text-sm text-gray-500 mb-1">Nghĩa của từ:</p>
      <p className="text-xl font-semibold mb-4">{current.definition}</p>

      <button
        onClick={() => speak(current.term, langCode)}
        className="text-sm text-blue-600 mb-6 underline"
      >
        🔊 Nghe phát âm mẫu
      </button>

      <div>
        <button
          onClick={() => startListening(langCode)}
          disabled={listening || !!result}
          className="w-20 h-20 rounded-full bg-red-500 text-white text-2xl disabled:opacity-50"
        >
          {listening ? "🔴" : "🎤"}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          {listening ? "Đang nghe..." : "Bấm để nói"}
        </p>
      </div>

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

      {/* Transcript nhận được, chờ user xác nhận gửi thay vì tự động gửi ngay
          để user có cơ hội nói lại nếu thấy STT nhận sai */}
      {transcript && !result && (
        <div className="mt-4 border rounded p-3">
          <p className="text-sm text-gray-500">Bạn vừa nói:</p>
          <p className="text-lg">{transcript}</p>
          <button
            onClick={() => handleResult(transcript)}
            disabled={submitting}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {submitting ? "Đang chấm..." : "Gửi đáp án"}
          </button>
        </div>
      )}

      {result && (
        <div className="mt-4">
          <p className={result.isCorrect ? "text-green-600" : "text-red-600"}>
            {result.isCorrect ? "✓ Chính xác!" : `✗ Chưa đúng. Đáp án: ${result.correctAnswer}`}
          </p>
          <button onClick={handleNext} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
            Tiếp tục
          </button>
        </div>
      )}
    </div>
  );
}