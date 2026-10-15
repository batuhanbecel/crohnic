import { View } from 'react-native';
import { SlotCard } from '../components/DayPlan';
import { Mascot } from '../components/Mascot';
import { Icon, Row, Screen, T } from '../components/ui';
import { PHASE_NOTE } from '../lib/suggest';
import { palette, radius } from '../lib/theme';
import { useDayPlan } from '../lib/use-day-plan';

/** "Bugün ne yesem?": the whole day's ideas for the current phase. */
export default function Suggestions() {
  const { plan, reroll, current, phase } = useDayPlan();
  const flare = phase === 'atak';

  return (
    <Screen header={false}>
      <Row gap={4} style={{ alignItems: 'center' }}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: flare ? palette.flareSoft : palette.lettuceSoft }}>
            <Icon name={flare ? 'flame.fill' : 'leaf.fill'} size={12} color={flare ? palette.flareDeep : palette.lettuceDeep} fallback={flare ? '🔥' : '🌿'} />
            <T v="caption" color={flare ? palette.flareDeep : palette.lettuceDeep} style={{ fontWeight: '700' }}>
              {flare ? 'Atak dönemi' : 'Remisyon dönemi'}
            </T>
          </View>
          <T v="small" color={palette.inkSoft}>
            {PHASE_NOTE[phase]}
          </T>
        </View>
        <Mascot mood="yemek" size={84} />
      </Row>

      {plan
        ? plan.map((slot) => <SlotCard key={slot.key} slot={slot} next={slot.key === current} onReroll={() => reroll(slot.key)} />)
        : null}

      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', paddingHorizontal: 12 }}>
        Öneriler genel beslenme kılavuzlarına ve kendi kayıtlarına göre seçilir. Sana dokunan bir şeyi kaydedersen bir daha önermem. Diyetisyeninin ya da doktorunun dediği her zaman önce gelir.
      </T>
    </Screen>
  );
}
