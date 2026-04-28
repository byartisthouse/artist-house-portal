'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { G } from '@/lib/growth/colors';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/growth';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(next);
    });
  }, [router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.replace(next);
    }
  }

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: G.bg,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ width: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: G.text, letterSpacing: '-0.02em', marginBottom: 2 }}>Growth Engine</div>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: G.accent, marginBottom: 32 }}>by AUSTERE</div>

        <div style={{
          background: G.surface,
          border: `1px solid ${G.border}`,
          borderRadius: 12,
          padding: '32px 28px',
          textAlign: 'left',
        }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: G.text, marginBottom: 4 }}>Sign in</div>
          <div style={{ fontSize: 13, color: G.muted, marginBottom: 24 }}>Use your AUSTERE account credentials</div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: G.muted, marginBottom: 4 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: G.surfaceAlt, border: `1px solid ${G.border}`,
                  borderRadius: 6, padding: '10px 12px',
                  fontSize: 13, color: G.text,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: G.muted, marginBottom: 4 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: G.surfaceAlt, border: `1px solid ${G.border}`,
                  borderRadius: 6, padding: '10px 12px',
                  fontSize: 13, color: G.text,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{
                fontSize: 12, marginBottom: 12, padding: '8px 10px',
                background: '#FFF5F5', border: '1px solid #FED7D7',
                borderRadius: 6, color: '#C53030',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', background: G.text, color: G.bg,
                border: 'none', borderRadius: 6, padding: 12,
                fontSize: 14, fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function GrowthLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
