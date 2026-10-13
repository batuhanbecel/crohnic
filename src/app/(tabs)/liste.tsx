import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Card, Chip, Empty, Row, Screen, T, Tap, VerdictBadge, s as ui } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import * as db from '../../lib/db';
import { CATEGORIES, FOODS, normalizeName, type Category, type Verdict } from '../../lib/foods';
import { colors, fonts } from '../../lib/theme';
import { assessFood } from '../../lib/tolerance';

export default function FoodList() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [meals, setMeals] = useState<db.Meal[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | null>(null);
  const [vf, setVf] = useState<Verdict | null>(null);

  useFocusEffect(
    useCallback(() => {
      db.allRatedMeals(sql).then(setMeals);
    }, [sql]),
  );

  const rows = useMemo(() => {
    const n = normalizeName(q);
    return FOODS.filter((f) => (!cat || f.cat === cat) && (!n || normalizeName(f.name).includes(n)))
      .map((f) => ({ f, a: assessFood(f, app.phase, meals) }))
      .filter((r) => !vf || r.a.verdict === vf);
  }, [q, cat, vf, app.phase, meals]);

  return (
    <Screen>
      <View>
        <T v="small" color={colors.inkSoft}>
          {app.phase === 'atak' ? 'Atak dönemine göre işaretli' : 'Remisyon dönemine göre işaretli'}
        </T>
        <T v="title">Yemekler</T>
      </View>
      <TextInput value={q} onChangeText={setQ} placeholder="🔍  Yemek ara" placeholderTextColor={colors.inkFaint} style={ui.input} clearButtonMode="while-editing" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
        <Chip label="Hepsi" active={!cat} onPress={() => setCat(null)} />
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} active={cat === c} onPress={() => setCat(cat === c ? null : c)} />
        ))}
      </ScrollView>
      <Row gap={8}>
        <Chip label="İyi" emoji="💚" active={vf === 'iyi'} color={colors.mint} onPress={() => setVf(vf === 'iyi' ? null : 'iyi')} />
        <Chip label="Dikkat" emoji="💛" active={vf === 'dikkat'} color={colors.butter} onPress={() => setVf(vf === 'dikkat' ? null : 'dikkat')} />
        <Chip label="Riskli" emoji="❤️‍🩹" active={vf === 'riskli'} color={colors.tomato} onPress={() => setVf(vf === 'riskli' ? null : 'riskli')} />
      </Row>

      {rows.length === 0 ? (
        <Empty emoji="🤷" title="Bulamadım" text="Sor sekmesinden adını yazıp Kıvırcık’a sorabilirsin." />
      ) : (
        <View style={{ gap: 10 }}>
          {rows.map(({ f, a }) => (
            <Tap key={f.id} onPress={() => router.push(`/besin/${f.id}`)}>
              <Card style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 26 }}>{f.emoji}</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <T v="h3" numberOfLines={1}>
                    {f.name}
                  </T>
                  <Row gap={6}>
                    <VerdictBadge verdict={a.verdict} size="sm" />
                    {a.confidence !== 'genel' ? (
                      <T v="tiny" color={colors.lavender} style={{ fontFamily: fonts.heavy }}>
                        ✦ SANA GÖRE
                      </T>
                    ) : null}
                  </Row>
                </View>
              </Card>
            </Tap>
          ))}
        </View>
      )}
    </Screen>
  );
}
