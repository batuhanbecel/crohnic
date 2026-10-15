import { Stack, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, ScrollView, View } from 'react-native';
import { ThinkingOverlay } from '../../../components/ThinkingOverlay';
import { Text } from '../../../components/text';
import { Button, Card, Chip, Row, T, Tap, VERDICT_UI } from '../../../components/ui';
import { useApp } from '../../../lib/app-state';
import * as db from '../../../lib/db';
import { CATEGORIES, FOODS, searchFoods, type Category, type Verdict } from '../../../lib/foods';
import { palette, radius, surface, type } from '../../../lib/theme';
import { assessFood, setTagHistory, statsByName } from '../../../lib/tolerance';
import { useAnalyze } from '../../../lib/use-analyze';

type VF = Verdict | 'hepsi' | 'denedim';

export default function FoodList() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [meals, setMeals] = useState<db.Meal[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | null>(null);
  const [vf, setVf] = useState<VF>('hepsi');
  const { busy, byName } = useAnalyze();
  const query = q.trim();

  useFocusEffect(
    useCallback(() => {
      db.allRatedMeals(sql).then(setMeals);
    }, [sql]),
  );

  const assessed = useMemo(() => {
    setTagHistory(meals);
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
    { key: 'denedim', label: 'Denediklerim', color: palette.lettuce },
  ];

  const explain = () =>
    Alert.alert(
      'Bu değerlendirme nasıl yapılıyor?',
      'Üç katmanda değerlendiririm:\n\n1. Genel kural: Her yemeğin içeriği (lif, yağ, acı, laktoz, kafein, katkı gibi) etiketlenir ve dönemine göre puanlanır. Ağırlıklar IOIBD (2020) ve ESPEN (2023) beslenme önerilerine göre: doymuş yağ, işlenmiş et ve çok işlenmiş gıdalar azaltılır; lif yalnızca darlık varsa ya da atakta kısıtlanır; çiğ hayvansal gıdalar enfeksiyon riski yüzünden temkinli sayılır.\n\n2. Sana özel durumlar: Ayarlar’da darlık, stoma ya da laktoz intoleransını açarsan puanlar ona göre değişir.\n\n3. Senin kayıtların: Bir yemeği 2 kez yiyip nasıl geçtiğini yazınca senin sonucun geçerli olur. Bir içerik (örneğin baklagil) sana 3 kayıtta tekrar tekrar dokunursa, hiç denemediğin benzer yemekler de daha riskli görünür.\n\nCrohn’da herkese uyan tek bir liste yok. Kılavuzlar da bunu söylüyor; en doğru sonucu senin kayıtların verir. Diyetini değiştirmeden önce doktorun ya da diyetisyeninle konuş.',
    );

  const header = (
    <View style={{ gap: 12, marginBottom: 12 }}>
      <T v="large">Yemekler</T>
      <Tap onPress={explain} haptic={false}>
        <Row gap={6} style={{ paddingHorizontal: 2, marginTop: -6 }}>
          <T v="small" color={app.phase === 'atak' ? palette.flareDeep : palette.inkSoft} style={{ flex: 1 }}>
            {FOODS.length} yemek, {app.phase === 'atak' ? 'atak' : 'remisyon'} dönemine göre
          </T>
        </Row>
      </Tap>
      <View style={{ gap: 8 }}>
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
    </View>
  );

  // a food that isn't in the list: ask Kıvırcık (AI) about it by name
  const askCard = (empty: boolean) =>
    query.length >= 2 ? (
      <Card style={{ gap: 10, marginTop: empty ? 0 : 8 }}>
        <T v="h3">{empty ? `“${query}” listede yok` : `Aradığın “${query}” değil mi?`}</T>
        <T v="small" color={palette.inkSoft}>
          Adını Kıvırcık’a sor, {app.phase === 'atak' ? 'atak' : 'remisyon'} dönemine ve kayıtlarına göre değerlendireyim.
        </T>
        <Button title={`“${query}” için sor`} icon="sparkles" onPress={() => byName(query, null)} />
      </Card>
    ) : empty ? (
      <Card style={{ alignItems: 'center', gap: 4, paddingVertical: 24 }}>
        <T v="h3">Bulamadım</T>
      </Card>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: palette.paper }}>
      <FlatList
        style={{ flex: 1 }}
        data={rows}
        keyExtractor={(r) => r.f.id}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: Platform.OS === 'web' ? 72 : 8, paddingBottom: 32 }}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        initialNumToRender={20}
        ListEmptyComponent={askCard(true)}
        ListFooterComponent={rows.length ? askCard(false) : null}
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
      <ThinkingOverlay mode={busy} />
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            { type: 'button', label: 'Nasıl değerlendiriliyor', icon: { type: 'sfSymbol', name: 'info.circle' }, onPress: explain },
          ],
        }}
      />
      <Stack.SearchBar
        placeholder="Ara ya da yeni bir yemek yaz"
        onChangeText={(e) => setQ(e.nativeEvent.text)}
        onCancelButtonPress={() => setQ('')}
        onSearchButtonPress={() => {
          if (query.length >= 2 && !rows.length) byName(query, null);
        }}
        hideWhenScrolling={false}
        autoCapitalize="none"
        placement="automatic"
      />
    </View>
  );
}
