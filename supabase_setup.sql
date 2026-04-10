-- ============================================================
-- EDUSHARE — SUPABASE SQL SETUP
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────
-- 1. PROFILES TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, created_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────
-- 2. ITEMS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  subject    TEXT,
  category   TEXT DEFAULT 'Other',
  condition  TEXT DEFAULT 'Good',
  price      NUMERIC(10, 2),
  location   TEXT,
  status     TEXT DEFAULT 'available' CHECK (status IN ('available', 'requested', 'borrowed')),
  image_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS items_user_id_idx ON public.items(user_id);
CREATE INDEX IF NOT EXISTS items_category_idx ON public.items(category);
CREATE INDEX IF NOT EXISTS items_status_idx   ON public.items(status);


-- ─────────────────────────────────────────
-- 3. POSTS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  category   TEXT DEFAULT 'Academics',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_user_id_idx  ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS posts_category_idx ON public.posts(category);


-- ─────────────────────────────────────────
-- 4. UPVOTES TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.upvotes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)  -- Enforce 1 upvote per user per post
);

CREATE INDEX IF NOT EXISTS upvotes_post_id_idx ON public.upvotes(post_id);
CREATE INDEX IF NOT EXISTS upvotes_user_id_idx ON public.upvotes(user_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- ─────────────────────────────────────────
-- PROFILES RLS
-- ─────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read profiles
CREATE POLICY "profiles: public read"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only owner can insert/update their profile
CREATE POLICY "profiles: owner insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- ─────────────────────────────────────────
-- ITEMS RLS
-- ─────────────────────────────────────────
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view all items
CREATE POLICY "items: public read"
  ON public.items FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only owner can insert their items
CREATE POLICY "items: owner insert"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only owner can update their items
CREATE POLICY "items: owner update"
  ON public.items FOR UPDATE
  USING (auth.uid() = user_id);

-- Only owner can delete their items
CREATE POLICY "items: owner delete"
  ON public.items FOR DELETE
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────
-- POSTS RLS
-- ─────────────────────────────────────────
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts: public read"
  ON public.posts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "posts: owner insert"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts: owner update"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "posts: owner delete"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────
-- UPVOTES RLS
-- ─────────────────────────────────────────
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "upvotes: public read"
  ON public.upvotes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "upvotes: owner insert"
  ON public.upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "upvotes: owner delete"
  ON public.upvotes FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- STORAGE SETUP (run after creating the bucket in dashboard)
-- ============================================================

-- After creating a public bucket named "item-images" in Supabase Storage:

INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "storage: authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone authenticated to view images
CREATE POLICY "storage: public read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'item-images');

-- Allow owners to delete their images
CREATE POLICY "storage: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);
