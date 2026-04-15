'use client';

import { useState } from 'react';
import { C } from '@/lib/colors';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const { setSignedIn, setMemberTier } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success the auth.tsx listener picks up the new session and sets signedIn(true)
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 400, textAlign: 'center' }}>
        <div className="font-display" style={{ fontSize: 32, color: C.text, marginBottom: 4 }}>Artist House</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 32 }}>Resources portal</div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '32px 28px' }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: C.text, marginBottom: 4 }}>Welcome back</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Sign in with your Artist House account</div>
          <button
            onClick={() => { setSignedIn(true); setMemberTier('paid'); }}
            style={{ width: '100%', background: C.text, color: C.bg, border: 'none', borderRadius: 6, padding: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}
          >
            Sign in with Memberstack
          </button>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 12 }}>Same login you use for Circle and artisthousekey.com</div>
        </div>

        <div style={{ marginTop: 20, fontSize: 13, color: C.muted }}>
          Not a member?{' '}
          <a
            href="https://www.artisthousekey.com/compare"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: C.text, fontWeight: 500, textDecoration: 'underline' }}
          >
            Join Artist House
          </a>
        </div>

        <div style={{ marginTop: 10 }}>
          <span
            onClick={() => { setShowEmailForm(v => !v); setError(null); }}
            style={{ fontSize: 13, color: C.muted, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Sign in with email and password
          </span>
        </div>

        {showEmailForm && (
          <form onSubmit={handleEmailSignIn} style={{ marginTop: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px 28px', textAlign: 'left' }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ width: '100%', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 12px', fontSize: 13, color: C.text, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 4 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 12px', fontSize: 13, color: C.text, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            {error && (
              <div style={{ fontSize: 12, color: C.coral, marginBottom: 12, padding: '8px 10px', background: C.coralBg, border: `1px solid ${C.coralBorder}`, borderRadius: 6 }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: C.text, color: C.bg, border: 'none', borderRadius: 6, padding: 12, fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
