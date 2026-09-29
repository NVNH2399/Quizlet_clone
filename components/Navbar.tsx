import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">
        <Link href="/dashboard" className="text-xl font-extrabold text-brand shrink-0">
          Quizlet<span className="text-gray-800">Clone</span>
        </Link>

        <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600 shrink-0">
          <Link href="/dashboard" className="hover:text-brand">Trang chủ</Link>
          <Link href="/sets" className="hover:text-brand">Bộ từ vựng</Link>
          <Link href="/videos" className="hover:text-brand">Video Learning</Link>
        </div>

        <SearchBar />

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/sets/new"
            className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand-dark transition"
          >
            + Tạo mới
          </Link>
          <Link href="/account" className="text-sm text-gray-600 hover:text-brand hidden md:block">
            Tài khoản
          </Link>
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </nav>
  );
}