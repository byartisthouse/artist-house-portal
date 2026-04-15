/**
 * Modular stats fetching utility.
 *
 * V1: Reads from stats_history table (populated by the Apify sync route).
 * V2: Swap only this file to call platform APIs directly — the Dashboard
 *     and Roster components import from here and remain unchanged.
 */

import { supabase } from '@/lib/supabase';
import type { GrowthPoint, PlatformStats, StatsHistory } from './types';

/** Fetch the last N weeks of history for an artist across all platforms */
export async function fetchGrowthHistory(
  artistId: string,
  weeks = 8
): Promise<{ points: GrowthPoint[]; raw: StatsHistory[] }> {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const { data, error } = await supabase
    .from('stats_history')
    .select('*')
    .eq('artist_id', artistId)
    .gte('recorded_at', since.toISOString())
    .order('recorded_at', { ascending: true });

  if (error || !data) return { points: [], raw: [] };

  // Bucket by week label, sum follower counts across platforms
  const byWeek: Record<string, { followers: number; listeners: number }> = {};
  for (const row of data as StatsHistory[]) {
    const label = new Date(row.recorded_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    if (!byWeek[label]) byWeek[label] = { followers: 0, listeners: 0 };
    byWeek[label].followers += row.follower_count ?? 0;
    byWeek[label].listeners += row.listener_count ?? 0;
  }

  const points: GrowthPoint[] = Object.entries(byWeek).map(([week, v]) => ({
    week,
    followers: v.followers,
    listeners: v.listeners,
  }));

  return { points, raw: data as StatsHistory[] };
}

/** Latest stats per platform for the stat cards */
export async function fetchPlatformStats(artistId: string): Promise<PlatformStats[]> {
  // Get the two most recent rows per platform to calculate weekly change
  const { data } = await supabase
    .from('stats_history')
    .select('*')
    .eq('artist_id', artistId)
    .order('recorded_at', { ascending: false })
    .limit(20);

  if (!data || data.length === 0) return [];

  const rows = data as StatsHistory[];
  const platforms = [...new Set(rows.map(r => r.platform))];

  return platforms.map(platform => {
    const platformRows = rows.filter(r => r.platform === platform);
    const latest = platformRows[0];
    const previous = platformRows[1];

    const current = latest.follower_count ?? 0;
    const prev = previous?.follower_count ?? current;
    const weeklyGrowth = current - prev;
    const weeklyGrowthPct = prev > 0 ? (weeklyGrowth / prev) * 100 : 0;

    return {
      platform,
      followers: current,
      weeklyGrowth,
      weeklyGrowthPct,
      engagementRate: latest.engagement_rate,
      topPostLikes: latest.top_post_likes,
      topPostUrl: latest.top_post_url,
    };
  });
}

/** Total followers across all platforms (latest snapshot) */
export async function fetchTotalFollowers(artistId: string): Promise<number> {
  const stats = await fetchPlatformStats(artistId);
  return stats.reduce((sum, s) => sum + s.followers, 0);
}
