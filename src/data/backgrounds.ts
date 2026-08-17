export interface WallpaperPresetBg {
  id: string;
  name: string;
  category: 'nature' | 'minimal' | 'gradient' | 'celestial';
  thumbnailUrl: string;
  fullUrl: string;
  author: string;
  defaultOverlay: number;
}

export const PRESET_BACKGROUNDS: WallpaperPresetBg[] = [
  {
    id: 'charcoal-obsidian-minimal',
    name: 'Charcoal & Obsidian Silk',
    category: 'minimal',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=500&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=2160&auto=format&fit=crop&q=90',
    author: 'Matt Palmer',
    defaultOverlay: 0.25
  },
  {
    id: 'starry-celestial-night',
    name: 'Celestial Deep Starfield',
    category: 'celestial',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=2160&auto=format&fit=crop&q=90',
    author: 'Benjamin Davies',
    defaultOverlay: 0.30
  },
  {
    id: 'misty-mountain-dawn',
    name: 'Charcoal Mountain Mist',
    category: 'nature',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=2160&auto=format&fit=crop&q=90',
    author: 'Bailey Zindel',
    defaultOverlay: 0.40
  },
  {
    id: 'golden-sunbeam-forest',
    name: 'Golden Beams in Nightwood',
    category: 'nature',
    thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=2160&auto=format&fit=crop&q=90',
    author: 'Sebastian Unrau',
    defaultOverlay: 0.45
  },
  {
    id: 'desert-dune-solitude',
    name: 'Nocturnal Desert Dunes',
    category: 'nature',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=2160&auto=format&fit=crop&q=90',
    author: 'Jeremy Bishop',
    defaultOverlay: 0.35
  },
  {
    id: 'calm-coastal-sunset',
    name: 'Charcoal Twilight Waters',
    category: 'nature',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=500&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=2160&auto=format&fit=crop&q=90',
    author: 'Kalen Emsley',
    defaultOverlay: 0.40
  },
  {
    id: 'parchment-warm-glow',
    name: 'Dark Parchment & Amber',
    category: 'minimal',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=2160&auto=format&fit=crop&q=90',
    author: 'Annie Spratt',
    defaultOverlay: 0.25
  },
  {
    id: 'clouds-ethereal-light',
    name: 'Moody Obsidian Cloudscape',
    category: 'celestial',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=500&auto=format&fit=crop&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=2160&auto=format&fit=crop&q=90',
    author: 'Zoltan Tasi',
    defaultOverlay: 0.40
  }
];

export const GRADIENT_PRESETS = [
  { id: 'pure-charcoal-black', name: 'Black & Pure Charcoal', colors: ['#000000', '#121212', '#1E1E24'], dir: 'to bottom' },
  { id: 'divine-gold', name: 'Charcoal & Divine Gold', colors: ['#050505', '#18181B', '#78350F', '#D97706'], dir: 'to bottom right' },
  { id: 'midnight-glory', name: 'Midnight Charcoal Azure', colors: ['#000000', '#0F172A', '#1E293B'], dir: 'to bottom' },
  { id: 'royal-purple', name: 'Charcoal & Imperial Violet', colors: ['#050505', '#18181B', '#3B0764', '#6B21A8'], dir: 'to bottom right' },
  { id: 'emerald-haven', name: 'Charcoal & Forest Emerald', colors: ['#000000', '#064E3B', '#022C22'], dir: 'to bottom' },
  { id: 'minimal-mono', name: 'Pitch Black & Slate Charcoal', colors: ['#000000', '#121214', '#202024'], dir: 'to bottom' }
];

export const COLOR_PALETTES = [
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Warm Parchment', hex: '#FEF3C7' },
  { name: 'Divine Gold (Accent)', hex: '#FBBF24' },
  { name: 'Amber Glow (Accent)', hex: '#F59E0B' },
  { name: 'Warm Rose Gold', hex: '#FDA4AF' },
  { name: 'Charcoal Ash', hex: '#A1A1AA' },
  { name: 'Steel Gray', hex: '#71717A' },
  { name: 'Dark Slate Charcoal', hex: '#27272A' },
  { name: 'Deep Charcoal', hex: '#18181B' },
  { name: 'Pitch Black', hex: '#000000' }
];
