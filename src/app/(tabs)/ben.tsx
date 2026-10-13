import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { bristolTone } from '../../components/bristol';
import { Mascot } from '../../components/Mascot';
import { Button, Card, Empty, Row, Screen, SectionTitle, T } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { dayKey, now } from '../../lib/dates';
import * as db from '../../lib/db';
import { TAGS } from '../../lib/foods';
import { lifestyleEffects, suspectFoods } from '../../lib/insights';
import { palette, radius, surface, type } from '../../lib/theme';
import { personalVerdict, statsByName, triggerInsights } from '../../lib/tolerance';

const SLOTS = [
  { label: 'Sabah', from: 5, to: 11 },
  { label: 'Öğle', from: 11, to: 16 },
  { label: 'Akşam', from: 16, to: 22 },
  { label: 'Gece', from: 22, to: 29 },
];

export default function Insights() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [rated, setRated] = useState<db.Meal[]>([]);
  const [allMeals, setAllMeals] = useState<db.Meal[]>([]);
  const [bowel, setBowel] = useState<db.BowelLog[]>([]);
  const [symptoms, setSymptoms] = useState<db.SymptomLog[]>([]);
  const [daily, setDaily] = useState<db.Daily[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      Promise.all([db.allRatedMeals(sql), db.listMeals(sql, 600), db.listBowel(sql, 600), db.listSymptoms(sql, 600), db.listDaily(sql, 120)]).then(([r, m, b, s, d]) => {
        setRated(r);
        setAllMeals(m);
        setBowel(b);
        setSymptoms(s);
        setDaily(d);
        setLoadedAt(now());
      });
    }, [sql]),
  );

  const { triggers, safe } = useMemo(() => triggerInsights(rated), [rated]);
  const suspects = useMemo(() => suspectFoods(allMeals, symptoms, bowel), [allMeals, symptoms, bowel]);
  const lifestyle = useMemo(() => lifestyleEffects(daily, symptoms, bowel, allMeals), [daily, symptoms, bowel, allMeals]);
  const foods = useMemo(() => {
    const list = [...statsByName(rated).values()];
    return {
      bad: list.filter((x) => personalVerdict(x) === 'riskli').sort((a, b) => b.bad - a.bad || b.n - a.n).slice(0, 6),
      good: list.filter((x) => personalVerdict(x) === 'iyi' && x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 6),
    };
  }, [rated]);

  const last14 = useMemo(() => {
    const days: { key: string; label: string; count: number; bristol: number | null; pain: number | null }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(loadedAt || 0);
      d.setDate(d.getDate() - i);
      const key = dayKey(d.getTime());
      const bs = bowel.filter((b) => dayKey(b.at) === key);
      const ss = symptoms.filter((s) => dayKey(s.at) === key);
      days.push({
        key,
        label: d.toLocaleDateString('tr-TR', { weekday: 'narrow' }),
        count: bs.length,
        bristol: bs.length ? bs.reduce((a, b) => a + b.bristol, 0) / bs.length : null,
        pain: ss.length ? Math.max(...ss.map((s) => s.pain)) : null,
      });
    }
    return days;
  }, [bowel, symptoms, loadedAt]);

  const monthAgo = loadedAt - 30 * 86400000;
  const monthBowel = bowel.filter((b) => b.at >= monthAgo);
  const slots = SLOTS.map((s) => ({
    ...s,
    n: monthBowel.filter((b) => {
      const h = new Date(b.at).getHours();
      const hh = h < 5 ? h + 24 : h;
      return hh >= s.from && hh < s.to;
    }).length,
  }));
  const slotMax = Math.max(1, ...slots.map((s) => s.n));
  const maxCount = Math.max(3, ...last14.map((d) => d.count));
  const activeDays = last14.filter((d) => d.count).length;
  const avgPerDay = activeDays ? last14.reduce((a, d) => a + d.count, 0) / activeDays : 0;
  const monthMeals = allMeals.filter((m) => m.eaten_at >= monthAgo);
  const enough = rated.length >= 4;

  return (
    <Screen tone={app.phase === 'atak' ? 'flare' : 'calm'}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
        <T v="large">Örüntüler</T>
        <Button title="Doktor raporu" kind="glass" compact icon="doc.text" onPress={() => router.push('/rapor')} />
      </Row>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
        <Mascot mood={enough ? 'happy' : 'sleepy'} size={84} />
        <View style={{ flex: 1, gap: 4 }}>
          <T v="caption" color={palette.inkSoft}>
            Son 30 gün
          </T>
          <T v="callout" style={type.medium}>
            {monthMeals.length} öğün, {monthBowel.length} tuvalet, {symptoms.filter((s) => s.at >= monthAgo).length} semptom kaydı.
          </T>
        </View>
      </Card>

      {!enough ? (
        <Empty emoji="🔍" title="Biraz daha kayıt lazım" text={`4 öğünün nasıl geçtiğini yazınca tetikleyicilerini göstermeye başlarım. Şu an ${rated.length} tane var.`} />
      ) : null}

      {triggers.length ? (
        <>
          <SectionTitle title="Olası tetikleyiciler" />
          <Card style={{ gap: 14 }}>
            {triggers.slice(0, 6).map((t) => (
              <View key={t.tag} style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="h3">{TAGS[t.tag].label}</T>
                  <T v="small" color={palette.inkSoft}>
                    {t.stat.n} kayıtta {t.stat.mild + t.stat.bad} kez
                  </T>
                </Row>
                <Bar pct={t.rate} color={t.rate >= 0.75 ? palette.bad : palette.warn} />
              </View>
            ))}
            <T v="caption" color={palette.inkFaint} style={{ fontWeight: '400' }}>
              Bu bir ilişki, kesin sonuç değil. Diyetinden bir şey çıkarmadan önce doktorun ya da diyetisyeninle konuş.
            </T>
          </Card>
        </>
      ) : null}

      {safe.length ? (
        <>
          <SectionTitle title="Sorun çıkarmayanlar" />
          <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {safe.slice(0, 8).map((t) => (
              <View key={t.tag} style={{ backgroundColor: palette.goodSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                <T v="small" color={palette.good} style={type.semibold}>
                  {TAGS[t.tag].label} · {t.stat.n}
                </T>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {suspects.foods.length ? (
        <>
          <SectionTitle title="Şikayetten önce sık yenenler" />
          <Card style={{ gap: 14 }}>
            {suspects.foods.map((f) => (
              <View key={f.name} style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="h3" numberOfLines={1} style={{ flex: 1 }}>
                    {f.name}
                  </T>
                  <T v="small" color={palette.inkSoft}>
                    {f.hit}/{f.n} kez
                  </T>
                </Row>
                <Bar pct={f.rate} color={f.rate >= 0.75 ? palette.bad : palette.warn} />
              </View>
            ))}
            <T v="caption" color={palette.inkFaint} style={{ fontWeight: '400' }}>
              Yedikten 2–24 saat sonra ağrı, şişkinlik ya da sulu dışkı kaydettiğin öğünler. Genel ortalaman %{Math.round(suspects.baseline * 100)}.
            </T>
          </Card>
        </>
      ) : null}

      {lifestyle.length ? (
        <>
          <SectionTitle title="Stres ve uyku" />
          <Card style={{ gap: 16 }}>
            {lifestyle.map((e) => (
              <View key={e.key} style={{ gap: 8 }}>
                <T v="h3">{e.label}</T>
                <Row gap={10}>
                  <T v="small" style={{ width: 150 }} numberOfLines={1}>
                    {e.highLabel}
                  </T>
                  <View style={{ flex: 1 }}>
                    <Bar pct={e.high} color={palette.bad} />
                  </View>
                  <T v="small" color={palette.inkSoft} style={{ width: 40, textAlign: 'right' }}>
                    %{Math.round(e.high * 100)}
                  </T>
                </Row>
                <Row gap={10}>
                  <T v="small" style={{ width: 150 }} numberOfLines={1}>
                    {e.lowLabel}
                  </T>
                  <View style={{ flex: 1 }}>
                    <Bar pct={e.low} color={palette.good} />
                  </View>
                  <T v="small" color={palette.inkSoft} style={{ width: 40, textAlign: 'right' }}>
                    %{Math.round(e.low * 100)}
                  </T>
                </Row>
              </View>
            ))}
            <T v="caption" color={palette.inkFaint} style={{ fontWeight: '400' }}>
              O gün ya da ertesi gün şikayet kaydettiğin günlerin oranı.
            </T>
          </Card>
        </>
      ) : daily.length ? null : (
        <Empty emoji="🌙" title="Stres ve uyku" text="Akşamları “Bugün nasıldı” kaydını doldurursan, stres ve uykunun şikayetlerinle ilişkisini burada gösteririm." />
      )}

      {foods.bad.length || foods.good.length ? (
        <Row gap={10} style={{ alignItems: 'stretch' }}>
          <FoodList title="Dokunanlar" items={foods.bad.map((x) => `${x.name} (${x.bad + x.mild}/${x.n})`)} color={palette.bad} />
          <FoodList title="İyi gelenler" items={foods.good.map((x) => `${x.name} (${x.n})`)} color={palette.good} />
        </Row>
      ) : null}

      <SectionTitle title="Tuvalet, son 14 gün" />
      <Card style={{ gap: 12 }}>
        <Row gap={18}>
          <View>
            <T v="title">{avgPerDay ? avgPerDay.toFixed(1) : '–'}</T>
            <T v="caption" color={palette.inkSoft}>
              günde ortalama
            </T>
          </View>
          <View>
            <T v="title">{monthBowel.filter((b) => b.bristol >= 6).length}</T>
            <T v="caption" color={palette.inkSoft}>
              sulu (30 gün)
            </T>
          </View>
          <View>
            <T v="title">{monthBowel.filter((b) => b.blood).length}</T>
            <T v="caption" color={palette.inkSoft}>
              kanlı (30 gün)
            </T>
          </View>
        </Row>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4 }}>
          {last14.map((d) => (
            <View key={d.key} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <T v="caption" color={palette.inkSoft} style={{ fontSize: 10 }}>
                {d.count || ''}
              </T>
              <View
                style={{
                  width: '100%',
                  height: d.count ? Math.max(8, (d.count / maxCount) * 80) : 4,
                  backgroundColor: d.bristol ? bristolTone(Math.round(d.bristol)) : surface.well,
                  borderRadius: 6,
                }}
              />
              <T v="caption" color={palette.inkFaint} style={{ fontSize: 10 }}>
                {d.label}
              </T>
            </View>
          ))}
        </View>
        <Row gap={14} style={{ flexWrap: 'wrap' }}>
          <Legend c={palette.good} l="Normal (3–4)" />
          <Legend c={palette.apricot} l="Sert" />
          <Legend c={palette.warn} l="Yumuşak" />
          <Legend c={palette.bad} l="Sulu" />
        </Row>
      </Card>

      {monthBowel.length ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Günün hangi saatinde</T>
          {slots.map((s) => (
            <Row key={s.label} gap={10}>
              <T v="small" style={{ width: 52 }}>
                {s.label}
              </T>
              <View style={{ flex: 1 }}>
                <Bar pct={s.n / slotMax} color={palette.sky} />
              </View>
              <T v="small" color={palette.inkSoft} style={{ width: 24, textAlign: 'right' }}>
                {s.n}
              </T>
            </Row>
          ))}
        </Card>
      ) : null}

      {last14.some((d) => d.pain != null) ? (
        <Card style={{ gap: 8 }}>
          <T v="h3">En yüksek ağrı</T>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {last14.map((d) => (
              <View
                key={d.key}
                style={{
                  flex: 1,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: d.pain == null ? surface.well : d.pain >= 4 ? palette.bad : d.pain >= 2 ? palette.peri : palette.periSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {d.pain != null ? (
                  <T v="caption" color={d.pain >= 2 ? '#fff' : palette.peri} style={{ fontSize: 10 }}>
                    {d.pain}
                  </T>
                ) : null}
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', lineHeight: 17, fontWeight: '400' }}>
        Kontrole giderken Doktor raporu’nu PDF olarak paylaşabilirsin.{'\n'}Yedeklerin Ayarlar’da.
      </T>
    </Screen>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={{ height: 10, borderRadius: 5, backgroundColor: surface.well, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, Math.round(pct * 100))}%`, height: '100%', backgroundColor: color, borderRadius: 5 }} />
    </View>
  );
}

function Legend({ c, l }: { c: string; l: string }) {
  return (
    <Row gap={6}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }} />
      <T v="caption" color={palette.inkSoft} style={{ fontWeight: '400' }}>
        {l}
      </T>
    </Row>
  );
}

function FoodList({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <Card style={{ flex: 1, gap: 6, padding: 14 }}>
      <Row gap={6}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <T v="h3">{title}</T>
      </Row>
      {items.length ? (
        items.map((x) => (
          <T key={x} v="small" numberOfLines={2}>
            {x}
          </T>
        ))
      ) : (
        <T v="small" color={palette.inkSoft}>
          Henüz yok
        </T>
      )}
    </Card>
  );
}
