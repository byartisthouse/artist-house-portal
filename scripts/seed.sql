-- ============================================================
-- AUSTERE Growth Engine — Sample Data Seed
-- Run this in the Supabase SQL Editor (runs as postgres superuser)
-- Safe to re-run: uses ON CONFLICT DO NOTHING / DO UPDATE
-- ============================================================

-- ── 1. Test users in auth.users ────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new
) VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'maya@artisthouse.test',
    crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now() - interval '60 days', now() - interval '60 days',
    '', '', '', ''
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'jordan@artisthouse.test',
    crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now() - interval '45 days', now() - interval '45 days',
    '', '', '', ''
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'sofia@artisthouse.test',
    crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now() - interval '30 days', now() - interval '30 days',
    '', '', '', ''
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'marcus@artisthouse.test',
    crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now() - interval '90 days', now() - interval '90 days',
    '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- ── 2. Profiles ────────────────────────────────────────────
INSERT INTO profiles (id, email, full_name, role, created_at) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'maya@artisthouse.test',   'Maya Chen',    'Paid Member', now() - interval '60 days'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'jordan@artisthouse.test', 'Jordan Rivers', 'Paid Member', now() - interval '45 days'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'sofia@artisthouse.test',  'Sofia Lane',    'Paid Member', now() - interval '30 days'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'marcus@artisthouse.test', 'Marcus Webb',   'Coach',       now() - interval '90 days')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role      = EXCLUDED.role;

-- ── 3. Artist data ─────────────────────────────────────────
INSERT INTO artist_data (id, user_id, instagram_handle, tiktok_handle, spotify_handle, youtube_handle, artist_goals, updated_at) VALUES
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'mayachenmusic', 'mayachen', 'maya-chen', 'MayaChenVEVO',
    'Hit 100k on TikTok by summer and land a Spotify editorial playlist.',
    now()
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'jordanriversrap', 'jordanrivers', null, null,
    'Release debut project and grow to 50k Instagram followers.',
    now()
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'sofialanesings', null, 'sofia-lane', null,
    'Finish EP by July and get placed on indie playlist blogs.',
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  instagram_handle = EXCLUDED.instagram_handle,
  tiktok_handle    = EXCLUDED.tiktok_handle,
  spotify_handle   = EXCLUDED.spotify_handle,
  youtube_handle   = EXCLUDED.youtube_handle,
  artist_goals     = EXCLUDED.artist_goals;

