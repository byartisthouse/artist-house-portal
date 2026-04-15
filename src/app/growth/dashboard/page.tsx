'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { G } from '@/lib/growth/colors';
import { fetchGrowthHistory, fetchPlatformStats } from '@/lib/growth/stats';
import type { GrowthPoint, PlatformStats, Task, Note, Profile, ArtistData } from '@/lib/growth/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Stat Card ──────────────────────────────────────────────────────────────
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

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
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

// ─── Platform Badge ──────────────────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok: '#00F2EA',
  spotify: '#1DB954',
  youtube: '#FF0000',
};

function PlatformBadge({ platform, pct }: { platform: string; pct: number }) {
  const color = PLATFORM_COLORS[platform] ?? G.accent;
  const positive = pct >= 0;
  return (
    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: `${color}14`, border: `1px solid ${color}30`, color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {platform} {positive ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

// ─── Empty state for charts ──────────────────────────────────────────────────
function EmptyChart({ onSync }: { onSync: () => void }) {
  return (
    <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={G.dim} strokeWidth="1.5">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
      </svg>
      <div style={{ fontSize: 13, color: G.muted }}>No growth data yet</div>
      <button onClick={onSync} style={{ fontSize: 12, color: G.accent, background: G.accentBg, border: `1px solid ${G.accentBorder}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
        Sync stats now
      </button>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function ArtistDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [artistData, setArtistData] = useState<ArtistData | null>(null);
  const [chartPoints, setChartPoints] = useState<GrowthPoint[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: prof }, { data: art }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('artist_data').select('*').eq('user_id', user.id).single(),
      ]);

      setProfile(prof);

      if (art) {
        setArtistData(art);
        const [history, platforms, taskData, noteData] = await Promise.all([
          fetchGrowthHistory(art.id),
          fetchPlatformStats(art.id),
          supabase.from('tasks').select('*').eq('artist_id', user.id).order('created_at', { ascending: false }).limit(8),
          supabase.from('notes').select('*, author:profiles!notes_author_id_fkey(full_name, role)').eq('artist_id', user.id).order('created_at', { ascending: false }).limit(5),
        ]);
        setChartPoints(history.points);
        setPlatformStats(platforms);
        setTasks((taskData.data as Task[]) ?? []);
        setNotes((noteData.data as Note[]) ?? []);
      }
    }
    load();
  }, []);

  async function handleSyncStats() {
    if (!artistData) return;
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await fetch('/api/growth/sync-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId: artistData.id }),
      });
      const json = await res.json();
      setSyncMsg(res.ok ? 'Stats synced successfully!' : json.error ?? 'Sync failed.');
    } catch {
      setSyncMsg('Network error during sync.');
    } finally {
      setSyncing(false);
    }
  }

  async function toggleTask(taskId: string, current: Task['status']) {
    const next: Task['status'] = current === 'Done' ? 'Todo' : current === 'Todo' ? 'In-Progress' : 'Done';
    await supabase.from('tasks').update({ status: next, updated_at: new Date().toISOString() }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: next } : t));
  }

  const totalFollowers = platformStats.reduce((s, p) => s + p.followers, 0);
  const weeklyGrowth = platformStats.reduce((s, p) => s + p.weeklyGrowth, 0);
  const topPlatform = platformStats.sort((a, b) => b.followers - a.followers)[0];
  const openTasks = tasks.filter(t => t.status !== 'Done').length;

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 600, color: G.text, letterSpacing: '-0.02em', marginBottom: 4 }}>
          Hey, {firstName} 👋
        </div>
        <div style={{ fontSize: 13, color: G.muted, display: 'flex', alignItems: 'center', gap: 10 }}>
          Your growth dashboard
          <button
            onClick={handleSyncStats}
            disabled={syncing || !artistData}
            style={{ fontSize: 11, color: G.accent, background: G.accentBg, border: `1px solid ${G.accentBorder}`, borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit', opacity: syncing ? 0.6 : 1 }}
          >
            {syncing ? 'Syncing...' : 'Sync stats'}
          </button>
          {syncMsg && <span style={{ fontSize: 11, color: syncMsg.includes('success') ? G.accent : G.red }}>{syncMsg}</span>}
        </div>
      </div>

      {/* Onboarding prompt if no artist_data */}
      {!artistData && (
        <div style={{ background: G.accentBg, border: `1px solid ${G.accentBorder}`, borderRadius: 10, padding: '18px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: G.accent, marginBottom: 2 }}>Complete your artist profile</div>
            <div style={{ fontSize: 12, color: G.muted }}>Add your social handles to start tracking growth.</div>
          </div>
          <a href="/growth/onboarding" style={{ fontSize: 12, fontWeight: 500, color: G.bg, background: G.accent, borderRadius: 6, padding: '8px 16px', textDecoration: 'none' }}>Set up →</a>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard
          label="Total Followers"
          value={totalFollowers > 0 ? totalFollowers.toLocaleString() : '—'}
          trend={weeklyGrowth || undefined}
          sub="across all platforms"
        />
        <StatCard
          label="Weekly Growth"
          value={weeklyGrowth > 0 ? `+${weeklyGrowth.toLocaleString()}` : weeklyGrowth < 0 ? weeklyGrowth.toLocaleString() : '—'}
          sub="vs. last week"
        />
        <StatCard
          label="Monthly Listeners"
          value={topPlatform?.platform === 'spotify' ? (topPlatform.followers).toLocaleString() : '—'}
          sub="Spotify"
        />
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

      {/* Growth Chart */}
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
          <EmptyChart onSync={handleSyncStats} />
        )}
      </div>

      {/* Tasks + Notes row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Tasks */}
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: G.text, marginBottom: 14 }}>Action Items</div>
          {tasks.length === 0 ? (
            <div style={{ fontSize: 13, color: G.dim, textAlign: 'center', padding: '20px 0' }}>No tasks yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map(task => {
                const done = task.status === 'Done';
                const inProgress = task.status === 'In-Progress';
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id, task.status)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '4px 0' }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                      background: done ? G.accent : 'transparent',
                      border: `1.5px solid ${done ? G.accent : inProgress ? G.amber : G.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {done && <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke={G.bg} strokeWidth="2"><polyline points="2 6 5 9 10 3"/></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: done ? G.dim : G.text, textDecoration: done ? 'line-through' : 'none' }}>{task.title}</div>
                      {inProgress && <span style={{ fontSize: 10, color: G.amber }}>In progress</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: G.text, marginBottom: 14 }}>Call Notes</div>
          {notes.length === 0 ? (
            <div style={{ fontSize: 13, color: G.dim, textAlign: 'center', padding: '20px 0' }}>No notes yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notes.map(note => (
                <div key={note.id} style={{ borderLeft: `2px solid ${G.border}`, paddingLeft: 12 }}>
                  <div style={{ fontSize: 12, color: G.muted, marginBottom: 4 }}>
                    {note.author?.full_name ?? 'Coach'} · {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 13, color: G.text, lineHeight: 1.5 }}>
                    {note.content.length > 120 ? note.content.slice(0, 120) + '…' : note.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Level Up section — upsells */}
      <div style={{ marginTop: 24, background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: G.text, marginBottom: 14 }}>Level Up</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: G.text, marginBottom: 4 }}>1-on-1 Consulting</div>
            <div style={{ fontSize: 12, color: G.muted, marginBottom: 12, lineHeight: 1.5 }}>Immediate strategy and clarity with our advisors. $300 per session.</div>
            <a href="https://www.artisthousekey.com/product/one-on-one-consulting" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: G.accent, textDecoration: 'none', fontWeight: 500 }}>Book a call →</a>
          </div>
          <div style={{ background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: G.text, marginBottom: 4 }}>Full-Service Marketing</div>
            <div style={{ fontSize: 12, color: G.muted, marginBottom: 12, lineHeight: 1.5 }}>AUSTERE handles marketing, creative, playlisting, PR, and ad strategy.</div>
            <a href="https://www.byaustere.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: G.accent, textDecoration: 'none', fontWeight: 500 }}>Discover AUSTERE →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
