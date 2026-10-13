import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { SymbolViewProps } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { MealRow, MealThumb } from '../../components/MealRow';
import { Mascot, type Mood } from '../../components/Mascot';
import { ReactionPicker } from '../../components/ReactionPicker';
import { Card, Icon, Row, SectionTitle, Screen, T, Tap } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { dayKey, daysSince, greeting, relative } from '../../lib/dates';
import * as db from '../../lib/db';
import type { Phase } from '../../lib/foods';
import { colors, fonts, radius } from '../../lib/theme';

const TIPS_REMISSION = [
  'Bugün bağırsaklar sakin, sen de sakin. Ama o acı sosa göz kırpma.',
  'Su iç! Ben kıvrım kıvrım bir bağırsağım, kuru kalmayı sevmem.',
  'Yeni bir yemek denemek mi? Az az dene, bana da haber ver.',
  'Yediğini yazmak sıkıcı ama ben bayılıyorum. Veri = mutluluk.',
  'Remisyon modundayız. Tadını çıkar, abartmadan.',
];
const TIPS_FLARE = [
  'Atak dönemindeyiz. Sade, yumuşak, haşlama… Biraz sıkıcı, biliyorum.',
  'Bugün kahramanlık yok: az az, sık sık, bol su.',
  'Çiğ salatayla aram bozuk şu an. Haşlama sebzeye evet.',
  'Kendine nazik ol. Ben de elimden geleni yapıyorum, söz.',
];

const ACTIONS: { label: string; sub: string; icon: SymbolViewProps['name']; fallback: string; bg: string; fg: string; to: string }[] = [
  { label: 'Fotoğrafla sor', sub: 'Yemek ya da menü', icon: 'camera.fill', fallback: '📷', bg: colors.coralSoft, fg: colors.coral, to: '/sor' },
  { label: 'Yedim', sub: 'Öğün kaydet', icon: 'fork.knife', fallback: '🍽️', bg: colors.mintSoft, fg: colors.mint, to: '/yemek-ekle' },
  { label: 'Nasılım', sub: 'Semptom', icon: 'waveform.path.ecg', fallback: '🌡️', bg: colors.lavSoft, fg: colors.lavender, to: '/semptom' },
  { label: 'Tuvalet', sub: 'Bristol skalası', icon: 'drop.fill', fallback: '💧', bg: colors.skySoft, fg: colors.sky, to: '/tuvalet' },
];

