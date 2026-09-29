"use client";

import { useCallback, useState } from "react";

// Hook tái sử dụng cho mọi nơi cần phát âm (Nghe, và cả phần Nói để đọc mẫu trước khi user tự nói)
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text: string, lang: string = "en-US") => {
    // Hủy lượt đọc trước đó nếu đang phát, tránh chồng chéo giọng đọc
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // đọc chậm hơn bình thường 1 chút, dễ nghe khi đang học

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak, speaking };
}

// Map ngôn ngữ lưu trong Set (vd "en", "zh") sang mã lang chuẩn mà Web Speech API cần
export function getLangCode(language: string): string {
  const map: Record<string, string> = {
    en: "en-US",
    zh: "zh-CN",
  };
  return map[language] ?? "en-US";
}