import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { glow, isDark, onTint, palette, radius, soft } from '../lib/theme';
import { Text } from './text';
import { Icon, T, Tap, type SymbolName } from './ui';

export type QuickCounts = {
  meals: number;
  toilet: number;
  symptoms: number;
  doses: { taken: number; total: number };
  /** one short line under each count: "son 08:45", "Tip 4, son 09:10", "sıradaki 13:00"… */
  subs?: { meal?: string; toilet?: string; symptom?: string; med?: string };
};

type Tile = {
  key: string;
  label: string;
  value: string;
  sub?: string;
  icon: SymbolName;
  fallback: string;
  color: string;
  bg: string;
  to: string;
  a11y: string;
  dots?: { taken: number; total: number };
};

/**
 * The four everyday logs as candy tiles. Each wears its colour (the same one the entry has
 * everywhere else) as a soft gradient with a big tilted watermark of its icon, shows today's
 * count with one line of context, and opens its log in one tap.
 */
export function QuickLog({ counts }: { counts: QuickCounts }) {
  const d = counts.doses;
  const s = counts.subs ?? {};
  const tiles: Tile[] = [
    { key: 'meal', label: 'Öğün', value: String(counts.meals), sub: s.meal, icon: 'fork.knife', fallback: '🍽️', color: palette.good, bg: palette.goodSoft, to: '/yemek-ekle', a11y: `Öğün ekle, bugün ${counts.meals}` },
    { key: 'toilet', label: 'Tuvalet', value: String(counts.toilet), sub: s.toilet, icon: 'drop.fill', fallback: '💧', color: palette.sky, bg: palette.skySoft, to: '/tuvalet', a11y: `Tuvalet kaydet, bugün ${counts.toilet}` },
    { key: 'symptom', label: 'Semptom', value: String(counts.symptoms), sub: s.symptom, icon: 'waveform.path.ecg', fallback: '🌡️', color: palette.apricot, bg: palette.apricotSoft, to: '/semptom', a11y: `Semptom kaydet, bugün ${counts.symptoms}` },
    {
      key: 'med',
      label: 'İlaç',
      value: d.total ? `${d.taken}/${d.total}` : '–',
      sub: d.total ? s.med : 'İlacını ekle',
      icon: 'pills.fill',
      fallback: '💊',
      color: palette.peri,
      bg: palette.periSoft,
      to: d.total ? '/ilaclar' : '/ilac',
      a11y: d.total ? `İlaçlar, bugün ${d.total} dozdan ${d.taken} alındı` : 'İlaç ekle',
      dots: d.total ? d : undefined,
    },
  ];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {tiles.map((t) => (
        <Tap
          key={t.key}
          press="scale"
          onPress={() => router.push(t.to as never)}
          accessibilityRole="button"
          accessibilityLabel={[t.a11y, t.sub].filter(Boolean).join(', ')}
          style={[{ width: '47.9%', borderRadius: radius.lg }, glow(t.color, 0.16)]}
        >
          <View style={{ borderRadius: radius.lg, overflow: 'hidden', minHeight: 148, padding: 14, justifyContent: 'space-between', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)' }}>
            {/* soft wash: lighter top-left, the tile's colour deepening toward the corner */}
            <LinearGradient
              colors={[t.bg, soft(t.color, isDark ? 0.34 : 0.26)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* big tilted watermark of the icon, peeking out of the corner */}
            <View pointerEvents="none" style={{ position: 'absolute', right: -14, bottom: -16, transform: [{ rotate: '-14deg' }], opacity: isDark ? 0.22 : 0.16 }}>
              <Icon name={t.icon} size={86} color={t.color} fallback={t.fallback} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.color, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={t.icon} size={17} color={onTint(t.color)} fallback={t.fallback} />
              </View>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)',
                }}
              >
                <Icon name="plus" size={13} color={t.color} fallback="+" />
              </View>
            </View>

            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <Text numberOfLines={1} style={{ fontSize: 34, lineHeight: 38, fontWeight: '900', color: palette.ink, fontVariant: ['tabular-nums'], letterSpacing: -0.5 }}>
                  {t.value}
                </Text>
                {t.dots ? <Dots {...t.dots} color={t.color} /> : null}
              </View>
              <T v="callout" numberOfLines={1} style={{ fontWeight: '800', color: palette.ink }}>
                {t.label}
              </T>
              <T v="caption" numberOfLines={1} color={palette.inkSoft} style={{ fontWeight: '600', marginTop: 1 }}>
                {t.sub ?? 'Bugün henüz yok'}
              </T>
            </View>
          </View>
        </Tap>
      ))}
    </View>
  );
}

/** One dot per dose today: filled once taken. */
function Dots({ taken, total, color }: { taken: number; total: number; color: string }) {
  const n = Math.min(total, 6);
  return (
    <View style={{ flexDirection: 'row', gap: 4, paddingBottom: 11 }} accessibilityElementsHidden>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i < taken ? color : 'transparent', borderWidth: 1.5, borderColor: color }} />
      ))}
    </View>
  );
}
