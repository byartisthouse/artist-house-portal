import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('Set them in .env.local or as environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------------------------------------------------------------------------
// CSV parser (handles quoted fields with commas and newlines)
// ---------------------------------------------------------------------------
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field);
        field = '';
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        current.push(field);
        field = '';
        if (current.length > 1 || current[0] !== '') rows.push(current);
        current = [];
        if (ch === '\r') i++;
      } else {
        field += ch;
      }
    }
  }
  // last field / row
  if (field || current.length) {
    current.push(field);
    if (current.length > 1 || current[0] !== '') rows.push(current);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.replace(/^\uFEFF/, '').trim());
  return rows.slice(1).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (row[i] ?? '').trim();
    });
    return obj;
  });
}

// ---------------------------------------------------------------------------
// 1. Import coaching calls
// ---------------------------------------------------------------------------
async function importCoachingCalls() {
  const csvPath = path.resolve(__dirname, '../../coaching_calls_clean_for_supabase.csv');
  console.log(`Reading coaching calls from ${csvPath}`);
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(raw);
  console.log(`Parsed ${records.length} coaching call records`);

  // Map rows to insert objects
  const rows = records.map(r => {
    // Parse MM/DD/YYYY date to YYYY-MM-DD
    let date: string | null = null;
    if (r.date) {
      const parts = r.date.split('/');
      if (parts.length === 3) {
        date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }
    // Topics are pipe-delimited → Postgres text array
    const topics = r.topics
      ? r.topics.split('|').map(t => t.trim()).filter(Boolean)
      : [];

    return {
      date,
      title: r.title || 'Untitled',
      advisor: r.advisor || null,
      video_url: r.video_url || null,
      topics,
      summary: r.summary || null,
    };
  });

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from('coaching_calls').insert(batch);
    if (error) {
      console.error(`Error inserting coaching_calls batch at ${i}:`, error.message);
    } else {
      inserted += batch.length;
    }
  }
  console.log(`Inserted ${inserted} coaching calls`);
}

// ---------------------------------------------------------------------------
// 2. Import sync companies
// ---------------------------------------------------------------------------
async function importSyncCompanies() {
  const csvPath = path.resolve(
    __dirname,
    '../../Sync Databases 8a011ef8e92148eaa6a61e5d1ce395a9.csv'
  );
  console.log(`Reading sync companies from ${csvPath}`);
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(raw);
  console.log(`Parsed ${records.length} sync company records`);

  const rows = records.map(r => ({
    name: r['Name'] || r['name'] || 'Unknown',
    genre: r['Genres'] || r['genres'] || null,
    site: r['Site'] || r['site'] || null,
  }));

  const { error } = await supabase.from('sync_companies').insert(rows);
  if (error) {
    console.error('Error inserting sync companies:', error.message);
  } else {
    console.log(`Inserted ${rows.length} sync companies`);
  }
}

