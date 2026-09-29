"use client";

import { useState } from "react";
import { bulkCreateCards } from "@/lib/actions/card";

export default function BulkAddForm({ setId }: { setId: string }) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setMessage("");
    try {
      const count = await bulkCreateCards(setId, text);
      setMessage(`Đã thêm ${count} thẻ`);
      setText("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="my-4 border rounded p-4 bg-gray-50">
      <p className="text-sm text-gray-600 mb-2">
        Dán nhiều dòng, mỗi dòng dạng: <code>từ - nghĩa</code> (hoặc dán từ Excel/Sheets)
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="w-full border rounded p-2"
        placeholder={"apple - quả táo\nbanana - quả chuối"}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !text.trim()}
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Đang thêm..." : "Thêm thẻ"}
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}