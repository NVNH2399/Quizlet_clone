"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVideoLesson } from "@/lib/actions/video";
import { isYouTubeUrl, formatTime } from "@/lib/video-utils";

type SentenceDraft = { text: string; translation: string; startTime: string; endTime: string };

function emptySentence(): SentenceDraft {
  return { text: "", translation: "", startTime: "", endTime: "" };
}

export default function NewVideoForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("en");
  const [sentences, setSentences] = useState<SentenceDraft[]>([emptySentence()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const urlLooksValid = videoUrl.trim() === "" || isYouTubeUrl(videoUrl) || videoUrl.startsWith("http");

  function updateSentence(index: number, patch: Partial<SentenceDraft>) {
    setSentences((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSentence() {
    // Gợi ý startTime mới = endTime của câu trước, cho nhanh khi nhập tay theo video
    const last = sentences[sentences.length - 1];
    const suggestedStart = last?.endTime || "";
    setSentences((prev) => [...prev, { ...emptySentence(), startTime: suggestedStart }]);
  }

  function removeSentence(index: number) {
    setSentences((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError("");

    const parsedSentences = sentences.map((s) => ({
      text: s.text.trim(),
      translation: s.translation.trim(),
      startTime: parseFloat(s.startTime) || 0,
      endTime: parseFloat(s.endTime) || 0,
    }));

    if (parsedSentences.some((s) => !s.text)) {
      setError("Có câu chưa nhập nội dung");
      return;
    }

    setLoading(true);
    try {
      const id = await createVideoLesson(
        { title, description, videoUrl, level, category, language },
        parsedSentences
      );
      router.push(`/videos/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Thêm video học</h1>

      {/* Thông tin cơ bản */}
      <div className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề video"
          className="w-full border rounded-lg p-2"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả (không bắt buộc)"
          rows={2}
          className="w-full border rounded-lg p-2"
        />

        <div>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Dán URL YouTube (vd: https://www.youtube.com/watch?v=...)"
            className="w-full border rounded-lg p-2"
          />
          {!urlLooksValid && (
            <p className="text-xs text-orange-500 mt-1">URL chưa đúng định dạng</p>
          )}
        </div>

        {/* Placeholder cho upload file trực tiếp — cần BLOB_READ_WRITE_TOKEN */}
        <div className="border border-dashed rounded-lg p-3 text-sm text-gray-400 bg-gray-50">
          📤 Upload file video trực tiếp — <b>chưa khả dụng</b>, cần cấu hình Vercel Blob token.
          Hiện tại chỉ dùng được URL YouTube ở trên.
        </div>

        <div className="grid grid-cols-3 gap-2">
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="border rounded-lg p-2 text-sm">
            <option value="">Trình độ</option>
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Chủ đề (vd: Du lịch)"
            className="border rounded-lg p-2 text-sm"
          />
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border rounded-lg p-2 text-sm">
            <option value="en">Tiếng Anh</option>
            <option value="zh">Tiếng Trung</option>
          </select>
        </div>
      </div>

      {/* Transcript theo từng câu */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Transcript (chia theo câu)</h2>
          <p className="text-xs text-gray-400">
            Nhập thời gian bắt đầu/kết thúc (giây) khớp với video, dùng để đồng bộ khi phát
          </p>
        </div>

        {sentences.map((s, i) => (
          <div key={i} className="border rounded-xl p-3 space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Câu {i + 1}</span>
              {sentences.length > 1 && (
                <button onClick={() => removeSentence(i)} className="text-red-500 text-xs">
                  Xóa
                </button>
              )}
            </div>
            <input
              value={s.text}
              onChange={(e) => updateSentence(i, { text: e.target.value })}
              placeholder="Nội dung câu (tiếng Anh/Trung)"
              className="w-full border rounded p-2 text-sm"
            />
            <input
              value={s.translation}
              onChange={(e) => updateSentence(i, { translation: e.target.value })}
              placeholder="Nghĩa tiếng Việt (không bắt buộc)"
              className="w-full border rounded p-2 text-sm"
            />
            <div className="flex gap-2 items-center text-sm">
              <input
                type="number"
                step="0.1"
                value={s.startTime}
                onChange={(e) => updateSentence(i, { startTime: e.target.value })}
                placeholder="Bắt đầu (giây)"
                className="w-full border rounded p-2"
              />
              <span className="text-gray-300">→</span>
              <input
                type="number"
                step="0.1"
                value={s.endTime}
                onChange={(e) => updateSentence(i, { endTime: e.target.value })}
                placeholder="Kết thúc (giây)"
                className="w-full border rounded p-2"
              />
              {s.startTime && (
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatTime(parseFloat(s.startTime) || 0)}
                </span>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={addSentence}
          className="w-full border-2 border-dashed rounded-xl p-3 text-sm text-gray-500 hover:border-brand hover:text-brand"
        >
          + Thêm câu
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-brand text-white px-6 py-2.5 rounded-full font-semibold disabled:opacity-50"
      >
        {loading ? "Đang tạo..." : "Tạo video học"}
      </button>
    </div>
  );
}