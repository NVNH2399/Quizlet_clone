// Tính khoảng cách Levenshtein giữa 2 chuỗi
// Dùng thuật toán quy hoạch động (dynamic programming) chuẩn, độ phức tạp O(m*n)
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // dp[i][j] = số phép biến đổi tối thiểu để biến a[0..i] thành b[0..j]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  // Trường hợp cơ sở: biến chuỗi rỗng thành chuỗi có độ dài i/j
  // cần đúng i (hoặc j) phép thêm ký tự
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]; // ký tự giống nhau, không tốn phép biến đổi
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // xóa 1 ký tự
          dp[i][j - 1],     // thêm 1 ký tự
          dp[i - 1][j - 1]  // thay 1 ký tự
        );
      }
    }
  }

  return dp[m][n];
}

// Quy đổi distance thành điểm tương đồng 0-1, để dễ đặt ngưỡng chấm đúng/sai
// Ví dụ: similarity 0.9 nghĩa là 90% giống với đáp án
export function similarityScore(input: string, answer: string): number {
  const normalizedInput = input.trim().toLowerCase();
  const normalizedAnswer = answer.trim().toLowerCase();

  if (normalizedAnswer.length === 0) return 0;

  const distance = levenshteinDistance(normalizedInput, normalizedAnswer);
  const maxLength = Math.max(normalizedInput.length, normalizedAnswer.length);

  return 1 - distance / maxLength;
}

// Ngưỡng chấm: >= 0.85 coi là đúng (cho phép sai lệch nhỏ như thiếu dấu, gõ nhầm 1-2 ký tự)
// Ngưỡng này nên để config được, vì từ ngắn (vd "cat") chỉ cần sai 1 ký tự
// đã tụt dưới 0.85, trong khi từ dài (vd "beautiful") thì threshold này hợp lý hơn
const CORRECT_THRESHOLD = 0.85;

export function checkWritingAnswer(input: string, answer: string) {
  const score = similarityScore(input, answer);
  const isCorrect = score >= CORRECT_THRESHOLD;

  return { score, isCorrect };
}