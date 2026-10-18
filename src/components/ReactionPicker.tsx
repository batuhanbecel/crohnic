import type { Reaction } from '../lib/db';
import { palette } from '../lib/theme';
import { OptionTiles } from './ui';

/**
 * How a meal went. A food doesn't "do good"; it either leaves you alone or bothers you, so the
 * answers are Normal / Dokundu / Kötü. `phrase` is the sentence form for lists and VoiceOver.
 */
export const REACTIONS: { value: Reaction; emoji: string; label: string; phrase: string; color: string; bg: string }[] = [
  { value: 0, emoji: '😌', label: 'Normal', phrase: 'Normal geçti', color: palette.good, bg: palette.goodSoft },
  { value: 1, emoji: '😕', label: 'Dokundu', phrase: 'Biraz dokundu', color: palette.warn, bg: palette.warnSoft },
  { value: 2, emoji: '😣', label: 'Kötü', phrase: 'Kötü geçti, çok dokundu', color: palette.bad, bg: palette.badSoft },
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
