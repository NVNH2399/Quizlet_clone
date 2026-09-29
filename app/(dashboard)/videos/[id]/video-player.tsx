"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { extractYouTubeId } from "@/lib/video-utils";
import WordLookupModal from "./word-lookup-modal";


type Sentence = {
  id: string;
  text: string;
  translation: string | null;
  startTime: number;
  endTime: number;
  order: number;
};

type Lesson = {
  id: string;
  title: string;
  videoUrl: string;
  videoSource: string;
  language: string;
  sentences: Sentence[];
};

// Khai báo type tối thiểu cho YouTube IFrame API — thư viện chưa có type chuẩn trong TypeScript
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({ lesson }: { lesson: Lesson }) {
  const playerRef = useRef<any>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const youtubeId = lesson.videoSource === "YOUTUBE" ? extractYouTubeId(lesson.videoUrl) : null;

  // Nạp YouTube IFrame API 1 lần duy nhất, tạo player khi API sẵn sàng
  useEffect(() => {
    if (!youtubeId) return;

    function createPlayer() {
      playerRef.current = new window.YT.Player("youtube-player", {
        videoId: youtubeId,
        events: {
          onReady: () => setPlayerReady(true),
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = createPlayer;
    }
  }, [youtubeId]);

  // Poll thời gian phát mỗi 300ms để tự highlight câu đang phát —
  // YouTube IFrame API không có sự kiện "timeupdate" như thẻ <video> thường, phải tự poll
  useEffect(() => {
    if (!playerReady) return;

    const interval = setInterval(() => {
      const time = playerRef.current?.getCurrentTime?.();
      if (time == null) return;

      const idx = lesson.sentences.findIndex(
        (s) => time >= s.startTime && time < s.endTime
      );
      if (idx !== -1 && idx !== currentSentenceIndex) {
        setCurrentSentenceIndex(idx);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [playerReady, lesson.sentences, currentSentenceIndex]);

  // Với video upload trực tiếp (không phải YouTube), dùng thẻ <video> thường thay vì iframe
  useEffect(() => {
    if (lesson.videoSource !== "UPLOAD" || !videoElRef.current) return;

    const video = videoElRef.current;
    function handleTimeUpdate() {
      const time = video.currentTime;
      const idx = lesson.sentences.findIndex((s) => time >= s.startTime && time < s.endTime);
      if (idx !== -1 && idx !== currentSentenceIndex) setCurrentSentenceIndex(idx);
    }

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [lesson.videoSource, lesson.sentences, currentSentenceIndex]);

  function seekTo(sentence: Sentence) {
    if (lesson.videoSource === "YOUTUBE" && playerRef.current) {
      playerRef.current.seekTo(sentence.startTime, true);
      playerRef.current.playVideo();
    } else if (videoElRef.current) {
      videoElRef.current.currentTime = sentence.startTime;
      videoElRef.current.play();
    }
  }

  function playCurrentSentence() {
    seekTo(lesson.sentences[currentSentenceIndex]);
  }

  function goToPrevious() {
    if (currentSentenceIndex > 0) {
      const idx = currentSentenceIndex - 1;
      setCurrentSentenceIndex(idx);
      seekTo(lesson.sentences[idx]);
    }
  }

  function goToNext() {
    if (currentSentenceIndex < lesson.sentences.length - 1) {
      const idx = currentSentenceIndex + 1;
      setCurrentSentenceIndex(idx);
      seekTo(lesson.sentences[idx]);
    }
  }

  const currentSentence = lesson.sentences[currentSentenceIndex];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
  <h1 className="text-xl font-bold">{lesson.title}</h1>
  <Link
    href={`/videos/${lesson.id}/quiz`}
    className="border border-brand text-brand text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand-light"
  >
    📝 Làm Quiz
  </Link>
</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột trái — Video player */}
        <div>
          {lesson.videoSource === "YOUTUBE" ? (
            <div id="youtube-player" className="w-full aspect-video rounded-xl overflow-hidden" />
          ) : (
            <video
              ref={videoElRef}
              src={lesson.videoUrl}
              controls
              className="w-full aspect-video rounded-xl bg-black"
            />
          )}

          {/* Câu hiện tại — từng từ bấm được để tra nghĩa */}
          <div className="border rounded-xl p-4 mt-4 bg-white">
            <p className="text-lg font-medium leading-relaxed">
              {currentSentence?.text.split(" ").map((word, i) => (
                <span key={i}>
                  <button
                    onClick={() => setSelectedWord(word.replace(/[.,!?;:"']/g, ""))}
                    className="hover:bg-brand-light hover:text-brand rounded px-0.5 transition"
                  >
                    {word}
                  </button>{" "}
                </span>
              ))}
            </p>
            {currentSentence?.translation && (
              <p className="text-sm text-gray-500 mt-1">{currentSentence.translation}</p>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={goToPrevious}
                disabled={currentSentenceIndex === 0}
                className="border rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
              >
                ← Câu trước
              </button>
              <button
                onClick={playCurrentSentence}
                className="border rounded-lg px-3 py-1.5 text-sm hover:border-brand hover:text-brand"
              >
                🔁 Nghe lại
              </button>
              <button
                onClick={goToNext}
                disabled={currentSentenceIndex === lesson.sentences.length - 1}
                className="border rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Câu sau →
              </button>
            </div>

            {/* Điều hướng sang Shadowing / Dictation cho câu đang chọn */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Link
                href={`/videos/${lesson.id}/shadowing/${currentSentence?.id}`}
                className="block text-center bg-brand text-white rounded-full py-2 text-sm font-semibold"
              >
                🎤 Shadowing
              </Link>
              <Link
                href={`/videos/${lesson.id}/dictation/${currentSentence?.id}`}
                className="block text-center border border-brand text-brand rounded-full py-2 text-sm font-semibold"
              >
                ✍️ Điền từ
              </Link>
            </div>
          </div>
        </div>

        {/* Cột phải — Transcript đầy đủ, click để nhảy tới câu */}
        <div className="border rounded-xl bg-white max-h-[500px] overflow-y-auto">
          {lesson.sentences.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                setCurrentSentenceIndex(i);
                seekTo(s);
              }}
              className={`w-full text-left p-3 border-b text-sm transition ${
                i === currentSentenceIndex ? "bg-brand-light text-brand font-medium" : "hover:bg-gray-50"
              }`}
            >
              {s.text}
            </button>
          ))}
        </div>
      </div>

      {/* Modal tra từ + lưu vào bộ từ vựng */}
      {selectedWord && currentSentence && (
        <WordLookupModal
          word={selectedWord}
          language={lesson.language}
          sentenceId={currentSentence.id}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}