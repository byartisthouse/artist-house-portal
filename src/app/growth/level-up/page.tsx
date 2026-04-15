'use client';

import { G } from '@/lib/growth/colors';

const services = [
  {
    title: '1-on-1 Consulting',
    description: 'Immediate strategy and clarity with our advisors. Ideal for release planning, social strategy, or career direction.',
    price: '$300 / session',
    cta: 'Book a call',
    href: 'https://www.artisthousekey.com/product/one-on-one-consulting',
    color: G.accent, bg: G.accentBg, border: G.accentBorder,
  },
  {
    title: 'Full-Service Marketing',
    description: 'AUSTERE handles everything — creative, playlisting, PR, advertising, and brand strategy for serious artists.',
    price: 'Custom',
    cta: 'Discover AUSTERE',
    href: 'https://www.byaustere.com',
    color: G.purple, bg: G.purpleBg, border: G.purpleBorder,
  },
  {
    title: 'Artist House Membership',
    description: 'Access our community of artists, resources, workshops, and ongoing support from the Artist House team.',
    price: 'Included',
    cta: 'Go to portal',
    href: '/',
    color: G.blue, bg: G.blueBg, border: G.blueBorder,
  },
  {
    title: 'Growth Engine Pro',
    description: 'Automated social syncing, AI-generated insights, and advanced analytics coming soon.',
    price: 'Coming soon',
    cta: null, href: null,
    color: G.dim, bg: G.surfaceAlt, border: G.border,
    comingSoon: true,
  },
];

export default function LevelUpPage() {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: G.accent, marginBottom: 10 }}>by AUSTERE</div>
        <div style={{ fontSize: 26, fontWeight: 600, color: G.text, letterSpacing: '-0.02em', marginBottom: 8 }}>Take your career to the next level</div>
        <div style={{ fontSize: 14, color: G.muted, lineHeight: 1.7, maxWidth: 560 }}>You've got the talent. We've got the tools, team, and strategy to get you there. Choose the level of support that fits where you are right now.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
        {services.map(s => (
          <div key={s.title} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: '24px 24px', display: 'flex', flexDirection: 'column', opacity: s.comingSoon ? 0.65 : 1, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.color, borderRadius: '14px 14px 0 0' }} />
            {s.comingSoon && (
              <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 9, padding: '2px 8px', borderRadius: 4, background: G.surfaceAlt, border: `1px solid ${G.border}`, color: G.dim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Soon</div>
            )}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.color, marginBottom: 10, marginTop: 8 }}>{s.price}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: G.text, marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 13, color: G.muted, lineHeight: 1.65, flex: 1, marginBottom: 20 }}>{s.description}</div>
            {s.cta && s.href ? (
              <a href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '9px 16px', textDecoration: 'none', alignSelf: 'flex-start' }}>
                {s.cta} →
              </a>
            ) : (
              <div style={{ fontSize: 13, color: G.dim, fontStyle: 'italic' }}>Notify me when available</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: G.text, marginBottom: 4 }}>Not sure where to start?</div>
          <div style={{ fontSize: 13, color: G.muted }}>Book a free 15-minute intro call and we'll point you in the right direction.</div>
        </div>
        <a href="https://www.artisthousekey.com/product/one-on-one-consulting" target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, marginLeft: 24, fontSize: 13, fontWeight: 500, color: G.bg, background: G.accent, borderRadius: 8, padding: '10px 20px', textDecoration: 'none' }}>
          Book free intro →
        </a>
      </div>
    </div>
  );
}