-- ── 4. Stats history (8 weeks per artist/platform) ─────────
-- Maya Chen — Instagram + TikTok + Spotify
INSERT INTO stats_history (artist_id, platform, follower_count, listener_count, engagement_rate, recorded_at) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'instagram', 12100, null, 3.8, now() - interval '56 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'instagram', 12400, null, 4.1, now() - interval '49 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'instagram', 12900, null, 3.9, now() - interval '42 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'instagram', 13200, null, 4.3, now() - interval '35 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'instagram', 13500, null, 4.0, now() - interval '28 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'instagram', 13700, null, 4.2, now() - interval '21 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'instagram', 14000, null, 4.5, now() - interval '14 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'instagram', 14200, null, 4.6, now() - interval '7 days'),

  ('bbbbbbbb-0000-0000-0000-000000000001', 'tiktok', 45200, null, 6.1, now() - interval '56 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'tiktok', 46500, null, 6.4, now() - interval '49 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'tiktok', 47800, null, 5.9, now() - interval '42 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'tiktok', 48600, null, 6.2, now() - interval '35 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'tiktok', 49400, null, 6.8, now() - interval '28 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'tiktok', 50200, null, 7.1, now() - interval '21 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'tiktok', 51300, null, 7.0, now() - interval '14 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'tiktok', 52100, null, 7.3, now() - interval '7 days'),

  ('bbbbbbbb-0000-0000-0000-000000000001', 'spotify', 8500, 8500, null, now() - interval '56 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'spotify', 8600, 8600, null, now() - interval '49 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'spotify', 8750, 8750, null, now() - interval '42 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'spotify', 8900, 8900, null, now() - interval '35 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'spotify', 9000, 9000, null, now() - interval '28 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'spotify', 9050, 9050, null, now() - interval '21 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'spotify', 9150, 9150, null, now() - interval '14 days'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'spotify', 9200, 9200, null, now() - interval '7 days'),

-- Jordan Rivers — Instagram + TikTok
  ('bbbbbbbb-0000-0000-0000-000000000002', 'instagram', 8500, null, 5.2, now() - interval '56 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'instagram', 8700, null, 5.0, now() - interval '49 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'instagram', 8900, null, 5.4, now() - interval '42 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'instagram', 9100, null, 5.1, now() - interval '35 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'instagram', 9300, null, 5.6, now() - interval '28 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'instagram', 9500, null, 5.3, now() - interval '21 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'instagram', 9650, null, 5.8, now() - interval '14 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'instagram', 9800, null, 6.0, now() - interval '7 days'),

  ('bbbbbbbb-0000-0000-0000-000000000002', 'tiktok', 22000, null, 4.8, now() - interval '56 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'tiktok', 23200, null, 5.1, now() - interval '49 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'tiktok', 24100, null, 4.9, now() - interval '42 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'tiktok', 25000, null, 5.3, now() - interval '35 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'tiktok', 25900, null, 5.5, now() - interval '28 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'tiktok', 26800, null, 5.2, now() - interval '21 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'tiktok', 27400, null, 5.7, now() - interval '14 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'tiktok', 28100, null, 5.9, now() - interval '7 days'),

-- Sofia Lane — Instagram + Spotify
  ('bbbbbbbb-0000-0000-0000-000000000003', 'instagram', 5200, null, 6.8, now() - interval '56 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'instagram', 5350, null, 7.1, now() - interval '49 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'instagram', 5500, null, 6.9, now() - interval '42 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'instagram', 5650, null, 7.3, now() - interval '35 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'instagram', 5750, null, 7.0, now() - interval '28 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'instagram', 5850, null, 7.4, now() - interval '21 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'instagram', 5980, null, 7.2, now() - interval '14 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'instagram', 6100, null, 7.6, now() - interval '7 days'),

  ('bbbbbbbb-0000-0000-0000-000000000003', 'spotify', 15000, 15000, null, now() - interval '56 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'spotify', 15400, 15400, null, now() - interval '49 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'spotify', 15900, 15900, null, now() - interval '42 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'spotify', 16200, 16200, null, now() - interval '35 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'spotify', 16600, 16600, null, now() - interval '28 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'spotify', 16900, 16900, null, now() - interval '21 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'spotify', 17200, 17200, null, now() - interval '14 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'spotify', 17500, 17500, null, now() - interval '7 days');

-- ── 5. Tasks ───────────────────────────────────────────────
INSERT INTO tasks (artist_id, coach_id, title, description, status, due_date, created_at, updated_at) VALUES
  -- Maya Chen
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Record 3 TikTok videos this week',
    'Focus on trend sounds. Hook needs to land in the first 2 seconds.',
    'In-Progress',
    (now() + interval '3 days')::date,
    now() - interval '5 days', now() - interval '1 day'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Update Spotify artist profile bio and header image',
    'New bio should reference the upcoming EP. Use the press photo from the March shoot.',
    'Done',
    null,
    now() - interval '14 days', now() - interval '7 days'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Submit to 5 Spotify editorial playlists',
    'Use the Spotify for Artists pitch tool. Target: Pop Rising, New Music Friday, Fresh Finds.',
    'Todo',
    (now() + interval '10 days')::date,
    now() - interval '2 days', now() - interval '2 days'
  ),
  -- Jordan Rivers
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Write and record new freestyle over a trending beat',
    'Post raw version to TikTok first, then polish for SoundCloud.',
    'Todo',
    (now() + interval '7 days')::date,
    now() - interval '3 days', now() - interval '3 days'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Reach out to 5 blog curators for feature coverage',
    'Focus on HipHopDX, Audiomack editorial, and 3 smaller blogs in your lane.',
    'In-Progress',
    (now() + interval '5 days')::date,
    now() - interval '8 days', now() - interval '2 days'
  ),
  -- Sofia Lane
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Finalize EP artwork with designer',
    'Send final tracklist and mood board to Jamie by end of week.',
    'Todo',
    (now() + interval '6 days')::date,
    now() - interval '4 days', now() - interval '4 days'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Book live show for June release weekend',
    'Venue shortlist: Elsewhere Brooklyn, Baby''s All Right, Purgatory. Reach out to all three.',
    'Done',
    null,
    now() - interval '20 days', now() - interval '10 days'
  );

-- ── 6. Notes ───────────────────────────────────────────────
INSERT INTO notes (artist_id, author_id, content, created_at) VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Great session today. Maya is locked in on the TikTok growth strategy. Main focus: consistency over virality. We agreed on 3 videos/week minimum, leaning into behind-the-scenes content and vocal snippets. Her engagement rate is already strong — just needs the volume. Next call in 2 weeks to review metrics.',
    now() - interval '7 days'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Reviewed her Spotify for Artists pitch strategy. She has a release coming in 6 weeks — we submitted early to editorial. Playlist targets: Pop Rising, Fresh Finds, New Music Friday. Also discussed sync licensing as a revenue stream. Will connect her with the sync team next month.',
    now() - interval '21 days'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Jordan is one of the most consistent artists on the roster in terms of output but he is underposting relative to his catalog. We talked about repurposing old loosies as TikTok content — he has 30+ tracks that have never seen short-form promotion. Action plan: 1 old track repost per week alongside new content.',
    now() - interval '10 days'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Sofia EP timeline is solid. Mastering is done, artwork is 80% there. We pushed the release date by 2 weeks to give more time for pre-save campaign. She is going to do a 3-part "making of the EP" video series on Instagram Reels to build anticipation. This is a strong campaign — feeling good about the rollout.',
    now() - interval '5 days'
  );
