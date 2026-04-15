'use client';

import { highlightSnippet } from '@/lib/utils';

export interface CoachingCall {
  id: number;
  date: string | null;
  title: string;
  advisor: string | null;
  video_url: string | null;
  topics: string[];
  summary: string | null;
}

interface CoachingCardProps {
  call: CoachingCall;
  expanded: boolean;
  onToggle: () => void;
  search: string;
  activeTopic: string | null;
  onTopicClick: (topic: string) => void;
}

export default function CoachingCard({
  call,
  expanded,
  onToggle,
  search,
  activeTopic,
  onTopicClick,
}: CoachingCardProps) {
  const hasSearchMatch =
    search.length >= 3 && call.summary?.toLowerCase().includes(search.toLowerCase());

  const formatDate = (d: string | null) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return d;
  };

  return (
    <div
      style={{
        background: expanded ? '#161616' : '#111111',
        border: `0.5px solid ${expanded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 8,
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      <div onClick={onToggle} style={{ padding: '16px 20px', cursor: 'pointer' }}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5" style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: '#5A5850', fontVariantNumeric: 'tabular-nums' }}>{formatDate(call.date)}</div>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#5A5850' }} />
              <div style={{ fontSize: 11, color: '#C4A0F5' }}>{call.advisor}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#F0EDE6', marginBottom: 6 }}>{call.title}</div>
            <div className="flex gap-1 flex-wrap">
              {call.topics.slice(0, 4).map((t, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 3,
                    background: activeTopic === t ? 'rgba(232,196,106,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `0.5px solid ${activeTopic === t ? 'rgba(232,196,106,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    color: activeTopic === t ? '#E8C46A' : '#5A5850',
                  }}
                >
                  {t}
                </span>
              ))}
              {call.topics.length > 4 && (
                <span style={{ fontSize: 10, color: '#5A5850', padding: '2px 4px' }}>
                  +{call.topics.length - 4}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1.5 items-center shrink-0">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.3 }}
            >
              <path d="M2 4l4 4 4-4" fill="none" stroke="#8A8880" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {hasSearchMatch && !expanded && (
          <div
            style={{
              marginTop: 10,
              padding: '10px 14px',
              background: 'rgba(232,196,106,0.04)',
              border: '0.5px solid rgba(232,196,106,0.2)',
              borderRadius: 4,
              fontSize: 12,
              color: '#8A8880',
              lineHeight: 1.6,
            }}
          >
            {highlightSnippet(call.summary!, search)}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          {/* Video link */}
          {call.video_url && (
            <div className="flex items-center gap-2.5" style={{ padding: '14px 0 16px' }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: 'rgba(196,160,245,0.08)',
                  border: '0.5px solid rgba(196,160,245,0.2)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#C4A0F5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#F0EDE6' }}>Watch recording</div>
                <a
                  href={call.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: 11, color: '#6B9FD4', textDecoration: 'none' }}
                >
                  {call.video_url.length > 60 ? call.video_url.slice(0, 60) + '...' : call.video_url}
                </a>
              </div>
            </div>
          )}

          {/* All topics */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5850', marginBottom: 6 }}>
              Topics covered
            </div>
            <div className="flex gap-1 flex-wrap">
              {call.topics.map((t, i) => (
                <span
                  key={i}
                  onClick={(e) => { e.stopPropagation(); onTopicClick(t); }}
                  style={{
                    fontSize: 10,
                    padding: '3px 10px',
                    borderRadius: 3,
                    background: 'rgba(232,196,106,0.08)',
                    border: '0.5px solid rgba(232,196,106,0.2)',
                    color: '#E8C46A',
                    cursor: 'pointer',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Summary */}
          {call.summary && (
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5850', marginBottom: 8 }}>
                Summary
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 6, padding: '16px 18px' }}>
                {call.summary.split('\n\n').map((p, i) => (
                  <p key={i} style={{ fontSize: 13, color: '#8A8880', lineHeight: 1.7, marginBottom: 10, marginTop: 0 }}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
