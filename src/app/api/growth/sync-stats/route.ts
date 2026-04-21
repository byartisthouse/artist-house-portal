/**
 * POST /api/growth/sync-stats
 *
 * Runs one Apify actor per platform in parallel, normalizes results,
 * writes stats_history rows and refreshes the posts table.
 *
 * Body: { artistId: string }   (artist_data.id, NOT profiles.id)
 *
 * Required env vars:
 *   APIFY_API_TOKEN              — your Apify API key
 *   SUPABASE_SERVICE_ROLE_KEY    — bypasses RLS for server writes
 *
 * Per-platform actor IDs (set whichever platforms you have):
 *   APIFY_ACTOR_INSTAGRAM        e.g. "apify/instagram-profile-scraper"
 *   APIFY_ACTOR_TIKTOK           e.g. "clockworks/tiktok-profile-scraper"
 *   APIFY_ACTOR_YOUTUBE          e.g. "streamers/youtube-channel-scraper"
 *   APIFY_ACTOR_SPOTIFY          e.g. "maxcopell/spotify-scraper" (optional)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── Shared Apify runner ─────────────────────────────────────────────────────

async function runActor(actorId: string, input: unknown): Promise<Record<string, unknown>[]> {
  const token = process.env.APIFY_API_TOKEN!;

  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId.replace('/', '~')}/runs?token=${token}`,
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
  return await dataRes.json() as Record<string, unknown>[];
}

// ─── Shared types ─────────────────────────────────────────────────────────────

interface StatsRow {
  platform: string;
  follower_count: number | null;
  listener_count: number | null;
  post_count: number | null;
  engagement_rate: number | null;
  top_post_url: string | null;
  top_post_likes: number | null;
}

interface PostRow {
  platform: string;
  post_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  likes_count: number | null;
  comments_count: number | null;
  views_count: number | null;
  posted_at: string | null;
}

interface ScrapeResult {
  stats: StatsRow;
  posts: PostRow[];
}

// ─── Instagram ────────────────────────────────────────────────────────────────
// Actor: apify/instagram-profile-scraper
// Output: profile item with nested latestPosts array

async function scrapeInstagram(handle: string): Promise<ScrapeResult | null> {
  const actorId = process.env.APIFY_ACTOR_INSTAGRAM;
  if (!actorId || !handle) return null;
  try {
    const items = await runActor(actorId, { usernames: [handle] });
    const profile = items[0];
    if (!profile) return null;

    const rawPosts = (profile.latestPosts ?? profile.posts ?? []) as Record<string, unknown>[];

    const posts: PostRow[] = rawPosts.slice(0, 12).map(p => ({
      platform: 'instagram',
      post_url: (p.url ?? p.shortCode ? `https://www.instagram.com/p/${p.shortCode}/` : null) as string | null,
      thumbnail_url: (p.displayUrl ?? p.thumbnailUrl ?? p.imageUrl) as string | null,
      caption: ((p.caption as string) ?? '').slice(0, 300) || null,
      likes_count: (p.likesCount as number) ?? null,
      comments_count: (p.commentsCount as number) ?? null,
      views_count: (p.videoViewCount as number) ?? null,
      posted_at: (p.timestamp ?? p.takenAt) as string | null,
    }));

    return {
      stats: {
        platform: 'instagram',
        follower_count: (profile.followersCount as number) ?? null,
        listener_count: null,
        post_count: (profile.postsCount as number) ?? null,
        engagement_rate: (profile.engagementRate as number) ?? null,
        top_post_url: posts[0]?.post_url ?? null,
        top_post_likes: posts[0]?.likes_count ?? null,
      },
      posts,
    };
  } catch (e) {
    console.error('[sync] Instagram scrape failed:', e);
    return null;
  }
}

// ─── TikTok ───────────────────────────────────────────────────────────────────
// Actor: clockworks/tiktok-profile-scraper
// Output: first item is profile, remaining items are videos (or nested)

async function scrapeTikTok(handle: string): Promise<ScrapeResult | null> {
  const actorId = process.env.APIFY_ACTOR_TIKTOK;
  if (!actorId || !handle) return null;
  try {
    const cleanHandle = handle.replace(/^@/, '');
    const items = await runActor(actorId, {
      profiles: [`https://www.tiktok.com/@${cleanHandle}`],
    });
    if (!items.length) return null;

    // Profile data is typically in the first item
    const profile = items[0];
    const authorStats = (profile.authorStats ?? profile.stats ?? profile) as Record<string, unknown>;

    // Videos may be in nested array or subsequent items
    const rawVideos = (
      (profile.videos as Record<string, unknown>[]) ??
      items.slice(1)
    ).slice(0, 12) as Record<string, unknown>[];

    const posts: PostRow[] = rawVideos.map(v => {
      const meta = (v.videoMeta ?? {}) as Record<string, unknown>;
      const ts = v.createTime ?? v.createTimeISO;
      return {
        platform: 'tiktok',
        post_url: (v.webVideoUrl ?? v.videoUrl) as string | null,
        thumbnail_url: (meta.coverUrl ?? v.covers) as string | null,
        caption: ((v.text ?? v.desc) as string ?? '').slice(0, 300) || null,
        likes_count: (v.diggCount ?? (v.stats as Record<string, unknown>)?.diggCount) as number | null,
        comments_count: (v.commentCount ?? (v.stats as Record<string, unknown>)?.commentCount) as number | null,
        views_count: (v.playCount ?? (v.stats as Record<string, unknown>)?.playCount) as number | null,
        posted_at: ts ? new Date(typeof ts === 'number' ? ts * 1000 : ts as string).toISOString() : null,
      };
    });

    return {
      stats: {
        platform: 'tiktok',
        follower_count: (authorStats.followerCount ?? authorStats.fans) as number | null,
        listener_count: null,
        post_count: (authorStats.videoCount) as number | null,
        engagement_rate: null,
        top_post_url: posts[0]?.post_url ?? null,
        top_post_likes: posts[0]?.likes_count ?? null,
      },
      posts,
    };
  } catch (e) {
    console.error('[sync] TikTok scrape failed:', e);
    return null;
  }
}

// ─── YouTube ──────────────────────────────────────────────────────────────────
// Actor: streamers/youtube-channel-scraper
// Output: channel item + video items

async function scrapeYouTube(handle: string): Promise<ScrapeResult | null> {
  const actorId = process.env.APIFY_ACTOR_YOUTUBE;
  if (!actorId || !handle) return null;
  try {
    const url = handle.startsWith('http')
      ? handle
      : `https://www.youtube.com/@${handle.replace(/^@/, '')}`;

    const items = await runActor(actorId, { startUrls: [{ url }] });
    if (!items.length) return null;

    const channel = items[0];

    // Videos are remaining items or nested
    const rawVideos = (
      (channel.videos as Record<string, unknown>[]) ??
      items.slice(1)
    ).slice(0, 12) as Record<string, unknown>[];

    const posts: PostRow[] = rawVideos.map(v => ({
      platform: 'youtube',
      post_url: (v.url ?? (v.id ? `https://www.youtube.com/watch?v=${v.id}` : null)) as string | null,
      thumbnail_url: (v.thumbnailUrl ?? (v.id ? `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg` : null)) as string | null,
      caption: ((v.title ?? v.name) as string ?? '').slice(0, 300) || null,
      likes_count: (v.likes ?? v.likeCount) as number | null,
      comments_count: (v.commentsCount ?? v.commentCount) as number | null,
      views_count: (v.viewCount ?? v.views) as number | null,
      posted_at: (v.date ?? v.publishedAt ?? v.uploadDate) as string | null,
    }));

    return {
      stats: {
        platform: 'youtube',
        follower_count: (channel.subscriberCount ?? channel.subscribers) as number | null,
        listener_count: null,
        post_count: (channel.videoCount ?? channel.videos) as number | null,
        engagement_rate: null,
        top_post_url: posts[0]?.post_url ?? null,
        top_post_likes: posts[0]?.likes_count ?? null,
      },
      posts,
    };
  } catch (e) {
    console.error('[sync] YouTube scrape failed:', e);
    return null;
  }
}

// ─── Spotify ──────────────────────────────────────────────────────────────────

async function scrapeSpotify(handle: string): Promise<ScrapeResult | null> {
  const actorId = process.env.APIFY_ACTOR_SPOTIFY;
  if (!actorId || !handle) return null;
  try {
    const items = await runActor(actorId, { artistNames: [handle] });
    const item = items[0];
    if (!item) return null;
    return {
      stats: {
        platform: 'spotify',
        follower_count: (item.monthlyListeners ?? item.followersCount) as number | null,
        listener_count: (item.monthlyListeners) as number | null,
        post_count: null,
        engagement_rate: null,
        top_post_url: null,
        top_post_likes: null,
      },
      posts: [],
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

    // Run all configured scrapers in parallel
    const [instagram, tiktok, youtube, spotify] = await Promise.all([
      scrapeInstagram(artist.instagram_handle ?? ''),
      scrapeTikTok(artist.tiktok_handle ?? ''),
      scrapeYouTube(artist.youtube_handle ?? ''),
      scrapeSpotify(artist.spotify_handle ?? ''),
    ]);

    const results = [instagram, tiktok, youtube, spotify].filter(Boolean) as ScrapeResult[];

    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No platform actors are configured or no handles set for this artist.',
      });
    }

    const now = new Date().toISOString();

    // Write stats_history rows
    const statsRows = results.map(r => ({
      artist_id: artistId,
      recorded_at: now,
      ...r.stats,
    }));
    const { error: statsError } = await supabaseAdmin.from('stats_history').insert(statsRows);
    if (statsError) throw new Error(`Stats insert failed: ${statsError.message}`);

    // Refresh posts: delete stale rows per platform, insert fresh ones
    const allPosts = results.flatMap(r => r.posts);
    if (allPosts.length > 0) {
      const platforms = [...new Set(allPosts.map(p => p.platform))];
      await supabaseAdmin
        .from('posts')
        .delete()
        .eq('artist_id', artistId)
        .in('platform', platforms);

      const postRows = allPosts.map(p => ({ artist_id: artistId, scraped_at: now, ...p }));
      const { error: postError } = await supabaseAdmin.from('posts').insert(postRows);
      if (postError) console.error('[sync] Post insert error:', postError.message);
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      platforms: results.map(r => r.stats.platform),
      posts: allPosts.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
