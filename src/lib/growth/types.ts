export type Role = 'Artist' | 'Coach' | 'Admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
}

export interface ArtistData {
  id: string;
  user_id: string;
  spotify_handle: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  artist_goals: string | null;
  current_stats: Record<string, unknown>;
  updated_at: string;
}

export interface StatsHistory {
  id: string;
  artist_id: string;
  platform: 'instagram' | 'tiktok' | 'spotify' | 'youtube';
  follower_count: number | null;
  listener_count: number | null;
  post_count: number | null;
  engagement_rate: number | null;
  top_post_url: string | null;
  top_post_likes: number | null;
  recorded_at: string;
}

export interface Task {
  id: string;
  artist_id: string;
  coach_id: string | null;
  title: string;
  description: string | null;
  status: 'Todo' | 'In-Progress' | 'Done';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  artist_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Pick<Profile, 'full_name' | 'role'>;
}

// Chart-ready data point
export interface GrowthPoint {
  week: string;       // e.g. "Apr 1"
  followers: number;
  listeners: number;
}

// Aggregated per-platform summary
export interface PlatformStats {
  platform: string;
  followers: number;
  weeklyGrowth: number;      // absolute change
  weeklyGrowthPct: number;   // percentage change
  engagementRate: number | null;
  topPostLikes: number | null;
  topPostUrl: string | null;
}
