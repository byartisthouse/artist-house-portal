'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { C } from '@/lib/colors';

interface Counts { coaching: number; contacts: number; sync: number; tools: number; guides: number; }

function SideItem({ href, label, active, badge, locked }: {
  href: string; label: string; active: boolean; badge?: string; locked?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5 no-underline" style={{ padding: '8px 14px', borderRadius: 6, background: active ? C.accentSoft : 'transparent', color: locked ? C.dim : active ? C.text : C.muted, fontSize: 13, transition: 'all 0.12s', opacity: locked ? 0.6 : 1 }}>
      <span className="flex-1">{label}</span>
      {locked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.lock} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      )}
      {!locked && badge && <span style={{ fontSize: 10, color: C.dim, background: C.surfaceAlt, padding: '1px 6px', borderRadius: 3 }}>{badge}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isPaid, isAdmin, setIsAdmin, memberTier, setMemberTier, setSignedIn } = useAuth();
  const [counts, setCounts] = useState<Counts>({ coaching: 0, contacts: 0, sync: 0, tools: 0, guides: 0 });

  useEffect(() => {
    async function loadCounts() {
      const [coaching, contacts, sync, tools, guides] = await Promise.all([
        supabase.from('coaching_calls').select('id', { count: 'exact', head: true }),
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
        supabase.from('sync_companies').select('id', { count: 'exact', head: true }),
        supabase.from('tools').select('id', { count: 'exact', head: true }),
        supabase.from('guides').select('id', { count: 'exact', head: true }),
      ]);
      setCounts({ coaching: coaching.count ?? 0, contacts: contacts.count ?? 0, sync: sync.count ?? 0, tools: tools.count ?? 0, guides: guides.count ?? 0 });
    }
    loadCounts();
  }, []);

  return (
    <aside className="flex flex-col shrink-0 overflow-y-auto" style={{ width: 230, borderRight: `1px solid ${C.border}`, position: 'sticky', top: 0, height: '100vh', background: C.surface, padding: '20px 12px' }}>
      <div style={{ padding: '0 14px', marginBottom: 20 }}>
        <div className="font-display" style={{ fontSize: 18, color: C.text }}>Artist House</div>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.dim }}>Resources</div>
      </div>

      {/* Admin tier switcher */}
      {isAdmin && (
        <div className="flex gap-1" style={{ margin: '0 8px 12px' }}>
          <span onClick={() => setMemberTier('paid')} style={{ flex: 1, textAlign: 'center', fontSize: 10, padding: '5px 0', borderRadius: 4, border: `1px solid ${memberTier === 'paid' ? C.green : C.border}`, background: memberTier === 'paid' ? C.greenBg : 'transparent', color: memberTier === 'paid' ? C.green : C.dim, cursor: 'pointer' }}>Paid member</span>
          <span onClick={() => setMemberTier('free')} style={{ flex: 1, textAlign: 'center', fontSize: 10, padding: '5px 0', borderRadius: 4, border: `1px solid ${memberTier === 'free' ? C.amber : C.border}`, background: memberTier === 'free' ? C.amberBg : 'transparent', color: memberTier === 'free' ? C.amber : C.dim, cursor: 'pointer' }}>Free member</span>
        </div>
      )}

      {/* Admin toggle */}
      <div onClick={() => setIsAdmin(!isAdmin)} style={{ margin: '0 8px 16px', padding: '8px 12px', borderRadius: 6, background: isAdmin ? C.greenBg : C.surfaceAlt, border: `1px solid ${isAdmin ? C.greenBorder : C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: isAdmin ? C.green : C.muted }}>{isAdmin ? 'Admin view' : 'Member view'}</div>
        <div style={{ width: 28, height: 16, borderRadius: 8, background: isAdmin ? C.green : '#D4D4D0', position: 'relative' }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#FFF', position: 'absolute', top: 2, left: isAdmin ? 14 : 2, transition: 'left 0.2s' }} />
        </div>
      </div>

      <SideItem href="/" label="Dashboard" active={pathname === '/'} />

      <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.dim, padding: '12px 14px 4px' }}>Course</div>
      <SideItem href="/blueprint" label="Iconic Artist Blueprint" active={pathname === '/blueprint'} />

      <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.dim, padding: '12px 14px 4px' }}>Directories</div>
      <SideItem href="/ar" label="A&R contacts" active={pathname === '/ar'} locked={!isPaid} badge={isPaid && counts.contacts ? String(counts.contacts) : undefined} />
      <SideItem href="/coaching" label="Coaching archive" active={pathname === '/coaching'} locked={!isPaid} badge={isPaid && counts.coaching ? String(counts.coaching) : undefined} />
      <SideItem href="/sync" label="Sync databases" active={pathname === '/sync'} locked={!isPaid} />

      <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.dim, padding: '12px 14px 4px' }}>Resources</div>
      <SideItem href="/toolkit" label="Toolkit" active={pathname === '/toolkit'} locked={!isPaid} />
      <SideItem href="/guides" label="Guides" active={pathname === '/guides'} locked={!isPaid} />
      <SideItem href="/templates" label="Templates" active={pathname === '/templates'} locked={!isPaid} />
      <SideItem href="/funding" label="Funding" active={pathname === '/funding'} />

      {/* Bottom */}
      <div className="mt-auto" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, padding: '12px 14px 0' }}>
        <a href="https://www.artisthousekey.com/product/one-on-one-consulting" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.muted, textDecoration: 'none', display: 'block', marginBottom: 6 }}>Book a consulting call</a>
        <a href="https://www.byaustere.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.muted, textDecoration: 'none', display: 'block', marginBottom: 12 }}>Discover AUSTERE</a>
        <div style={{ fontSize: 11, color: C.dim }}>Signed in as</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Member</div>
        <div style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>{isPaid ? 'Pro plan' : 'Free tier'}</div>
        <span onClick={() => { supabase.auth.signOut(); setSignedIn(false); }} style={{ fontSize: 11, color: C.dim, cursor: 'pointer', marginTop: 8, display: 'inline-block', textDecoration: 'underline' }}>Sign out</span>
      </div>
    </aside>
  );
}
