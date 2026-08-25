import type { Feather } from '@expo/vector-icons';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

export type BaseMood = {
  name: string;
  prompt: string;
  img: number; // require() asset
  families: readonly string[];
};

export type BaseAccord = {
  name: string;
  desc: string;
  icon: FeatherName;
  families: readonly string[];
};

// Mirrors BASE_MOODS in the web app (artifacts/sillage-lab/src/sillage.tsx)
export const BASE_MOODS: BaseMood[] = [
  { name: 'Clean',  prompt: 'A clean, transparent skin scent — no soap, just presence',  img: require('../assets/images/moods/mood-clean.jpg'),  families: ['musk'] },
  { name: 'Warm',   prompt: 'A warm, resinous amber with depth and sensuality',          img: require('../assets/images/moods/mood-warm.jpg'),   families: ['resinous', 'spicy'] },
  { name: 'Dark',   prompt: 'A dark, smoky, almost feral composition',                   img: require('../assets/images/moods/mood-dark.jpg'),   families: ['woody', 'resinous'] },
  { name: 'Fresh',  prompt: 'A luminous fresh green accord — dew, herbs, cut stems',     img: require('../assets/images/moods/mood-fresh.jpg'),  families: ['green', 'fresh', 'citrus'] },
  { name: 'Floral', prompt: 'A romantic, heady white floral that lingers',               img: require('../assets/images/moods/mood-floral.jpg'), families: ['floral'] },
  { name: 'Woody',  prompt: 'A dry, cerebral woody accord — sandalwood, cedar, vetiver', img: require('../assets/images/moods/mood-woody.jpg'),  families: ['woody'] },
];

// Mirrors BASE_ACCORDS in the web app
export const BASE_ACCORDS: BaseAccord[] = [
  { name: 'Clean Musk',       desc: 'Soft. Transparent. Skin-like.',  icon: 'wind',    families: ['musk'] },
  { name: 'Amber Woods',      desc: 'Warm. Resinous. Addictive.',     icon: 'sun',     families: ['resinous', 'woody'] },
  { name: 'Fresh Citrus',     desc: 'Bright. Zesty. Uplifting.',      icon: 'droplet', families: ['citrus'] },
  { name: 'Modern Patchouli', desc: 'Earthy. Textured. Refined.',     icon: 'feather', families: ['woody'] },
  { name: 'White Florals',    desc: 'Luminous. Heady. Sensual.',      icon: 'star',    families: ['floral'] },
  { name: 'Chypre',           desc: 'Mossy. Elegant. Complex.',       icon: 'hexagon', families: ['green', 'citrus'] },
];

// Same seed-message templates as the web hub
export function moodSeedMessage(mood: { name: string; prompt: string }): string {
  return `Give me a creative brief for a ${mood.name.toLowerCase()} fragrance direction — ${mood.prompt}. Describe the feeling, the key materials that define it, and two or three specific accord ideas I could explore.`;
}

export function accordSeedMessage(accord: { name: string; desc: string }, ownedNames: string[]): string {
  return ownedNames.length > 0
    ? `Tell me about the ${accord.name} accord — what defines it (${accord.desc}), and how I could build it starting from materials I already own: ${ownedNames.slice(0, 6).join(', ')}. What would I still need to add?`
    : `Tell me about the ${accord.name} accord — what defines it (${accord.desc}), which raw materials are essential to building it, and what's a modern take I could explore?`;
}

export const PINNED_SESSIONS_KEY = 'matiere-pinned-sessions';
