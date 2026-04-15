'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { G } from '@/lib/growth/colors';

const STEPS = ['Social Handles', 'Your Goals', 'Done'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [handles, setHandles] = useState({
    instagram_handle: '',
    tiktok_handle: '',
    spotify_handle: '',
    youtube_handle: '',
  });
  const [goals, setGoals] = useState('');

  async function finish() {
    setSaving(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/'); return; }

    const { error: upsertError } = await supabase
      .from('artist_data')
      .upsert({
        user_id: user.id,
        ...handles,
        artist_goals: goals,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    router.push('/growth/dashboard');
  }

  const fieldStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: G.surfaceAlt, border: `1px solid ${G.border}`,
    borderRadius: 8, padding: '10px 14px', fontSize: 13, color: G.text,
    fontFamily: 'inherit', outline: 'none',
  };

  const labelStyle = { display: 'block' as const, fontSize: 12, color: G.muted, marginBottom: 6 };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: i <= step ? G.accent : G.surfaceAlt,
                border: `1.5px solid ${i <= step ? G.accent : G.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, color: i <= step ? G.bg : G.dim,
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, color: i === step ? G.text : G.dim, fontWeight: i === step ? 500 : 400 }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < step ? G.accent : G.border, margin: '0 12px' }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: '32px 28px' }}>
        {step === 0 && (
          <>
            <div style={{ fontSize: 18, fontWeight: 600, color: G.text, marginBottom: 6 }}>Add your social handles</div>
            <div style={{ fontSize: 13, color: G.muted, marginBottom: 24 }}>We'll use these to track your growth across platforms.</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'instagram_handle', label: 'Instagram handle', placeholder: 'yourhandle (no @)' },
                { key: 'tiktok_handle', label: 'TikTok handle', placeholder: 'yourhandle (no @)' },
                { key: 'spotify_handle', label: 'Spotify artist name', placeholder: 'Exact name as on Spotify' },
                { key: 'youtube_handle', label: 'YouTube channel', placeholder: 'Channel name or @handle' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    value={handles[key as keyof typeof handles]}
                    onChange={e => setHandles(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={fieldStyle}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              style={{ marginTop: 24, width: '100%', background: G.accent, color: G.bg, border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Continue →
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontSize: 18, fontWeight: 600, color: G.text, marginBottom: 6 }}>What are your artist goals?</div>
            <div style={{ fontSize: 13, color: G.muted, marginBottom: 24 }}>Help your coach understand what you're working toward.</div>

            <textarea
              value={goals}
              onChange={e => setGoals(e.target.value)}
              placeholder="e.g. Reach 100k followers on TikTok by Q3, land a sync placement, release my debut EP..."
              rows={5}
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }}
            />

            {error && (
              <div style={{ fontSize: 12, color: G.red, marginTop: 10, padding: '8px 10px', background: G.redBg, border: `1px solid ${G.redBorder}`, borderRadius: 6 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setStep(0)}
                style={{ flex: 1, background: G.surfaceAlt, color: G.muted, border: `1px solid ${G.border}`, borderRadius: 8, padding: 12, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← Back
              </button>
              <button
                onClick={finish}
                disabled={saving}
                style={{ flex: 2, background: G.accent, color: G.bg, border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving...' : 'Launch my dashboard →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
