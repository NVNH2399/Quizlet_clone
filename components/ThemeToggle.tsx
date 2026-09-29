"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Tránh hiển thị sai icon trước khi next-themes xác định được theme thật từ localStorage
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9 flex items-center justify-center rounded-full border hover:border-brand transition"
      aria-label="Chuyển giao diện sáng/tối"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}