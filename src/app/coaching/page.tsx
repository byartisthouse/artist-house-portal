'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { C } from '@/lib/colors';
import LockScreen from '@/components/LockScreen';

interface CoachingCall {
  id: number;
  date: string | null;
  title: string;
  advisor: string | null;
  video_url: string | null;
  topics: string[];
  summary: string | null;
}

export default function CoachingPage() {
  const { isPaid } = useAuth();
  const [calls, setCalls] = useState<CoachingCall[]>([]);
  const [search, setSearch] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('coaching_calls')
        .select('id, date, title, advisor, video_url, topics, summary')
        .order('date', { ascending: false });
      if (data) setCalls(data);
    }
    load();
  }, []);

  const sortedCalls = useMemo(() => {
    return [...calls].sort((a, b) => {
      const da = a.date || '', db = b.date || '';
      return sortOrder === 'newest' ? db.localeCompare(da) : da.localeCompare(db);
    });
  }, [calls, sortOrder]);

  const topTopics = useMemo(() => {
    const freq: Record<string, number> = {};
    calls.forEach(c => c.topics?.forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t]) => t);
  }, [calls]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sortedCalls.filter(c => {
      const matchSearch = !q || c.title.toLowerCase().includes(q) || (c.advisor?.toLowerCase().includes(q)) || (c.summary?.toLowerCase().includes(q)) || c.topics?.some(t => t.toLowerCase().includes(q));
      const matchTopic = !activeTopic || c.topics?.includes(activeTopic);
      return matchSearch && matchTopic;
    });
  }, [sortedCalls, search, activeTopic]);

  const formatDate = (d: string | null) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return d;
  };

  const highlightSnippet = (text: string, query: string): string => {
    if (!query || query.length < 3) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + query.length + 60);
    return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
  };

  if (!isPaid) return <LockScreen />;

  return (
    <div>
      <div className="flex justify-between items-end" style={{ marginBottom: 16 }}>
        <div>
          <div className="font-display" style={{ fontSize: 24, color: C.text }}>Coaching call archive</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{calls.length} calls searchable by topic, advisor, or keyword</div>
        </div>
        <div className="flex gap-1">
          <span onClick={() => setSortOrder('newest')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: `1px solid ${sortOrder === 'newest' ? C.text : C.border}`, background: sortOrder === 'newest' ? C.text : 'transparent', color: sortOrder === 'newest' ? C.bg : C.muted, cursor: 'pointer' }}>Newest first</span>
          <span onClick={() => setSortOrder('oldest')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: `1px solid ${sortOrder === 'oldest' ? C.text : C.border}`, background: sortOrder === 'oldest' ? C.text : 'transparent', color: sortOrder === 'oldest' ? C.bg : C.muted, cursor: 'pointer' }}>Oldest first</span>
        </div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search calls by keyword, topic, or advisor..." className="w-full font-body outline-none" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.text, boxSizing: 'border-box', marginBottom: 12 }} />

      <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 18 }}>
        <span onClick={() => setActiveTopic(null)} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 4, background: !activeTopic ? C.text : 'transparent', border: `1px solid ${!activeTopic ? C.text : C.border}`, color: !activeTopic ? C.bg : C.muted, cursor: 'pointer' }}>All topics</span>
        {topTopics.map(t => (
          <span key={t} onClick={() => setActiveTopic(activeTopic === t ? null : t)} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 4, background: activeTopic === t ? C.text : 'transparent', border: `1px solid ${activeTopic === t ? C.text : C.border}`, color: activeTopic === t ? C.bg : C.muted, cursor: 'pointer' }}>{t}</span>
        ))}
      </div>

      {(search || activeTopic) && (
        <div style={{ fontSize: 12, color: C.dim, marginBottom: 12 }}>
          {filtered.length} call{filtered.length !== 1 ? 's' : ''} found
          {search && search.length >= 3 && <span> matching &ldquo;{search}&rdquo;</span>}
          {activeTopic && <span> in {activeTopic}</span>}
        </div>
      )}

      {filtered.map(call => {
        const isOpen = expanded === call.id;
        const hasSearchMatch = search.length >= 3 && call.summary?.toLowerCase().includes(search.toLowerCase());
        return (
          <div key={call.id} onClick={() => setExpanded(isOpen ? null : call.id)} style={{ background: C.surface, border: `1px solid ${isOpen ? C.borderHover : C.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 6, cursor: 'pointer' }}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2.5" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.text, fontVariantNumeric: 'tabular-nums', background: C.surfaceAlt, padding: '2px 10px', borderRadius: 4, border: `1px solid ${C.border}` }}>{formatDate(call.date)}</span>
                  <span style={{ fontSize: 12, color: C.purple, fontWeight: 500 }}>{call.advisor}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: C.text, marginBottom: 6 }}>{call.title}</div>
                <div className="flex gap-1 flex-wrap">
                  {call.topics?.slice(0, 4).map((t, i) => (
                    <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.muted }}>{t}</span>
                  ))}
                  {call.topics?.length > 4 && <span style={{ fontSize: 10, color: C.dim, padding: '2px 4px' }}>+{call.topics.length - 4}</span>}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginTop: 4 }}><path d="M3 5l4 4 4-4" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>

            {hasSearchMatch && !isOpen && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 4, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                {highlightSnippet(call.summary!, search)}
              </div>
            )}

            {isOpen && call.summary && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                {call.video_url && (
                  <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
                    <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 6, background: C.purpleBg, border: `1px solid ${C.purpleBorder}` }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={C.purple}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </div>
                    <a href={call.video_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 13, color: C.blue, textDecoration: 'none' }}>Watch recording</a>
                  </div>
                )}
                {call.summary.split('\n\n').map((p, i) => (
                  <p key={i} style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 8, marginTop: 0 }}>{p}</p>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: C.dim, fontSize: 13 }}>No calls match your search.</div>}
    </div>
  );
}
