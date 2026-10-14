import { Stack, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, View } from 'react-native';
import { Text } from '../../../components/text';
import { Card, Chip, Glass, Icon, Row, T, Tap, VERDICT_UI } from '../../../components/ui';
import { useApp } from '../../../lib/app-state';
import * as db from '../../../lib/db';
import { CATEGORIES, FOODS, searchFoods, type Category, type Verdict } from '../../../lib/foods';
import { palette, radius, surface, type } from '../../../lib/theme';
import { assessFood, statsByName } from '../../../lib/tolerance';

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

  const explain = () =>
    Alert.alert(
      'Bu değerlendirme nasıl yapılıyor?',
      'Her yemeğin içeriği (lif, yağ, acı, laktoz, kafein gibi) etiketlenir ve dönemine göre puanlanır. Atakta kısa süreli düşük posalı beslenme, remisyonda ise ECCO ve IOIBD kılavuzlarına uygun olarak gereksiz lif kısıtlaması yapılmaz.\n\nBunlar genel bilgidir, kişiden kişiye değişir. Bir yemeği 2 kez kaydedip nasıl geçtiğini yazınca senin sonuçların genel değerlendirmenin önüne geçer. Diyetini değiştirmeden önce doktorun ya da diyetisyeninle konuş.',
    );

  const header = (
    <View style={{ gap: 12, marginBottom: 12 }}>
      <Tap onPress={explain} haptic={false}>
        <Row gap={6} style={{ paddingHorizontal: 2 }}>
          <T v="small" color={app.phase === 'atak' ? palette.flareDeep : palette.inkSoft} style={{ flex: 1 }}>
            {FOODS.length} yemek, {app.phase === 'atak' ? 'atak' : 'remisyon'} dönemine göre
          </T>
          <Icon name="info.circle" size={15} color={palette.inkSoft} fallback="ⓘ" />
        </Row>
      </Tap>
      <Glass style={{ borderRadius: radius.lg, paddingVertical: 10, gap: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 10 }}>
          {filters.map((x) => (
            <Chip key={x.key} label={`${x.label} ${counts[x.key]}`} active={vf === x.key} color={x.color} onPress={() => setVf(x.key)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 10 }}>
          <Chip label="Tüm kategoriler" active={!cat} onPress={() => setCat(null)} />
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={cat === c} onPress={() => setCat(cat === c ? null : c)} />
          ))}
        </ScrollView>
      </Glass>
    </View>
  );

  return (
    <>
      <Stack.SearchBar
        placeholder="Ara: köfte, çorba, kahve…"
        onChangeText={(e) => setQ(e.nativeEvent.text)}
        onCancelButtonPress={() => setQ('')}
        hideWhenScrolling={false}
        autoCapitalize="none"
        placement="automatic"
      />
      <FlatList
        style={{ flex: 1, backgroundColor: palette.paper }}
        data={rows}
        keyExtractor={(r) => r.f.id}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 120 }}
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
                <View style={{ width: 50, height: 50, borderRadius: radius.sm, backgroundColor: surface.well, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{f.emoji}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="h3" numberOfLines={1}>
                    {f.name}
                  </T>
                  <T v="small" color={palette.inkSoft} numberOfLines={1}>
                    {a.confidence === 'kişisel' ? `Senin kayıtlarına göre, ${a.stat?.n} kez` : a.reasons[0] ?? f.cat}
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
    </>
  );
}
