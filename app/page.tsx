import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Học từ vựng theo cách của bạn</h1>
      <p className="text-gray-500 max-w-md mb-8">
        Flashcard, Nghe, Viết, Nói, Đọc — 5 kỹ năng, 1 hệ thống ôn tập thông minh dựa trên
        spaced repetition.
      </p>

      <Show when="signed-out">
        <div className="flex gap-3">
          <SignInButton>
            <button className="border border-gray-300 rounded px-6 py-3 font-medium">
              Đăng nhập
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="bg-blue-600 text-white rounded px-6 py-3 font-medium">
              Bắt đầu miễn phí
            </button>
          </SignUpButton>
        </div>
      </Show>

      <Show when="signed-in">
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white rounded px-6 py-3 font-medium"
        >
          Vào Dashboard
        </Link>
      </Show>
    </div>
  );
}