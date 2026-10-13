import type { Reaction } from '../lib/db';
import { palette } from '../lib/theme';
import { OptionTiles } from './ui';

export const REACTIONS: { value: Reaction; emoji: string; label: string; color: string; bg: string }[] = [
  { value: 0, emoji: '😌', label: 'İyi geldi', color: palette.good, bg: palette.goodSoft },
  { value: 1, emoji: '😕', label: 'Biraz dokundu', color: palette.warn, bg: palette.warnSoft },
  { value: 2, emoji: '😣', label: 'Çok dokundu', color: palette.bad, bg: palette.badSoft },
];

export function ReactionPicker({ value, onChange, compact }: { value?: Reaction | null; onChange: (r: Reaction) => void; compact?: boolean }) {
  return (
    <OptionTiles
      compact={compact}
      value={value}
      onChange={onChange}
      items={REACTIONS.map((r) => ({ key: r.value, emoji: r.emoji, label: r.label, color: r.color }))}
    />
  );
}
