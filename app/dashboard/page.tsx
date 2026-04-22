import { createClient } from "@/lib/supabase/server";
import { Book, Reaction } from "@/types";
import BookshelfClient from "@/components/BookshelfClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: books } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const bookIds = (books ?? []).map((b) => b.id);
  const { data: reactions } = bookIds.length
    ? await supabase.from("reactions").select("*").in("book_id", bookIds)
    : { data: [] };

  return (
    <BookshelfClient
      initialBooks={(books ?? []) as Book[]}
      initialReactions={(reactions ?? []) as Reaction[]}
      userId={user!.id}
    />
  );
}
