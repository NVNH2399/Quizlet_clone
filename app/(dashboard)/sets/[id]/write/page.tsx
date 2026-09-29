import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CreateWriteExercise from "./create-exercise";
import Link from "next/link";

export default async function WriteListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const set = await prisma.set.findUnique({ where: { id } });
  if (!set) notFound();

  const exercises = await prisma.writingExercise.findMany({
    where: { setId: id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Luyện Viết</h1>

      <CreateWriteExercise setId={id} language={set.language} />

      <div className="space-y-2 mt-6">
        {exercises.map((ex) => (
          <Link
            key={ex.id}
            href={`/sets/${id}/write/${ex.id}`}
            className="block border rounded-xl p-4 bg-white hover:border-brand"
          >
            <span className="text-xs text-gray-400">
              {ex.type === "ERROR_CORRECTION" ? "Tìm lỗi sai" : "Viết tự do"}
            </span>
            <h2 className="font-semibold">{ex.title}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}