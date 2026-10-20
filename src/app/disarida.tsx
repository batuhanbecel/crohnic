import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Mascot } from '../components/Mascot';
import { Text, TextInput } from '../components/text';
import { Card, Icon, Row, Screen, SectionTitle, T, Tap, VERDICT_UI, VerdictBadge, st } from '../components/ui';
import { useApp } from '../lib/app-state';
import { activeMedClasses } from '../lib/med-food';
import { BRANDS, brandFoods, withoutBrand, type Brand, type Food, type Verdict } from '../lib/foods';
import { palette, radius, surface } from '../lib/theme';
import { assessContext, assessFood, hasLactose, type FoodAssessment } from '../lib/tolerance';

const fold = (s: string) => s.toLocaleLowerCase('tr-TR');

/** What to ask for at the counter, for this phase, these medicines and factors. */
function orderTips(phase: 'remisyon' | 'atak', brand: Brand) {
  const steroid = activeMedClasses().includes('steroid');
  const tips: string[] = [];
  if (brand.kind === 'restoran') {
    tips.push('Kızartma yerine ızgara ya da fırın seç; sosu ayrı iste, azını kullan.');
    if (phase === 'atak') tips.push('Acısız, az yağlı ve küçük porsiyon; yanına ayran ya da yoğurt.');
    if (steroid) tips.push('Kortizondasın: turşu, tuzlu sos ve patates kızartmasını azalt, içecekte şekersizi seç.');
    tips.push('Menüdeki büyük boy yerine normal boy; patatesi paylaş.');
  } else {
    if (phase === 'atak') tips.push('Kafein bağırsağı hızlandırabilir: kafeinsiz ya da sütlü, küçük boy seç.');
    if (steroid) tips.push('Kortizondasın: şuruplu ve kremalı içecekler yerine sade kahve, tatlıyı paylaş.');
    if (hasLactose()) tips.push('Laktoz için laktozsuz süt ya da bitkisel süt iste.');
    tips.push('Şurup ve krema eklemelerini azalt; tatlıyı küçük porsiyonla, yemekten sonra ye.');
  }
  return tips.slice(0, 3);
}

/**
 * "Dışarıda ne yesem?": pick a chain, see its menu sorted for you right now (phase, personal
 * factors, your records, the medicines switched on), suitable ones first.
 */
