"use client";

import { UserProfile } from "@clerk/nextjs";
import { useState } from "react";

export default function SecuritySection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-2xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 font-semibold"
      >
        <span>🔒 Bảo mật & đăng nhập</span>
        <span className="text-gray-400 text-sm">{open ? "Thu gọn ▲" : "Mở rộng ▼"}</span>
      </button>

      {open && (
        <div className="border-t">
          <UserProfile
            routing="hash"
            appearance={{
              variables: {
                colorPrimary: "#4255ff", // khớp màu --quizlet-blue trong globals.css
                colorForeground: "#1f2937",
                borderRadius: "0.75rem",
                fontFamily: "Inter, -apple-system, sans-serif",
              },
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-none w-full",
                navbar: "hidden", // ẩn sidebar mặc định của Clerk, chỉ hiện nội dung
                navbarMobileMenuButton: "hidden",
                pageScrollBox: "p-0",
              },
            }}
          />
        </div>
      )}
    </div>
  );
}