import { syncUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await syncUser();
  if (!user) redirect("/sign-in");

return (
  <>
    <Navbar />
    <main className="max-w-6xl mx-auto">{children}</main>
  </>
)};