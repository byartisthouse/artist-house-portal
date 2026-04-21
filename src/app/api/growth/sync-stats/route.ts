/**
 * POST /api/growth/sync-stats
 *
 * Runs one Apify actor per platform in parallel, normalizes results,
 * and writes a stats_history row for each platform that has data.
 *
 * Body: { artistId: string }   (artist_data.id, NOT profiles.id)
 *
 * Required env vars:
 *   APIFY_API_TOKEN              — your Apify API key
 *
 * Per-platform actor IDs (set whichever platforms you have):
 *   APIFY_ACTOR_INSTAGRAM        e.g. "apify/instagram-profile-scraper"
 *   APIFY_ACTOR_TIKTOK           e.g. "clockworks/tiktok-profile-scraper"
 *   APIFY_ACTOR_YOUTUBE          e.g. "streamers/youtube-channel-scraper"
 *   APIFY_ACTOR_SPOTIFY          e.g. "maxcopell/spotify-scraper" (optional)
 *
 * V2 upgrade path: replace the scrape* functions below with direct
 * platform API calls — the route handler and DB writes stay unchanged.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── Shared Apify runner ─────────────────────────────────────────────────────

async function runActor(actorId: string, input: unknown): Promise<unknown[]> {
  const token = process.env.APIFY_API_TOKEN!;

  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }
  );
  if (!runRes.ok) throw new Error(`Apify run failed for ${actorId}: ${await runRes.text()}`);
  const { data: run } = await runRes.json() as { data: { id: string; status: string } };

  // Poll up to 90s
  let status = run.status;
  for (let i = 0; i < 18 && !['SUCCEEDED', 'FAILED', 'ABORTED'].includes(status); i++) {
    await new Promise(r => setTimeout(r, 5000));
    const s = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`);
    status = ((await s.json()) as { data: { status: string } }).data?.status;
  }
  if (status !== 'SUCCEEDED') throw new Error(`Actor ${actorId} ended with status: ${status}`);

  const dataRes = await fetch(
    `https://api.apify.com/v2/actor-runs/${run.id}/dataset/items?token=${token}&clean=true`
  );
  return await dataRes.json() as unknown[];
}

// ─── Per-platform scrapers ───────────────────────────────────────────────────
// Each returns a partial stats row or null if skipped/failed.
// Edit input shapes here if your actor version expects different field names.

interface StatsRow {
  platform: string;
  follower_count: number | null;
  listener_count: number | null;
  post_count: number | null;
  engagement_rate: number | null;
  top_post_url: string | null;
  top_post_likes: number | null;
}

async function scrapeInstagram(handle: string): Promise<StatsRow | null> {
  const actorId = process.env.APIFY_ACTOR_INSTAGRAM;
  if (!actorId || !handle) return null;
  try {
    // apify/instagram-profile-scraper input format
    const items = await runActor(actorId, { usernames: [handle] }) as Record<string, unknown>[];
    const item = items[0];
    if (!item) return null;
    return {
      platform: 'instagram',
      follower_count: (item.followersCount as number) ?? null,
      listener_count: null,
      post_count: (item.postsCount as number) ?? null,
      engagement_rate: (item.engagementRate as number) ?? null,
      top_post_url: null,
      top_post_likes: null,
    };
  } catch (e) {
    console.error('[sync] Instagram scrape failed:', e);
    return null;
  }
}

async function scrapeTikTok(handle: string): Promise<StatsRow | null> {
  const actorId = process.env.APIFY_ACTOR_TIKTOK;
  if (!actorId || !handle) return null;
  try {
    // clockworks/tiktok-profile-scraper input format
    const profiles = [`https://www.tiktok.com/@${handle.replace(/^@/, '')}`];
    const items = await runActor(actorId, { profiles }) as Record<string, unknown>[];
    const item = items[0];
    if (!item) return null;
    // Output shape varies — handle both common formats
    const stats = (item.authorStats ?? item.stats ?? item) as Record<string, unknown>;
    return {
      platform: 'tiktok',
      follower_count: (stats.followerCount as number) ?? (stats.fans as number) ?? null,
      listener_count: null,
      post_count: (stats.videoCount as number) ?? null,
      engagement_rate: null,
      top_post_url: null,
      top_post_likes: null,
    };
  } catch (e) {
    console.error('[sync] TikTok scrape failed:', e);
    return null;
  }
}

async function scrapeYouTube(handle: string): Promise<StatsRow | null> {
  const actorId = process.env.APIFY_ACTOR_YOUTUBE;
  if (!actorId || !handle) return null;
  try {
    // streamers/youtube-channel-scraper input format
    const url = handle.startsWith('http')
      ? handle
      : `https://www.youtube.com/@${handle.replace(/^@/, '')}`;
    const items = await runActor(actorId, { startUrls: [{ url }] }) as Record<string, unknown>[];
    const item = items[0];
    if (!item) return null;
    return {
      platform: 'youtube',
      follower_count: (item.subscriberCount as number) ?? null,
      listener_count: null,
      post_count: (item.videoCount as number) ?? null,
      engagement_rate: null,
      top_post_url: null,
      top_post_likes: null,
    };
  } catch (e) {
    console.error('[sync] YouTube scrape failed:', e);
    return null;
  }
}

async function scrapeSpotify(handle: string): Promise<StatsRow | null> {
  const actorId = process.env.APIFY_ACTOR_SPOTIFY;
  if (!actorId || !handle) return null;
  try {
    // Adjust input/output shape to match whichever Spotify actor you use
    const items = await runActor(actorId, { artistNames: [handle] }) as Record<string, unknown>[];
    const item = items[0];
    if (!item) return null;
    return {
      platform: 'spotify',
      follower_count: (item.monthlyListeners as number) ?? (item.followersCount as number) ?? null,
      listener_count: (item.monthlyListeners as number) ?? null,
      post_count: null,
      engagement_rate: null,
      top_post_url: null,
      top_post_likes: null,
    };
  } catch (e) {
    console.error('[sync] Spotify scrape failed:', e);
    return null;
  }
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { artistId } = await request.json() as { artistId?: string };
    if (!artistId) {
      return NextResponse.json({ error: 'artistId is required' }, { status: 400 });
    }

    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json({ error: 'APIFY_API_TOKEN is not set.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: artist, error: artistError } = await supabaseAdmin
      .from('artist_data')
      .select('instagram_handle, tiktok_handle, spotify_handle, youtube_handle')
      .eq('id', artistId)
      .single();

    if (artistError || !artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Run all configured platform scrapers in parallel
    const [instagram, tiktok, youtube, spotify] = await Promise.all([
      scrapeInstagram(artist.instagram_handle ?? ''),
      scrapeTikTok(artist.tiktok_handle ?? ''),
      scrapeYouTube(artist.youtube_handle ?? ''),
      scrapeSpotify(artist.spotify_handle ?? ''),
    ]);

    const results = [instagram, tiktok, youtube, spotify].filter(Boolean) as StatsRow[];

    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No platform actors are configured or no handles set for this artist.',
      });
    }

    const rows = results.map(r => ({
      artist_id: artistId,
      recorded_at: new Date().toISOString(),
      ...r,
    }));

    const { error: insertError } = await supabaseAdmin.from('stats_history').insert(rows);
    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({
      success: true,
      synced: rows.length,
      platforms: results.map(r => r.platform),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
