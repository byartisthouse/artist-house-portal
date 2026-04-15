'use client';

import { C } from '@/lib/colors';
import { useAuth } from '@/lib/auth';

export default function SignIn() {
  const { setSignedIn, setMemberTier } = useAuth();

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
      </div>
    </div>
  );
}
