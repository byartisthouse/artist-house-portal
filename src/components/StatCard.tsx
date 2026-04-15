'use client';

interface StatCardProps {
  value: number | string;
  label: string;
  color?: string;
}

export default function StatCard({ value, label, color = '#E8E4DC' }: StatCardProps) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg" style={{ padding: '14px 16px' }}>
      <div className="font-display" style={{ fontSize: 22, color }}>{value}</div>
      <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5850', marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}
