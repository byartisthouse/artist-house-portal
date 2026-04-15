'use client';

interface TagProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  border?: string;
  onClick?: () => void;
  active?: boolean;
}

export default function Tag({ children, color, bg, border, onClick, active }: TagProps) {
  return (
    <span
      onClick={onClick}
      className="inline-flex items-center gap-1 whitespace-nowrap font-body"
      style={{
        fontSize: 10,
        padding: '3px 10px',
        borderRadius: 3,
        background: active ? (bg || 'rgba(232,228,220,0.08)') : (bg || 'transparent'),
        border: `0.5px solid ${active ? (border || '#E8E4DC') : (border || 'rgba(255,255,255,0.06)')}`,
        color: active ? (color || '#E8E4DC') : (color || '#5A5850'),
        cursor: onClick ? 'pointer' : 'default',
        letterSpacing: '0.04em',
        transition: 'all 0.12s',
      }}
    >
      {children}
    </span>
  );
}
