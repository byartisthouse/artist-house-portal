'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { G } from '@/lib/growth/colors';
import type { Profile, ArtistData, StatsHistory } from '@/lib/growth/types';

interface RosterArtist {
  profile: Profile;
  artistData: ArtistData | null;
  latestStats: StatsHistory[];
  totalFollowers: number;
  weeklyGrowthPct: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok: '#00F2EA',
  spotify: '#1DB954',
  youtube: '#FF0000',
};

function GrowthBadge({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <span style={{
      fontSize: 11, padding: '3px 8px', borderRadius: 5, fontWeight: 500,
      background: positive ? G.accentBg : G.redBg,
      border: `1px solid ${positive ? G.accentBorder : G.redBorder}`,
      color: positive ? G.accent : G.red,
    }}>
      {positive ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export default function RosterPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<RosterArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }

      const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!myProfile || !['Coach', 'Admin'].includes(myProfile.role)) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Fetch all artists
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'Artist')
        .order('full_name');

      if (!profiles) { setLoading(false); return; }

      const artistIds = profiles.map(p => p.id);

      // Fetch artist_data and stats in parallel
      const [{ data: artistDataRows }, { data: statsRows }] = await Promise.all([
        supabase.from('artist_data').select('*').in('user_id', artistIds),
        supabase.from('stats_history').select('*')
          .in('artist_id', (await supabase.from('artist_data').select('id').in('user_id', artistIds)).data?.map(a => a.id) ?? [])
          .order('recorded_at', { ascending: false })
          .limit(200),
      ]);

      const roster: RosterArtist[] = profiles.map(profile => {
        const artData = artistDataRows?.find(a => a.user_id === profile.id) ?? null;
        const stats = statsRows?.filter(s => s.artist_id === artData?.id) ?? [];

        // Calculate total followers from latest snapshot per platform
        const platforms = [...new Set(stats.map((s: StatsHistory) => s.platform))];
        const totalFollowers = platforms.reduce((sum, plt) => {
          const latest = stats.find((s: StatsHistory) => s.platform === plt);
          return sum + (latest?.follower_count ?? 0);
        }, 0);

        // Weekly growth % (latest vs second-latest snapshot, any platform)
        const latest = stats[0];
        const previous = stats.find((s: StatsHistory) => s.platform === latest?.platform && s.id !== latest.id);
        const weeklyGrowthPct = latest && previous && previous.follower_count
          ? ((latest.follower_count ?? 0) - previous.follower_count) / previous.follower_count * 100
          : 0;

        return { profile, artistData: artData, latestStats: stats.slice(0, 10), totalFollowers, weeklyGrowthPct };
      });

      setArtists(roster);
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return artists;
    return artists.filter(a =>
      a.profile.full_name?.toLowerCase().includes(q) ||
      a.profile.email.toLowerCase().includes(q) ||
      a.artistData?.instagram_handle?.toLowerCase().includes(q) ||
      a.artistData?.spotify_handle?.toLowerCase().includes(q)
    );
  }, [artists, search]);

  if (accessDenied) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: G.text, marginBottom: 4 }}>Access Restricted</div>
          <div style={{ fontSize: 13, color: G.muted }}>Roster is available to Coaches and Admins only.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 600, color: G.text, letterSpacing: '-0.02em', marginBottom: 4 }}>Artist Roster</div>
        <div style={{ fontSize: 13, color: G.muted }}>{artists.length} artists on your roster</div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, email, or handle..."
        style={{
          width: '100%', boxSizing: 'border-box', background: G.surface, border: `1px solid ${G.border}`,
          borderRadius: 8, padding: '10px 14px', fontSize: 13, color: G.text,
          fontFamily: 'inherit', outline: 'none', marginBottom: 20,
        }}
      />

      {loading ? (
        <div style={{ fontSize: 13, color: G.muted }}>Loading roster...</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize: 13, color: G.dim, textAlign: 'center', padding: 48 }}>
          {artists.length === 0 ? 'No artists on the roster yet.' : 'No artists match your search.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(({ profile, artistData, latestStats, totalFollowers, weeklyGrowthPct }) => {
            const platforms = [...new Set(latestStats.map(s => s.platform))];
            return (
              <div
                key={profile.id}
                onClick={() => router.push(`/growth/roster/${profile.id}`)}
                style={{
                  background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12,
                  padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = G.borderHover)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = G.border)}
              >
                {/* Avatar + name row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: G.surfaceAlt, border: `1px solid ${G.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 600, color: G.muted,
                  }}>
                    {getInitials(profile.full_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: G.text, marginBottom: 2 }}>
                      {profile.full_name ?? profile.email}
                    </div>
                    <div style={{ fontSize: 11, color: G.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile.email}
                    </div>
                  </div>
                  <GrowthBadge pct={weeklyGrowthPct} />
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <div style={{ background: G.surfaceAlt, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: G.dim, marginBottom: 2 }}>Total Followers</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: G.text }}>
                      {totalFollowers > 0 ? totalFollowers.toLocaleString() : '—'}
                    </div>
                  </div>
                  <div style={{ background: G.surfaceAlt, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: G.dim, marginBottom: 2 }}>Weekly</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: weeklyGrowthPct >= 0 ? G.accent : G.red }}>
                      {weeklyGrowthPct !== 0 ? `${weeklyGrowthPct >= 0 ? '+' : ''}${weeklyGrowthPct.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                </div>

                {/* Handles */}
                {artistData && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {artistData.instagram_handle && (
                      <span style={{ fontSize: 10, color: PLATFORM_COLORS.instagram, background: `${PLATFORM_COLORS.instagram}14`, border: `1px solid ${PLATFORM_COLORS.instagram}30`, borderRadius: 4, padding: '2px 7px' }}>
                        @{artistData.instagram_handle}
                      </span>
                    )}
                    {artistData.tiktok_handle && (
                      <span style={{ fontSize: 10, color: PLATFORM_COLORS.tiktok, background: `${PLATFORM_COLORS.tiktok}14`, border: `1px solid ${PLATFORM_COLORS.tiktok}30`, borderRadius: 4, padding: '2px 7px' }}>
                        @{artistData.tiktok_handle}
                      </span>
                    )}
                    {artistData.spotify_handle && (
                      <span style={{ fontSize: 10, color: PLATFORM_COLORS.spotify, background: `${PLATFORM_COLORS.spotify}14`, border: `1px solid ${PLATFORM_COLORS.spotify}30`, borderRadius: 4, padding: '2px 7px' }}>
                        {artistData.spotify_handle}
                      </span>
                    )}
                  </div>
                )}

                {/* Platform dots */}
                {platforms.length > 0 && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {platforms.map(p => (
                      <div key={p} style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS[p] ?? G.muted }} title={p} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
