'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { G } from '@/lib/growth/colors';
import { fetchGrowthHistory, fetchPlatformStats } from '@/lib/growth/stats';
import type { GrowthPoint, PlatformStats, Task, Note, Profile, ArtistData } from '@/lib/growth/types';

interface Post {
  id: string;
  platform: string;
  post_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  likes_count: number | null;
  comments_count: number | null;
  views_count: number | null;
  posted_at: string | null;
  scraped_at: string;
}
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok: '#00F2EA',
  spotify: '#1DB954',
  youtube: '#FF0000',
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend }: {
  label: string; value: string; sub?: string; trend?: number;
}) {
  const positive = (trend ?? 0) >= 0;
  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: '18px 20px' }}>
      <div style={{ fontSize: 11, color: G.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: G.text, letterSpacing: '-0.02em', marginBottom: 4 }}>{value}</div>
      {sub && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {trend !== undefined && (
            <span style={{ fontSize: 11, color: positive ? G.accent : G.red, fontWeight: 500 }}>
              {positive ? '↑' : '↓'} {Math.abs(trend).toLocaleString()}
            </span>
          )}
          <span style={{ fontSize: 11, color: G.dim }}>{sub}</span>
        </div>
      )}
    </div>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: G.text }}>{payload[0].value.toLocaleString()}</div>
      <div style={{ fontSize: 11, color: G.dim }}>followers</div>
    </div>
  );
}

