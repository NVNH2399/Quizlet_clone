import { getDashboardStats } from "@/lib/actions/dashboard";
import Link from "next/link";

const SKILL_LABELS: Record<string, string> = {
  FLASHCARD: "Flashcard",
  LISTENING: "Nghe",
  WRITING: "Viết",
  SPEAKING: "Nói",
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tổng quan</h1>

      {/* Hàng thẻ thống kê tổng quát */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Bộ từ vựng</p>
          <p className="text-3xl font-bold">{stats.totalSets}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Tổng số thẻ</p>
          <p className="text-3xl font-bold">{stats.totalCards}</p>
        </div>
        <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
          <p className="text-sm text-orange-700">Cần ôn hôm nay</p>
          <p className="text-3xl font-bold text-orange-700">{stats.dueToday}</p>
        </div>
      </div>

      {/* Tiến độ theo từng kỹ năng */}
      <h2 className="font-semibold mb-3">Tiến độ theo kỹ năng</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {Object.entries(stats.masteredBySkill).map(([skill, count]) => {
          // Tính % so với tổng số thẻ, tránh chia cho 0 khi user chưa có thẻ nào
          const percent =
            stats.totalCards > 0 ? Math.round((count / stats.totalCards) * 100) : 0;

          return (
            <div key={skill} className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">{SKILL_LABELS[skill]}</p>
              <p className="text-2xl font-bold">{count}</p>
              <div className="h-1.5 bg-gray-200 rounded mt-2">
                <div
                  className="h-1.5 bg-blue-600 rounded"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{percent}% đã thuộc</p>
            </div>
          );
        })}
      </div>

      {/* Hoạt động gần đây */}
      <h2 className="font-semibold mb-3">Hoạt động gần đây</h2>
      {stats.recentAttempts.length === 0 ? (
        <p className="text-gray-400 text-sm">Chưa có hoạt động nào.</p>
      ) : (
        <div className="space-y-2">
          {stats.recentAttempts.map((attempt) => (
            <div
              key={attempt.id}
              className="border rounded p-3 flex justify-between items-center text-sm"
            >
              <span>
                {SKILL_LABELS[attempt.skill]} — <b>{attempt.card.term}</b>
              </span>
              <span className={attempt.isCorrect ? "text-green-600" : "text-red-600"}>
                {attempt.isCorrect ? "✓ Đúng" : "✗ Sai"}
              </span>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/sets"
        className="inline-block mt-8 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Xem tất cả bộ từ vựng
      </Link>
    </div>
  );
}