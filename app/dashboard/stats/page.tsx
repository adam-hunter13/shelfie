import { createClient } from "@/lib/supabase/server";
import StatsClient from "@/components/StatsClient";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const year = new Date().getFullYear();

  const [{ data: books }, { data: goal }] = await Promise.all([
    supabase
      .from("books")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("reading_goals")
      .select("*")
      .eq("user_id", user!.id)
      .eq("year", year)
      .maybeSingle(),
  ]);

  return (
    <StatsClient
      books={books ?? []}
      goal={goal}
      userId={user!.id}
      year={year}
    />
  );
}
