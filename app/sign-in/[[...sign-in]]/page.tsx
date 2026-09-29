import { SignIn } from "@clerk/nextjs";

// Tên thư mục [[...sign-in]] là "catch-all route" của Next.js —
// bắt buộc phải đặt tên này vì Clerk tự điều hướng qua nhiều bước con
// (nhập email → nhập mã OTP → ...) đều nằm trong cùng route này
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn />
    </div>
  );
}