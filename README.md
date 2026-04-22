# 📚 Shelfie

Your personal cozy bookshelf — track, review, and curate the books that matter to you.

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · Supabase (Auth + Postgres)

---

## 🚀 Getting started

### 1. Clone and install

```bash
git clone <your-repo>
cd shelfie
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a **New Project** (note your database password)
3. Once the project is ready, go to **SQL Editor → New query**
4. Paste the contents of `supabase-schema.sql` and click **Run**
5. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon / public` key

### 3. Configure environment

Rename `.env.local` (already in the project) and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Enable Email Auth in Supabase

1. Go to **Authentication → Providers**
2. Make sure **Email** is enabled
3. For development, you can disable "Confirm email" under **Authentication → Settings → Email** so you can sign in immediately without checking your inbox

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're live!

---

## 🗂 Project structure

```
shelfie/
├── app/
│   ├── layout.tsx          # Root layout (fonts, global styles)
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Global styles + Tailwind
│   ├── auth/
│   │   └── page.tsx        # Sign in / Sign up
│   └── dashboard/
│       ├── layout.tsx      # Auth guard + nav wrapper
│       └── page.tsx        # Bookshelf dashboard
├── components/
│   ├── DashboardNav.tsx    # Top navigation bar
│   ├── BookshelfClient.tsx # Main shelf state & layout
│   ├── BookCard.tsx        # Individual book card
│   └── BookFormModal.tsx   # Add / edit book modal
├── lib/
│   └── supabase/
│       ├── client.ts       # Browser Supabase client
│       └── server.ts       # Server Supabase client
├── types/
│   └── index.ts            # Shared TypeScript types
├── middleware.ts            # Auth route protection
├── supabase-schema.sql     # Run this in Supabase SQL editor
└── .env.local              # Your env vars (never commit this)
```

---

## ✨ Features

- **Auth** — Email/password sign up & sign in via Supabase Auth
- **Protected routes** — Middleware redirects unauthenticated users
- **Bookshelf** — Add, edit, and delete books with a polished modal
- **Per-book fields** — Title, author, review, star rating (1–5), recommendation toggle, reading status
- **Reading status** — Track books as *Read*, *Currently reading*, or *Want to read*
- **Shelf stats** — Quick count cards for each status, click to filter
- **Row-level security** — Supabase RLS ensures users can only access their own data
- **Cozy design** — Warm parchment palette, Playfair Display + Lora typography, subtle animations

---

## 🚢 Deploying to Vercel

```bash
npm i -g vercel
vercel
```

Add your two `NEXT_PUBLIC_SUPABASE_*` environment variables in the Vercel dashboard under **Project → Settings → Environment Variables**.
# shelfie
