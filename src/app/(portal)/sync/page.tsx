'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { C } from '@/lib/colors';
import LockScreen from '@/components/LockScreen';

interface SyncCompany { id: number; name: string; genre: string | null; site: string | null; notes: string | null; }

const EMPTY: Partial<SyncCompany> = { name: '', genre: '', site: '', notes: '' };

export default function SyncPage() {
  const { isPaid, isAdmin } = useAuth();
  const [companies, setCompanies] = useState<SyncCompany[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<SyncCompany | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<SyncCompany>>(EMPTY);

  async function load() {
    const { data } = await supabase.from('sync_companies').select('*').order('name');
    if (data) setCompanies(data);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return companies.filter(c => !q || c.name.toLowerCase().includes(q) || (c.genre?.toLowerCase().includes(q)));
  }, [companies, search]);

  const startAdd = () => { setAdding(true); setEditing(null); setForm(EMPTY); };
  const startEdit = (c: SyncCompany) => { setEditing(c); setAdding(false); setForm({ ...c }); };
  const cancelForm = () => { setAdding(false); setEditing(null); setForm(EMPTY); };

  const saveForm = async () => {
    const payload = { name: form.name || '', genre: form.genre || null, site: form.site || null, notes: form.notes || null };
    if (editing) {
      await supabase.from('sync_companies').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('sync_companies').insert(payload);
    }
    cancelForm();
    load();
  };

  const deleteCompany = async (id: number) => {
    if (!confirm('Delete this company?')) return;
    await supabase.from('sync_companies').delete().eq('id', id);
    load();
  };

  if (!isPaid) return <LockScreen />;

  const showForm = adding || editing;

  return (
    <div>
      <div className="flex justify-between items-end" style={{ marginBottom: 16 }}>
        <div>
          <div className="font-display" style={{ fontSize: 24, color: C.text, marginBottom: 4 }}>Sync databases</div>
          <div style={{ fontSize: 13, color: C.muted }}>{companies.length} licensing companies</div>
        </div>
        {isAdmin && !showForm && (
          <span onClick={startAdd} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, background: C.greenBg, border: `1px solid ${C.greenBorder}`, color: C.green, cursor: 'pointer', fontWeight: 500 }}>+ Add company</span>
        )}
      </div>

      {showForm && (
        <div style={{ background: C.surface, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 12 }}>{editing ? 'Edit company' : 'Add new company'}</div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Company name" style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 6, background: C.bg, color: C.text, fontFamily: 'inherit' }} />
            <input value={form.genre || ''} onChange={e => setForm({ ...form, genre: e.target.value })} placeholder="Genre" style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 6, background: C.bg, color: C.text, fontFamily: 'inherit' }} />
            <input value={form.site || ''} onChange={e => setForm({ ...form, site: e.target.value })} placeholder="Website" style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 6, background: C.bg, color: C.text, fontFamily: 'inherit', gridColumn: '1 / -1' }} />
            <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes" rows={2} style={{ padding: '8px 12px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 6, background: C.bg, color: C.text, fontFamily: 'inherit', gridColumn: '1 / -1', resize: 'vertical' }} />
          </div>
          <div className="flex gap-2 mt-3">
            <span onClick={saveForm} style={{ padding: '8px 20px', fontSize: 13, borderRadius: 6, background: C.green, color: '#fff', cursor: 'pointer', fontWeight: 500 }}>Save</span>
            <span onClick={cancelForm} style={{ padding: '8px 20px', fontSize: 13, borderRadius: 6, background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer' }}>Cancel</span>
          </div>
        </div>
      )}

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by company name or genre..." className="w-full font-body outline-none" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.text, boxSizing: 'border-box', marginBottom: 16 }} />
      {filtered.map(s => (
        <div key={s.id} className="flex justify-between items-center" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 18px', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 2 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: C.dim }}>{s.genre}{s.notes ? ` — ${s.notes}` : ''}</div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <div className="flex gap-1">
                <span onClick={() => startEdit(s)} style={{ fontSize: 11, color: C.blue, cursor: 'pointer' }}>Edit</span>
                <span onClick={() => deleteCompany(s.id)} style={{ fontSize: 11, color: C.coral, cursor: 'pointer' }}>Del</span>
              </div>
            )}
            {s.site && <a href={s.site.startsWith('http') ? s.site : `https://${s.site}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, textDecoration: 'none', flexShrink: 0 }}>{s.site.replace(/^https?:\/\//, '')}</a>}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: C.dim, fontSize: 13 }}>No companies match your search.</div>}
    </div>
  );
}
