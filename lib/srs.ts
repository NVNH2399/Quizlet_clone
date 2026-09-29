// Thuật toán SM-2 (Simplified) — dùng chung cho cả 4 kỹ năng
// Input: progress hiện tại của 1 thẻ + độ khó user tự đánh giá (quality)
// Output: bộ progress mới để lưu vào UserCardProgress

type SRSInput = {
  easeFactor: number;
  interval: number;
  repetitions: number;
};

type SRSResult = {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
};

// quality: 0 = Không nhớ, 1 = Khó, 2 = Nhớ, 3 = Dễ
export function calculateSRS(current: SRSInput, quality: 0 | 1 | 2 | 3): SRSResult {
  let { easeFactor, interval, repetitions } = current;

  if (quality < 2) {
    // Trả lời sai hoặc quá khó → coi như chưa thuộc, học lại từ đầu
    // Không giảm easeFactor mạnh ở đây, chỉ reset tiến trình lặp lại
    repetitions = 0;
    interval = 1;
  } else {
    // Trả lời đúng → tính interval mới dựa trên số lần đúng liên tiếp
    if (repetitions === 0) {
      interval = 1; // lần đầu đúng, ôn lại sau 1 ngày
    } else if (repetitions === 1) {
      interval = 6; // lần thứ 2 đúng liên tiếp, ôn lại sau 6 ngày
    } else {
      // Từ lần thứ 3 trở đi, interval nhân theo easeFactor
      // → thẻ càng dễ (easeFactor cao) thì giãn cách càng dài
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Cập nhật easeFactor theo công thức gốc của SM-2
  // Quality càng cao thì easeFactor càng tăng (thẻ dễ, giãn nhanh hơn)
  // Quality thấp thì easeFactor giảm, nhưng không bao giờ dưới 1.3
  // (dưới mức này thẻ sẽ lặp lại quá dày, gây khó chịu)
  const qualityScore = quality * 1.67; // quy đổi thang 0-3 sang thang 0-5 gốc
  easeFactor = easeFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { easeFactor, interval, repetitions, nextReview };
}