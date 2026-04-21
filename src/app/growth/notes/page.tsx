'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { G } from '@/lib/growth/colors';
import type { Note, Profile } from '@/lib/growth/types';

type NoteWithMeta = Note & {
  author?: { full_name: string | null; role: string };
  artist?: { full_name: string | null };
};

export default function NotesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState<NoteWithMeta[]>([]);
  const [artists, setArtists] = useState<Pick<Profile, 'id' | 'full_name'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ content: '', artist_id: '' });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      const isCoachOrAdmin = prof?.role === 'Coach' || prof?.role === 'Admin';

      if (isCoachOrAdmin) {
        const [{ data: noteData }, { data: artistData }] = await Promise.all([
          supabase.from('notes').select('*, author:profiles!notes_author_id_fkey(full_name, role), artist:profiles!notes_artist_id_fkey(full_name)').order('created_at', { ascending: false }),
          supabase.from('profiles').select('id, full_name').in('role', ['Paid Member', 'Free Member']),
        ]);
        setNotes((noteData as NoteWithMeta[]) ?? []);
        setArtists(artistData ?? []);
        if (artistData?.[0]) setForm(f => ({ ...f, artist_id: artistData[0].id }));
      } else {
        const { data: noteData } = await supabase
          .from('notes').select('*, author:profiles!notes_author_id_fkey(full_name, role)').eq('artist_id', user.id).order('created_at', { ascending: false });
        setNotes((noteData as NoteWithMeta[]) ?? []);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function addNote() {
    if (!form.content.trim() || !profile) return;
    setSaving(true);
    const artistId = (profile.role === 'Paid Member' || profile.role === 'Free Member') ? profile.id : form.artist_id;
    const { data, error } = await supabase.from('notes').insert({ artist_id: artistId, author_id: profile.id, content: form.content.trim() })
      .select('*, author:profiles!notes_author_id_fkey(full_name, role), artist:profiles!notes_artist_id_fkey(full_name)').single();
    if (!error && data) {
      setNotes(prev => [data as NoteWithMeta, ...prev]);
      setForm(f => ({ ...f, content: '' }));
      setShowForm(false);
    }
    setSaving(false);
  }

  const isCoachOrAdmin = profile?.role === 'Coach' || profile?.role === 'Admin';

  if (loading) return <div style={{ fontSize: 13, color: G.muted }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: G.text, letterSpacing: '-0.02em', marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 13, color: G.muted }}>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</div>
        </div>
        {isCoachOrAdmin && (
          <button onClick={() => setShowForm(v => !v)} style={{ fontSize: 13, fontWeight: 500, color: G.bg, background: G.accent, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Note
          </button>
        )}
      </div>

      {showForm && isCoachOrAdmin && (
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: G.text, marginBottom: 16 }}>New Note</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {artists.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: G.muted, marginBottom: 5 }}>Artist</label>
                <select value={form.artist_id} onChange={e => setForm(f => ({ ...f, artist_id: e.target.value }))} style={{ width: '100%', background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: G.text, fontFamily: 'inherit', outline: 'none' }}>
                  {artists.map(a => <option key={a.id} value={a.id}>{a.full_name ?? 'Unnamed'}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: G.muted, marginBottom: 5 }}>Note *</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your note here..." rows={5} style={{ width: '100%', boxSizing: 'border-box', background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: G.text, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ fontSize: 13, color: G.muted, background: G.surfaceAlt, border: `1px solid ${G.border}`, borderRadius: 7, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={addNote} disabled={saving || !form.content.trim()} style={{ fontSize: 13, fontWeight: 500, color: G.bg, background: G.accent, border: 'none', borderRadius: 7, padding: '8px 16px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={G.dim} strokeWidth="1.5" style={{ marginBottom: 12 }}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <div style={{ fontSize: 13, color: G.dim }}>No notes yet</div>
          {isCoachOrAdmin && <div style={{ fontSize: 12, color: G.dim, marginTop: 6 }}>Add a note after your next call</div>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notes.map(note => (
            <div key={note.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: G.accentBg, border: `1px solid ${G.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: G.accent, flexShrink: 0 }}>
                    {(note.author?.full_name ?? 'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: G.text }}>{note.author?.full_name ?? 'Coach'}</div>
                    <div style={{ fontSize: 11, color: G.dim }}>{note.author?.role}{isCoachOrAdmin && note.artist?.full_name && ` · for ${note.artist.full_name}`}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: G.dim }}>{new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <div style={{ fontSize: 14, color: G.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{note.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
