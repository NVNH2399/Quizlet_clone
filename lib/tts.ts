"use server";

import { EdgeTTS } from "edge-tts-universal";

// Map ngôn ngữ sang giọng đọc — dễ đổi/thêm giọng khác sau này chỉ tại 1 chỗ
const VOICE_MAP: Record<string, string> = {
  en: "en-US-AriaNeural",
  zh: "zh-CN-XiaoxiaoNeural",
};

// Trả về audio dạng base64 để client phát trực tiếp
// Trả về chuỗi rỗng nếu lỗi — KHÔNG throw, để client tự fallback sang Web Speech API
// (Edge TTS là API không chính thức, có thể ngừng hoạt động bất kỳ lúc nào)
export async function generateSpeech(text: string, language: string): Promise<string> {
  try {
    const voice = VOICE_MAP[language] ?? VOICE_MAP.en;
    const tts = new EdgeTTS(text, voice);
    const result = await tts.synthesize();
    const buffer = Buffer.from(await result.audio.arrayBuffer());
    return `data:audio/mpeg;base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error("Edge TTS lỗi, client sẽ fallback về Web Speech API:", err);
    return "";
  }
}