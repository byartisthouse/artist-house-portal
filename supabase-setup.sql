-- Artist House Portal — Database Setup
-- Run this in the Supabase SQL Editor

CREATE TABLE coaching_calls (
  id SERIAL PRIMARY KEY,
  date DATE,
  title TEXT NOT NULL,
  advisor TEXT,
  video_url TEXT,
  topics TEXT[],
  summary TEXT,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  label_name TEXT,
  parent_company TEXT,
  genre TEXT,
  email TEXT,
  email_confidence INTEGER,
  linkedin TEXT,
  instagram TEXT,
  twitter TEXT,
  recent_signing TEXT,
  accepts_cold TEXT DEFAULT 'Unknown',
  source TEXT,
  date_found DATE,
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sync_companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  genre TEXT,
  site TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guides (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE saved_items (
  id SERIAL PRIMARY KEY,
  member_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE outreach_status (
  id SERIAL PRIMARY KEY,
  member_id TEXT NOT NULL,
  contact_id INTEGER REFERENCES contacts(id),
  status TEXT DEFAULT 'not_contacted',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
