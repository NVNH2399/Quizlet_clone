"use client";

import { useState } from "react";
import { createErrorCorrectionExercise, createFreeWriteExercise } from "@/lib/actions/writing-exercise";
import { useRouter } from "next/navigation";

export default function CreateWriteExercise({ setId, language }: { setId: string; language: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"NONE" | "ERROR" | "FREE">("NONE");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateError() {
    setLoading(true);
    const formData = new FormData();
    formData.set("title", title);
    formData.set("originalText", text);
    await createErrorCorrectionExercise(setId, formData);
    setLoading(false);
    setMode("NONE");
    setTitle("");
    setText("");
  }

  async function handleCreateFree() {
    setLoading(true);
    const id = await createFreeWriteExercise(setId, language, title);
    router.push(`/sets/${setId}/write/${id}`);
  }

  if (mode === "NONE") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setMode("ERROR")}
          className="border rounded-lg p-3 text-sm flex-1 hover:border-brand"
        >
          📝 Thêm bài viết có sẵn (tìm lỗi sai)
        </button>
        <button
          onClick={handleCreateFree}
          disabled={loading}
          className="border rounded-lg p-3 text-sm flex-1 hover:border-brand disabled:opacity-50"
        >
          {loading ? "AI đang tạo chủ đề..." : "🎲 Chủ đề ngẫu nhiên (viết tự do)"}
        </button>
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-4 space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tiêu đề"
        className="w-full border rounded p-2 text-sm"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Dán đoạn văn đúng ngữ pháp của bạn vào đây, AI sẽ tự chèn lỗi để bạn luyện tìm"
        className="w-full border rounded p-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={handleCreateError}
          disabled={loading}
          className="bg-brand text-white px-4 py-2 rounded-full text-sm disabled:opacity-50"
        >
          {loading ? "AI đang tạo..." : "Tạo bài luyện"}
        </button>
        <button onClick={() => setMode("NONE")} className="text-gray-500 text-sm">
          Hủy
        </button>
      </div>
    </div>
  );
}