// ─── Platform Badge ───────────────────────────────────────────────────────────
function PlatformBadge({ platform, pct }: { platform: string; pct: number }) {
  const color = PLATFORM_COLORS[platform] ?? G.accent;
  const positive = pct >= 0;
  return (
    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: `${color}14`, border: `1px solid ${color}30`, color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {platform} {positive ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

// ─── Task Status Badge ────────────────────────────────────────────────────────
function statusColor(status: Task['status']) {
  if (status === 'Done') return { bg: G.accentBg, border: G.accentBorder, color: G.accent };
  if (status === 'In-Progress') return { bg: G.amberBg, border: G.amberBorder, color: G.amber };
  return { bg: G.surfaceAlt, border: G.border, color: G.muted };
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RosterDetailPage() {
  const { id: profileId } = useParams<{ id: string }>();
  const router = useRouter();

  const [myRole, setMyRole] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [artist, setArtist] = useState<Profile | null>(null);
  const [artistData, setArtistData] = useState<ArtistData | null>(null);
  const [chartPoints, setChartPoints] = useState<GrowthPoint[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postFilter, setPostFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [syncOk, setSyncOk] = useState<boolean | null>(null);

  // Edit handles form
  const [editingHandles, setEditingHandles] = useState(false);
  const [handleForm, setHandleForm] = useState({ instagram_handle: '', tiktok_handle: '', spotify_handle: '', youtube_handle: '' });
  const [savingHandles, setSavingHandles] = useState(false);

  // Add task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Add note form
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/growth/dashboard'); return; }

      const { data: myProfile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();

      if (!myProfile || !['Coach', 'Admin'].includes(myProfile.role)) {
        router.replace('/growth/dashboard');
        return;
      }

      setMyRole(myProfile.role);
      setMyUserId(user.id);

      const [{ data: prof }, { data: art }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('artist_data').select('*').eq('user_id', profileId).single(),
      ]);

      if (!prof) { router.replace('/growth/roster'); return; }
      setArtist(prof);

      if (art) {
        setArtistData(art);
        const [history, platforms, taskData, noteData, postData] = await Promise.all([
          fetchGrowthHistory(art.id),
          fetchPlatformStats(art.id),
          supabase.from('tasks').select('*').eq('artist_id', profileId).order('created_at', { ascending: false }),
          supabase.from('notes').select('*, author:profiles!notes_author_id_fkey(full_name, role)').eq('artist_id', profileId).order('created_at', { ascending: false }),
          supabase.from('posts').select('*').eq('artist_id', art.id).order('posted_at', { ascending: false }).limit(48),
        ]);
        setChartPoints(history.points);
        setPlatformStats(platforms);
        setTasks((taskData.data as Task[]) ?? []);
        setNotes((noteData.data as Note[]) ?? []);
        setPosts((postData.data as Post[]) ?? []);
      } else {
        // Load tasks/notes even without artist_data
        const [taskData, noteData] = await Promise.all([
          supabase.from('tasks').select('*').eq('artist_id', profileId).order('created_at', { ascending: false }),
          supabase.from('notes').select('*, author:profiles!notes_author_id_fkey(full_name, role)').eq('artist_id', profileId).order('created_at', { ascending: false }),
        ]);
        setTasks((taskData.data as Task[]) ?? []);
        setNotes((noteData.data as Note[]) ?? []);
      }

      setLoading(false);
    }
    load();
  }, [profileId, router]);

  async function handleSyncStats() {
    if (!artistData) return;
    setSyncing(true);
    setSyncMsg('');
    setSyncOk(null);

    // Cycle status messages while Apify actors run (takes 60-90s)
    const stages = [
      'Connecting to Apify…',
      'Scraping Instagram…',
      'Scraping TikTok…',
      'Scraping YouTube…',
      'Fetching posts…',
      'Writing to database…',
    ];
    let stageIdx = 0;
    setSyncMsg(stages[0]);
    const ticker = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, stages.length - 1);
      setSyncMsg(stages[stageIdx]);
    }, 15000);

    try {
      const res = await fetch('/api/growth/sync-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId: artistData.id }),
      });
      clearInterval(ticker);
      const json = await res.json() as {
        success?: boolean;
        synced?: number;
        platforms?: string[];
        posts?: number;
        postWarning?: string;
        message?: string;
        error?: string;
      };

      if (!res.ok || !json.success) {
        const msg = json.error ?? json.message ?? 'Sync failed — no data returned.';
        setSyncMsg(msg);
        setSyncOk(false);
        return;
      }

      // Build a human-readable summary
      const platformList = (json.platforms ?? []).join(', ');
      const postCount = json.posts ?? 0;
      const base = `Synced ${json.synced} platform${json.synced !== 1 ? 's' : ''} (${platformList}) · ${postCount} post${postCount !== 1 ? 's' : ''} saved`;
      setSyncMsg(json.postWarning ? `${base} — ⚠ ${json.postWarning}` : base);
      setSyncOk(json.postWarning ? false : true);

      // Reload chart, platform stats, and posts without a full page refresh
      const [history, platforms, postData] = await Promise.all([
        fetchGrowthHistory(artistData.id),
        fetchPlatformStats(artistData.id),
        supabase.from('posts').select('*').eq('artist_id', artistData.id).order('posted_at', { ascending: false }).limit(48),
      ]);
      setChartPoints(history.points);
      setPlatformStats(platforms);
      setPosts((postData.data as Post[]) ?? []);
    } catch {
      clearInterval(ticker);
      setSyncMsg('Network error — check your connection and try again.');
      setSyncOk(false);
    } finally {
      setSyncing(false);
    }
  }

  function openEditHandles() {
    setHandleForm({
      instagram_handle: artistData?.instagram_handle ?? '',
      tiktok_handle: artistData?.tiktok_handle ?? '',
      spotify_handle: artistData?.spotify_handle ?? '',
      youtube_handle: artistData?.youtube_handle ?? '',
    });
    setEditingHandles(true);
  }

  async function saveHandles(e: React.FormEvent) {
    e.preventDefault();
    setSavingHandles(true);
    const payload = {
      user_id: profileId,
      instagram_handle: handleForm.instagram_handle.trim().replace(/^@/, '') || null,
      tiktok_handle: handleForm.tiktok_handle.trim().replace(/^@/, '') || null,
      spotify_handle: handleForm.spotify_handle.trim() || null,
      youtube_handle: handleForm.youtube_handle.trim().replace(/^@/, '') || null,
    };
    const res = await fetch('/api/growth/save-handles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json() as { data?: ArtistData; error?: string };
    if (json.data) setArtistData(json.data);
    setSavingHandles(false);
    setEditingHandles(false);
  }

  async function toggleTask(taskId: string, current: Task['status']) {
    const next: Task['status'] = current === 'Done' ? 'Todo' : current === 'Todo' ? 'In-Progress' : 'Done';
    await supabase.from('tasks').update({ status: next, updated_at: new Date().toISOString() }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: next } : t));
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim() || !myUserId) return;
    setAddingTask(true);
    const { data } = await supabase.from('tasks').insert({
      artist_id: profileId,
      coach_id: myUserId,
      title: taskTitle.trim(),
      description: taskDesc.trim() || null,
      due_date: taskDue || null,
      status: 'Todo',
    }).select().single();
    if (data) {
      setTasks(prev => [data as Task, ...prev]);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDue('');
      setShowTaskForm(false);
    }
    setAddingTask(false);
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim() || !myUserId) return;
    setAddingNote(true);
    const { data } = await supabase.from('notes').insert({
      artist_id: profileId,
      author_id: myUserId,
      content: noteContent.trim(),
    }).select('*, author:profiles!notes_author_id_fkey(full_name, role)').single();
    if (data) {
      setNotes(prev => [data as Note, ...prev]);
      setNoteContent('');
      setShowNoteForm(false);
    }
    setAddingNote(false);
  }

  const totalFollowers = platformStats.reduce((s, p) => s + p.followers, 0);
  const weeklyGrowth = platformStats.reduce((s, p) => s + p.weeklyGrowth, 0);
  // Only show growth if we have at least two data points per platform
  const hasGrowthData = platformStats.some(p => p.weeklyGrowth !== 0);
  const spotifyStats = platformStats.find(p => p.platform === 'spotify');
  const youtubeStats = platformStats.find(p => p.platform === 'youtube');
  const openTasks = tasks.filter(t => t.status !== 'Done').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <span style={{ fontSize: 13, color: G.muted }}>Loading artist...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={() => router.push('/growth/roster')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: G.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, fontFamily: 'inherit' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Roster
      </button>

      {/* Artist header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28, background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 24px' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: G.surfaceAlt, border: `1px solid ${G.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 600, color: G.muted,
        }}>
          {getInitials(artist?.full_name ?? null)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: G.text, letterSpacing: '-0.02em' }}>
              {artist?.full_name ?? artist?.email}
            </div>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: G.accentBg, border: `1px solid ${G.accentBorder}`, color: G.accent }}>
              {artist?.role ?? 'Paid Member'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: G.dim, marginBottom: artistData ? 10 : 0 }}>{artist?.email}</div>

          {/* Handles — view or edit */}
          {editingHandles ? (
            <form onSubmit={saveHandles} style={{ marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {([
                  { key: 'instagram_handle', label: 'Instagram', prefix: '@', color: PLATFORM_COLORS.instagram },
                  { key: 'tiktok_handle',   label: 'TikTok',    prefix: '@', color: PLATFORM_COLORS.tiktok },
                  { key: 'spotify_handle',  label: 'Spotify',   prefix: '',  color: PLATFORM_COLORS.spotify },
                  { key: 'youtube_handle',  label: 'YouTube',   prefix: '@', color: PLATFORM_COLORS.youtube },
                ] as const).map(({ key, label, prefix, color }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 10, color, marginBottom: 3, fontWeight: 500 }}>{label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 6, overflow: 'hidden' }}>
                      {prefix && <span style={{ fontSize: 12, color: G.dim, padding: '0 6px' }}>{prefix}</span>}
                      <input
                        value={handleForm[key]}
                        onChange={e => setHandleForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={`${label} handle`}
                        style={{ flex: 1, background: 'transparent', border: 'none', padding: '7px 8px 7px 0', fontSize: 12, color: G.text, fontFamily: 'inherit', outline: 'none' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={savingHandles} style={{ fontSize: 12, color: G.bg, background: G.accent, border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontFamily: 'inherit', opacity: savingHandles ? 0.6 : 1 }}>
                  {savingHandles ? 'Saving…' : 'Save handles'}
                </button>
                <button type="button" onClick={() => setEditingHandles(false)} style={{ fontSize: 12, color: G.muted, background: 'transparent', border: `1px solid ${G.border}`, borderRadius: 6, padding: '7px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: artistData?.artist_goals ? 10 : 0 }}>
                {artistData?.instagram_handle && (
                  <span style={{ fontSize: 11, color: PLATFORM_COLORS.instagram, background: `${PLATFORM_COLORS.instagram}14`, border: `1px solid ${PLATFORM_COLORS.instagram}30`, borderRadius: 4, padding: '2px 8px' }}>
                    IG @{artistData.instagram_handle}
                  </span>
                )}
                {artistData?.tiktok_handle && (
                  <span style={{ fontSize: 11, color: PLATFORM_COLORS.tiktok, background: `${PLATFORM_COLORS.tiktok}14`, border: `1px solid ${PLATFORM_COLORS.tiktok}30`, borderRadius: 4, padding: '2px 8px' }}>
                    TT @{artistData.tiktok_handle}
                  </span>
                )}
                {artistData?.spotify_handle && (
                  <span style={{ fontSize: 11, color: PLATFORM_COLORS.spotify, background: `${PLATFORM_COLORS.spotify}14`, border: `1px solid ${PLATFORM_COLORS.spotify}30`, borderRadius: 4, padding: '2px 8px' }}>
                    Spotify: {artistData.spotify_handle}
                  </span>
                )}
                {artistData?.youtube_handle && (
                  <span style={{ fontSize: 11, color: PLATFORM_COLORS.youtube, background: `${PLATFORM_COLORS.youtube}14`, border: `1px solid ${PLATFORM_COLORS.youtube}30`, borderRadius: 4, padding: '2px 8px' }}>
                    YT @{artistData.youtube_handle}
                  </span>
                )}
                {!artistData?.instagram_handle && !artistData?.tiktok_handle && !artistData?.spotify_handle && !artistData?.youtube_handle && (
                  <span style={{ fontSize: 11, color: G.dim }}>No handles set</span>
                )}
                <button
                  onClick={openEditHandles}
                  style={{ fontSize: 11, color: G.muted, background: 'transparent', border: `1px solid ${G.border}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Edit
                </button>
              </div>
              {artistData?.artist_goals && (
                <div style={{ fontSize: 12, color: G.muted, fontStyle: 'italic', maxWidth: 560, lineHeight: 1.5 }}>
                  &ldquo;{artistData.artist_goals}&rdquo;
                </div>
              )}
            </>
          )}
        </div>

        {/* Sync button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <button
            onClick={handleSyncStats}
            disabled={syncing || !artistData}
            style={{ fontSize: 12, color: G.accent, background: G.accentBg, border: `1px solid ${G.accentBorder}`, borderRadius: 6, padding: '7px 14px', cursor: artistData ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: syncing || !artistData ? 0.6 : 1 }}
          >
            {syncing ? 'Syncing…' : 'Sync stats'}
          </button>
          {syncMsg && (
            <span style={{
              fontSize: 11,
              color: syncing ? G.muted : syncOk === true ? G.accent : syncOk === false ? G.red : G.muted,
            }}>
              {syncMsg}
            </span>
          )}
          {!artistData && (
            <button onClick={openEditHandles} style={{ fontSize: 11, color: G.accent, background: G.accentBg, border: `1px solid ${G.accentBorder}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add handles
            </button>
          )}
        </div>
      </div>

      {/* No artist_data notice (only when not editing) */}
      {!artistData && !editingHandles && (
        <div style={{ background: G.amberBg, border: `1px solid ${G.amberBorder}`, borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: G.amber }}>
          This artist hasn&apos;t completed onboarding. Use &ldquo;+ Add handles&rdquo; to set their social profiles.
        </div>
      )}

      {artistData && (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <StatCard
              label="Total Followers"
              value={totalFollowers > 0 ? totalFollowers.toLocaleString() : '—'}
              trend={hasGrowthData ? weeklyGrowth : undefined}
              sub="across all platforms"
            />
            <StatCard
              label="Weekly Growth"
              value={hasGrowthData ? `${weeklyGrowth >= 0 ? '+' : ''}${weeklyGrowth.toLocaleString()}` : '—'}
              sub={hasGrowthData ? 'vs. last week' : 'sync weekly to track'}
            />
            {spotifyStats ? (
              <StatCard
                label="Monthly Listeners"
                value={spotifyStats.followers.toLocaleString()}
                sub="Spotify"
              />
            ) : youtubeStats ? (
              <StatCard
                label="YouTube Subscribers"
                value={youtubeStats.followers > 0 ? youtubeStats.followers.toLocaleString() : '—'}
                sub="subscribers"
              />
            ) : (
              <StatCard
                label="Monthly Listeners"
                value="—"
                sub="add Spotify handle to sync"
              />
            )}
            <StatCard
              label="Open Tasks"
              value={String(openTasks)}
              sub={openTasks === 1 ? 'action item' : 'action items'}
            />
          </div>

          {/* Platform badges */}
          {platformStats.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {platformStats.map(p => (
                <PlatformBadge key={p.platform} platform={p.platform} pct={p.weeklyGrowthPct} />
              ))}
            </div>
          )}

          {/* Growth chart */}
          <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: G.text }}>Follower Growth</div>
                <div style={{ fontSize: 11, color: G.dim }}>All platforms · last 8 weeks</div>
              </div>
              {chartPoints.length > 0 && (
                <div style={{ fontSize: 12, color: G.accent }}>
                  {weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth.toLocaleString()} this week
                </div>
              )}
            </div>
            {chartPoints.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartPoints} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={G.chartGrid} vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: G.dim }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: G.dim }} axisLine={false} tickLine={false} width={48} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: G.border }} />
                  <Line type="monotone" dataKey="followers" stroke={G.chartLine} strokeWidth={2} dot={{ fill: G.chartDot, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: G.chartLine, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G.dim} strokeWidth="1.5">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                </svg>
                <div style={{ fontSize: 13, color: G.muted }}>No growth data yet — sync stats to populate the chart.</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Recent Posts */}
      {(posts.length > 0 || artistData) && (
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: G.text }}>Recent Posts</div>
              <div style={{ fontSize: 11, color: G.dim }}>
                {posts.length > 0
                  ? `${posts.length} posts across ${[...new Set(posts.map(p => p.platform))].join(', ')}`
                  : 'Sync stats to load posts'}
              </div>
            </div>
            {posts.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['all', ...[...new Set(posts.map(p => p.platform))]].map(plt => (
                  <button
                    key={plt}
                    onClick={() => setPostFilter(plt)}
                    style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
                      fontFamily: 'inherit', border: '1px solid',
                      background: postFilter === plt ? (plt === 'all' ? G.text : PLATFORM_COLORS[plt]) : 'transparent',
                      color: postFilter === plt ? (plt === 'all' ? G.bg : G.bg) : (plt === 'all' ? G.muted : PLATFORM_COLORS[plt]),
                      borderColor: postFilter === plt ? 'transparent' : (plt === 'all' ? G.border : `${PLATFORM_COLORS[plt]}50`),
                    }}
                  >
                    {plt.charAt(0).toUpperCase() + plt.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {posts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 10 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G.dim} strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              <div style={{ fontSize: 13, color: G.muted }}>No posts yet — hit &quot;Sync stats&quot; to pull recent content.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {posts
                .filter(p => postFilter === 'all' || p.platform === postFilter)
                .map(post => {
                  const color = PLATFORM_COLORS[post.platform] ?? G.accent;
                  const dateStr = post.posted_at
                    ? new Date(post.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : null;
                  return (
                    <a
                      key={post.id}
                      href={post.post_url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', display: 'block', borderRadius: 8, overflow: 'hidden', border: `1px solid ${G.border}`, background: G.surfaceAlt, transition: 'border-color 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = G.borderHover)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = G.border)}
                    >
                      {/* Thumbnail */}
                      <div style={{ aspectRatio: '1', background: `${color}18`, position: 'relative', overflow: 'hidden' }}>
                        {post.thumbnail_url ? (
                          <>
                            <img
                              src={post.thumbnail_url}
                              alt={post.caption ?? ''}
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              onError={e => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const sibling = img.nextElementSibling as HTMLElement | null;
                                if (sibling) sibling.style.display = 'flex';
                              }}
                            />
                            {/* Shown when image fails to load */}
                            <div style={{ display: 'none', position: 'absolute', inset: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <span style={{ fontSize: 10, color: color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{post.platform}</span>
                              <span style={{ fontSize: 9, color: G.dim }}>Preview unavailable</span>
                            </div>
                          </>
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <span style={{ fontSize: 10, color: color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{post.platform}</span>
                            <span style={{ fontSize: 9, color: G.dim }}>Preview unavailable</span>
                          </div>
                        )}
                        {/* Platform dot */}
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: '0 0 0 2px white' }} />
                      </div>

                      {/* Meta */}
                      <div style={{ padding: '8px 10px' }}>
                        {post.caption && (
                          <div style={{ fontSize: 11, color: G.text, lineHeight: 1.4, marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                            {post.caption}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {post.likes_count !== null && (
                              <span style={{ fontSize: 10, color: G.dim, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill={G.dim} stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                {post.likes_count >= 1000 ? `${(post.likes_count / 1000).toFixed(1)}k` : post.likes_count}
                              </span>
                            )}
                            {post.views_count !== null && (
                              <span style={{ fontSize: 10, color: G.dim, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={G.dim} strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                {post.views_count >= 1000 ? `${(post.views_count / 1000).toFixed(1)}k` : post.views_count}
                              </span>
                            )}
                          </div>
                          {dateStr && <span style={{ fontSize: 9, color: G.dim, whiteSpace: 'nowrap' }}>{dateStr}</span>}
                        </div>
                      </div>
                    </a>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Tasks + Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Tasks */}
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: G.text }}>Action Items</div>
            <button
              onClick={() => setShowTaskForm(v => !v)}
              style={{ fontSize: 12, color: G.accent, background: G.accentBg, border: `1px solid ${G.accentBorder}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {showTaskForm ? 'Cancel' : '+ Add task'}
            </button>
          </div>

          {showTaskForm && (
            <form onSubmit={handleAddTask} style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="Task title*"
                required
                style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, color: G.text, fontFamily: 'inherit', outline: 'none' }}
              />
              <input
                value={taskDesc}
                onChange={e => setTaskDesc(e.target.value)}
                placeholder="Description (optional)"
                style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, color: G.text, fontFamily: 'inherit', outline: 'none' }}
              />
              <input
                type="date"
                value={taskDue}
                onChange={e => setTaskDue(e.target.value)}
                style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, color: taskDue ? G.text : G.dim, fontFamily: 'inherit', outline: 'none' }}
              />
              <button
                type="submit"
                disabled={addingTask || !taskTitle.trim()}
                style={{ fontSize: 12, color: G.bg, background: G.accent, border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', opacity: addingTask || !taskTitle.trim() ? 0.6 : 1 }}
              >
                {addingTask ? 'Adding…' : 'Add task'}
              </button>
            </form>
          )}

          {tasks.length === 0 ? (
            <div style={{ fontSize: 13, color: G.dim, textAlign: 'center', padding: '20px 0' }}>No tasks yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tasks.map(task => {
                const s = statusColor(task.status);
                const done = task.status === 'Done';
                const inProgress = task.status === 'In-Progress';
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id, task.status)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '6px 0', borderBottom: `1px solid ${G.border}` }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                      background: done ? G.accent : 'transparent',
                      border: `1.5px solid ${s.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {done && <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke={G.bg} strokeWidth="2"><polyline points="2 6 5 9 10 3"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: done ? G.dim : G.text, textDecoration: done ? 'line-through' : 'none', marginBottom: 2 }}>
                        {task.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {inProgress && <span style={{ fontSize: 10, color: G.amber }}>In progress</span>}
                        {task.due_date && !done && (
                          <span style={{ fontSize: 10, color: G.dim }}>
                            Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: G.text }}>Call Notes</div>
            <button
              onClick={() => setShowNoteForm(v => !v)}
              style={{ fontSize: 12, color: G.accent, background: G.accentBg, border: `1px solid ${G.accentBorder}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {showNoteForm ? 'Cancel' : '+ Add note'}
            </button>
          </div>

          {showNoteForm && (
            <form onSubmit={handleAddNote} style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Write a note about this session..."
                rows={4}
                required
                style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, color: G.text, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
              />
              <button
                type="submit"
                disabled={addingNote || !noteContent.trim()}
                style={{ fontSize: 12, color: G.bg, background: G.accent, border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', opacity: addingNote || !noteContent.trim() ? 0.6 : 1 }}
              >
                {addingNote ? 'Saving…' : 'Save note'}
              </button>
            </form>
          )}

          {notes.length === 0 ? (
            <div style={{ fontSize: 13, color: G.dim, textAlign: 'center', padding: '20px 0' }}>No notes yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notes.map(note => (
                <div key={note.id} style={{ borderLeft: `2px solid ${G.border}`, paddingLeft: 12 }}>
                  <div style={{ fontSize: 12, color: G.muted, marginBottom: 4 }}>
                    {note.author?.full_name ?? 'Coach'}
                    {note.author?.role && <span style={{ color: G.dim }}> · {note.author.role}</span>}
                    {' · '}
                    {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 13, color: G.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {note.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
