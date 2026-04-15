'use client';

import { useState } from 'react';
import { C } from '@/lib/colors';

const BLUEPRINT_DATA = [
  { category: 'Directories', items: [
    { name: 'YouTube Shorts Tags Per Genre', type: 'content' as const, content: 'Comprehensive tags lists organized by genre: Pop, Afropop/African, Indie Electronic, Metal, and more. Each genre includes core keywords, artist references, viral hashtags, mood-based keywords, and algorithm-triggering terms optimized for YouTube Shorts discovery.' },
    { name: '100+ Viral Hooks For Musicians', type: 'content' as const, content: 'Hook templates for social video organized by type: Controversial hooks that challenge norms, Promise hooks offering immediate value, Direct Address hooks that stop the scroll, Experience-Based hooks drawing on personal stories, and Curiosity hooks that tease information. Over 100 ready-to-use templates.' },
    { name: 'Sync Pitching Resources', type: 'link' as const, url: '/sync', desc: 'See Sync Databases section' },
  ]},
  { category: 'Social media tools', items: [
    { name: 'Later', desc: 'Social media management', url: 'later.com', type: 'link' as const },
    { name: 'Preview App', desc: 'Instagram feed planner', url: 'thepreviewapp.com', type: 'link' as const },
    { name: '12 Month Artist Calendar', desc: 'Google Sheets template', url: 'docs.google.com', type: 'link' as const },
  ]},
  { category: 'Registering music', items: [
    { name: 'SoundExchange', desc: 'Digital performance royalties', url: 'soundexchange.com', type: 'link' as const },
    { name: 'Songtrust', desc: 'Publishing administration', url: 'songtrust.com', type: 'link' as const },
  ]},
  { category: 'Sync pitching', items: [
    { name: 'Bodega Sync', desc: 'Sync representation', url: 'bodegasync.com', type: 'link' as const },
    { name: 'TAXI', desc: 'A&R music service', url: 'taxi.com', type: 'link' as const },
    { name: 'DISCO', desc: 'Music management platform', url: 'disco.ac', type: 'link' as const },
    { name: 'Swayzio', desc: 'AI music storage & sharing', url: 'swayzio.com', type: 'link' as const },
  ]},
  { category: 'Video + photo editing', items: [
    { name: 'VSCO', desc: 'Photo & video editing', url: 'vsco.co', type: 'link' as const },
    { name: 'Unfold', desc: 'Story templates', url: 'unfold.com', type: 'link' as const },
  ]},
  { category: 'Links + websites', items: [
    { name: 'Linktree', desc: 'Link in bio', url: 'linktr.ee', type: 'link' as const },
    { name: 'Bitly', desc: 'URL shortener', url: 'bit.ly', type: 'link' as const },
    { name: 'Squarespace', desc: 'Website builder', url: 'squarespace.com', type: 'link' as const },
  ]},
  { category: 'Automation', items: [
    { name: 'Zapier', desc: 'Workflow automation', url: 'zapier.com', type: 'link' as const },
  ]},
  { category: 'YouTube', items: [
    { name: 'TubeBuddy', desc: 'YouTube channel toolkit', url: 'tubebuddy.com', type: 'link' as const },
  ]},
];

export default function BlueprintPage() {
  const [expandedContent, setExpandedContent] = useState<string | null>(null);

  return (
    <div>
      <div className="font-display" style={{ fontSize: 24, color: C.text, marginBottom: 4 }}>Iconic Artist Blueprint</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Course materials, directories, templates, and tools</div>

      {BLUEPRINT_DATA.map((cat, ci) => (
        <div key={ci} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.dim, marginBottom: 10 }}>{cat.category}</div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {cat.items.map((item, ii) => {
              const isContent = item.type === 'content';
              const isExpanded = expandedContent === item.name;
              const isInternal = 'url' in item && item.url?.startsWith('/');

              return (
                <div key={ii} style={{ gridColumn: isContent && isExpanded ? '1 / -1' : undefined }}>
                  <div
                    onClick={() => {
                      if (isContent) setExpandedContent(isExpanded ? null : item.name);
                      else if (!isInternal && 'url' in item && item.url) window.open(item.url.startsWith('http') ? item.url : `https://${item.url}`, '_blank');
                    }}
                    style={{ padding: '12px 16px', background: C.surface, borderRadius: 8, border: `1px solid ${isExpanded ? C.borderHover : C.border}`, cursor: 'pointer', transition: 'border-color 0.15s' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{item.name}</div>
                        {'desc' in item && item.desc && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{item.desc}</div>}
                      </div>
                      {isContent ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}><path d="M3 5l4 4 4-4" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" style={{ flexShrink: 0 }}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      )}
                    </div>
                    {isContent && isExpanded && 'content' in item && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                        {item.content?.split('\n\n').map((p: string, pi: number) => (
                          <p key={pi} style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 8, marginTop: 0 }}>{p}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
