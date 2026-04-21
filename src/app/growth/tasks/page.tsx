'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { G } from '@/lib/growth/colors';
import type { Task, Profile } from '@/lib/growth/types';

type FilterStatus = 'All' | Task['status'];

const STATUS_COLORS: Record<Task['status'], { color: string; bg: string; border: string }> = {
  'Todo':        { color: G.dim,   bg: G.surfaceAlt, border: G.border },
  'In-Progress': { color: G.amber, bg: G.amberBg,    border: G.amberBorder },
  'Done':        { color: G.accent, bg: G.accentBg,  border: G.accentBorder },
};

function StatusBadge({ status }: { status: Task['status'] }) {
  const s = STATUS_COLORS[status];
  return (
    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: s.bg, border: `1px solid ${s.border}`, color: s.color, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

type TaskWithArtist = Task & { artist?: { full_name: string | null } };

export default function TasksPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<TaskWithArtist[]>([]);
  const [artists, setArtists] = useState<Pick<Profile, 'id' | 'full_name'>[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('All');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', artist_id: '' });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      const isCoachOrAdmin = prof?.role === 'Coach' || prof?.role === 'Admin';

      if (isCoachOrAdmin) {
        const [{ data: taskData }, { data: artistData }] = await Promise.all([
          supabase.from('tasks').select('*, artist:profiles!tasks_artist_id_fkey(full_name)').order('created_at', { ascending: false }),
          supabase.from('profiles').select('id, full_name').in('role', ['Paid Member', 'Free Member']),
        ]);
        setTasks((taskData as TaskWithArtist[]) ?? []);
        setArtists(artistData ?? []);
        if (artistData?.[0]) setForm(f => ({ ...f, artist_id: artistData[0].id }));
      } else {
        const { data: taskData } = await supabase
          .from('tasks').select('*').eq('artist_id', user.id).order('created_at', { ascending: false });
        setTasks((taskData as TaskWithArtist[]) ?? []);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function toggleStatus(task: TaskWithArtist) {
    const next: Task['status'] = task.status === 'Todo' ? 'In-Progress' : task.status === 'In-Progress' ? 'Done' : 'Todo';
    await supabase.from('tasks').update({ status: next, updated_at: new Date().toISOString() }).eq('id', task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
  }

  async function addTask() {
    if (!form.title.trim() || !form.artist_id || !profile) return;
    setSaving(true);
    const { data, error } = await supabase.from('tasks').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.due_date || null,
      artist_id: form.artist_id,
      coach_id: profile.id,
      status: 'Todo',
    }).select('*, artist:profiles!tasks_artist_id_fkey(full_name)').single();

    if (!error && data) {
      setTasks(prev => [data as TaskWithArtist, ...prev]);
      setForm(f => ({ ...f, title: '', description: '', due_date: '' }));
      setShowForm(false);
    }
    setSaving(false);
  }

  const isCoachOrAdmin = profile?.role === 'Coach' || profile?.role === 'Admin';
  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.status === filter);
  const filterTabs: FilterStatus[] = ['All', 'Todo', 'In-Progress', 'Done'];

  if (loading) return <div style={{ fontSize: 13, color: G.muted }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: G.text, letterSpacing: '-0.02em', marginBottom: 4 }}>Tasks</div>
          <div style={{ fontSize: 13, color: G.muted }}>{tasks.filter(t => t.status !== 'Done').length} open · {tasks.filter(t => t.status === 'Done').length} done</div>
        </div>
        {isCoachOrAdmin && (
          <button onClick={() => setShowForm(v => !v)} style={{ fontSize: 13, fontWeight: 500, color: G.bg, background: G.accent, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Task
          </button>
        )}
      </div>

      {showForm && isCoachOrAdmin && (
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: G.text, marginBottom: 16 }}>New Task</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: G.muted, marginBottom: 5 }}>Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" style={{ width: '100%', boxSizing: 'border-box', background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: G.text, fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: G.muted, marginBottom: 5 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details..." rows={2} style={{ width: '100%', boxSizing: 'border-box', background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: G.text, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: G.muted, marginBottom: 5 }}>Artist</label>
                <select value={form.artist_id} onChange={e => setForm(f => ({ ...f, artist_id: e.target.value }))} style={{ width: '100%', background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: G.text, fontFamily: 'inherit', outline: 'none' }}>
                  {artists.map(a => <option key={a.id} value={a.id}>{a.full_name ?? 'Unnamed'}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: G.muted, marginBottom: 5 }}>Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: G.text, fontFamily: 'inherit', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ fontSize: 13, color: G.muted, background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 7, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={addTask} disabled={saving || !form.title.trim()} style={{ fontSize: 13, fontWeight: 500, color: G.bg, background: G.accent, border: 'none', borderRadius: 7, padding: '8px 16px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {filterTabs.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: `1px solid ${filter === tab ? G.accent : G.border}`, background: filter === tab ? G.accentBg : 'transparent', color: filter === tab ? G.accent : G.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
            {tab}{tab !== 'All' && <span style={{ marginLeft: 5, fontSize: 10 }}>{tasks.filter(t => t.status === tab).length}</span>}
          </button>
        ))}
      </div>

      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: G.dim }}>No {filter === 'All' ? '' : filter.toLowerCase() + ' '}tasks</div>
          </div>
        ) : filtered.map((task, i) => (
          <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${G.border}` : 'none' }}>
            <button onClick={() => toggleStatus(task)} style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2, background: task.status === 'Done' ? G.accent : 'transparent', border: `1.5px solid ${task.status === 'Done' ? G.accent : task.status === 'In-Progress' ? G.amber : G.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
              {task.status === 'Done' && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={G.bg} strokeWidth="2.5"><polyline points="2 6 5 9 10 3"/></svg>}
              {task.status === 'In-Progress' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: G.amber }} />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: task.description ? 4 : 0 }}>
                <span style={{ fontSize: 14, color: task.status === 'Done' ? G.dim : G.text, textDecoration: task.status === 'Done' ? 'line-through' : 'none' }}>{task.title}</span>
                <StatusBadge status={task.status} />
                {isCoachOrAdmin && task.artist?.full_name && <span style={{ fontSize: 11, color: G.dim }}>→ {task.artist.full_name}</span>}
              </div>
              {task.description && <div style={{ fontSize: 12, color: G.muted, lineHeight: 1.5 }}>{task.description}</div>}
            </div>
            {task.due_date && <div style={{ fontSize: 11, color: G.dim, whiteSpace: 'nowrap', flexShrink: 0, marginTop: 3 }}>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
