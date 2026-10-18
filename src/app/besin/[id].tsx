import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { Text } from '../../components/text';
import { Mascot } from '../../components/Mascot';
import { ThinkingOverlay } from '../../components/ThinkingOverlay';
import { Button, Card, Icon, Row, Screen, T, Tap, VERDICT_UI, VerdictBadge } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { now } from '../../lib/dates';
import * as db from '../../lib/db';
import { afterMealSaved } from '../../lib/reminders';
import { FOOD_BY_ID, TAGS } from '../../lib/foods';
import { palette, radius, surface, type } from '../../lib/theme';
import { alternativesFor, assessContext, assessFood, phaseSummary, setTagHistory, statsByName } from '../../lib/tolerance';
import { MedNotes } from '../../components/MedNotes';
import { useAnalyze } from '../../lib/use-analyze';

export default function FoodDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const food = FOOD_BY_ID[id ?? ''];
  const sql = useSQLiteContext();
  const app = useApp();
  const { busy, byName, hasAi } = useAnalyze();
  const [meals, setMeals] = useState<db.Meal[]>([]);

  useEffect(() => {
    db.allRatedMeals(sql).then((m) => {
      setTagHistory(m);
      setMeals(m);
    });
  }, [sql, app.dataVersion]);

  const stats = useMemo(() => statsByName(meals), [meals]);
  // every verdict on this page comes from the same assessment: phase, personal factors,
  // the records (per phase) and the medicines switched on
  const both = useMemo(
    () => (food ? { remisyon: assessFood(food, 'remisyon', undefined, stats), atak: assessFood(food, 'atak', undefined, stats) } : null),
    // the medicines and the per-tag history live outside React; medsKey and meals mark their changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [food, stats, app.medsKey],
  );
  /** Foods that come out 'iyi' under the same assessment, for the "instead" row. */
  const alternatives = useMemo(
    () => (food ? alternativesFor(food, app.phase, 4, stats) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [food, app.phase, stats, app.medsKey],
  );

  if (!food || !both) return null;
  const a = both[app.phase];
  const u = VERDICT_UI[a.verdict];
  const ctx = assessContext(app.phase);

  const ate = async () => {
    const id = await db.addMeal(sql, {
      name: food.name,
      food_id: food.id,
      tags: food.tags.join(','),
      photo: null,
      eaten_at: now(),
      ai_verdict: a.verdict,
      phase: app.phase,
    });
    await afterMealSaved(sql, [id]);
    app.bump();
    router.back();
    setTimeout(() => Alert.alert('Kaydedildi', 'Birkaç saat sonra nasıl geçtiğini soracağım.'), 350);
  };

  const mood = a.verdict === 'iyi' ? 'catalla' : a.verdict === 'dikkat' ? 'dusunuyor' : 'agri';
  const phaseWord = app.phase === 'atak' ? 'atakta' : 'remisyonda';
  const line =
    a.driver === 'ilac'
      ? a.verdict === 'riskli'
        ? 'Kullandığın ilaçla birlikte bundan uzak durmak daha iyi.'
        : 'Kullandığın ilaç yüzünden ölçülü ol, nedeni aşağıda.'
      : a.driver === 'kisisel'
      ? a.verdict === 'iyi'
        ? `Kayıtlarına bakılırsa bu ${phaseWord} sana dokunmuyor.`
        : a.verdict === 'dikkat'
          ? `Bu ${phaseWord} sana bazen dokunmuş. Küçük porsiyon, yavaş ye.`
          : `Kayıtlarında bu ${phaseWord} çoğu zaman dokunmuş. Bugün başka bir şey seçmek daha iyi.`
      : a.verdict === 'iyi'
        ? 'Çoğu kişide sorun çıkarmayan bir seçim.'
        : a.verdict === 'dikkat'
          ? 'Bazı kişilere dokunabilir. Az deneyip nasıl geçtiğini yaz.'
          : app.phase === 'atak'
            ? 'Atak döneminde bundan uzak durmak daha iyi.'
            : 'Çoğu kişiye dokunan içerikleri var. Denersen az dene.';

  return (
    <Screen header={false}>
      <ThinkingOverlay mode={busy} />
      <Card style={{ gap: 12 }}>
        <Row style={{ alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ fontSize: 44 }}>{food.emoji}</Text>
            <T v="title">{food.name}</T>
            <Row gap={8}>
              <VerdictBadge verdict={a.verdict} />
              <T v="caption" color={palette.inkSoft}>
                {food.cat}
              </T>
            </Row>
          </View>
          <Mascot mood={mood} size={88} />
        </Row>
        <View style={{ backgroundColor: u.bg, borderRadius: radius.md, padding: 14 }}>
          <T v="callout" style={type.medium}>
            {line}
          </T>
        </View>
        <ContextLine phase={app.phase} label={ctx.phase} extras={ctx.extras} />
      </Card>

      <MedNotes notes={(a.meds ?? []).map((hit) => ({ hit }))} />

      {a.stat && a.stat.n > 0 ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Senin kayıtların</T>
          <Row gap={8}>
            <Mini label="Normal" value={a.stat.good} bg={palette.goodSoft} fg={palette.good} />
            <Mini label="Dokundu" value={a.stat.mild} bg={palette.warnSoft} fg={palette.warn} />
            <Mini label="Kötü" value={a.stat.bad} bg={palette.badSoft} fg={palette.bad} />
          </Row>
          {(['remisyon', 'atak'] as const)
            .filter((p) => a.stat!.phases[p].n)
            .map((p) => (
              <T key={p} v="small" color={p === app.phase ? palette.ink : palette.inkSoft}>
                {`${phaseSummary(p, a.stat!.phases[p])}.`}
              </T>
            ))}
          {a.personalAdvice ? (
            <T v="caption" color={palette.inkSoft}>
              {a.personalAdvice}
            </T>
          ) : null}
        </Card>
      ) : (
        <Card tint={palette.lettuceSoft}>
          <T v="small">Bunu henüz kaydetmedin. Yiyip nasıl geçtiğini yazarsan bir dahaki sefere sana göre söylerim.</T>
        </Card>
      )}

      <Card style={{ gap: 10 }}>
        <T v="h3">Neden</T>
        {a.reasons.filter((r) => !r.startsWith('💊')).map((r, i) => (
          <Row key={i} gap={10} style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: u.fg, marginTop: 8 }} />
            <T v="callout" style={{ flex: 1 }}>
              {r}
            </T>
          </Row>
        ))}
        {food.tags.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {food.tags.map((t) => (
              <View key={t} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: surface.well }}>
                <T v="caption" color={palette.inkSoft}>
                  {TAGS[t].label}
                </T>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="h3">Döneme göre</T>
        {(['remisyon', 'atak'] as const).map((p) => (
          <Row key={p} style={{ justifyContent: 'space-between' }}>
            <T v="callout" style={p === app.phase ? type.semibold : undefined}>
              {p === 'atak' ? 'Atakta' : 'Remisyonda'}
              {p === app.phase ? <T v="small" color={palette.inkSoft}>{'  şu an'}</T> : null}
            </T>
            <VerdictBadge verdict={both[p].verdict} size="sm" />
          </Row>
        ))}
        {ctx.extras.length || a.stat?.n ? (
          <T v="caption" color={palette.inkSoft}>
            {`${andList([...ctx.extras, ...(a.stat?.n ? ['kayıtların'] : [])])} iki dönemde de hesaba katıldı.`}
          </T>
        ) : null}
      </Card>

      {a.verdict !== 'iyi' && alternatives.length ? (
        <Card style={{ gap: 4 }}>
          <T v="h3">Bunun yerine</T>
          <T v="small" color={palette.inkSoft} style={{ marginBottom: 4 }}>
            {`${app.phase === 'atak' ? 'Atak' : 'Remisyon'} dönemine${ctx.extras.length ? `, ${ctx.extras.join(', ').toLocaleLowerCase('tr-TR')}` : ''} ve kayıtlarına göre uygun`}
          </T>
          {alternatives.map(({ food: f, a: fa }) => (
            <Tap key={f.id} onPress={() => router.replace(`/besin/${f.id}`)} accessibilityRole="button" accessibilityLabel={`${f.name}, uygun`}>
              <Row gap={10} style={{ paddingVertical: 6 }}>
                <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <T v="callout">{f.name}</T>
                  {fa.confidence === 'kişisel' ? (
                    <T v="caption" color={palette.good}>
                      Sana dokunmuyor
                    </T>
                  ) : null}
                </View>
                <VerdictBadge verdict={fa.verdict} size="sm" />
              </Row>
            </Tap>
          ))}
        </Card>
      ) : null}

      <View style={{ gap: 8 }}>
        <Button title="Yedim, kaydet" icon="checkmark" onPress={ate} />
        {hasAi ? <Button title="Daha ayrıntılı sor" kind="glass" icon="sparkles" onPress={() => byName(food.name, food.id)} /> : null}
      </View>
    </Screen>
  );
}

