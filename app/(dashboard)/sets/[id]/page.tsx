import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import BulkAddForm from "./bulk-add-form";
import SkillNav from "@/components/SkillNav";
import { deleteCard } from "@/lib/actions/card";

const PAGE_SIZE = 20; // số thẻ hiển thị mỗi trang

export default async function SetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const { userId } = await auth();

  // Lấy số trang từ URL, mặc định trang 1, chặn giá trị âm/không hợp lệ
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const set = await prisma.set.findUnique({ where: { id } });
  if (!set) notFound();
  const isOwner = set.userId === userId;

  // Đếm tổng số thẻ + lấy đúng 20 thẻ của trang hiện tại, chạy song song
  const [totalCards, cards] = await Promise.all([
    prisma.card.count({ where: { setId: id } }),
    prisma.card.findMany({
      where: { setId: id },
      orderBy: { order: "asc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCards / PAGE_SIZE));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header thông tin Set */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-brand bg-brand-light px-2 py-1 rounded-full">
          {set.language === "en" ? "Tiếng Anh" : "Tiếng Trung"}
        </span>
      </div>
      <h1 className="text-2xl font-bold">{set.title}</h1>
      {set.description && <p className="text-gray-500 mt-1">{set.description}</p>}
      <p className="text-gray-400 text-sm mt-1">{totalCards} thẻ</p>

      {/* Điều hướng vào từng kỹ năng học */}
      {isOwner && <SkillNav setId={id} />}

      {/* Form thêm nhiều thẻ cùng lúc */}
      {isOwner && <BulkAddForm setId={id} />}

      {/* Danh sách thẻ trong set — có phân trang */}
      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="font-semibold">Danh sách thẻ</h2>
        <span className="text-sm text-gray-400">
          Trang {currentPage}/{totalPages}
        </span>
      </div>

      {cards.length === 0 ? (
        <p className="text-gray-400 text-sm">Chưa có thẻ nào, thêm thẻ ở form phía trên.</p>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className="border rounded-xl p-4 flex justify-between items-center bg-white"
            >
              <div>
                <p className="font-medium">{card.term}</p>
                <p className="text-gray-600 text-sm">{card.definition}</p>
                {card.example && (
                  <p className="text-gray-400 text-xs italic mt-1">{card.example}</p>
                )}
              </div>
              {isOwner && (
                <form action={deleteCard.bind(null, card.id, id)}>
                  <button type="submit" className="text-red-500 text-sm hover:underline">
                    Xóa
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Điều khiển phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Link
            href={`/sets/${id}?page=${currentPage - 1}`}
            aria-disabled={currentPage <= 1}
            className={`px-3 py-1.5 rounded-lg border text-sm ${
              currentPage <= 1
                ? "pointer-events-none opacity-40"
                : "hover:border-brand hover:text-brand"
            }`}
          >
            ← Trước
          </Link>

          {/* Hiện số trang, tối đa 7 nút để không tràn màn hình khi có quá nhiều trang */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPages ||
                (p >= currentPage - 1 && p <= currentPage + 1)
            )
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-2">
                {/* Chèn dấu "..." nếu số trang bị nhảy cách quãng */}
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-gray-300">...</span>
                )}
                <Link
                  href={`/sets/${id}?page=${p}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                    p === currentPage
                      ? "bg-brand text-white font-semibold"
                      : "border hover:border-brand hover:text-brand"
                  }`}
                >
                  {p}
                </Link>
              </span>
            ))}

          <Link
            href={`/sets/${id}?page=${currentPage + 1}`}
            aria-disabled={currentPage >= totalPages}
            className={`px-3 py-1.5 rounded-lg border text-sm ${
              currentPage >= totalPages
                ? "pointer-events-none opacity-40"
                : "hover:border-brand hover:text-brand"
            }`}
          >
            Sau →
          </Link>
        </div>
      )}
    </div>
  );
}