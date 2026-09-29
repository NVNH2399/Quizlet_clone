"use server";

// Gọi Gemini API (miễn phí), ép trả về JSON thuần để dễ parse
// Dùng chung cho cả sinh câu hỏi Đọc, chèn lỗi Viết, chấm bài Viết, Quiz Video, tra từ vựng
async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
  {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error("Lỗi gọi AI: " + errorBody);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Bóc JSON ra khỏi text trả về, phòng trường hợp AI lỡ kèm giải thích thừa
function extractJSON(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function generateReadingQuestions(passageContent: string) {
  const system = `Bạn là giáo viên ngoại ngữ. Từ đoạn văn được cung cấp, tạo 4 câu hỏi trắc nghiệm đọc hiểu bằng tiếng Việt (câu hỏi và đáp án bằng tiếng Việt, trích dẫn từ tiếng Anh/Trung nếu cần). CHỈ trả về JSON, không giải thích gì thêm, đúng định dạng:
[{"question": "...", "options": ["A", "B", "C", "D"], "answer": "..."}]`;

  const result = await callClaude(system, passageContent);
  return extractJSON(result) as { question: string; options: string[]; answer: string }[];
}

export async function generateErrorCorrectionText(originalText: string) {
  const system = `Bạn là giáo viên ngoại ngữ. Nhận đoạn văn đúng ngữ pháp, hãy tạo ra 1 bản có chèn 4-6 lỗi ngữ pháp/chính tả phổ biến (không đổi ý nghĩa, không đổi quá nhiều để vẫn đọc hiểu được). CHỈ trả về JSON, đúng định dạng:
{"exerciseText": "đoạn văn có lỗi ở đây"}`;

  const result = await callClaude(system, originalText);
  return extractJSON(result) as { exerciseText: string };
}

export async function checkErrorCorrection(originalText: string, userAnswer: string) {
  const system = `Bạn là giáo viên chấm bài. So sánh bản user sửa với bản gốc đúng. Chỉ ra những lỗi user còn sót hoặc sửa sai. Chấm điểm 0-10. CHỈ trả về JSON:
{"score": 8, "feedback": "nhận xét ngắn gọn bằng tiếng Việt, chỉ rõ lỗi còn sót nếu có"}`;

  const result = await callClaude(
    system,
    `Bản gốc đúng: ${originalText}\n\nBản user sửa: ${userAnswer}`
  );
  return extractJSON(result) as { score: number; feedback: string };
}

export async function generateWritingTopic(language: string) {
  const system = `Tạo 1 chủ đề viết luyện tập cho người học ${language === "en" ? "tiếng Anh" : "tiếng Trung"}, kèm 3 gợi ý ý tưởng ngắn. CHỈ trả về JSON:
{"topic": "...", "suggestions": ["gợi ý 1", "gợi ý 2", "gợi ý 3"]}`;

  const result = await callClaude(system, "Tạo chủ đề mới, ngẫu nhiên, phù hợp trình độ trung bình.");
  return extractJSON(result) as { topic: string; suggestions: string[] };
}

export async function checkFreeWriting(topic: string, userAnswer: string) {
  const system = `Bạn là giáo viên ngoại ngữ chấm bài viết tự do theo chủ đề. Nhận xét về ngữ pháp, từ vựng, cách diễn đạt. Chấm điểm 0-10. CHỈ trả về JSON:
{"score": 7, "feedback": "nhận xét chi tiết bằng tiếng Việt: điểm mạnh, lỗi cần sửa, gợi ý cải thiện cách diễn đạt"}`;

  const result = await callClaude(system, `Chủ đề: ${topic}\n\nBài viết của user:\n${userAnswer}`);
  return extractJSON(result) as { score: number; feedback: string };
}

export async function generateVideoQuiz(transcriptText: string) {
  const system = `Bạn là giáo viên ngoại ngữ. Từ transcript video được cung cấp, tạo 5 câu hỏi kiểm tra hiểu bài bằng tiếng Việt (câu hỏi và đáp án tiếng Việt, có thể trích từ/cụm từ gốc nếu cần). Trộn 2 loại: trắc nghiệm và đúng/sai. CHỈ trả về JSON, đúng định dạng:
[{"type": "MULTIPLE_CHOICE", "question": "...", "options": ["A","B","C","D"], "answer": "..."}, {"type": "TRUE_FALSE", "question": "...", "options": ["Đúng","Sai"], "answer": "..."}]`;

  const result = await callClaude(system, transcriptText);
  return extractJSON(result) as {
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    question: string;
    options: string[];
    answer: string;
  }[];
}

export async function lookupWord(word: string, language: string) {
  const system = `Bạn là từ điển ${language === "en" ? "Anh-Việt" : "Trung-Việt"}. Cho 1 từ, trả về nghĩa tiếng Việt ngắn gọn, phiên âm (IPA nếu tiếng Anh, pinyin nếu tiếng Trung), và 1 câu ví dụ ngắn. CHỈ trả về JSON, đúng định dạng:
{"meaning": "...", "pronunciation": "...", "example": "..."}`;

  const result = await callClaude(system, word);
  return extractJSON(result) as { meaning: string; pronunciation: string; example: string };
}