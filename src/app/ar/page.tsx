'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { C } from '@/lib/colors';
import LockScreen from '@/components/LockScreen';
import { getInitials, nameHue } from '@/lib/utils';

const SIMPLE_GENRES = ['All', 'Hip-Hop', 'R&B', 'Pop', 'Alternative', 'Rock', 'Latin', 'Electronic', 'Gospel'];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  not_contacted: { label: 'Not contacted', color: C.dim },
  reached_out: { label: 'Reached out', color: C.blue },
  responded: { label: 'Responded', color: C.green },
  meeting: { label: 'Meeting', color: C.purple },
  passed: { label: 'Passed', color: C.coral },
};

interface Contact {
  id: number;
  name: string;
  title: string | null;
  label_name: string | null;
  parent_company: string | null;
  genre: string | null;
  email: string | null;
  email_confidence: number | null;
  linkedin: string | null;
  instagram: string | null;
  twitter: string | null;
  accepts_cold: string | null;
  verified: boolean;
  notes: string | null;
  source: string | null;
}

export default function ARPage() {
  const { isPaid } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [outreach, setOutreach] = useState<Record<number, string>>({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('contacts').select('*').order('name');
      if (data) setContacts(data);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter(c => {
      const matchQ = !q || c.name.toLowerCase().includes(q) || (c.label_name?.toLowerCase().includes(q)) || (c.title?.toLowerCase().includes(q));
      const matchG = activeGenre === 'All' || (c.genre?.includes(activeGenre));
      return matchQ && matchG;
    });
  }, [contacts, search, activeGenre]);

  if (!isPaid) return <LockScreen />;

  return (
    <div>
      <div className="font-display" style={{ fontSize: 24, color: C.text, marginBottom: 16 }}>A&R contacts</div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, label, or title..."
        className="w-full font-body outline-none"
        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.text, boxSizing: 'border-box', marginBottom: 12 }}
      />
      <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 18 }}>
        {SIMPLE_GENRES.map(g => (
          <span key={g} onClick={() => setActiveGenre(g)} style={{ padding: '5px 14px', fontSize: 12, border: `1px solid ${activeGenre === g ? C.text : C.border}`, borderRadius: 6, background: activeGenre === g ? C.text : 'transparent', color: activeGenre === g ? C.bg : C.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: activeGenre === g ? 500 : 400, transition: 'all 0.12s' }}>{g}</span>
        ))}
      </div>
      {filtered.map(c => {
        const st = STATUS_MAP[outreach[c.id] || 'not_contacted'] || STATUS_MAP.not_contacted;
        const hue = nameHue(c.name);
        const isOpen = expanded === c.id;
        return (
          <div key={c.id} onClick={() => setExpanded(isOpen ? null : c.id)} style={{ background: C.surface, border: `1px solid ${isOpen ? C.borderHover : C.border}`, borderRadius: 10, padding: '14px 18px', marginBottom: 6, cursor: 'pointer', transition: 'all 0.12s' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 flex-1">
                <div className="shrink-0 flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: '50%', background: `hsl(${hue},25%,93%)`, fontSize: 13, fontWeight: 500, color: `hsl(${hue},30%,45%)` }}>{getInitials(c.name)}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: C.dim }}><span style={{ fontWeight: 500, color: C.muted }}>{c.label_name}</span> / {c.genre}</div>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 4, background: `${st.color}12`, border: `1px solid ${st.color}30`, color: st.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.color, display: 'inline-block' }} /> {st.label}
                </span>
                {c.verified && <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 4, background: C.greenBg, border: `1px solid ${C.greenBorder}`, color: C.green }}>Verified</span>}
              </div>
            </div>
            {isOpen && (
              <div className="grid gap-2.5 mt-3.5 pt-3" style={{ borderTop: `1px solid ${C.border}`, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.dim, marginBottom: 2 }}>Email</div>
                  <div style={{ fontSize: 12, color: c.email ? C.blue : C.dim }}>{c.email || 'Not enriched'}{c.email_confidence != null && <span style={{ color: C.green, fontSize: 11 }}> ({c.email_confidence}%)</span>}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.dim, marginBottom: 2 }}>Accepts cold</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{c.accepts_cold || 'Unknown'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.dim, marginBottom: 2 }}>LinkedIn</div>
                  <div style={{ fontSize: 12, color: c.linkedin ? C.blue : C.dim }}>{c.linkedin || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.dim, marginBottom: 2 }}>Outreach status</div>
                  <select value={outreach[c.id] || 'not_contacted'} onChange={e => { e.stopPropagation(); setOutreach(prev => ({ ...prev, [c.id]: e.target.value })); }} onClick={e => e.stopPropagation()} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 12, color: C.text, fontFamily: 'inherit' }}>
                    {Object.entries(STATUS_MAP).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.dim, marginBottom: 2 }}>Notes</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{c.notes || '—'}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: C.dim, fontSize: 14 }}>No contacts match your search.</div>}
    </div>
  );
}
