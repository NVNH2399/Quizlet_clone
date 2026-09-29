import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ReadingListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  const set = await prisma.set.findUnique({ where: { id } });
  if (!set) notFound();
  const isOwner = set.userId === userId;

  const passages = await prisma.readingPassage.findMany({
    where: { setId: id },
    include: { questions: { select: { id: true } } },
    orderBy: { id: "asc" },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bài đọc</h1>
        {isOwner && (
          <div className="flex gap-2">
            <Link
              href={`/sets/${id}/reading/new`}
              className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand-dark"
            >
              + Tạo thủ công
            </Link>
            <Link
              href={`/sets/${id}/reading/new-ai`}
              className="border border-brand text-brand text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand-light"
            >
              ✨ AI tạo từ đoạn văn có sẵn
            </Link>
          </div>
        )}
      </div>

      {passages.length === 0 ? (
        <p className="text-gray-400 text-sm">
          Chưa có bài đọc nào trong bộ từ vựng này.
        </p>
      ) : (
        <div className="space-y-3">
          {passages.map((passage) => (
            <Link
              key={passage.id}
              href={`/sets/${id}/reading/${passage.id}`}
              className="block border rounded-xl p-4 bg-white hover:border-brand hover:shadow-sm transition"
            >
              <h2 className="font-semibold">{passage.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {passage.questions.length} câu hỏi
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
