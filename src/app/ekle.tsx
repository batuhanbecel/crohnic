import { router } from 'expo-router';
import { View } from 'react-native';
import { Icon, IconBubble, Row, T, Tap, type SymbolName } from '../components/ui';
import { palette } from '../lib/theme';

type Item = { title: string; sub: string; icon: SymbolName; fallback: string; color: string; to: string };

const ITEMS: Item[] = [
  { title: 'Öğün', sub: 'Ne yediğini yaz', icon: 'fork.knife', fallback: '🍽️', color: palette.lettuce, to: '/yemek-ekle' },
  { title: 'Tuvalet', sub: 'Saat, kıvam, kan', icon: 'drop.fill', fallback: '💧', color: palette.sky, to: '/tuvalet' },
  { title: 'Semptom', sub: 'Ağrı, şişkinlik, gaz, yorgunluk', icon: 'waveform.path.ecg', fallback: '🌡️', color: palette.apricot, to: '/semptom' },
  { title: 'İlaç', sub: 'Aldığın dozu işaretle', icon: 'pills.fill', fallback: '💊', color: palette.peri, to: '/ilaclar' },
  { title: 'Gün nasıldı', sub: 'Stres ve uyku', icon: 'moon.stars.fill', fallback: '🌙', color: palette.flare, to: '/gun' },
];

/** One door for every kind of entry, so the home screen doesn't need a button per type. */
export default function AddSheet() {
  // close the sheet first, then open the form: swapping one sheet for another in place animates badly
  const open = (it: Item) => {
    router.back();
    setTimeout(() => router.push(it.to as never), 280);
  };

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 34, gap: 4 }}>
      <T v="h2" style={{ marginBottom: 8, paddingHorizontal: 2 }}>
        Ne kaydedelim?
      </T>
      {ITEMS.map((it) => (
        <Tap key={it.title} onPress={() => open(it)}>
          <Row gap={14} style={{ paddingVertical: 10, paddingHorizontal: 2 }}>
            <IconBubble name={it.icon} color={it.color} dim={44} fallback={it.fallback} />
            <View style={{ flex: 1 }}>
              <T v="h3">{it.title}</T>
              <T v="small" color={palette.inkSoft} numberOfLines={1}>
                {it.sub}
              </T>
            </View>
            <Icon name="chevron.right" size={14} color={palette.inkFaint} fallback="›" />
          </Row>
        </Tap>
      ))}
    </View>
  );
}
