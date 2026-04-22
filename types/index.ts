export type ReadingStatus = "read" | "reading" | "want-to-read";

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  review: string;
  rating: number;
  recommended: boolean;
  status: ReadingStatus;
  cover_color: string;
  cover_url: string | null;
  // Progress
  progress_type: "pages" | "percent" | null;
  current_page: number | null;
  total_pages: number | null;
  progress_percent: number | null;
  // Metadata
  date_finished: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type BookFormData = Omit<Book, "id" | "user_id" | "created_at" | "updated_at">;

export type FriendshipStatus = "pending" | "accepted" | "declined";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_color: string | null;
  created_at: string;
}

export interface FriendWithProfile {
  friendship_id: string;
  status: FriendshipStatus;
  direction: "sent" | "received";
  profile: Profile;
}

export type ReactionEmoji = "👍" | "❤️" | "🤩";

export interface Reaction {
  id: string;
  book_id: string;
  user_id: string;
  emoji: ReactionEmoji;
  created_at: string;
}

export interface BookWithReactions extends Book {
  reactions: Reaction[];
}
