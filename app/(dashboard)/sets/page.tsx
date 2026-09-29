import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function SetsPage() {
  const { userId } = await auth();

  const sets = await prisma.set.findMany({
    where: { userId: userId! },
    orderBy: { createdAt: "desc" },
    include: { cards: { select: { id: true } } }, // chỉ lấy id để đếm số thẻ, đỡ tốn dữ liệu
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-6">
  {sets.map((set) => (
    <Link
      key={set.id}
      href={`/sets/${set.id}`}
      className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-brand transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-brand bg-brand-light px-2 py-1 rounded-full">
          {set.language === "en" ? "Tiếng Anh" : "Tiếng Trung"}
        </span>
      </div>
      <h2 className="font-bold text-lg text-gray-900 group-hover:text-brand line-clamp-2">
        {set.title}
      </h2>
      <p className="text-sm text-gray-500 mt-2">{set.cards.length} thuật ngữ</p>
    </Link>
  ))}
</div>
  );
}