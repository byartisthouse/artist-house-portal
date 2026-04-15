'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { C } from '@/lib/colors';
import Link from 'next/link';

interface Counts { coaching: number; contacts: number; sync: number; tools: number; }

export default function Dashboard() {
  const { isPaid } = useAuth();
  const [counts, setCounts] = useState<Counts>({ coaching: 0, contacts: 0, sync: 0, tools: 0 });

  useEffect(() => {
    async function load() {
      const [coaching, contacts, sync, tools] = await Promise.all([
        supabase.from('coaching_calls').select('id', { count: 'exact', head: true }),
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
        supabase.from('sync_companies').select('id', { count: 'exact', head: true }),
        supabase.from('tools').select('id', { count: 'exact', head: true }),
      ]);
      setCounts({ coaching: coaching.count ?? 0, contacts: contacts.count ?? 0, sync: sync.count ?? 0, tools: tools.count ?? 0 });
    }
    load();
  }, []);

  const paidQuickAccess = [
    { title: 'A&R contacts', desc: 'Search label A&Rs with verified emails', href: '/ar' },
    { title: 'Coaching archive', desc: `${counts.coaching} calls searchable by topic`, href: '/coaching' },
    { title: 'Sync databases', desc: 'Licensing companies accepting submissions', href: '/sync' },
    { title: 'Toolkit', desc: 'Curated tools for every part of your career', href: '/toolkit' },
  ];

  const freeQuickAccess = [
    { title: 'A&R contacts', desc: 'Label contacts with verified emails' },
    { title: 'Coaching archive', desc: '564+ coaching call recordings' },
    { title: 'Sync databases', desc: '100+ licensing companies' },
    { title: 'Toolkit', desc: '20+ curated industry tools' },
  ];

  return (
    <div>
      <div className="font-display" style={{ fontSize: 28, color: C.text, marginBottom: 4 }}>Welcome back</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>Your Artist House resources</div>

      {/* Member resources quick access */}
      <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.dim, marginBottom: 10 }}>Member resources</div>
      {isPaid ? (
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginBottom: 28 }}>
          {paidQuickAccess.map((item, i) => (
            <Link key={i} href={item.href} className="no-underline" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px', cursor: 'pointer', display: 'block', transition: 'border-color 0.15s' }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 3 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>{item.desc}</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginBottom: 28 }}>
          {freeQuickAccess.map((item, i) => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px', opacity: 0.5, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 10, right: 10 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.lock} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 3 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Consulting CTAs */}
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>Stuck? Get direction, directly.</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 12 }}>One-on-one consulting with our advisors. Immediate strategy and clarity. $300 per session.</div>
          <a href="https://www.artisthousekey.com/product/one-on-one-consulting" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: C.text, color: C.bg, borderRadius: 5, padding: '8px 18px', fontSize: 12, fontWeight: 500, textDecoration: 'none', fontFamily: 'inherit' }}>Book a call</a>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>Need a team behind you?</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 12 }}>AUSTERE handles marketing, creative, playlisting, PR, and ad strategy for artists and labels.</div>
          <a href="https://www.byaustere.com" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: C.text, color: C.bg, borderRadius: 5, padding: '8px 18px', fontSize: 12, fontWeight: 500, textDecoration: 'none', fontFamily: 'inherit' }}>Discover AUSTERE</a>
        </div>
      </div>
    </div>
  );
}
