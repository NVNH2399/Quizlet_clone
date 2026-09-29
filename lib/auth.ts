import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";

// Đồng bộ user từ Clerk vào DB nội bộ.
// Dùng upsert (update nếu đã tồn tại, create nếu chưa) để hàm này
// gọi lại bao nhiêu lần cũng an toàn, không lo tạo trùng.
export async function syncUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const user = await prisma.user.upsert({
    where: { id: clerkUser.id },
    update: {
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name: clerkUser.fullName ?? undefined,
      avatarUrl: clerkUser.imageUrl,
    },
    create: {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name: clerkUser.fullName ?? undefined,
      avatarUrl: clerkUser.imageUrl,
    },
  });

  return user;
}