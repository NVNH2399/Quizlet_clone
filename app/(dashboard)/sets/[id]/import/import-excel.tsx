"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { bulkCreateCards } from "@/lib/actions/card";

type ParsedRow = { term: string; definition: string };

export default function ImportExcel({ setId }: { setId: string }) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const parsed = raw
        .filter((row) => row[0] && row[1])
        .map((row) => ({ term: String(row[0]).trim(), definition: String(row[1]).trim() }));

      setRows(parsed);
    };
    reader.readAsBinaryString(file);
  }

  function updateRow(index: number, field: "term" | "definition", value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImport() {
    setLoading(true);
    const text = rows.map((r) => `${r.term}\t${r.definition}`).join("\n");
    const count = await bulkCreateCards(setId, text);
    setMessage(`Đã import ${count} thẻ thành công!`);
    setRows([]);
    setLoading(false);
  }

  return (
    <div className="border rounded-2xl p-5 bg-white">
      <h3 className="font-semibold mb-2">Import từ Excel/CSV</h3>
      <p className="text-sm text-gray-500 mb-3">
        File cần có 2 cột: cột A là từ, cột B là nghĩa (không cần tiêu đề).
      </p>

      <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="text-sm mb-4" />

      {rows.length > 0 && (
        <div className="max-h-80 overflow-y-auto border rounded-lg mb-4">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 p-2 border-b items-center">
              <input
                value={row.term}
                onChange={(e) => updateRow(i, "term", e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <input
                value={row.definition}
                onChange={(e) => updateRow(i, "definition", e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <button onClick={() => removeRow(i)} className="text-red-500 text-xs">
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <button
          onClick={handleImport}
          disabled={loading}
          className="bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "Đang import..." : `Import ${rows.length} thẻ`}
        </button>
      )}

      {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
    </div>
  );
}