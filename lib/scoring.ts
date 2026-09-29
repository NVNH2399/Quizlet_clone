import { levenshteinDistance } from "./levenshtein";

// Chuẩn hóa text trước khi so sánh: lowercase, bỏ dấu câu, gộp khoảng trắng thừa
// Kỹ hơn bản chuẩn hóa cũ đang dùng cho Speaking/Writing (chỉ lowercase + trim)
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"'()]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

export function calculateAccuracy(recognized: string, target: string): number {
  const a = normalize(recognized);
  const b = normalize(target);
  if (b.length === 0) return 0;
  const distance = levenshteinDistance(a, b);
  return Math.max(0, 1 - distance / Math.max(a.length, b.length));
}

export type WordStatus = "correct" | "mispronounced" | "missing" | "extra";
export type WordResult = { word: string; status: WordStatus };

// So từng từ theo vị trí — đủ dùng cho câu ngắn (Shadowing thường luyện từng câu đơn)
export function compareWords(recognized: string, target: string): WordResult[] {
  const userWords = normalize(recognized).split(" ").filter(Boolean);
  const targetWords = normalize(target).split(" ").filter(Boolean);

  const results: WordResult[] = targetWords.map((word, i) => {
    const userWord = userWords[i];
    if (!userWord) return { word, status: "missing" };
    if (userWord === word) return { word, status: "correct" };
    return { word, status: "mispronounced" };
  });

  // Từ user nói thừa ra so với câu gốc — trường hợp trước đây bị bỏ sót
  if (userWords.length > targetWords.length) {
    const extraWords = userWords.slice(targetWords.length);
    results.push(...extraWords.map((word) => ({ word, status: "extra" as const })));
  }

  return results;
}