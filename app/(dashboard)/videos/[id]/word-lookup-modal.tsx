"use client";

import { useEffect, useState } from "react";
import { lookupWord } from "@/lib/ai";
import { getUserSetsForLanguage, saveWordToSet } from "@/lib/actions/video-vocabulary";

type WordInfo = { meaning: string; pronunciation: string; example: string };
type SetOption = { id: string; title: string };

export default function WordLookupModal({
  word,
  language,
  sentenceId,
  onClose,
}: {
  word: string;
  language: string;
  sentenceId: string;
  onClose: () => void;
}) {
  const [info, setInfo] = useState<WordInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sets, setSets] = useState<SetOption[]>([]);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Tra từ + lấy danh sách Set song song ngay khi mở modal
  useEffect(() => {
    setLoading(true);
    setSaved(false);
    Promise.all([lookupWord(word, language), getUserSetsForLanguage(language)]).then(
      ([wordInfo, userSets]) => {
        setInfo(wordInfo);
        setSets(userSets);
        setSelectedSetId(userSets[0]?.id ?? "");
        setLoading(false);
      }
    );
  }, [word, language]);

  async function handleSave() {
    if (!selectedSetId || !info) return;
    setSaving(true);
    await saveWordToSet({
      sentenceId,
      setId: selectedSetId,
      term: word,
      definition: info.meaning,
      example: info.example,
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-5 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">{word}</h3>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">
            ×
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Đang tra từ...</p>
        ) : info ? (
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-500 italic">{info.pronunciation}</p>
            <p className="text-sm">{info.meaning}</p>
            <p className="text-sm text-gray-400 border-l-2 pl-2">{info.example}</p>
          </div>
        ) : (
          <p className="text-sm text-red-500">Không tra được từ này.</p>
        )}

        {!loading && info && (
          <>
            {sets.length === 0 ? (
              <p className="text-xs text-orange-500 mb-2">
                Bạn chưa có bộ từ vựng nào cho ngôn ngữ này — tạo 1 bộ trước đã.
              </p>
            ) : (
              <select
                value={selectedSetId}
                onChange={(e) => setSelectedSetId(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm mb-2"
              >
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleSave}
              disabled={saving || sets.length === 0 || saved}
              className="w-full bg-brand text-white rounded-full py-2 text-sm font-semibold disabled:opacity-50"
            >
              {saved ? "✓ Đã lưu" : saving ? "Đang lưu..." : "Lưu vào bộ từ vựng"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}