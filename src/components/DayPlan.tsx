import { router } from 'expo-router';
import { View } from 'react-native';
import type { SlotKey, SlotPlan } from '../lib/suggest';
import { palette, radius, surface } from '../lib/theme';
import { Text } from './text';
import { Button, Card, Icon, IconBubble, Row, T, Tap, type SymbolName } from './ui';

export const SLOT_UI: Record<SlotKey, { icon: SymbolName; color: string; hours: string; fallback: string }> = {
  kahvalti: { icon: 'cup.and.saucer.fill', color: palette.warn, hours: '08:00–10:00 arası', fallback: '☕️' },
  ogle: { icon: 'sun.max.fill', color: palette.good, hours: '12:00–14:00 arası', fallback: '☀️' },
  ara: { icon: 'leaf.fill', color: palette.plum, hours: '16:00 civarı', fallback: '🍎' },
  aksam: { icon: 'moon.stars.fill', color: palette.peri, hours: '19:00–20:00 arası', fallback: '🌙' },
};

/** One meal of the day plan: what to eat with it, a re-roll and "Bunu yedim" (opens the meal log prefilled). */
export function SlotCard({ slot, next, onReroll, compact }: { slot: SlotPlan; next?: boolean; onReroll?: () => void; compact?: boolean }) {
  const ui = SLOT_UI[slot.key];
  const ate = () => router.push({ pathname: '/yemek-ekle', params: { foods: slot.items.map((i) => i.food.id).join(',') } });

  return (
    <Card style={[{ gap: 12 }, next && !compact ? { borderWidth: 1.5, borderColor: ui.color } : null]}>
      <Row gap={12}>
        <IconBubble name={ui.icon} color={ui.color} dim={36} fallback={ui.fallback} />
        <View style={{ flex: 1 }}>
          <T v="h3">{slot.title}</T>
          <T v="caption" color={next ? ui.color : palette.inkSoft} style={next ? { fontWeight: '700' } : null}>
            {next ? 'Sıradaki öğün' : ui.hours}
          </T>
        </View>
        {onReroll ? (
          <Tap onPress={onReroll} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${slot.title} için başka öner`} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: surface.well }}>
            <Icon name="arrow.triangle.2.circlepath" size={13} color={palette.lettuceDeep} fallback="↻" />
            <T v="caption" color={palette.lettuceDeep} style={{ fontWeight: '700' }}>
              Başka öner
            </T>
          </Tap>
        ) : null}
      </Row>

      {slot.items.length ? (
        <View style={{ borderRadius: radius.md, overflow: 'hidden', backgroundColor: surface.well }}>
          {slot.items.map((it, i) => (
            <View key={it.food.id}>
              {i > 0 ? <View style={{ height: 1, marginLeft: 58, backgroundColor: palette.hairline }} /> : null}
              <Tap onPress={() => router.push(`/besin/${it.food.id}`)} accessibilityLabel={`${it.role}: ${it.food.name}${it.personal ? ', sana dokunmuyor' : ''}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: surface.card }}>
                  <Text style={{ fontSize: 19 }}>{it.food.emoji || '🍽️'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <T v="callout" style={{ fontWeight: '700' }} numberOfLines={1}>
                    {it.food.name}
                  </T>
                  <Row gap={6}>
                    <T v="caption" color={palette.inkSoft}>
                      {it.role}
                    </T>
                    {it.personal ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: palette.goodSoft }}>
                        <Icon name="heart.fill" size={9} color={palette.good} fallback="♥" />
                        <T v="caption" color={palette.good} style={{ fontSize: 11, fontWeight: '700' }}>
                          Sana dokunmuyor
                        </T>
                      </View>
                    ) : null}
                  </Row>
                </View>
                <Icon name="chevron.right" size={12} color={palette.inkFaint} fallback="›" />
              </Tap>
            </View>
          ))}
        </View>
      ) : (
        <T v="small" color={palette.inkSoft}>
          Bu öğün için şu an önerecek bir şey bulamadım.
        </T>
      )}

      {slot.items.length ? <Button title="Bunu yedim" icon="checkmark" kind="glass" compact onPress={ate} /> : null}
    </Card>
  );
}
