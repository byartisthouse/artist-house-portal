'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { G } from '@/lib/growth/colors';
import type { Profile, Role } from '@/lib/growth/types';

const ROLES: Role[] = ['Paid Member', 'Free Member', 'Coach', 'Admin'];

const ROLE_COLORS: Record<Role, { bg: string; border: string; color: string }> = {
  'Admin':       { bg: G.purpleBg,  border: G.purpleBorder,  color: G.purple },
  'Coach':       { bg: G.blueBg,    border: G.blueBorder,    color: G.blue },
  'Paid Member': { bg: G.accentBg,  border: G.accentBorder,  color: G.accent },
  'Free Member': { bg: G.surfaceAlt, border: G.border,       color: G.muted },
};

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function RoleBadge({ role }: { role: Role }) {
  const s = ROLE_COLORS[role] ?? ROLE_COLORS['Free Member'];
  return (
    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: s.bg, border: `1px solid ${s.border}`, color: s.color, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {role}
    </span>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }

      const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (myProfile?.role !== 'Admin') { router.replace('/growth/dashboard'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      setUsers((data as Profile[]) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function updateRole(userId: string, newRole: Role) {
    setUpdating(userId);
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
    setUpdating(null);
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const counts = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {} as Record<Role, number>);

  if (loading) return <div style={{ fontSize: 13, color: G.muted }}>Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 600, color: G.text, letterSpacing: '-0.02em', marginBottom: 4 }}>Manage Users</div>
        <div style={{ fontSize: 13, color: G.muted }}>{users.length} total users</div>
      </div>

      {/* Role summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {ROLES.map(role => {
          const s = ROLE_COLORS[role];
          return (
            <div key={role} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: G.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{role}</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: s.color }}>{counts[role] ?? 0}</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        style={{
          width: '100%', boxSizing: 'border-box', background: G.surface,
          border: `1px solid ${G.border}`, borderRadius: 8, padding: '10px 14px',
          fontSize: 13, color: G.text, fontFamily: 'inherit', outline: 'none', marginBottom: 16,
        }}
      />

      {/* User table */}
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 140px', gap: 0, padding: '10px 20px', borderBottom: `1px solid ${G.border}`, background: G.surfaceAlt }}>
          {['User', 'Email', 'Joined', 'Role'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 500, color: G.dim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: G.dim }}>
            {users.length === 0 ? 'No users yet.' : 'No users match your search.'}
          </div>
        ) : (
          filtered.map((user, i) => (
            <div
              key={user.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 160px 140px',
                gap: 0, padding: '14px 20px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? `1px solid ${G.border}` : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = G.surfaceAlt)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Name + avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: G.surfaceAlt, border: `1px solid ${G.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, color: G.muted,
                }}>
                  {getInitials(user.full_name)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: G.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name ?? '—'}
                </div>
              </div>

              {/* Email */}
              <div style={{ fontSize: 12, color: G.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 16 }}>
                {user.email}
              </div>

              {/* Joined */}
              <div style={{ fontSize: 12, color: G.dim }}>
                {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>

              {/* Role selector */}
              <div style={{ position: 'relative' }}>
                {updating === user.id ? (
                  <span style={{ fontSize: 12, color: G.muted }}>Saving…</span>
                ) : (
                  <select
                    value={user.role}
                    onChange={e => updateRole(user.id, e.target.value as Role)}
                    style={{
                      fontSize: 12, padding: '4px 8px', borderRadius: 6,
                      background: ROLE_COLORS[user.role]?.bg ?? G.surfaceAlt,
                      border: `1px solid ${ROLE_COLORS[user.role]?.border ?? G.border}`,
                      color: ROLE_COLORS[user.role]?.color ?? G.muted,
                      cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                      appearance: 'none', paddingRight: 24,
                    }}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