export default function EatingOut() {
  const app = useApp();
  const params = useLocalSearchParams<{ brand?: string }>();
  const [brand, setBrand] = useState<string | null>(params.brand ?? null);
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);
  const ctx = assessContext(app.phase);

  // every chain's items, assessed once per phase/medicines/data change
  const assessed = useMemo(() => {
    const out = new Map<string, { f: Food; a: FoodAssessment }[]>();
    for (const b of BRANDS) out.set(b.name, brandFoods(b.name).map((f) => ({ f, a: assessFood(f, app.phase) })));
    return out;
  }, [app.phase, app.medsKey, app.dataVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = BRANDS.find((b) => b.name === brand) ?? null;

  if (current) {
    const rows = assessed.get(current.name) ?? [];
    const rank: Record<Verdict, number> = { iyi: 0, dikkat: 1, riskli: 2 };
    const sorted = [...rows].sort(
      (x, y) => rank[x.a.verdict] - rank[y.a.verdict] || Number(y.a.confidence === 'kişisel') - Number(x.a.confidence === 'kişisel') || x.f.name.localeCompare(y.f.name, 'tr'),
    );
    const groups = (['iyi', 'dikkat', 'riskli'] as Verdict[]).map((v) => ({ v, items: sorted.filter((r) => r.a.verdict === v) })).filter((g) => g.items.length);
    const good = rows.filter((r) => r.a.verdict === 'iyi').length;
    return (
      <Screen title={current.name}>
        <Row gap={10}>
          <Tap onPress={() => setBrand(null)} accessibilityRole="button" hitSlop={8}>
            <Row gap={4}>
              <Icon name="chevron.left" size={12} color={palette.lettuceDeep} fallback="‹" />
              <T v="callout" color={palette.lettuceDeep} style={{ fontWeight: '700' }}>
                Tüm zincirler
              </T>
            </Row>
          </Tap>
          <View style={{ flex: 1 }} />
          <T v="small" color={palette.inkSoft}>
            {`${rows.length} ürün, ${good} uygun`}
          </T>
        </Row>

        <Card tint={palette.lettuceSoft} style={{ gap: 6 }}>
          <Row gap={8}>
            <Icon name="lightbulb.fill" size={14} color={palette.apricot} fallback="💡" />
            <T v="h3">Sipariş verirken</T>
          </Row>
          {orderTips(app.phase, current).map((t) => (
            <T key={t} v="small">
              {`• ${t}`}
            </T>
          ))}
          <T v="caption" color={palette.inkSoft}>
            {`Değerlendirme: ${[ctx.phase, ...ctx.extras].join(' · ')}`}
          </T>
        </Card>

        {groups.map((g) => {
          const limit = g.v === 'iyi' || showAll ? g.items.length : 4;
          return (
            <View key={g.v} style={{ gap: 8 }}>
              <Row gap={8} style={{ paddingHorizontal: 2, marginTop: 4 }}>
                <Icon name={VERDICT_UI[g.v].icon} size={16} color={VERDICT_UI[g.v].fg} fallback={VERDICT_UI[g.v].dot} />
                <T v="h2">{VERDICT_UI[g.v].short}</T>
                <T v="small" color={palette.inkSoft}>
                  {g.items.length}
                </T>
              </Row>
              <Card style={{ paddingVertical: 4 }}>
                {g.items.slice(0, limit).map(({ f, a }, i) => (
                  <Tap key={f.id} onPress={() => router.push(`/besin/${f.id}`)} accessibilityRole="button" accessibilityLabel={`${f.name}, ${VERDICT_UI[a.verdict].short}`}>
                    {i > 0 ? <View style={{ height: 1, backgroundColor: palette.hairline, marginLeft: 44 }} /> : null}
                    <Row gap={10} style={{ paddingVertical: 10 }}>
                      <View style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: surface.well, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18 }}>{f.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <T v="callout" style={{ fontWeight: '700' }} numberOfLines={1}>
                          {withoutBrand(f.name, current.name)}
                        </T>
                        <T v="small" color={palette.inkSoft} numberOfLines={1}>
                          {a.confidence === 'kişisel' && a.verdict === 'iyi' ? 'Sana dokunmuyor' : a.why}
                        </T>
                      </View>
                      <VerdictBadge verdict={a.verdict} size="sm" inline />
                    </Row>
                  </Tap>
                ))}
                {g.items.length > limit ? (
                  <Tap onPress={() => setShowAll(true)} accessibilityRole="button">
                    <T v="small" color={palette.lettuceDeep} style={{ paddingVertical: 10, fontWeight: '700' }}>
                      {`${g.items.length - limit} tane daha göster`}
                    </T>
                  </Tap>
                ) : null}
              </Card>
            </View>
          );
        })}
      </Screen>
    );
  }

  const term = fold(q.trim());
  const list = BRANDS.filter((b) => brandFoods(b.name).length && (!term || fold(b.name).includes(term)));
  const tile = (b: Brand) => {
    const rows = assessed.get(b.name) ?? [];
    const good = rows.filter((r) => r.a.verdict === 'iyi').length;
    return (
      <Tap
        key={b.name}
        onPress={() => {
          setBrand(b.name);
          setShowAll(false);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${b.name}, ${good} uygun ürün`}
        style={{ width: '31%', flexGrow: 1 }}
      >
        <Card style={{ padding: 12, gap: 4, alignItems: 'center' }}>
          <Text style={{ fontSize: 26 }}>{b.emoji}</Text>
          <T v="callout" style={{ fontWeight: '700', textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>
            {b.name}
          </T>
          <T v="caption" color={good ? palette.good : palette.inkSoft} style={{ fontWeight: '700' }}>
            {good ? `${good} uygun` : `${rows.length} ürün`}
          </T>
        </Card>
      </Tap>
    );
  };

  return (
    <Screen title="Dışarıda ne yesem?">
      <Row gap={4}>
        <Mascot mood="soru" size={64} />
        <T v="callout" color={palette.inkSoft} style={{ flex: 1 }}>
          {`Zinciri seç, menüsünü ${ctx.phase === 'Atak' ? 'atak' : 'remisyon'} dönemine${ctx.extras.length ? `, ${ctx.extras.join(', ').toLocaleLowerCase('tr')}` : ''} ve kayıtlarına göre sıralayayım.`}
        </T>
      </Row>
      <TextInput value={q} onChangeText={setQ} placeholder="Zincir ara: ör. Burger King" placeholderTextColor={palette.inkFaint} style={st.input} autoCorrect={false} />
      {(['restoran', 'kafe'] as const).map((k) => {
        const items = list.filter((b) => b.kind === k);
        if (!items.length) return null;
        return (
          <View key={k} style={{ gap: 10 }}>
            <SectionTitle title={k === 'restoran' ? 'Restoranlar' : 'Kafe ve pastaneler'} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{items.map(tile)}</View>
          </View>
        );
      })}
      {!list.length ? (
        <T v="small" color={palette.inkSoft} style={{ textAlign: 'center' }}>
          Bu zincir listemde yok. Menüsünün fotoğrafını Sor sekmesinden çekersen tek tek değerlendiririm.
        </T>
      ) : null}
    </Screen>
  );
}
