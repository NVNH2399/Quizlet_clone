"use client";

import { useState } from "react";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";
import { useSpeech, getLangCode } from "@/lib/hooks/useSpeech";
import { submitShadowingAttempt } from "@/lib/actions/shadowing";
import { generateSpeech } from "@/lib/tts";
import { compareWords, type WordResult } from "@/lib/scoring";

type Sentence = {
  id: string;
  text: string;
  videoLesson: { language: string; title: string };
};

export default function ShadowingSession({ sentence }: { sentence: Sentence }) {
  const langCode = getLangCode(sentence.videoLesson.language);
  const { speak } = useSpeech(); // fallback Web Speech API
  const { startListening, listening, transcript, error, isSupported } = useSpeechRecognition();

  const [playingLoading, setPlayingLoading] = useState(false);
  const [result, setResult] = useState<{ accuracyScore: number } | null>(null);
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isSupported) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">
          Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome trên máy tính.
        </p>
      </div>
    );
  }

  // Ưu tiên Edge TTS (giọng tự nhiên hơn), tự động fallback Web Speech API nếu lỗi
  async function playSample() {
    setPlayingLoading(true);
    const audioBase64 = await generateSpeech(sentence.text, sentence.videoLesson.language);
    setPlayingLoading(false);

    if (audioBase64) {
      new Audio(audioBase64).play();
    } else {
      speak(sentence.text, langCode);
    }
  }

  async function handleSubmit() {
    if (!transcript || submitting) return;
    setSubmitting(true);
    const res = await submitShadowingAttempt(sentence.id, transcript);
    const words = compareWords(transcript, sentence.text);
    setResult(res);
    setWordResults(words);
    setSubmitting(false);
  }

  function handleRetry() {
    setResult(null);
    setWordResults([]);
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button onClick={() => history.back()} className="text-sm text-gray-400">
        ← Quay lại video
      </button>

      <h1 className="text-lg font-bold mt-2 mb-4">Luyện Shadowing</h1>

      <div className="border rounded-2xl p-5 bg-white text-center">
        <p className="text-xl font-medium mb-4">{sentence.text}</p>

        <button
          onClick={playSample}
          disabled={playingLoading}
          className="text-sm text-brand underline mb-6 disabled:opacity-50"
        >
          {playingLoading ? "Đang tải..." : "🔊 Nghe mẫu"}
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
            {listening ? "Đang nghe..." : "Bấm để nói lại câu trên"}
          </p>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        {transcript && !result && (
          <div className="mt-4 border rounded-lg p-3 text-left">
            <p className="text-sm text-gray-500">Bạn vừa nói:</p>
            <p className="text-lg">{transcript}</p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-2 bg-brand text-white px-4 py-2 rounded-full text-sm disabled:opacity-50"
            >
              {submitting ? "Đang chấm..." : "Kiểm tra"}
            </button>
          </div>
        )}

        {result && (
          <div className="mt-4">
            <p className="text-2xl font-bold text-brand">
              {Math.round(result.accuracyScore * 100)}%
            </p>
            <p className="text-sm text-gray-400 mb-3">Độ khớp với câu gốc</p>

            <div className="flex flex-wrap gap-1.5 justify-center text-sm">
              {wordResults.map((w, i) => (
                <span
                  key={i}
                  className={
                    w.status === "correct"
                      ? "text-green-600"
                      : w.status === "mispronounced"
                        ? "text-orange-500 underline decoration-wavy"
                        : w.status === "extra"
                          ? "text-purple-400 italic"
                          : "text-gray-300 line-through"
                  }
                >
                  {w.word}
                </span>
              ))}
            </div>

            <button
              onClick={handleRetry}
              className="mt-4 border rounded-full px-4 py-2 text-sm hover:border-brand hover:text-brand"
            >
              🔁 Thử lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}