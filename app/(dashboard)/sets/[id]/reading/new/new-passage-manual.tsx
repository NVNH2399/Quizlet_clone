"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPassageManual } from "@/lib/actions/reading";

type QuestionDraft = {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  question: string;
  options: string[];
  correctIndex: number; // -1 nghĩa là chưa chọn đáp án nào
};

function emptyQuestion(): QuestionDraft {
  return { type: "MULTIPLE_CHOICE", question: "", options: ["", "", "", ""], correctIndex: -1 };
}

export default function NewPassageManual({ setId }: { setId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateOption(qIndex: number, optIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, j) => (j === optIndex ? value : o)) } : q
      )
    );
  }

  // Đổi loại câu hỏi giữa Trắc nghiệm và Đúng/Sai — Đúng/Sai có sẵn 2 lựa chọn cố định,
  // không cho user tự gõ, để tránh nhập sai chính tả "Đúng"/"Sai"
  function changeType(index: number, type: QuestionDraft["type"]) {
    updateQuestion(index, {
      type,
      options: type === "TRUE_FALSE" ? ["Đúng", "Sai"] : ["", "", "", ""],
      correctIndex: -1,
    });
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function addOption(qIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, ""] } : q))
    );
  }

  function removeOption(qIndex: number, optIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const newOptions = q.options.filter((_, j) => j !== optIndex);
        // Nếu xóa đúng lựa chọn đang được đánh dấu là đáp án đúng, reset lại về chưa chọn
        const newCorrectIndex = q.correctIndex === optIndex ? -1 : q.correctIndex;
        return { ...q, options: newOptions, correctIndex: newCorrectIndex };
      })
    );
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const passageId = await createPassageManual(setId, title, content, questions);
      router.push(`/sets/${setId}/reading/${passageId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Tạo bài đọc thủ công</h1>

      {/* Phần đoạn văn */}
      <div className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề bài đọc"
          className="w-full border rounded-lg p-2"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Dán đoạn văn vào đây..."
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Danh sách câu hỏi động */}
      <div className="space-y-4">
        <h2 className="font-semibold">Câu hỏi</h2>

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="border rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Câu {qIndex + 1}</span>
              <div className="flex items-center gap-2">
                <select
                  value={q.type}
                  onChange={(e) => changeType(qIndex, e.target.value as QuestionDraft["type"])}
                  className="border rounded p-1 text-sm"
                >
                  <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                  <option value="TRUE_FALSE">Đúng/Sai</option>
                </select>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-500 text-xs"
                  >
                    Xóa câu
                  </button>
                )}
              </div>
            </div>

            <input
              value={q.question}
              onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
              placeholder="Nội dung câu hỏi"
              className="w-full border rounded p-2 text-sm"
            />

            {/* Danh sách lựa chọn — click radio để đánh dấu đáp án đúng, không cần gõ lại text */}
            <div className="space-y-2">
              {q.options.map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={q.correctIndex === optIndex}
                    onChange={() => updateQuestion(qIndex, { correctIndex: optIndex })}
                  />
                  {q.type === "TRUE_FALSE" ? (
                    <span className="flex-1 text-sm">{opt}</span>
                  ) : (
                    <input
                      value={opt}
                      onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                      placeholder={`Lựa chọn ${optIndex + 1}`}
                      className="flex-1 border rounded p-1.5 text-sm"
                    />
                  )}
                  {q.type === "MULTIPLE_CHOICE" && q.options.length > 2 && (
                    <button
                      onClick={() => removeOption(qIndex, optIndex)}
                      className="text-red-400 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {q.type === "MULTIPLE_CHOICE" && (
                <button
                  onClick={() => addOption(qIndex)}
                  className="text-brand text-xs font-medium"
                >
                  + Thêm lựa chọn
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full border-2 border-dashed rounded-xl p-3 text-sm text-gray-500 hover:border-brand hover:text-brand"
        >
          + Thêm câu hỏi
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-brand text-white px-6 py-2.5 rounded-full font-semibold disabled:opacity-50"
      >
        {loading ? "Đang tạo..." : "Tạo bài đọc"}
      </button>
    </div>
  );
}