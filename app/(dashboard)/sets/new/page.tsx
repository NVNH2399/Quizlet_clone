"use client";

import { createSet } from "@/lib/actions/set";

export default function NewSetPage() {
  return (
    <form action={createSet} className="p-6 max-w-md space-y-4">
      <h1 className="text-xl font-bold">Tạo set mới</h1>

      <input
        name="title"
        placeholder="Tên set (vd: 100 từ vựng TOEIC)"
        className="w-full border rounded p-2"
        required
      />
      <textarea
        name="description"
        placeholder="Mô tả (không bắt buộc)"
        className="w-full border rounded p-2"
      />
      <select name="language" className="w-full border rounded p-2" required>
        <option value="en">Tiếng Anh</option>
        <option value="zh">Tiếng Trung</option>
      </select>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Tạo set
      </button>
    </form>
  );
}