'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { C } from '@/lib/colors';
import LockScreen from '@/components/LockScreen';

interface Guide { id: number; title: string; content: string | null; }

const EMPTY: Partial<Guide> = { title: '', content: '' };

export default function GuidesPage() {
  const { isPaid, isAdmin } = useAuth();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Guide | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<Guide>>(EMPTY);

  async function load() {
    const { data } = await supabase.from('guides').select('*').order('id');
    if (data) { setGuides(data); if (data.length > 0 && !activeId) setActiveId(data[0].id); }
  }

  useEffect(() => { load(); }, []);

  const startAdd = () => { setAdding(true); setEditing(null); setForm(EMPTY); };
  const startEdit = (g: Guide) => { setEditing(g); setAdding(false); setForm({ ...g }); };
  const cancelForm = () => { setAdding(false); setEditing(null); setForm(EMPTY); };

  const saveForm = async () => {
    const payload = { title: form.title || '', content: form.content || null };
    if (editing) {
      await supabase.from('guides').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('guides').insert(payload);
    }
    cancelForm();
    load();
  };

  const deleteGuide = async (id: number) => {
    if (!confirm('Delete this guide?')) return;
    await supabase.from('guides').delete().eq('id', id);
    if (activeId === id) setActiveId(null);
    load();
  };

  if (!isPaid) return <LockScreen />;

  const active = guides.find(g => g.id === activeId);
  const showForm = adding || editing;

  return (
    <div>
      <div className="flex justify-between items-end" style={{ marginBottom: 16 }}>
        <div className="font-display" style={{ fontSize: 24, color: C.text }}>Guides</div>
        {isAdmin && !showForm && (
          <span onClick={startAdd} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, background: C.greenBg, border: `1px solid ${C.greenBorder}`, color: C.green, cursor: 'pointer', fontWeight: 500 }}>+ Add guide</span>
        )}
      </div>

      {showForm && (
        <div style={{ background: C.surface, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 12 }}>{editing ? 'Edit guide' : 'Add new guide'}</div>
          <div className="grid gap-2">
            <input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Guide title" style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 6, background: C.bg, color: C.text, fontFamily: 'inherit' }} />
            <textarea value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Content (use double newlines for paragraphs)" rows={8} style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 6, background: C.bg, color: C.text, fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
          <div className="flex gap-2 mt-3">
            <span onClick={saveForm} style={{ padding: '8px 20px', fontSize: 13, borderRadius: 6, background: C.green, color: '#fff', cursor: 'pointer', fontWeight: 500 }}>Save</span>
            <span onClick={cancelForm} style={{ padding: '8px 20px', fontSize: 13, borderRadius: 6, background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer' }}>Cancel</span>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 16 }}>
        {guides.map(g => (
          <span key={g.id} onClick={() => setActiveId(g.id)} style={{ padding: '5px 14px', fontSize: 12, border: `1px solid ${activeId === g.id ? C.text : C.border}`, borderRadius: 6, background: activeId === g.id ? C.text : 'transparent', color: activeId === g.id ? C.bg : C.muted, cursor: 'pointer', fontWeight: activeId === g.id ? 500 : 400 }}>{g.title}</span>
        ))}
      </div>
      {active && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '24px 28px' }}>
          <div className="flex justify-between items-start">
            <div className="font-display" style={{ fontSize: 18, color: C.text, marginBottom: 16 }}>{active.title}</div>
            {isAdmin && (
              <div className="flex gap-2">
                <span onClick={() => startEdit(active)} style={{ fontSize: 11, color: C.blue, cursor: 'pointer' }}>Edit</span>
                <span onClick={() => deleteGuide(active.id)} style={{ fontSize: 11, color: C.coral, cursor: 'pointer' }}>Del</span>
              </div>
            )}
          </div>
          {active.content?.split('\n\n').map((p, i) => (
            <p key={i} style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 12, marginTop: 0 }}>{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}
