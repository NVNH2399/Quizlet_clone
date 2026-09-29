import ProfileCard from "./profile-card";
import SecuritySection from "./security-section";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export default async function AccountPage() {
  const { userId } = await auth();

  const [totalSets, totalCards, totalVideos] = await Promise.all([
    prisma.set.count({ where: { userId: userId! } }),
    prisma.card.count({ where: { set: { userId: userId! } } }),
    prisma.videoLesson.count({ where: { userId: userId! } }),
  ]);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Tài khoản của tôi</h1>

      <ProfileCard stats={{ totalSets, totalCards, totalVideos }} />

      <SecuritySection />
    </div>
  );
}