export default function Home() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [pending, setPendingMeals] = useState<db.Meal[]>([]);
  const [today, setToday] = useState<db.Meal[]>([]);
  const [lastBowel, setLastBowel] = useState<db.BowelLog | null>(null);
  const [lastSymptom, setLastSymptom] = useState<db.SymptomLog | null>(null);
  const [redFlag, setRedFlag] = useState(false);

  const load = useCallback(async () => {
    const [p, meals, bowel, symptoms] = await Promise.all([
      db.pendingReactions(sql),
      db.listMeals(sql, 40),
      db.listBowel(sql, 30),
      db.listSymptoms(sql, 5),
    ]);
    setPendingMeals(p);
    const k = dayKey(Date.now());
    setToday(meals.filter((m) => dayKey(m.eaten_at) === k));
    setLastBowel(bowel[0] ?? null);
    setLastSymptom(symptoms[0] ?? null);
    const week = Date.now() - 7 * 86400000;
    const recent = bowel.filter((b) => b.at >= week);
    const severePain = symptoms.some((s) => s.at >= Date.now() - 2 * 86400000 && s.pain >= 5);
    setRedFlag(recent.some((b) => b.blood) || recent.filter((b) => b.bristol === 7).length >= 6 || severePain);
  }, [sql]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const mood: Mood = useMemo(() => {
    if (app.phase === 'atak') return 'ok';
    const bad = today.some((m) => m.reaction === 2);
    if (bad) return 'worried';
    if (today.length && today.every((m) => m.reaction === 0)) return 'cheer';
    return 'happy';
  }, [app.phase, today]);

  const tip = useMemo(() => {
    const list = app.phase === 'atak' ? TIPS_FLARE : TIPS_REMISSION;
    return list[new Date().getDate() % list.length];
  }, [app.phase]);

  const setPhase = async (p: Phase) => {
    if (p === app.phase) return;
    await app.changePhase(p);
  };

  const react = async (meal: db.Meal, r: db.Reaction) => {
    await db.setReaction(sql, meal.id, r, null);
    app.bump();
    load();
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <T v="small" color={colors.inkSoft}>
            {greeting()}
            {app.name ? `, ${app.name}` : ''} 👋
          </T>
          <T v="title">Crohnic</T>
        </View>
        <Tap onPress={() => router.push('/ayarlar')} style={{ padding: 10, backgroundColor: colors.card, borderRadius: 16 }} hitSlop={8}>
          <Icon name="gearshape.fill" color={colors.inkSoft} fallback="⚙️" />
        </Tap>
      </Row>

      {/* Mascot + speech bubble */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 14 }} tint={app.phase === 'atak' ? colors.lavSoft : colors.coralSoft}>
        <Mascot mood={mood} size={104} />
        <View style={{ flex: 1, gap: 4 }}>
          <T v="tiny" color={app.phase === 'atak' ? colors.lavender : colors.coral}>
            KIVIRCIK DİYOR Kİ
          </T>
          <T v="body" style={{ fontFamily: fonts.bold }}>
            {tip}
          </T>
        </View>
      </Card>

      {/* Phase */}
      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h3">Şu an hangi dönemdesin?</T>
          {app.phaseSince ? (
            <T v="tiny" color={colors.inkSoft}>
              {daysSince(app.phaseSince) === 0 ? 'BUGÜN' : `${daysSince(app.phaseSince)} GÜNDÜR`}
            </T>
          ) : null}
        </Row>
        <View style={{ flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.pill, padding: 4 }}>
          {(
            [
              ['remisyon', '🌤️ Remisyon', colors.mint],
              ['atak', '🌧️ Atak', colors.lavender],
            ] as const
          ).map(([p, label, c]) => (
            <Tap
              key={p}
              onPress={() => setPhase(p)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center', backgroundColor: app.phase === p ? c : 'transparent' }}
            >
              <T v="h3" color={app.phase === p ? '#fff' : colors.inkSoft}>
                {label}
              </T>
            </Tap>
          ))}
        </View>
        <T v="small" color={colors.inkSoft}>
          {app.phase === 'atak'
            ? 'Atakta önerilerim daha temkinli olur. Doktorunun verdiği diyet her zaman önce gelir.'
            : 'Remisyonda daha geniş bir menü serbest, yine de seni tanıdıkça önerilerim kişiselleşir.'}
        </T>
      </Card>

      {redFlag ? (
        <Card tint={colors.tomatoSoft} style={{ gap: 6 }}>
          <Row>
            <Text style={{ fontSize: 22 }}>🚩</Text>
            <T v="h3" color={colors.tomato}>
              Doktoruna haber vermeye değer
            </T>
          </Row>
          <T v="small">
            Son günlerde kan, şiddetli ağrı ya da çok sık sulu dışkılama kaydettin. Bu belirtileri gastroenteroloğunla paylaş. Ateş, şiddetli ağrı
            veya yoğun kanama varsa beklemeden acile git.
          </T>
        </Card>
      ) : null}

      {/* Pending reactions */}
      {pending.slice(0, 2).map((m) => (
        <Card key={m.id} style={{ gap: 12 }}>
          <Row gap={12}>
            <MealThumb meal={m} size={46} />
            <View style={{ flex: 1 }}>
              <T v="tiny" color={colors.lavender}>
                {relative(m.eaten_at).toLocaleUpperCase('tr-TR')}
              </T>
              <T v="h3" numberOfLines={2}>
                {m.name} nasıl geldi?
              </T>
            </View>
          </Row>
          <ReactionPicker compact onChange={(r) => react(m, r)} />
        </Card>
      ))}

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {ACTIONS.map((a) => (
          <Tap key={a.label} onPress={() => router.push(a.to as any)} style={{ width: '47.5%' }}>
            <Card style={{ gap: 10, padding: 16 }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: a.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={a.icon} color={a.fg} size={20} fallback={a.fallback} />
              </View>
              <View>
                <T v="h3">{a.label}</T>
                <T v="small" color={colors.inkSoft}>
                  {a.sub}
                </T>
              </View>
            </Card>
          </Tap>
        ))}
      </View>

      {/* Today */}
      <SectionTitle title="Bugün" action={today.length ? 'Günlük' : undefined} onAction={() => router.navigate('/gunluk')} />
      <Row gap={10}>
        <Stat label="Öğün" value={String(today.length)} bg={colors.mintSoft} />
        <Stat
          label="Son tuvalet"
          value={lastBowel ? `Tip ${lastBowel.bristol}` : '—'}
          sub={lastBowel ? relative(lastBowel.at) : undefined}
          bg={colors.skySoft}
        />
        <Stat
          label="Ağrı"
          value={lastSymptom ? `${lastSymptom.pain}/5` : '—'}
          sub={lastSymptom ? relative(lastSymptom.at) : undefined}
          bg={colors.lavSoft}
        />
      </Row>
      {today.length ? (
        today.map((m) => <MealRow key={m.id} meal={m} />)
      ) : (
        <Tap onPress={() => router.push('/yemek-ekle')}>
          <Card style={{ alignItems: 'center', gap: 4, paddingVertical: 22, borderWidth: 2, borderColor: colors.line, borderStyle: 'dashed', shadowOpacity: 0 }}>
            <Text style={{ fontSize: 30 }}>🥣</Text>
            <T v="h3">Bugün henüz bir şey yazmadın</T>
            <T v="small" color={colors.inkSoft}>
              Ne yedin? Dokunup ekle.
            </T>
          </Card>
        </Tap>
      )}

      <T v="tiny" color={colors.inkFaint} style={{ textAlign: 'center', marginTop: 8, lineHeight: 17 }}>
        Crohnic bir takip ve farkındalık aracıdır, tıbbi tavsiye vermez.{'\n'}Tedavi ve diyet kararlarını doktorunla birlikte al.
      </T>
    </Screen>
  );
}

function Stat({ label, value, sub, bg }: { label: string; value: string; sub?: string; bg: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: radius.md, padding: 12, gap: 2 }}>
      <T v="tiny" color={colors.inkSoft}>
        {label.toLocaleUpperCase('tr-TR')}
      </T>
      <T v="h2">{value}</T>
      {sub ? (
        <T v="tiny" color={colors.inkSoft} numberOfLines={1} style={{ fontFamily: fonts.regular }}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}
