'use client';

import { C } from '@/lib/colors';

const FUNDING = [
  { name: 'Indify', description: 'Funding and services for independent artists. Get advances based on your streaming data without giving up ownership.', url: 'https://artistsarefounders.com', color: C.green },
  { name: 'Beatbread', description: 'Non-recoupable funding for musicians. Data-driven offers based on your catalog performance. Keep your masters.', url: 'https://beatbread.com', color: C.blue },
];

export default function FundingPage() {
  return (
    <div>
      <div className="font-display" style={{ fontSize: 24, color: C.text, marginBottom: 4 }}>Funding resources</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Artist-friendly funding options that let you keep your rights</div>
      {FUNDING.map((f, i) => (
        <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '22px 24px', marginBottom: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: C.text, marginBottom: 6 }}>{f.name}</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 14 }}>{f.description}</div>
          <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: C.text, color: C.bg, borderRadius: 5, padding: '8px 18px', fontSize: 12, fontWeight: 500, textDecoration: 'none', fontFamily: 'inherit' }}>Visit {f.name} →</a>
        </div>
      ))}
    </div>
  );
}