function Mini({ label, value, bg, fg }: { label: string; value: number; bg: string; fg: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: radius.md, padding: 12, alignItems: 'center' }}>
      <T v="title" color={fg}>
        {value}
      </T>
      <T v="caption" color={fg}>
        {label}
      </T>
    </View>
  );
}

/** What the verdict was based on: "Remisyon · Kortizon · Laktoz". */
function ContextLine({ phase, label, extras }: { phase: 'remisyon' | 'atak'; label: string; extras: string[] }) {
  const tone = phase === 'atak' ? palette.flareDeep : palette.lettuceDeep;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }} accessible accessibilityLabel={`Değerlendirme: ${[label, ...extras].join(', ')}`}>
      <T v="caption" color={palette.inkSoft}>
        Değerlendirme:
      </T>
      <Row gap={4}>
        <Icon name={phase === 'atak' ? 'flame.fill' : 'leaf.fill'} size={11} color={tone} fallback={phase === 'atak' ? '🔥' : '🌿'} />
        <T v="caption" color={tone} style={type.semibold}>
          {label}
        </T>
      </Row>
      {extras.map((x) => (
        <T key={x} v="caption" color={palette.inkSoft} style={type.semibold}>
          {`· ${x}`}
        </T>
      ))}
    </View>
  );
}

/** "Kortizon, Laktoz ve kayıtların" */
function andList(xs: string[]) {
  const s = xs.length > 1 ? `${xs.slice(0, -1).join(', ')} ve ${xs[xs.length - 1]}` : (xs[0] ?? '');
  return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
}
