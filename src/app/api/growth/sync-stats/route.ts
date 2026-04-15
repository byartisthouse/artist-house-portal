/**
 * POST /api/growth/sync-stats
 *
 * Triggers an Apify actor to scrape social stats for an artist, then writes
 * the results to the stats_history table.
 *
 * Body: { artistId: string }
 *
 * Modular design: swap fetchFromApify() for direct platform API calls in V2
 * without touching this route or any UI components.
 *
 * Required env vars (set in Vercel):
 *   APIFY_API_TOKEN    — your Apify API token
 *   APIFY_ACTOR_ID     — the actor ID to run (e.g. "apify/instagram-scraper")
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── Apify data fetcher (V1) ─────────────────────────────────────────────────
// Replace the body of this function in V2 to call platform APIs directly.
async function fetchFromApify(artistData: {
  instagram_handle: string | null;
  tiktok_handle: string | null;
  spotify_handle: string | null;
}): Promise<ApifyResult[]> {
  const token = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;

  if (!token || !actorId) {
    throw new Error('APIFY_API_TOKEN and APIFY_ACTOR_ID must be set in environment variables.');
  }

  const input = {
    instagramHandles: artistData.instagram_handle ? [artistData.instagram_handle] : [],
    tiktokHandles: artistData.tiktok_handle ? [artistData.tiktok_handle] : [],
    spotifyHandles: artistData.spotify_handle ? [artistData.spotify_handle] : [],
  };

  // Run the actor
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }
  );
  if (!runRes.ok) throw new Error(`Apify run failed: ${await runRes.text()}`);
  const { data: run } = await runRes.json();

  // Poll for completion (max 60s)
  let status = run.status;
  for (let i = 0; i < 12 && !['SUCCEEDED', 'FAILED', 'ABORTED'].includes(status); i++) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${run.id}?token=${token}`);
    status = (await statusRes.json()).data?.status;
  }
  if (status !== 'SUCCEEDED') throw new Error(`Apify actor ${status}`);

  // Fetch dataset items
  const dataRes = await fetch(
    `https://api.apify.com/v2/actor-runs/${run.id}/dataset/items?token=${token}&clean=true`
  );
  return await dataRes.json() as ApifyResult[];
}

interface ApifyResult {
  platform: 'instagram' | 'tiktok' | 'spotify';
  followerCount?: number;
  followersCount?: number;
  monthlyListeners?: number;
  postsCount?: number;
  engagementRate?: number;
  topPostUrl?: string;
  topPostLikes?: number;
}

function normalizeApifyResult(item: ApifyResult, platform: string) {
  return {
    platform,
    follower_count: item.followerCount ?? item.followersCount ?? null,
    listener_count: item.monthlyListeners ?? null,
    post_count: item.postsCount ?? null,
    engagement_rate: item.engagementRate ?? null,
    top_post_url: item.topPostUrl ?? null,
    top_post_likes: item.topPostLikes ?? null,
  };
}

// ─── Route handler ───────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { artistId } = await request.json() as { artistId?: string };
    if (!artistId) {
      return NextResponse.json({ error: 'artistId is required' }, { status: 400 });
    }

    // Use service-role key for server-side writes (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch artist handles
    const { data: artistData, error: artistError } = await supabaseAdmin
      .from('artist_data')
      .select('instagram_handle, tiktok_handle, spotify_handle')
      .eq('id', artistId)
      .single();

    if (artistError || !artistData) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Fetch from Apify
    const results = await fetchFromApify(artistData);

    // Upsert into stats_history
    const rows = results.map(item => ({
      artist_id: artistId,
      recorded_at: new Date().toISOString(),
      ...normalizeApifyResult(item, item.platform),
    }));

    if (rows.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('stats_history')
        .insert(rows);

      if (insertError) throw new Error(insertError.message);
    }

    return NextResponse.json({ success: true, synced: rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
