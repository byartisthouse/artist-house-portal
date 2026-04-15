'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { C } from '@/lib/colors';

const apps = [
  {
    name: 'Artist House Portal',
    description: 'Resources & community',
    href: '/',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    name: 'Growth Engine',
    description: 'Analytics & artist CRM',
    href: '/growth',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
];

export default function AppLauncher() {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, left: rect.left });
    }
    setOpen(v => !v);
  }

  const isGrowth = pathname.startsWith('/growth');

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="Switch app"
        style={{
          width: 30,
          height: 30,
          border: `1px solid ${open ? C.borderHover : C.border}`,
          borderRadius: 6,
          background: open ? C.surfaceAlt : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          transition: 'all 0.12s',
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill={C.muted}>
          {[0, 1, 2].map(row =>
            [0, 1, 2].map(col => (
              <circle key={`${row}-${col}`} cx={2 + col * 5} cy={2 + row * 5} r={1.2} />
            ))
          )}
        </svg>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: 240,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          <div style={{ padding: '10px 12px 6px', fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.dim }}>
            Switch app
          </div>
          {apps.map(app => {
            const active = app.href === '/' ? !isGrowth : pathname.startsWith(app.href);
            return (
              <Link
                key={app.href}
                href={app.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  textDecoration: 'none',
                  background: active ? C.accentSoft : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = C.surfaceAlt; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = active ? C.accentSoft : 'transparent'; }}
              >
                <div style={{ color: active ? C.text : C.muted, flexShrink: 0 }}>{app.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: active ? 500 : 400, color: active ? C.text : C.muted }}>{app.name}</div>
                  <div style={{ fontSize: 11, color: C.dim }}>{app.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
