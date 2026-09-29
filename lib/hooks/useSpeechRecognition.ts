"use client";

import { useCallback, useRef, useState } from "react";

// Khai báo type tối thiểu vì Web Speech API chưa có type chuẩn trong TypeScript
type SpeechRecognitionType = any;

export function useSpeechRecognition() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  // Kiểm tra trình duyệt có hỗ trợ không — Safari/Firefox hỗ trợ kém hoặc không có
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback((lang: string = "en-US") => {
    if (!isSupported) {
      setError("Trình duyệt không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome.");
      return;
    }

    setError(null);
    setTranscript("");

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = lang;
    recognition.continuous = false; // chỉ ghi 1 câu rồi dừng, không ghi liên tục
    recognition.interimResults = false; // chỉ lấy kết quả cuối cùng, không lấy kết quả tạm thời

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
    };

    recognition.onerror = (event: any) => {
      // "no-speech" là lỗi phổ biến nhất — user im lặng quá lâu hoặc mic không bắt được
      if (event.error === "no-speech") {
        setError("Không nghe thấy gì, thử nói lại");
      } else {
        setError("Lỗi nhận diện giọng nói: " + event.error);
      }
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [isSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { startListening, stopListening, listening, transcript, error, isSupported };
}
