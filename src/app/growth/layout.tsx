'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { G } from '@/lib/growth/colors';
import type { Profile } from '@/lib/growth/types';
import AppLauncher from '@/components/AppLauncher';

function NavItem({ href, label, active, icon }: {
  href: string; label: string; active: boolean; icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        borderRadius: 6,
        background: active ? 'rgba(0,0,0,0.04)' : 'transparent',
        color: active ? G.text : G.muted,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        transition: 'all 0.12s',
      }}
    >
      <span style={{ opacity: active ? 1 : 0.5 }}>{icon}</span>
      {label}
    </Link>
  );
}

const icons = {
  dashboard: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  roster: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  tasks: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  notes: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  admin: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  levelup: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

export default function GrowthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data ?? { id: user.id, email: user.email ?? '', full_name: null, role: 'Artist', avatar_url: null, created_at: '' });
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) {
    return (
      <div style={{ background: G.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, color: G.muted }}>Loading...</div>
      </div>
    );
  }

  const role = profile?.role ?? 'Artist';
  const isCoachOrAdmin = role === 'Coach' || role === 'Admin';
  const isAdmin = role === 'Admin';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: G.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <aside style={{
        width: 230,
        background: G.surface,
        borderRight: `1px solid ${G.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        padding: '20px 12px',
        flexShrink: 0,
        overflowY: 'auto',
      }}>
        <div style={{ padding: '0 14px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="font-display" style={{ fontSize: 18, color: G.text }}>Growth Engine</div>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: G.accent }}>by AUSTERE</div>
          </div>
          <AppLauncher />
        </div>

        <div style={{ padding: '0 14px', marginBottom: 16 }}>
          <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: G.accentBg, border: `1px solid ${G.accentBorder}`, color: G.accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {role}
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavItem href="/growth/dashboard" label="Dashboard" active={pathname === '/growth' || pathname === '/growth/dashboard'} icon={icons.dashboard} />
          {isCoachOrAdmin && (
            <NavItem href="/growth/roster" label="Roster" active={pathname.startsWith('/growth/roster')} icon={icons.roster} />
          )}
          <NavItem href="/growth/tasks" label="Tasks" active={pathname.startsWith('/growth/tasks')} icon={icons.tasks} />
          <NavItem href="/growth/notes" label="Notes" active={pathname.startsWith('/growth/notes')} icon={icons.notes} />
          {role === 'Artist' && (
            <NavItem href="/growth/level-up" label="Level Up" active={pathname.startsWith('/growth/level-up')} icon={icons.levelup} />
          )}
          {isAdmin && (
            <>
              <div style={{ height: 1, background: G.border, margin: '8px 14px' }} />
              <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: G.dim, padding: '4px 14px' }}>Admin</div>
              <NavItem href="/growth/admin" label="DM Automation" active={pathname.startsWith('/growth/admin')} icon={icons.admin} />
            </>
          )}
        </nav>

        <div className="mt-auto" style={{ borderTop: `1px solid ${G.border}`, paddingTop: 12, padding: '12px 14px 0' }}>
          <div style={{ fontSize: 12, color: G.muted }}>{profile?.full_name ?? 'Artist'}</div>
          <div style={{ fontSize: 11, color: G.dim, marginTop: 1, marginBottom: 8 }}>{profile?.email}</div>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.replace('/'); }}
            style={{ fontSize: 11, color: G.dim, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '28px 36px', maxWidth: 860, background: G.bg }}>
        {children}
      </main>
    </div>
  );
}
