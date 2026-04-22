import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-dark-bg">
      <DashboardNav email={user.email ?? ""} />
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        {children}
      </main>
    </div>
  );
}
