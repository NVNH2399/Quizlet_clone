"use client";

import { useMemo, useState } from "react";
import { useSpeech, getLangCode } from "@/lib/hooks/useSpeech";
import { generateSpeech } from "@/lib/tts";
import { submitDictationAttempt } from "@/lib/actions/dictation";
import { pickBlankWord } from "@/lib/dictation-utils";

type Sentence = {
  id: string;
  text: string;
  videoLesson: { language: string };
};

export default function DictationSession({ sentence }: { sentence: Sentence }) {
  const langCode = getLangCode(sentence.videoLesson.language);
  const { speak } = useSpeech();

  // useMemo để chỉ chọn từ ẩn 1 lần duy nhất khi component mount,
  // không chọn lại mỗi lần re-render (sẽ khiến câu hỏi đổi liên tục gây khó chịu)
  const { blankedText, answer } = useMemo(() => pickBlankWord(sentence.text), [sentence.id]);

  const [userAnswer, setUserAnswer] = useState("");
  const [playingLoading, setPlayingLoading] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function playAudio() {
    setPlayingLoading(true);
    const audioBase64 = await generateSpeech(sentence.text, sentence.videoLesson.language);
    setPlayingLoading(false);

    if (audioBase64) {
      new Audio(audioBase64).play();
    } else {
      speak(sentence.text, langCode);
    }
  }

  async function handleCheck() {
    if (!userAnswer.trim() || submitting) return;
    setSubmitting(true);
    const res = await submitDictationAttempt(sentence.id, answer, userAnswer);
    setResult(res);
    setSubmitting(false);
  }

  function handleSkip() {
    setSkipped(true);
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button onClick={() => history.back()} className="text-sm text-gray-400">
        ← Quay lại video
      </button>

      <h1 className="text-lg font-bold mt-2 mb-4">Điền từ còn thiếu</h1>

      <div className="border rounded-2xl p-5 bg-white text-center">
        <button
          onClick={playAudio}
          disabled={playingLoading}
          className="w-16 h-16 rounded-full bg-brand text-white text-2xl mb-4 disabled:opacity-50"
        >
          {playingLoading ? "..." : "🔊"}
        </button>
        <p className="text-xs text-gray-400 mb-4">Nghe rồi điền từ còn thiếu vào chỗ trống</p>

        <p className="text-lg font-medium mb-4 leading-relaxed">
          {(result || skipped
            ? blankedText.replace("______", `【${answer}】`)
            : blankedText
          )}
        </p>

        {!result && !skipped && (
          <>
            <input
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              placeholder="Nhập từ còn thiếu..."
              className="w-full border rounded-lg p-2.5 text-center"
              autoFocus
            />
            <div className="flex gap-2 mt-3 justify-center">
              <button
                onClick={handleCheck}
                disabled={submitting || !userAnswer.trim()}
                className="bg-brand text-white px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? "Đang kiểm tra..." : "Kiểm tra"}
              </button>
              <button
                onClick={handleSkip}
                className="border rounded-full px-5 py-2 text-sm text-gray-500 hover:border-gray-400"
              >
                Bỏ qua
              </button>
            </div>
          </>
        )}

        {(result || skipped) && (
          <div className="mt-4">
            {result && (
              <p className={result.isCorrect ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                {result.isCorrect ? "✓ Chính xác!" : "✗ Chưa đúng"}
              </p>
            )}
            {skipped && <p className="text-gray-400 font-medium">Đã bỏ qua</p>}
            <p className="text-sm text-gray-500 mt-1">
              Đáp án đúng: <b>{answer}</b>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}