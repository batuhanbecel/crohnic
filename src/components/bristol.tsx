import { palette } from '../lib/theme';

export const BRISTOL = [
  { type: 1, emoji: '🪨', short: 'Sert topaklar', desc: 'Ayrı ayrı sert parçalar, zor çıkıyor' },
  { type: 2, emoji: '🌰', short: 'Topaklı', desc: 'Sosis şeklinde ama topaklı ve sert' },
  { type: 3, emoji: '🌽', short: 'Çatlaklı', desc: 'Sosis şeklinde, yüzeyi çatlak' },
  { type: 4, emoji: '🍌', short: 'Normal', desc: 'Yumuşak, pürüzsüz, sosis şeklinde' },
  { type: 5, emoji: '🫘', short: 'Yumuşak parçalar', desc: 'Kenarları belli yumuşak parçalar' },
  { type: 6, emoji: '🥣', short: 'Lapa', desc: 'Dağınık kenarlı, lapa kıvamında' },
  { type: 7, emoji: '💧', short: 'Sulu', desc: 'Tamamen sıvı' },
];

export function bristolTone(t: number) {
  if (t <= 2) return palette.apricot;
  if (t <= 4) return palette.good;
  if (t === 5) return palette.warn;
  return palette.bad;
}
