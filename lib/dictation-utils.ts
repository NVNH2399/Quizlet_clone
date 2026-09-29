// Chọn 1 từ trong câu để ẩn đi cho bài Dictation.
// Ưu tiên từ có độ dài >= 3 ký tự (tránh ẩn từ nối ngắn như "a", "to", "is"
// vốn dễ đoán và không giúp luyện nghe hiệu quả).
export function pickBlankWord(sentenceText: string): {
  blankedText: string;
  answer: string;
  wordIndex: number;
} {
  const words = sentenceText.split(" ");

  // Lọc ra các vị trí từ đủ dài để ẩn, kèm bỏ dấu câu khi so độ dài
  const candidateIndexes = words
    .map((w, i) => ({ i, len: w.replace(/[.,!?;:"']/g, "").length }))
    .filter((c) => c.len >= 3)
    .map((c) => c.i);

  // Nếu câu toàn từ ngắn (hiếm), fallback chọn đại 1 từ bất kỳ để vẫn có bài tập
  const pool = candidateIndexes.length > 0 ? candidateIndexes : words.map((_, i) => i);
  const wordIndex = pool[Math.floor(Math.random() * pool.length)];

  const answer = words[wordIndex].replace(/[.,!?;:"']/g, "");
  const blankedWords = words.map((w, i) => (i === wordIndex ? "______" : w));

  return { blankedText: blankedWords.join(" "), answer, wordIndex };
}