import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { HbiTrend } from '../components/HbiTrend';
import { Mascot } from '../components/Mascot';
import { PainMap } from '../components/PainMap';
import { Card, Chip, GlassPress, Icon, Row, Screen, SectionTitle, T } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { FOODS } from '../lib/foods';
import { weekKey, weekLabel, weekStart } from '../lib/hbi';
import { clockLabel } from '../lib/insights';
import { PLANT_GOAL, plantsIn } from '../lib/plants';
import { palette, radius, surface } from '../lib/theme';
import { assessFood } from '../lib/tolerance';
import { weekStats, weekTip } from '../lib/week';

const DAY = 86400000;
const PLANT_CATS = ['Sade sebze & yeşillik', 'Meyve', 'Bakliyat', 'Pilav & tahıl', 'Sebze yemekleri', 'Kuruyemiş & çerez'];

/**
 * The week on one screen (opened by the Sunday notification): the activity score, what changed
 * since last week, what bothered, fluids, plant variety, meal times and where it hurt, with one
 * thing to try next week. Arrows go back to earlier weeks.
 */
export default function Week() {
  const sql = useSQLiteContext();
  const app = useApp();
  const params = useLocalSearchParams<{ offset?: string }>();
  const [offset, setOffset] = useState(() => Math.min(0, Number(params.offset) || 0));
  const [data, setData] = useState<Awaited<ReturnType<typeof db.rangeData>> | null>(null);
  const [at, setAt] = useState(0);

  const load = useCallback(async () => {
    const t = now();
    setAt(t);
    setData(await db.rangeData(sql, weekStart(t) - 30 * 7 * DAY, weekStart(t) + 7 * DAY));
  }, [sql]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, app.dataVersion]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const start = weekStart(at || 0) + offset * 7 * DAY;
  const { cur, prev } = useMemo(() => {
    if (!data || !at) return { cur: null, prev: null };
    const s = weekStart(at) + offset * 7 * DAY;
    // DST: a week can be 167 or 169 hours, weekStart snaps back to Monday 00:00
    return { cur: weekStats(s, data), prev: weekStats(weekStart(s - 3 * DAY), data) };
  }, [data, at, offset]);

  // plants that fit the user right now and weren't eaten this week
  const newPlants = useMemo(() => {
    if (!cur || app.phase === 'atak') return [];
    const eaten = new Set(cur.plants);
    const out: { plant: string; foodId: string; name: string; emoji: string }[] = [];
    for (const f of FOODS) {
      if (!PLANT_CATS.includes(f.cat)) continue;
      const p = plantsIn(f.name)[0];
      if (!p || eaten.has(p) || out.some((x) => x.plant === p)) continue;
      const a = assessFood(f, app.phase);
      if (a.verdict !== 'iyi') continue;
      out.push({ plant: p, foodId: f.id, name: f.name, emoji: f.emoji });
      if (out.length >= 8) break;
    }
    return out;
  }, [cur, app.phase, app.medsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cur || !data) return <Screen title="Haftalık özet">{null}</Screen>;

  const thisWeek = offset === 0;
  const tip = weekTip(cur, prev, app.phase);
  const hbiRows = data.hbi.filter((h) => h.week <= weekKey(start));

  return (
    <Screen title="Haftalık özet">
      <Row gap={8}>
        <GlassPress onPress={() => setOffset((o) => o - 1)} accessibilityLabel="Önceki hafta" style={navBtn}>
          <Icon name="chevron.left" size={14} color={palette.ink} fallback="‹" />
        </GlassPress>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T v="h3">{thisWeek ? 'Bu hafta' : offset === -1 ? 'Geçen hafta' : `${-offset} hafta önce`}</T>
          <T v="small" color={palette.inkSoft}>
            {weekLabel(start)}
          </T>
        </View>
        <GlassPress onPress={() => setOffset((o) => Math.min(0, o + 1))} disabled={thisWeek} accessibilityLabel="Sonraki hafta" style={navBtn}>
          <Icon name="chevron.right" size={14} color={thisWeek ? palette.inkFaint : palette.ink} fallback="›" />
        </GlassPress>
      </Row>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
        <Mascot mood={cur.blood || (cur.hbi?.score ?? 0) >= 8 ? 'worried' : cur.bothered.length >= 3 ? 'dusunuyor' : 'mutlu'} size={84} />
        <T v="callout" style={{ flex: 1, fontWeight: '600', lineHeight: 22 }}>
          {cur.logged ? tip : 'Bu hafta kayıt yok. Bir sonraki haftaya birlikte başlayalım.'}
        </T>
      </Card>

      <HbiTrend rows={hbiRows} due={thisWeek && !cur.hbi} />

      <SectionTitle title="Geçen haftaya göre" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Stat label="Tuvalet / gün" value={cur.toiletPerDay} prev={prev?.toiletPerDay ?? null} lowerIsBetter digits={1} />
        <Stat label="Sulu dışkı" value={cur.watery} prev={prev?.watery ?? null} lowerIsBetter />
        <Stat label="Ağrılı gün" value={cur.painDays} prev={prev?.painDays ?? null} lowerIsBetter />
        <Stat label="Su / gün (bardak)" value={cur.water} prev={prev?.water ?? null} digits={1} />
        <Stat label="Öğün" value={cur.sittings} prev={prev?.sittings ?? null} neutral />
        <Stat label="Dokunan öğün" value={cur.bothered.length} prev={prev?.bothered.length ?? null} lowerIsBetter />
      </View>

      {cur.bothered.length || cur.fine ? (
        <Card style={{ gap: 8 }}>
          <T v="h3">Öğünler</T>
          <T v="small" color={palette.inkSoft}>
            {`${cur.fine} öğün normal geçti, ${cur.bothered.length} öğün dokundu${cur.unrated ? `, ${cur.unrated} öğünün cevabı boş` : ''}.`}
          </T>
          {cur.bothered.slice(0, 6).map((b, i) => (
            <Row key={`${b.name}-${i}`} gap={8}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: b.bad ? palette.bad : palette.warn }} />
              <T v="callout" style={{ flex: 1 }} numberOfLines={1}>
                {b.name}
              </T>
              <T v="small" color={b.bad ? palette.bad : palette.warn}>
                {b.bad ? 'kötü' : 'dokundu'}
              </T>
            </Row>
          ))}
        </Card>
      ) : null}

      <Card style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h3">Bitki çeşitliliği</T>
          <T v="h3" color={cur.plants.length >= PLANT_GOAL ? palette.good : palette.ink}>
            {app.phase === 'atak' ? cur.plants.length : `${cur.plants.length}/${PLANT_GOAL}`}
          </T>
        </Row>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: surface.well, overflow: 'hidden' }}>
          <View style={{ width: `${Math.min(100, (cur.plants.length / PLANT_GOAL) * 100)}%`, height: '100%', borderRadius: radius.pill, backgroundColor: palette.lettuce }} />
        </View>
        <T v="small" color={palette.inkSoft}>
          {app.phase === 'atak'
            ? 'Atakta hedef çeşitlilik değil, kolay sindirim. Remisyonda bu sayıyı birlikte artırırız.'
            : 'Haftada 20 farklı bitki iyi bir hafta: sebze, meyve, tahıl, baklagil, kuruyemiş ve yeşillik hepsi sayılır.'}
        </T>
        {cur.plants.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {cur.plants.map((p) => (
              <View key={p} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: palette.lettuceSoft }}>
                <T v="caption" color={palette.lettuceDeep} style={{ fontWeight: '700' }}>
                  {p}
                </T>
              </View>
            ))}
          </View>
        ) : null}
        {thisWeek && newPlants.length ? (
          <View style={{ gap: 8, marginTop: 4 }}>
            <T v="small" style={{ fontWeight: '700' }}>
              Sana uygun, bu hafta yemediğin
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {newPlants.map((p) => (
                <Chip key={p.foodId} label={p.name} emoji={p.emoji} onPress={() => router.push(`/besin/${p.foodId}`)} />
              ))}
            </View>
          </View>
        ) : null}
      </Card>

      {cur.lastMeal != null ? (
        <Card style={{ gap: 6 }}>
          <T v="h3">Öğün saatleri</T>
          <T v="small" color={palette.inkSoft}>
            {`Son öğünün ortalama ${clockLabel(cur.lastMeal)}.${cur.lateNights ? ` ${cur.lateNights} akşam 21:00'den sonra yedin.` : ' Hiç geç saatte yemedin.'}`}
          </T>
        </Card>
      ) : null}

      {cur.areas.size ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Ağrı nerede?</T>
          <PainMap counts={cur.areas} />
        </Card>
      ) : null}

    </Screen>
  );
}

const navBtn = { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const };

/** A number with its change since last week; green when it moved the good way. */
function Stat({ label, value, prev, lowerIsBetter, neutral, digits = 0 }: { label: string; value: number | null; prev: number | null; lowerIsBetter?: boolean; neutral?: boolean; digits?: number }) {
  const fmt = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  const diff = value != null && prev != null ? Math.round((value - prev) * 10 ** digits) / 10 ** digits : null;
  const better = diff == null || diff === 0 || neutral ? null : lowerIsBetter ? diff < 0 : diff > 0;
  return (
    <Card style={{ width: '31%', flexGrow: 1, padding: 12, gap: 2 }}>
      <T v="title">{value == null ? '–' : fmt(value)}</T>
      <T v="caption" color={palette.inkSoft} numberOfLines={2}>
        {label}
      </T>
      {diff ? (
        <T v="caption" color={better == null ? palette.inkSoft : better ? palette.good : palette.bad} style={{ fontWeight: '700' }}>
          {`${diff > 0 ? '▲' : '▼'} ${fmt(Math.abs(diff))}`}
        </T>
      ) : (
        <T v="caption" color={palette.inkFaint}>
          {prev == null ? ' ' : 'aynı'}
        </T>
      )}
    </Card>
  );
}

