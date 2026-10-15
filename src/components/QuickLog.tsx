import { router } from 'expo-router';
import { View } from 'react-native';
import { palette, radius, soft, surface } from '../lib/theme';
import { Text } from './text';
import { Icon, Row, T, Tap, type SymbolName } from './ui';

export type QuickCounts = { meals: number; toilet: number; symptoms: number; doses: { taken: number; total: number } };

type Tile = { key: string; label: string; value: string; icon: SymbolName; fallback: string; color: string; to: string; a11y: string };

/**
 * One tap to the four logs people make every day, each with today's count (the same
 * layout as the home screen widget).
 */
export function QuickLog({ counts }: { counts: QuickCounts }) {
  const d = counts.doses;
  const tiles: Tile[] = [
    { key: 'meal', label: 'Öğün', value: String(counts.meals), icon: 'fork.knife', fallback: '🍽️', color: palette.good, to: '/yemek-ekle', a11y: `Öğün ekle, bugün ${counts.meals}` },
    { key: 'toilet', label: 'Tuvalet', value: String(counts.toilet), icon: 'drop.fill', fallback: '💧', color: palette.sky, to: '/tuvalet', a11y: `Tuvalet kaydet, bugün ${counts.toilet}` },
    { key: 'symptom', label: 'Semptom', value: String(counts.symptoms), icon: 'waveform.path.ecg', fallback: '🌡️', color: palette.apricot, to: '/semptom', a11y: `Semptom kaydet, bugün ${counts.symptoms}` },
    {
      key: 'med',
      label: 'İlaç',
      value: d.total ? `${d.taken}/${d.total}` : '–',
      icon: 'pills.fill',
      fallback: '💊',
      color: palette.peri,
      to: d.total ? '/ilaclar' : '/ilac',
      a11y: d.total ? `İlaçlar, bugün ${d.total} dozdan ${d.taken} alındı` : 'İlaç ekle',
    },
  ];

  return (
    <Row gap={8} style={{ alignItems: 'stretch' }}>
        {tiles.map((t) => (
          <Tap key={t.key} onPress={() => router.push(t.to as never)} accessibilityRole="button" accessibilityLabel={t.a11y} style={{ flex: 1 }}>
            <View style={{ backgroundColor: surface.card, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 10, gap: 8, minHeight: 108 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: soft(t.color), alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={t.icon} size={16} color={t.color} fallback={t.fallback} />
                </View>
                <Icon name="plus.circle.fill" size={18} color={t.color} fallback="+" />
              </Row>
              <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 24, fontWeight: '800', color: palette.ink, fontVariant: ['tabular-nums'] }}>
                  {t.value}
                </Text>
                <T v="caption" color={palette.inkSoft} numberOfLines={1} style={{ fontWeight: '700' }}>
                  {t.label}
                </T>
              </View>
            </View>
          </Tap>
      ))}
    </Row>
  );
}
