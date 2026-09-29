"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchAll, type SearchResult } from "@/lib/actions/search";

export default function SearchBar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Debounce 300ms — tránh gọi Server Action mỗi lần gõ 1 ký tự,
  // chỉ tìm khi user ngừng gõ 1 lúc
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      const res = await searchAll(query);
      setResults(res);
      setOpen(true);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: SearchResult) {
    setQuery("");
    setOpen(false);
    router.push(result.type === "set" ? `/sets/${result.id}` : `/videos/${result.id}`);
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Tìm bộ từ vựng, video..."
          className="w-full border rounded-full pl-9 pr-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-brand outline-none transition"
        />
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden z-20">
          {loading ? (
            <p className="p-3 text-sm text-gray-400">Đang tìm...</p>
          ) : results.length === 0 ? (
            <p className="p-3 text-sm text-gray-400">Không tìm thấy kết quả nào.</p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3 py-2.5 hover:bg-brand-light transition flex items-center gap-2 border-b last:border-0"
              >
                <span className="text-lg">{r.type === "set" ? "🗂️" : "🎬"}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.title}</p>
                  <p className="text-xs text-gray-400">{r.subtitle}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}