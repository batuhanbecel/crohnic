import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, TextInput, View } from 'react-native';
import { Backdrop, Card, Chip, Icon, Row, T, Tap, VERDICT_UI, st } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import * as db from '../../lib/db';
import { CATEGORIES, FOODS, searchFoods, type Category, type Verdict } from '../../lib/foods';
import { palette, radius, surface, type } from '../../lib/theme';
import { assessFood, statsByName } from '../../lib/tolerance';

type VF = Verdict | 'hepsi' | 'denedim';

export default function FoodList() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [meals, setMeals] = useState<db.Meal[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | null>(null);
  const [vf, setVf] = useState<VF>('hepsi');

  useFocusEffect(
    useCallback(() => {
      db.allRatedMeals(sql).then(setMeals);
    }, [sql]),
  );

  const assessed = useMemo(() => {
    const stats = statsByName(meals);
    return FOODS.map((f) => ({ f, a: assessFood(f, app.phase, meals, stats) }));
  }, [app.phase, meals]);

  const counts = useMemo(() => {
    const base = assessed.filter((r) => !cat || r.f.cat === cat);
    return {
      hepsi: base.length,
      iyi: base.filter((r) => r.a.verdict === 'iyi').length,
      dikkat: base.filter((r) => r.a.verdict === 'dikkat').length,
      riskli: base.filter((r) => r.a.verdict === 'riskli').length,
      denedim: base.filter((r) => r.a.stat?.n).length,
    };
  }, [assessed, cat]);

  const rows = useMemo(() => {
    const ids = new Set(searchFoods(q).map((f) => f.id));
    return assessed.filter(
      (r) => ids.has(r.f.id) && (!cat || r.f.cat === cat) && (vf === 'hepsi' || (vf === 'denedim' ? !!r.a.stat?.n : r.a.verdict === vf)),
    );
  }, [assessed, q, cat, vf]);

  const filters: { key: VF; label: string; color: string }[] = [
    { key: 'hepsi', label: 'Hepsi', color: palette.ink },
    { key: 'iyi', label: 'İyi gelir', color: palette.good },
    { key: 'dikkat', label: 'Dikkat', color: palette.warn },
    { key: 'riskli', label: 'Riskli', color: palette.bad },
    { key: 'denedim', label: 'Denediklerim', color: palette.peri },
  ];

  const header = (
    <View style={{ gap: 12, marginBottom: 12 }}>
      <View style={{ marginTop: 4 }}>
        <T v="caption" color={palette.inkSoft} style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {FOODS.length} yemek · {app.phase === 'atak' ? 'atak' : 'remisyon'} dönemine göre
        </T>
        <T v="large">Yemekler</T>
      </View>
      <View>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Ara: köfte, çorba, kahve…"
          placeholderTextColor={palette.inkFaint}
          style={[st.input, { paddingLeft: 42 }]}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
        <View style={{ position: 'absolute', left: 14, top: 15 }}>
          <Icon name="magnifyingglass" size={17} color={palette.inkFaint} fallback="🔍" />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }}>
        {filters.map((x) => (
          <Chip key={x.key} label={`${x.label} ${counts[x.key]}`} active={vf === x.key} color={x.color} onPress={() => setVf(x.key)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -18 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }}>
        <Chip label="Tüm kategoriler" active={!cat} onPress={() => setCat(null)} />
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} active={cat === c} onPress={() => setCat(cat === c ? null : c)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.paper }}>
      <Backdrop tone={app.phase === 'atak' ? 'flare' : 'calm'} />
      <FlatList
        data={rows}
        keyExtractor={(r) => r.f.id}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40 }}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        initialNumToRender={20}
        ListEmptyComponent={
          <Card style={{ alignItems: 'center', gap: 4, paddingVertical: 24 }}>
            <T v="h3">Bulamadım</T>
            <T v="small" color={palette.inkSoft} style={{ textAlign: 'center' }}>
              Sor sekmesinden adını yazıp sorabilirsin.
            </T>
          </Card>
        }
        renderItem={({ item: { f, a } }) => {
          const u = VERDICT_UI[a.verdict];
          return (
            <Tap onPress={() => router.push(`/besin/${f.id}`)}>
              <Card style={{ padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: surface.well, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{f.emoji}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="h3" numberOfLines={1}>
                    {f.name}
                  </T>
                  <T v="small" color={palette.inkSoft} numberOfLines={1}>
                    {a.confidence === 'kişisel' ? `Senin kayıtlarına göre · ${a.stat?.n} kez` : a.reasons[0] ?? f.cat}
                  </T>
                </View>
                <Row gap={5} style={{ backgroundColor: u.bg, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: u.fg }} />
                  <Text style={[{ color: u.fg, fontSize: 12 }, type.semibold]}>{u.short}</Text>
                </Row>
              </Card>
            </Tap>
          );
        }}
      />
    </View>
  );
}
