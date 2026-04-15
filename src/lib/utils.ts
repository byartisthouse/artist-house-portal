export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2);
}

export function nameHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h) % 360;
}

export function highlightSnippet(text: string, query: string): string {
  if (!query || query.length < 3) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 60);
  return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
}
