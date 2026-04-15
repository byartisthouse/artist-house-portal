'use client';

import { useAuth } from '@/lib/auth';
import { C } from '@/lib/colors';
import LockScreen from '@/components/LockScreen';

export default function TemplatesPage() {
  const { isPaid } = useAuth();

  if (!isPaid) return <LockScreen />;

  return (
    <div>
      <div className="font-display" style={{ fontSize: 24, color: C.text, marginBottom: 16 }}>Templates</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <a href="https://austere.notion.site/EPK-Template-1ed102bc91cf8004b7cfd77caf239c20?pvs=74" target="_blank" rel="noopener noreferrer" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>EPK Template</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Professional electronic press kit — plug in your info and send</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
        {[['Content Calendar', 'Monthly content planning spreadsheet'], ['Release Checklist', 'Pre-release, release week, and post-release tasks']].map(([t, d], i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', opacity: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{t}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{d}</div>
            </div>
            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 4, background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.dim }}>Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
