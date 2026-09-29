"use client";

import { useState } from "react";
import { extractTextFromPDF } from "@/lib/pdf-extract";
import { bulkCreateCards } from "@/lib/actions/card";

export default function ImportPDF({ setId }: { setId: string }) {
  const [rawText, setRawText] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const text = await extractTextFromPDF(file);
    setRawText(text);
    setLoading(false);
  }

  async function handleImport() {
    setLoading(true);
    const count = await bulkCreateCards(setId, rawText);
    setMessage(`Đã import ${count} thẻ thành công!`);
    setRawText("");
    setLoading(false);
  }

  return (
    <div className="border rounded-2xl p-5 bg-white">
      <h3 className="font-semibold mb-2">Import từ PDF</h3>
      <p className="text-sm text-gray-500 mb-3">
        PDF cần có dạng danh sách <code>từ - nghĩa</code> mỗi dòng. Kiểm tra và sửa lại text
        bên dưới trước khi import.
      </p>

      <input type="file" accept=".pdf" onChange={handleFile} className="text-sm mb-4" />

      {loading && <p className="text-sm text-gray-400">Đang xử lý...</p>}

      {rawText && (
        <>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={10}
            className="w-full border rounded-lg p-3 text-sm font-mono mb-3"
          />
          <button
            onClick={handleImport}
            disabled={loading}
            className="bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
          >
            Import
          </button>
        </>
      )}

      {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
    </div>
  );
}