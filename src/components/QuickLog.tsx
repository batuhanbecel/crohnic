import { router } from 'expo-router';
import { View } from 'react-native';
import { glow, onTint, palette, radius, surface } from '../lib/theme';
import { Text } from './text';
import { Icon, T, Tap, type SymbolName } from './ui';

export type QuickCounts = { meals: number; toilet: number; symptoms: number; doses: { taken: number; total: number } };

type Tile = { key: string; label: string; value: string; icon: SymbolName; fallback: string; color: string; bg: string; to: string; a11y: string; dots?: { taken: number; total: number } };

/**
 * The four everyday logs as candy tiles: each one wears its own colour (the same colour the
 * entry has everywhere else), shows today's count and opens its log in one tap.
 */
export function QuickLog({ counts }: { counts: QuickCounts }) {
  const d = counts.doses;
  const tiles: Tile[] = [
    { key: 'meal', label: 'Öğün', value: String(counts.meals), icon: 'fork.knife', fallback: '🍽️', color: palette.good, bg: palette.goodSoft, to: '/yemek-ekle', a11y: `Öğün ekle, bugün ${counts.meals}` },
    { key: 'toilet', label: 'Tuvalet', value: String(counts.toilet), icon: 'drop.fill', fallback: '💧', color: palette.sky, bg: palette.skySoft, to: '/tuvalet', a11y: `Tuvalet kaydet, bugün ${counts.toilet}` },
    { key: 'symptom', label: 'Semptom', value: String(counts.symptoms), icon: 'waveform.path.ecg', fallback: '🌡️', color: palette.apricot, bg: palette.apricotSoft, to: '/semptom', a11y: `Semptom kaydet, bugün ${counts.symptoms}` },
    {
      key: 'med',
      label: d.total ? 'İlaç' : 'İlaç ekle',
      value: d.total ? `${d.taken}/${d.total}` : '–',
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
          accessibilityLabel={t.a11y}
          style={[
            {
              width: '47.9%',
              minHeight: 122,
              borderRadius: radius.lg,
              padding: 14,
              justifyContent: 'space-between',
              backgroundColor: t.bg,
            },
            glow(t.color, 0.14),
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surface.card, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={t.icon} size={18} color={t.color} fallback={t.fallback} />
            </View>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.color, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={14} color={onTint(t.color)} fallback="+" />
            </View>
          </View>
          <View style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <Text numberOfLines={1} style={{ fontSize: 32, lineHeight: 36, fontWeight: '900', color: palette.ink, fontVariant: ['tabular-nums'] }}>
                {t.value}
              </Text>
              {t.dots ? <Dots {...t.dots} color={t.color} /> : null}
            </View>
            <T v="small" color={palette.inkSoft} numberOfLines={1} style={{ fontWeight: '700' }}>
              {t.label}
            </T>
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
    <View style={{ flexDirection: 'row', gap: 4, paddingBottom: 9 }} accessibilityElementsHidden>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i < taken ? color : 'transparent', borderWidth: 1.5, borderColor: color }} />
      ))}
    </View>
  );
}
