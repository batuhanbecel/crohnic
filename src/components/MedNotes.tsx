import { View } from 'react-native';
import { medHits, medNames, type FoodLike, type MedHit } from '../lib/med-food';
import { palette } from '../lib/theme';
import { Card, Icon, Row, T } from './ui';

type Note = { hit: MedHit; items?: string[] };

const RANK = { kacin: 2, dikkat: 1, bilgi: 0 } as const;

/** What the user's medicines say about one food or a whole plate, merged per rule. */
export function medNotesFor(foods: FoodLike[]): Note[] {
  const byRule = new Map<string, Note>();
  for (const f of foods) {
    for (const hit of medHits(f)) {
      const n = byRule.get(hit.id);
      if (n) n.items = [...(n.items ?? []), f.name];
      else byRule.set(hit.id, { hit, items: [f.name] });
    }
  }
  return [...byRule.values()].sort((a, b) => RANK[b.hit.level] - RANK[a.hit.level]);
}

/**
 * "İlaçların için": the medicine notes as a tinted card (red when something is best avoided,
 * amber for "limit it", blue for timing notes). Renders nothing when there are none.
 * `showItems` names the foods on the plate each note is about.
 */
export function MedNotes({ notes, showItems }: { notes: Note[]; showItems?: boolean }) {
  if (!notes.length) return null;
  const worst = notes[0].hit.level;
  const tint = worst === 'kacin' ? palette.badSoft : worst === 'dikkat' ? palette.warnSoft : palette.periSoft;
  const tone = worst === 'kacin' ? palette.bad : worst === 'dikkat' ? palette.warn : palette.peri;
  return (
    <Card tint={tint} style={{ gap: 10 }}>
      <Row gap={8}>
        <Icon name="pills.fill" size={16} color={tone} fallback="💊" />
        <T v="h3" color={tone}>
          İlaçların için
        </T>
      </Row>
      {notes.map(({ hit, items }) => (
        <View key={hit.id} style={{ gap: 2 }}>
          <T v="callout" style={{ fontWeight: '700' }}>
            {`${medNames(hit)}${showItems && items?.length ? ` · ${[...new Set(items)].join(', ')}` : ''}`}
          </T>
          <T v="small">{hit.text}</T>
        </View>
      ))}
      <T v="caption" color={palette.inkSoft}>
        Genel bilgi; senin durumunu en iyi doktorun bilir.
      </T>
    </Card>
  );
}