// ---------------------------------------------------------------------------
// 3. Seed tools
// ---------------------------------------------------------------------------
async function seedTools() {
  const tools = [
    // Graphic design
    { name: 'Freepik', description: 'Free vectors, stock photos, PSD downloads', url: 'https://freepik.com', category: 'Graphic Design' },
    { name: 'PhotoMosh', description: 'Image and video glitching effects', url: 'https://photomosh.com', category: 'Graphic Design' },
    { name: 'Emoji Island', description: 'High-res Apple emoji PNGs', url: 'https://emojiisland.com', category: 'Graphic Design' },
    // Music tools
    { name: 'Untitled', description: 'Share work-in-progress music privately', url: 'https://untitled.stream', category: 'Music Tools' },
    { name: 'Music-Map', description: 'Find similar artists and bands', url: 'https://music-map.com', category: 'Music Tools' },
    { name: 'Chartmetric', description: 'Streaming and social data analytics', url: 'https://chartmetric.io', category: 'Music Tools' },
    { name: 'Musicstax', description: 'Find tempo, key, and analysis of any song', url: 'https://musicstax.com', category: 'Music Tools' },
    // Merch + Vinyl
    { name: 'Apliiq', description: 'Custom streetwear and apparel', url: 'https://apliiq.com', category: 'Merch + Vinyl' },
    { name: 'Printful', description: 'Print-on-demand merch fulfillment', url: 'https://printful.com', category: 'Merch + Vinyl' },
    { name: 'Culture Studio', description: 'Retail and tour merch production', url: 'https://culturestudio.net', category: 'Merch + Vinyl' },
    { name: 'Tiny Vinyl', description: '4-inch collectible mini vinyl records', url: 'https://tinyvinyl.com', category: 'Merch + Vinyl' },
    { name: 'Disc Makers', description: 'CD pressing and manufacturing', url: 'https://discmakers.com', category: 'Merch + Vinyl' },
    { name: 'Mobineko', description: 'Short-run vinyl pressing', url: 'https://mobineko.com', category: 'Merch + Vinyl' },
    { name: 'Blurb', description: 'Photo books, magazines, and print', url: 'https://blurb.com', category: 'Merch + Vinyl' },
    // Performance
    { name: 'Sofar Sounds', description: 'Intimate live music events worldwide', url: 'https://sofarsounds.com', category: 'Performance' },
    { name: 'Breaking Sound', description: 'Emerging artist showcases', url: 'https://breakingsound.com', category: 'Performance' },
    // Mixing + Mastering
    { name: 'SoundBetter', description: 'Hire mixing engineers and producers', url: 'https://soundbetter.com', category: 'Mixing + Mastering' },
    // Downloaders
    { name: 'GetVideo.at', description: 'Download from YouTube, Facebook, Vimeo', url: 'https://getvideo.at', category: 'Downloaders' },
    { name: 'YTMP3', description: 'YouTube to MP3 converter', url: 'https://ytmp3.cc', category: 'Downloaders' },
    // Production
    { name: 'Eyecandy', description: 'Visual technique library for creatives', url: 'https://eyecannndy.com', category: 'Production' },
  ];

  const { error } = await supabase.from('tools').insert(tools);
  if (error) {
    console.error('Error seeding tools:', error.message);
  } else {
    console.log(`Seeded ${tools.length} tools`);
  }
}

// ---------------------------------------------------------------------------
// 4. Seed guides
// ---------------------------------------------------------------------------
async function seedGuides() {
  const guides = [
    {
      title: 'Social posting cadence',
      content:
        'TikTok — Post ideally once per day. At least 5 posts per month should be trends.\n\nInstagram — 10-15 posts per month. All posts should be Reels, even static images.\n\nTwitter/X — Post as often as you\'d like. No requirement unless you love the platform or are in web3/NFT.\n\nFacebook — Repost your Instagram content. Worth curating only if your audience skews 40+.',
    },
    {
      title: 'TikTok content ideas',
      content:
        'Lip sync or dance videos featuring your own songs — TikTok is built for this.\n\nBehind-the-scenes of recording or live performances. Fans want to see the process.\n\nCollaborations with other creators to cross-pollinate audiences.\n\nCovers of popular songs in your own style — great for discovery.\n\nQ&A videos answering fan questions — builds personal connection.\n\nMix up content types to keep followers engaged. Use relevant hashtags on everything.',
    },
    {
      title: 'Instagram hashtags 101',
      content:
        'Research popular hashtags with tools like Hashtagify or RiteTag. Look for tags relevant to your content with high engagement.\n\nMix popular and niche hashtags. Popular tags increase visibility, niche tags reach your actual audience.\n\nCreate branded hashtags for community building. Make it easy for fans to find and share your content under one tag.\n\nCombine broad and specific. #music is too wide. #indieRnBDallas is too narrow. Find the middle.\n\nKeep it relevant. Unrelated hashtags read as spam and hurt your reach.\n\nMax 30 hashtags per post. Quality over quantity.',
    },
  ];

  const { error } = await supabase.from('guides').insert(guides);
  if (error) {
    console.error('Error seeding guides:', error.message);
  } else {
    console.log(`Seeded ${guides.length} guides`);
  }
}

// ---------------------------------------------------------------------------
// Run all imports
// ---------------------------------------------------------------------------
async function main() {
  console.log('Starting data import...\n');
  await importCoachingCalls();
  await importSyncCompanies();
  await seedTools();
  await seedGuides();
  console.log('\nImport complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
