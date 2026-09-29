"use client";

import { use, useState } from "react";
import { createPassageWithAI } from "@/lib/actions/reading";
import { useRouter } from "next/navigation";

export default function NewPassageAIPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: setId } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    const passageId = await createPassageWithAI(setId, title, content);
    router.push(`/sets/${setId}/reading/${passageId}`);
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-3">
      <h1 className="text-xl font-bold">Thêm bài đọc có sẵn</h1>
      <p className="text-sm text-gray-500">
        Dán đoạn văn bạn có sẵn, AI sẽ tự tạo 4 câu hỏi đọc hiểu.
      </p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tiêu đề bài đọc"
        className="w-full border rounded p-2"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        placeholder="Dán đoạn văn vào đây..."
        className="w-full border rounded p-2"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-brand text-white px-4 py-2 rounded-full font-semibold disabled:opacity-50"
      >
        {loading ? "AI đang tạo câu hỏi..." : "Tạo bài đọc"}
      </button>
    </div>
  );
}