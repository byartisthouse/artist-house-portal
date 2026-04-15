'use client';

import { C } from '@/lib/colors';

export default function LockScreen() {
  const perks = [
    { color: C.green, title: 'Industry contact databases', desc: 'Search A&R reps, booking agents, and sync supervisors with verified emails, socials, and submission preferences.' },
    { color: C.purple, title: '564+ coaching call recordings', desc: 'Searchable archive of calls with industry advisors covering marketing, branding, ads, mindset, merch, and more.' },
    { color: C.blue, title: 'Full toolkit and resources', desc: 'Curated tools for graphic design, merch, mixing, production, performance, and every part of your career.' },
    { color: C.amber, title: 'Guides and best practices', desc: 'Strategies for social posting, hashtags, TikTok content, release campaigns, and more — written by the people who\'ve done it.' },
    { color: C.coral, title: '4-6 live coaching calls per week', desc: 'Get direct advice from former label execs, award-winning managers, media buyers, and creative directors.' },
  ];

  const plans = [
    { name: 'Indie', price: '$29', period: '/mo', featured: false, highlights: ['All courses and resources', '24/7 Q&A forum', 'Recording database of past calls', 'Weekly trends report'] },
    { name: 'Pro', price: '$59', period: '/mo', featured: true, highlights: ['Everything in Indie', '4-6 live coaching calls/week', 'AI cover art generation', 'Full directories and databases'] },
    { name: 'Icon', price: '$149', period: '/mo', featured: false, highlights: ['Everything in Pro', 'Weekly calls with Natasha Brito', 'Guest speaker sessions', '3% off AUSTERE services'] },
  ];

  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.surfaceAlt, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <div className="font-display" style={{ fontSize: 26, color: C.text, marginBottom: 6 }}>You&apos;ve found the vault.</div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          This resource is available to Artist House members. The artists who take their career seriously enough to invest in real access — not just inspiration, but actual contacts, coaching, and tools.
        </div>
      </div>

      {/* What you unlock */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.dim, marginBottom: 16 }}>What members get access to</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {perks.map((p, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.surfaceAlt, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 1 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 24 }}>
        {plans.map((plan, i) => (
          <div key={i} style={{ background: C.surface, border: `${plan.featured ? '2px' : '1px'} solid ${plan.featured ? C.text : C.border}`, borderRadius: 10, padding: '20px 18px', position: 'relative' }}>
            {plan.featured && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: C.text, color: C.bg, fontSize: 10, fontWeight: 500, padding: '2px 12px', borderRadius: 4 }}>Most popular</div>}
            <div style={{ fontSize: 15, fontWeight: 500, color: C.text, marginBottom: 4 }}>{plan.name}</div>
            <div style={{ marginBottom: 12 }}>
              <span className="font-display" style={{ fontSize: 28, color: C.text }}>{plan.price}</span>
              <span style={{ fontSize: 12, color: C.dim }}>{plan.period}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {plan.highlights.map((h, hi) => (
                <div key={hi} className="flex gap-1.5 items-center" style={{ fontSize: 12, color: C.muted }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  {h}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <a
          href="https://www.artisthousekey.com/compare"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', background: C.text, color: C.bg, border: 'none', borderRadius: 8, padding: '14px 36px', fontSize: 15, fontWeight: 500, textDecoration: 'none', fontFamily: 'inherit', marginBottom: 10 }}
        >
          Compare plans and join
        </a>
        <div style={{ fontSize: 12, color: C.dim }}>Cancel anytime. No contracts. No commitments.</div>
      </div>
    </div>
  );
}
