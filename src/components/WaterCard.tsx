import { View } from 'react-native';
import { litres, waterNote } from '../lib/water';
import { onTint, palette, radius, soft, surface } from '../lib/theme';
import { Card, GlassPress, Icon, Row, T } from './ui';

/**
 * Today's fluids: tap + for every glass. The goal grows with watery stools, a flare, an
 * ileostomy and fever, and the line under it says why.
 */
export function WaterCard({
  glasses,
  target,
  watery,
  hour,
  stoma,
  onAdd,
  bare,
}: {
  glasses: number;
  target: number;
  watery: number;
  hour: number;
  stoma?: boolean;
  onAdd: (delta: 1 | -1) => void;
  /** without its own card, as a section of another one */
  bare?: boolean;
}) {
  const note = waterNote({ glasses, target, watery, hour, stoma });
  const pct = Math.min(1, glasses / target);
  const tone = note?.tone === 'bad' ? palette.bad : note?.tone === 'warn' ? palette.warn : note?.tone === 'good' ? palette.good : palette.inkSoft;
  const body = (
    <>
      <Row gap={12}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: soft(palette.water, 0.18), alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="drop.fill" size={18} color={palette.water} fallback="💧" />
        </View>
        <View style={{ flex: 1 }}>
          <T v="h3">Su</T>
          <T v="small" color={palette.inkSoft}>
            {`${glasses}/${target} bardak · ${litres(glasses)}`}
          </T>
        </View>
        <GlassPress
          onPress={() => onAdd(-1)}
          disabled={!glasses}
          accessibilityLabel="Bir bardak çıkar"
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="minus" size={15} color={glasses ? palette.ink : palette.inkFaint} fallback="−" />
        </GlassPress>
        <GlassPress
          onPress={() => onAdd(1)}
          tint={palette.water}
          accessibilityLabel="Bir bardak ekle"
          style={{ height: 40, borderRadius: 20, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Icon name="plus" size={14} color={onTint(palette.water)} fallback="+" />
          <T v="callout" color={onTint(palette.water)} style={{ fontWeight: '800' }}>
            Bardak
          </T>
        </GlassPress>
      </Row>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: surface.well, overflow: 'hidden' }} accessible accessibilityLabel={`Su hedefinin yüzde ${Math.round(pct * 100)}'i`}>
        <View style={{ width: `${Math.round(pct * 100)}%`, height: '100%', borderRadius: radius.pill, backgroundColor: palette.water }} />
      </View>
      {note ? (
        <T v="small" color={tone} style={{ fontWeight: note.tone === 'good' ? '700' : '400' }}>
          {note.text}
        </T>
      ) : null}
    </>
  );
  if (bare) return <View style={{ gap: 10 }}>{body}</View>;
  return (
    <Card style={{ gap: 10 }} tint={note?.tone === 'bad' ? palette.badSoft : undefined}>
      {body}
    </Card>
  );
}
