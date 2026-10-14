import { View } from 'react-native';
import { isoDay } from '../lib/dates';
import { palette, radius } from '../lib/theme';
import { Icon, Row, T, Tap } from './ui';

export type DayStatus = 'good' | 'mid' | 'bad' | 'none';

const WEEK = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];
const STATUS_LABEL: Record<DayStatus, string> = { good: 'iyi geçmiş', mid: 'biraz zor', bad: 'zor geçmiş', none: 'kayıt yok' };

/** Month grid (Monday first). Each day is tinted by how it went; tap to see that day. */
export function MonthCalendar({
  month,
  status,
  selected,
  onSelect,
  onMonth,
  today,
}: {
  month: Date;
  status: Map<string, DayStatus>;
  selected: string | null;
  onSelect: (day: string) => void;
  onMonth: (delta: number) => void;
  today: string;
}) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday = 0
  const count = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const tone = (s: DayStatus) =>
    s === 'good' ? { bg: palette.goodSoft, fg: palette.good } : s === 'mid' ? { bg: palette.warnSoft, fg: palette.warn } : s === 'bad' ? { bg: palette.badSoft, fg: palette.bad } : { bg: 'transparent', fg: palette.ink };

  return (
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Tap onPress={() => onMonth(-1)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Önceki ay">
          <Icon name="chevron.left" size={18} color={palette.lettuceDeep} fallback="‹" />
        </Tap>
        <T v="h3" accessibilityRole="header">
          {month.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
        </T>
        <Tap onPress={() => onMonth(1)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Sonraki ay">
          <Icon name="chevron.right" size={18} color={palette.lettuceDeep} fallback="›" />
        </Tap>
      </Row>
      <Row gap={0}>
        {WEEK.map((w) => (
          <T key={w} v="caption" color={palette.inkFaint} style={{ flex: 1, textAlign: 'center' }} accessibilityElementsHidden>
            {w}
          </T>
        ))}
      </Row>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          const key = isoDay(new Date(y, m, d, 12).getTime());
          const s = status.get(key) ?? 'none';
          const t = tone(s);
          const isSel = key === selected;
          const isToday = key === today;
          return (
            <View key={key} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}>
              <Tap
                onPress={() => onSelect(key)}
                haptic={false}
                accessibilityRole="button"
                accessibilityLabel={`${d} ${month.toLocaleDateString('tr-TR', { month: 'long' })}, ${STATUS_LABEL[s]}`}
                accessibilityState={{ selected: isSel }}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    flex: 1,
                    borderRadius: radius.sm,
                    backgroundColor: t.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: isSel ? 2 : isToday ? 1 : 0,
                    borderColor: isSel ? palette.lettuce : palette.inkFaint,
                  }}
                >
                  <T v="callout" color={s === 'none' ? palette.inkSoft : t.fg} style={{ fontWeight: isToday || isSel ? '700' : '500' }}>
                    {d}
                  </T>
                </View>
              </Tap>
            </View>
          );
        })}
      </View>
      <Row gap={14} style={{ justifyContent: 'center' }}>
        {(['good', 'mid', 'bad'] as const).map((s) => (
          <Row key={s} gap={5}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: tone(s).fg }} />
            <T v="caption" color={palette.inkSoft}>
              {s === 'good' ? 'İyi' : s === 'mid' ? 'Biraz zor' : 'Zor'}
            </T>
          </Row>
        ))}
      </Row>
    </View>
  );
}
