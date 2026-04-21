-- ============================================================
-- AUSTERE Growth Engine — Posts table migration
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS posts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id    uuid REFERENCES artist_data(id) ON DELETE CASCADE NOT NULL,
  platform     text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'spotify')),
  post_url     text,
  thumbnail_url text,
  caption      text,
  likes_count  integer,
  comments_count integer,
  views_count  integer,
  posted_at    timestamptz,
  scraped_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_artist_platform_idx
  ON posts (artist_id, platform, posted_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts: authenticated read all" ON posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "posts: service role insert" ON posts
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "posts: service role delete" ON posts
  FOR DELETE TO service_role USING (true);
