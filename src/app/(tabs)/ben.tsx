import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Mascot } from '../../components/Mascot';
import { Card, Empty, Row, Screen, SectionTitle, T } from '../../components/ui';
import { dayKey, now } from '../../lib/dates';
import * as db from '../../lib/db';
import { TAGS } from '../../lib/foods';
import { colors, fonts, radius } from '../../lib/theme';
import { personalVerdict, statsByName, triggerInsights } from '../../lib/tolerance';

export default function Insights() {
  const sql = useSQLiteContext();
  const [rated, setRated] = useState<db.Meal[]>([]);
  const [allMeals, setAllMeals] = useState<db.Meal[]>([]);
  const [bowel, setBowel] = useState<db.BowelLog[]>([]);
  const [symptoms, setSymptoms] = useState<db.SymptomLog[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      Promise.all([db.allRatedMeals(sql), db.listMeals(sql, 500), db.listBowel(sql, 500), db.listSymptoms(sql, 500)]).then(([r, m, b, s]) => {
        setRated(r);
        setAllMeals(m);
        setBowel(b);
        setSymptoms(s);
        setLoadedAt(now());
      });
    }, [sql]),
  );

  const { triggers, safe } = useMemo(() => triggerInsights(rated), [rated]);
  const foods = useMemo(() => {
    const list = [...statsByName(rated).values()];
    return {
      bad: list.filter((x) => personalVerdict(x) === 'riskli').sort((a, b) => b.bad - a.bad || b.n - a.n).slice(0, 6),
      good: list.filter((x) => personalVerdict(x) === 'iyi' && x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 6),
    };
  }, [rated]);

  const last14 = useMemo(() => {
    const days: { key: string; label: string; bristol: number | null; pain: number | null; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d.getTime());
      const bs = bowel.filter((b) => dayKey(b.at) === key);
      const ss = symptoms.filter((s) => dayKey(s.at) === key);
      days.push({
        key,
        label: d.toLocaleDateString('tr-TR', { weekday: 'narrow' }),
        bristol: bs.length ? bs.reduce((a, b) => a + b.bristol, 0) / bs.length : null,
        pain: ss.length ? Math.max(...ss.map((s) => s.pain)) : null,
        count: bs.length,
      });
    }
    return days;
  }, [bowel, symptoms]);

  const monthAgo = loadedAt - 30 * 86400000;
  const monthMeals = allMeals.filter((m) => m.eaten_at >= monthAgo);
  const ratedPct = monthMeals.length ? Math.round((monthMeals.filter((m) => m.reaction != null).length / monthMeals.length) * 100) : 0;

  const enough = rated.length >= 4;

  return (
    <Screen>
      <T v="title">Beni tanı</T>

      <Card tint={colors.coralSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Mascot mood={enough ? 'cheer' : 'sleepy'} size={92} />
        <View style={{ flex: 1, gap: 4 }}>
          <T v="tiny" color={colors.coral}>
            SON 30 GÜN
          </T>
          <T v="body" style={{ fontFamily: fonts.bold }}>
            {monthMeals.length} öğün, {bowel.filter((b) => b.at >= monthAgo).length} tuvalet, {symptoms.filter((s) => s.at >= monthAgo).length} semptom kaydı.
            {monthMeals.length ? ` Öğünlerin %${ratedPct}’ine “nasıl geldi” demişsin.` : ''}
          </T>
        </View>
      </Card>

      {!enough ? (
        <Empty
          emoji="🔍"
          title="Seni tanımaya başlıyorum"
          text={`En az 4 öğüne “nasıl geldi” dediğinde tetikleyicilerini burada göstereceğim. Şu an ${rated.length} tane var.`}
        />
      ) : null}

      {triggers.length ? (
        <>
          <SectionTitle title="Olası tetikleyicilerin" />
          <Card style={{ gap: 14 }}>
            {triggers.slice(0, 6).map((t) => (
              <View key={t.tag} style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="h3">{TAGS[t.tag].label}</T>
                  <T v="small" color={colors.inkSoft}>
                    {t.stat.n} kayıtta {t.stat.mild + t.stat.bad} kez dokundu
                  </T>
                </Row>
                <Bar pct={t.rate} color={t.rate >= 0.75 ? colors.tomato : colors.butter} />
              </View>
            ))}
            <T v="tiny" color={colors.inkFaint}>
              Bu bir korelasyon, kesin teşhis değil. Diyetinden bir şey çıkarmadan önce doktorun ya da diyetisyeninle konuş.
            </T>
          </Card>
        </>
      ) : null}

      {safe.length ? (
        <>
          <SectionTitle title="Seninle iyi anlaşanlar" />
          <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {safe.slice(0, 8).map((t) => (
              <View key={t.tag} style={{ backgroundColor: colors.mintSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                <T v="small" color={colors.mint} style={{ fontFamily: fonts.heavy }}>
                  {TAGS[t.tag].label} · {t.stat.n}
                </T>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {foods.bad.length || foods.good.length ? (
        <Row gap={12} style={{ alignItems: 'flex-start' }}>
          <FoodList title="😣 Dokunanlar" items={foods.bad.map((x) => `${x.name} (${x.bad + x.mild}/${x.n})`)} tint={colors.tomatoSoft} />
          <FoodList title="😌 Dostların" items={foods.good.map((x) => `${x.name} (${x.n})`)} tint={colors.mintSoft} />
        </Row>
      ) : null}

      <SectionTitle title="Son 14 gün" />
      <Card style={{ gap: 12 }}>
        <T v="small" color={colors.inkSoft}>
          Günlük ortalama Bristol tipi. 3–4 ideal aralık, 6–7 sulu.
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 }}>
          {last14.map((d) => {
            const h = d.bristol ? (d.bristol / 7) * 100 : 4;
            const c = !d.bristol ? colors.line : d.bristol <= 2 ? colors.butter : d.bristol <= 4.5 ? colors.mint : d.bristol <= 5.5 ? colors.butter : colors.tomato;
            return (
              <View key={d.key} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View style={{ width: '100%', height: h, backgroundColor: c, borderRadius: 6 }} />
                <T v="tiny" color={colors.inkFaint}>
                  {d.label}
                </T>
              </View>
            );
          })}
        </View>
        <Row gap={14}>
          <Legend c={colors.mint} l="İdeal" />
          <Legend c={colors.butter} l="Sert / yumuşak" />
          <Legend c={colors.tomato} l="Sulu" />
        </Row>
        {last14.some((d) => d.pain != null) ? (
          <View style={{ gap: 6 }}>
            <T v="small" color={colors.inkSoft}>
              En yüksek ağrı
            </T>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {last14.map((d) => (
                <View
                  key={d.key}
                  style={{
                    flex: 1,
                    height: 22,
                    borderRadius: 6,
                    backgroundColor: d.pain == null ? colors.bg : d.pain >= 4 ? colors.tomato : d.pain >= 2 ? colors.lavender : colors.lavSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {d.pain != null ? (
                    <Text style={{ fontSize: 10, fontFamily: fonts.heavy, color: d.pain >= 2 ? '#fff' : colors.lavender }}>{d.pain}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Card>

      <T v="tiny" color={colors.inkFaint} style={{ textAlign: 'center', lineHeight: 17 }}>
        Kontrole giderken bu ekranı doktoruna gösterebilirsin.{'\n'}Tüm verini Ayarlar’dan dışa aktarabilirsin.
      </T>
    </Screen>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.bg, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, Math.round(pct * 100))}%`, height: '100%', backgroundColor: color, borderRadius: 5 }} />
    </View>
  );
}

function Legend({ c, l }: { c: string; l: string }) {
  return (
    <Row gap={6}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }} />
      <T v="tiny" color={colors.inkSoft}>
        {l}
      </T>
    </Row>
  );
}

function FoodList({ title, items, tint }: { title: string; items: string[]; tint: string }) {
  return (
    <Card tint={tint} style={{ flex: 1, gap: 6, padding: 14 }}>
      <T v="h3">{title}</T>
      {items.length ? (
        items.map((x) => (
          <T key={x} v="small" numberOfLines={2}>
            {x}
          </T>
        ))
      ) : (
        <T v="small" color={colors.inkSoft}>
          Henüz yok
        </T>
      )}
    </Card>
  );
}
