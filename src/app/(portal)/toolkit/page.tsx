'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { C } from '@/lib/colors';
import LockScreen from '@/components/LockScreen';

interface Tool { id: number; name: string; description: string | null; url: string | null; category: string | null; }

const EMPTY: Partial<Tool> = { name: '', description: '', url: '', category: '' };

export default function ToolkitPage() {
  const { isPaid, isAdmin } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState<Tool | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<Tool>>(EMPTY);

  async function load() {
    const { data } = await supabase.from('tools').select('*').order('category, name');
    if (data) { setTools(data); if (data.length > 0 && !activeCategory) setActiveCategory(data[0].category); }
  }

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => [...new Set(tools.map(t => t.category).filter(Boolean))] as string[], [tools]);
  const filtered = useMemo(() => tools.filter(t => t.category === activeCategory), [tools, activeCategory]);

  const startAdd = () => { setAdding(true); setEditing(null); setForm({ ...EMPTY, category: activeCategory || '' }); };
  const startEdit = (t: Tool) => { setEditing(t); setAdding(false); setForm({ ...t }); };
  const cancelForm = () => { setAdding(false); setEditing(null); setForm(EMPTY); };

  const saveForm = async () => {
    const payload = { name: form.name || '', description: form.description || null, url: form.url || null, category: form.category || null };
    if (editing) {
      await supabase.from('tools').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('tools').insert(payload);
    }
    cancelForm();
    load();
  };

  const deleteTool = async (id: number) => {
    if (!confirm('Delete this tool?')) return;
    await supabase.from('tools').delete().eq('id', id);
    load();
  };

  if (!isPaid) return <LockScreen />;

  const showForm = adding || editing;

  return (
    <div>
      <div className="flex justify-between items-end" style={{ marginBottom: 16 }}>
        <div className="font-display" style={{ fontSize: 24, color: C.text }}>Toolkit</div>
        {isAdmin && !showForm && (
          <span onClick={startAdd} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, background: C.greenBg, border: `1px solid ${C.greenBorder}`, color: C.green, cursor: 'pointer', fontWeight: 500 }}>+ Add tool</span>
        )}
      </div>

      {showForm && (
        <div style={{ background: C.surface, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 12 }}>{editing ? 'Edit tool' : 'Add new tool'}</div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tool name" style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 6, background: C.bg, color: C.text, fontFamily: 'inherit' }} />
            <input value={form.url || ''} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="URL" style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 6, background: C.bg, color: C.text, fontFamily: 'inherit' }} />
            <input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 6, background: C.bg, color: C.text, fontFamily: 'inherit', gridColumn: '1 / -1' }} />
            <select value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 6, background: C.bg, color: C.text, fontFamily: 'inherit' }}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <span onClick={saveForm} style={{ padding: '8px 20px', fontSize: 13, borderRadius: 6, background: C.green, color: '#fff', cursor: 'pointer', fontWeight: 500 }}>Save</span>
            <span onClick={cancelForm} style={{ padding: '8px 20px', fontSize: 13, borderRadius: 6, background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer' }}>Cancel</span>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 16 }}>
        {categories.map(k => (
          <span key={k} onClick={() => setActiveCategory(k)} style={{ padding: '5px 14px', fontSize: 12, border: `1px solid ${activeCategory === k ? C.text : C.border}`, borderRadius: 6, background: activeCategory === k ? C.text : 'transparent', color: activeCategory === k ? C.bg : C.muted, cursor: 'pointer', fontWeight: activeCategory === k ? 500 : 400, transition: 'all 0.12s' }}>{k}</span>
        ))}
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        {filtered.map(t => (
          <div key={t.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px' }}>
            <div className="flex justify-between items-start">
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 3 }}>{t.name}</div>
              {isAdmin && (
                <div className="flex gap-1">
                  <span onClick={() => startEdit(t)} style={{ fontSize: 11, color: C.blue, cursor: 'pointer' }}>Edit</span>
                  <span onClick={() => deleteTool(t.id)} style={{ fontSize: 11, color: C.coral, cursor: 'pointer' }}>Del</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5, marginBottom: 8 }}>{t.description}</div>
            {t.url && <a href={t.url.startsWith('http') ? t.url : `https://${t.url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.blue, textDecoration: 'none' }}>{t.url.replace(/^https?:\/\//, '')}</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
