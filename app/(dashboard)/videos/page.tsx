import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function VideosPage() {
  const { userId } = await auth();

  const lessons = await prisma.videoLesson.findMany({
    where: { userId: userId! },
    orderBy: { createdAt: "desc" },
    include: { sentences: { select: { id: true } } },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Video Learning</h1>
        <div className="flex gap-2">
          <Link
            href="/videos/progress"
            className="border rounded-full px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
          >
            📊 Tiến độ
          </Link>
          <Link
            href="/videos/new"
            className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand-dark"
          >
            + Thêm video
          </Link>
        </div>
      </div>

      {lessons.length === 0 ? (
        <p className="text-gray-400 text-sm">
          Chưa có video nào. Thêm video kèm transcript để bắt đầu luyện Shadowing.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/videos/${lesson.id}`}
              className="border rounded-2xl p-4 bg-white hover:border-brand hover:shadow-md transition"
            >
              {lesson.level && (
                <span className="text-xs font-semibold text-brand bg-brand-light px-2 py-1 rounded-full">
                  {lesson.level}
                </span>
              )}
              <h2 className="font-bold mt-2">{lesson.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{lesson.sentences.length} câu</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}