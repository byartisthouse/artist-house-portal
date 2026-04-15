'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { G } from '@/lib/growth/colors';

interface MockSequence {
  id: string;
  name: string;
  status: 'Active' | 'Paused' | 'Draft';
  sent: number;
  opened: number;
  replied: number;
  converted: number;
}

// Placeholder DM sequences — replace with real data from your DM automation tool
const MOCK_SEQUENCES: MockSequence[] = [
  { id: '1', name: 'Cold Outreach — IG Artists 10k-50k', status: 'Active', sent: 847, opened: 312, replied: 89, converted: 14 },
  { id: '2', name: 'TikTok Creators — Music Niche', status: 'Active', sent: 523, opened: 198, replied: 61, converted: 8 },
  { id: '3', name: 'Re-engagement — 30d No Reply', status: 'Paused', sent: 210, opened: 77, replied: 19, converted: 2 },
  { id: '4', name: 'Warm Follow-up — Opened Not Replied', status: 'Active', sent: 134, opened: 98, replied: 44, converted: 11 },
];

function pct(a: number, b: number) {
  return b === 0 ? '—' : `${((a / b) * 100).toFixed(1)}%`;
}

function StatusBadge({ status }: { status: MockSequence['status'] }) {
  const map = {
    Active: { color: G.accent, bg: G.accentBg, border: G.accentBorder },
    Paused: { color: G.amber, bg: G.amberBg, border: 'rgba(245,158,11,0.25)' },
    Draft: { color: G.muted, bg: G.surfaceAlt, border: G.border },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontWeight: 500, letterSpacing: '0.04em' }}>
      {status}
    </span>
  );
}

export default function AdminDMPage() {
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();

      if (profile?.role !== 'Admin') setAccessDenied(true);
      setLoading(false);
    }
    checkRole();
  }, [router]);

  if (loading) return null;

  if (accessDenied) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: G.text, marginBottom: 4 }}>Access Restricted</div>
          <div style={{ fontSize: 13, color: G.muted }}>DM Automation is visible to Admins only.</div>
        </div>
      </div>
    );
  }

  const totalSent = MOCK_SEQUENCES.reduce((s, seq) => s + seq.sent, 0);
  const totalOpened = MOCK_SEQUENCES.reduce((s, seq) => s + seq.opened, 0);
  const totalReplied = MOCK_SEQUENCES.reduce((s, seq) => s + seq.replied, 0);
  const totalConverted = MOCK_SEQUENCES.reduce((s, seq) => s + seq.converted, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: G.text, letterSpacing: '-0.02em' }}>DM Automation</div>
          <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: G.purpleBg, border: `1px solid rgba(168,85,247,0.25)`, color: G.purple, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin Only</span>
        </div>
        <div style={{ fontSize: 13, color: G.muted }}>Monitor AI-driven outreach sequences and lead conversion</div>
      </div>

      {/* Summary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total DMs Sent', value: totalSent.toLocaleString(), sub: 'across all sequences' },
          { label: 'Open Rate', value: pct(totalOpened, totalSent), sub: `${totalOpened.toLocaleString()} opened` },
          { label: 'Reply Rate', value: pct(totalReplied, totalSent), sub: `${totalReplied.toLocaleString()} replied` },
          { label: 'Conversion Rate', value: pct(totalConverted, totalReplied), sub: `${totalConverted} converted` },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: G.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 600, color: G.text, letterSpacing: '-0.02em', marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: 11, color: G.dim }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Sequences table */}
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${G.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: G.text }}>Active Sequences</div>
          <button style={{ fontSize: 12, color: G.accent, background: G.accentBg, border: `1px solid ${G.accentBorder}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
            + New sequence
          </button>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 90px 80px 80px 80px 80px', gap: 0, padding: '10px 22px', borderBottom: `1px solid ${G.border}` }}>
          {['Sequence', 'Status', 'Sent', 'Opened', 'Replied', 'Converted'].map(h => (
            <div key={h} style={{ fontSize: 10, color: G.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{h}</div>
          ))}
        </div>

        {MOCK_SEQUENCES.map((seq, i) => (
          <div
            key={seq.id}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 90px 80px 80px 80px 80px',
              padding: '14px 22px',
              borderBottom: i < MOCK_SEQUENCES.length - 1 ? `1px solid ${G.border}` : 'none',
              transition: 'background 0.1s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = G.surfaceAlt)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ fontSize: 13, color: G.text, paddingRight: 16 }}>{seq.name}</div>
            <div><StatusBadge status={seq.status} /></div>
            <div style={{ fontSize: 13, color: G.muted }}>{seq.sent.toLocaleString()}</div>
            <div>
              <span style={{ fontSize: 13, color: G.text }}>{pct(seq.opened, seq.sent)}</span>
              <span style={{ fontSize: 10, color: G.dim, marginLeft: 4 }}>{seq.opened}</span>
            </div>
            <div>
              <span style={{ fontSize: 13, color: G.text }}>{pct(seq.replied, seq.sent)}</span>
              <span style={{ fontSize: 10, color: G.dim, marginLeft: 4 }}>{seq.replied}</span>
            </div>
            <div>
              <span style={{ fontSize: 13, color: seq.converted > 0 ? G.accent : G.muted, fontWeight: seq.converted > 0 ? 500 : 400 }}>
                {seq.converted}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: G.dim }}>
        * Sequence data is a placeholder. Connect your DM automation tool to populate live metrics.
      </div>
    </div>
  );
}
