import { getVideoProgressStats } from "@/lib/actions/video-progress";

export default async function VideoProgressPage() {
  const stats = await getVideoProgressStats();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Tiến độ Video Learning</h1>
      <p className="text-gray-400 text-sm mb-6">
        🔥 Streak: <b>{stats.streak} ngày liên tiếp</b>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Video đã tạo" value={stats.totalLessons} />
        <StatCard label="Video hoàn thành" value={stats.lessonsCompleted} highlight />
        <StatCard label="Câu đã luyện" value={stats.sentencesPracticed} />
        <StatCard label="Lượt Shadowing" value={stats.shadowingCount} />
        <StatCard
          label="Độ chính xác Shadowing TB"
          value={`${Math.round(stats.avgShadowingAccuracy * 100)}%`}
        />
        <StatCard
          label="Độ chính xác Dictation"
          value={stats.dictationTotal > 0 ? `${Math.round(stats.dictationAccuracy * 100)}%` : "—"}
        />
        <StatCard label="Lượt Dictation" value={stats.dictationTotal} />
        <StatCard label="Từ vựng đã lưu" value={stats.vocabularySaved} />
      </div>

      {stats.vocabularySaved === 0 && (
        <p className="text-xs text-gray-400 border-t pt-4">
          💡 Tính năng lưu từ vựng trực tiếp từ transcript video chưa được triển khai — chỉ số
          này sẽ luôn là 0 cho tới khi tính năng đó hoàn thành.
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className={`border rounded-2xl p-4 ${highlight ? "bg-brand-light border-brand" : "bg-white"}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? "text-brand" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}