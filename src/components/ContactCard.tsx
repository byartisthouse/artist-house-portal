'use client';

import { getInitials, nameHue } from '@/lib/utils';
import Tag from './Tag';

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; border: string }> = {
  not_contacted: { label: 'Not contacted', dot: '#555', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
  reached_out: { label: 'Reached out', dot: '#6B9FD4', bg: 'rgba(107,159,212,0.08)', border: 'rgba(107,159,212,0.2)' },
  responded: { label: 'Responded', dot: '#5DCAA5', bg: 'rgba(93,202,165,0.08)', border: 'rgba(93,202,165,0.2)' },
  meeting: { label: 'Meeting', dot: '#C4A0F5', bg: 'rgba(196,160,245,0.08)', border: 'rgba(196,160,245,0.2)' },
  passed: { label: 'Passed', dot: '#E07A5F', bg: 'rgba(224,122,95,0.08)', border: 'rgba(224,122,95,0.2)' },
};

export interface Contact {
  id: number;
  name: string;
  title: string | null;
  label_name: string | null;
  parent_company: string | null;
  genre: string | null;
  email: string | null;
  email_confidence: number | null;
  linkedin: string | null;
  instagram: string | null;
  twitter: string | null;
  recent_signing: string | null;
  accepts_cold: string | null;
  source: string | null;
  date_found: string | null;
  verified: boolean;
  notes: string | null;
}

interface ContactCardProps {
  contact: Contact;
  expanded: boolean;
  onToggle: () => void;
  saved: boolean;
  onSave: (e: React.MouseEvent) => void;
  outreachStatus: string;
  onStatusChange: (status: string) => void;
}

export default function ContactCard({
  contact: c,
  expanded,
  onToggle,
  saved,
  onSave,
  outreachStatus,
  onStatusChange,
}: ContactCardProps) {
  const hue = nameHue(c.name);
  const st = STATUS_MAP[outreachStatus] || STATUS_MAP.not_contacted;

  return (
    <div
      onClick={onToggle}
      style={{
        background: expanded ? '#161616' : '#111111',
        border: `0.5px solid ${expanded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 6,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex gap-3.5 flex-1 min-w-0">
          <div
            className="shrink-0 flex items-center justify-center font-body"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: `hsl(${hue}, 15%, 18%)`,
              fontSize: 13,
              fontWeight: 500,
              color: `hsl(${hue}, 20%, 60%)`,
              letterSpacing: '0.04em',
            }}
          >
            {getInitials(c.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 15, fontWeight: 500, color: '#F0EDE6', marginBottom: 1 }}>{c.name}</div>
            <div style={{ fontSize: 13, color: '#8A8880', marginBottom: 5 }}>{c.title}</div>
            <div className="flex gap-2.5 flex-wrap items-center" style={{ fontSize: 12, color: '#5A5850' }}>
              <span style={{ fontWeight: 500, color: '#8A8880' }}>{c.label_name}</span>
              {c.parent_company && (
                <>
                  <span style={{ opacity: 0.3 }}>/</span>
                  <span>{c.parent_company}</span>
                </>
              )}
              {c.genre && (
                <>
                  <span style={{ opacity: 0.3 }}>/</span>
                  <span>{c.genre}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex gap-1.5 flex-wrap justify-end">
            <Tag color={st.dot} bg={st.bg} border={st.border}>
              <span
                className="inline-block rounded-full"
                style={{ width: 5, height: 5, background: st.dot, marginRight: 4 }}
              />
              {st.label}
            </Tag>
            {c.verified && <Tag color="#5DCAA5" bg="rgba(93,202,165,0.08)" border="rgba(93,202,165,0.2)">Verified</Tag>}
            {c.accepts_cold === 'Yes' && <Tag color="#6B9FD4" bg="rgba(107,159,212,0.06)" border="rgba(107,159,212,0.15)">Accepts cold</Tag>}
            {c.accepts_cold === 'Referral only' && <Tag color="#5A5850" bg="rgba(232,228,220,0.06)" border="rgba(232,228,220,0.1)">Referral only</Tag>}
          </div>
          <button
            onClick={onSave}
            style={{
              fontSize: 10,
              padding: '3px 10px',
              borderRadius: 3,
              background: saved ? 'rgba(232,228,220,0.1)' : 'transparent',
              border: `0.5px solid ${saved ? '#E8E4DC' : 'rgba(255,255,255,0.06)'}`,
              color: saved ? '#E8E4DC' : '#5A5850',
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.04em',
            }}
          >
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          className="grid gap-3 mt-4 pt-3.5"
          style={{
            borderTop: '0.5px solid rgba(255,255,255,0.06)',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5850', marginBottom: 2 }}>Email</div>
            <div style={{ fontSize: 13, color: c.email ? '#6B9FD4' : '#5A5850', fontStyle: c.email ? 'normal' : 'italic' }}>
              {c.email || 'Not enriched yet'}
              {c.email_confidence != null && (
                <span style={{ fontSize: 11, marginLeft: 6, color: c.email_confidence > 85 ? '#5DCAA5' : '#E8C46A' }}>
                  {c.email_confidence}%
                </span>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5850', marginBottom: 2 }}>LinkedIn</div>
            <div style={{ fontSize: 13, color: '#6B9FD4' }}>{c.linkedin || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5850', marginBottom: 2 }}>Instagram</div>
            <div style={{ fontSize: 13, color: '#8A8880' }}>{c.instagram || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5850', marginBottom: 2 }}>Twitter / X</div>
            <div style={{ fontSize: 13, color: '#8A8880' }}>{c.twitter || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5850', marginBottom: 2 }}>Source</div>
            <div style={{ fontSize: 13, color: '#8A8880' }}>
              {c.source || '—'}
              {c.date_found && <span style={{ color: '#5A5850', fontSize: 11, marginLeft: 6 }}>{c.date_found}</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5850', marginBottom: 2 }}>Outreach status</div>
            <select
              value={outreachStatus}
              onChange={(e) => { e.stopPropagation(); onStatusChange(e.target.value); }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#111111',
                border: '0.5px solid rgba(255,255,255,0.06)',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 12,
                color: '#F0EDE6',
                fontFamily: 'inherit',
              }}
            >
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5850', marginBottom: 2 }}>Notes</div>
            <div style={{ fontSize: 13, color: '#8A8880' }}>{c.notes || '—'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
