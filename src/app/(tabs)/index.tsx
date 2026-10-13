import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { SymbolViewProps } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { MealRow, MealThumb } from '../../components/MealRow';
import { Mascot, type Mood } from '../../components/Mascot';
import { ReactionPicker } from '../../components/ReactionPicker';
import { Card, IconBubble, IconButton, Row, Screen, SectionTitle, Segmented, T, Tap } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { dayKey, daysSince, now, relative, todayLabel } from '../../lib/dates';
import * as db from '../../lib/db';
import { palette, radius, size, type } from '../../lib/theme';

const TIPS = [
  'Yeni bir yemeği küçük bir porsiyonla dene, birkaç saat sonra nasıl hissettiğini yaz.',
  'Gün içine yayılmış küçük öğünler, iki büyük öğünden genelde daha rahat geçer.',
  'İshalli günlerde su ve tuz kaybı artar. Ayran ya da tuzlu bir çorba iyi gelebilir.',
  'Kabuğu soyulmuş, iyice pişmiş sebze çiğine göre çok daha kolay sindirilir.',
  'Yavaş yemek ve iyi çiğnemek, bağırsağın işini gerçekten azaltır.',
  'Bir yemek bir kere dokundu diye listeden çıkarma. İki üç kayıt sonra daha net görürüz.',
];

const ACTIONS: { label: string; sub: string; icon: SymbolViewProps['name']; fallback: string; color: string; to: string }[] = [
  { label: 'Sor', sub: 'Tabak ya da menü', icon: 'camera.fill', fallback: '📷', color: palette.peri, to: '/sor' },
  { label: 'Öğün ekle', sub: 'Ne yedin?', icon: 'fork.knife', fallback: '🍽️', color: palette.lettuce, to: '/yemek-ekle' },
  { label: 'Semptom', sub: 'Ağrı, şişkinlik', icon: 'waveform.path.ecg', fallback: '🌡️', color: palette.apricot, to: '/semptom' },
  { label: 'Tuvalet', sub: 'Saat ve kıvam', icon: 'drop.fill', fallback: '💧', color: palette.sky, to: '/tuvalet' },
];

export default function Home() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [pending, setPendingMeals] = useState<db.Meal[]>([]);
  const [today, setToday] = useState<db.Meal[]>([]);
  const [lastBowel, setLastBowel] = useState<db.BowelLog | null>(null);
  const [bowelToday, setBowelToday] = useState(0);
  const [lastSymptom, setLastSymptom] = useState<db.SymptomLog | null>(null);
  const [redFlag, setRedFlag] = useState(false);
  const [loadedAt, setLoadedAt] = useState(0);

  const load = useCallback(async () => {
    const [p, meals, bowel, symptoms] = await Promise.all([db.pendingReactions(sql), db.listMeals(sql, 40), db.listBowel(sql, 40), db.listSymptoms(sql, 5)]);
    const t = now();
    const k = dayKey(t);
    setPendingMeals(p);
    setToday(meals.filter((m) => dayKey(m.eaten_at) === k));
    setLastBowel(bowel[0] ?? null);
    setBowelToday(bowel.filter((b) => dayKey(b.at) === k).length);
    setLastSymptom(symptoms[0] ?? null);
    const week = t - 7 * 86400000;
    const recent = bowel.filter((b) => b.at >= week);
    const severePain = symptoms.some((s) => s.at >= t - 2 * 86400000 && s.pain >= 5);
    setRedFlag(recent.some((b) => b.blood) || recent.filter((b) => b.bristol === 7).length >= 6 || severePain);
    setLoadedAt(t);
  }, [sql]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const { mood, line } = useMemo((): { mood: Mood; line: string } => {
    const hour = new Date(loadedAt || 0).getHours();
    if (today.some((m) => m.reaction === 2)) return { mood: 'worried', line: 'Bugün bir şey dokunmuş. Akşamı hafif geçirmek iyi olabilir: çorba, pilav, haşlama.' };
    if (app.phase === 'atak') return { mood: 'ok', line: 'Atak dönemindesin. Bu günlerde püre, haşlama ve az yağlı yemekleri öne çıkarıyorum.' };
    if (today.length >= 2 && today.every((m) => m.reaction === 0)) return { mood: 'cheer', line: 'Bugün yediklerin iyi gelmiş görünüyor.' };
    if (!today.length && hour < 11) return { mood: 'sleepy', line: 'Günaydın. Kahvaltıda ne var?' };
    return { mood: 'happy', line: TIPS[new Date(loadedAt || 0).getDate() % TIPS.length] };
  }, [today, app.phase, loadedAt]);

  const react = async (meal: db.Meal, r: db.Reaction) => {
    await db.setReaction(sql, meal.id, r, null);
    app.bump();
    load();
  };

  return (
    <Screen tone={app.phase === 'atak' ? 'flare' : 'calm'}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
        <View>
          <T v="caption" color={palette.inkSoft} style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {todayLabel()}
          </T>
          <T v="large">{app.name ? `Selam ${app.name}` : 'Crohnic'}</T>
        </View>
        <IconButton name="gearshape" label="Ayarlar" fallback="⚙️" onPress={() => router.push('/ayarlar')} />
      </Row>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingLeft: 8 }}>
        <Mascot mood={mood} size={96} />
        <T v="callout" style={[{ flex: 1 }, type.medium]}>
          {line}
        </T>
      </Card>

      <View style={{ gap: 8 }}>
        <Segmented
          value={app.phase}
          onChange={(p) => p !== app.phase && app.changePhase(p)}
          items={[
            { key: 'remisyon', label: 'Remisyon', color: palette.lettuceDeep, icon: 'leaf.fill' },
            { key: 'atak', label: 'Atak', color: palette.flare, icon: 'flame.fill' },
          ]}
        />
        <T v="small" color={palette.inkSoft} style={{ paddingHorizontal: 6 }}>
          {app.phaseSince
            ? `${daysSince(app.phaseSince) === 0 ? 'Bugün' : `${daysSince(app.phaseSince)} gündür`} ${app.phase === 'atak' ? 'atak' : 'remisyon'} modundasın.`
            : 'Şu an hangi dönemdeysen onu seç, önerilerim buna göre değişir.'}
        </T>
      </View>

      {redFlag ? (
        <Card tint={palette.badSoft} style={{ gap: 8 }}>
          <Row gap={10}>
            <IconBubble name="exclamationmark.triangle.fill" color={palette.bad} dim={32} fallback="⚠️" />
            <T v="h3" color={palette.bad}>
              Doktoruna haber ver
            </T>
          </Row>
          <T v="small">
            Son günlerde kan, şiddetli ağrı ya da çok sık sulu dışkılama kaydettin. Bunu gastroenteroloğunla paylaş. Ateş, şiddetli ağrı veya yoğun kanama varsa
            beklemeden acile git.
          </T>
        </Card>
      ) : null}

      {pending.slice(0, 2).map((m) => (
        <Card key={m.id} style={{ gap: 12 }}>
          <Row gap={12}>
            <MealThumb meal={m} size={44} />
            <View style={{ flex: 1 }}>
              <T v="caption" color={palette.inkSoft}>
                {relative(m.eaten_at)}
              </T>
              <T v="h3" numberOfLines={2}>
                {m.name} nasıl geçti?
              </T>
            </View>
          </Row>
          <ReactionPicker compact onChange={(r) => react(m, r)} />
        </Card>
      ))}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {ACTIONS.map((a) => (
          <Tap key={a.label} onPress={() => router.push(a.to as never)} style={{ width: '48.5%' }}>
            <Card style={{ height: size.tile, justifyContent: 'space-between' }}>
              <IconBubble name={a.icon} color={a.color} fallback={a.fallback} />
              <View>
                <T v="h3" numberOfLines={1}>
                  {a.label}
                </T>
                <T v="small" color={palette.inkSoft} numberOfLines={1}>
                  {a.sub}
                </T>
              </View>
            </Card>
          </Tap>
        ))}
      </View>

      <SectionTitle title="Bugün" action={today.length ? 'Günlüğe git' : undefined} onAction={() => router.navigate('/gunluk')} />
      <Row gap={8}>
        <Stat label="Öğün" value={String(today.length)} sub={today[0] ? relative(today[0].eaten_at) : undefined} />
        <Stat label="Tuvalet" value={String(bowelToday)} sub={lastBowel ? relative(lastBowel.at) : undefined} />
        <Stat label="Ağrı" value={lastSymptom ? `${lastSymptom.pain}/5` : '–'} sub={lastSymptom ? relative(lastSymptom.at) : undefined} />
      </Row>
      {today.length ? (
        today.map((m) => <MealRow key={m.id} meal={m} />)
      ) : (
        <Tap onPress={() => router.push('/yemek-ekle')}>
          <Card style={{ alignItems: 'center', gap: 4, paddingVertical: 22 }}>
            <T v="h3">Bugün henüz bir şey yazmadın</T>
            <T v="small" color={palette.inkSoft}>
              Dokun, ilk öğünü ekle
            </T>
          </Card>
        </Tap>
      )}

      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', marginTop: 10, lineHeight: 17, fontWeight: '400' }}>
        Crohnic bir takip aracıdır, tıbbi tavsiye vermez.{'\n'}Tedavi ve diyet kararlarını doktorunla birlikte al.
      </T>
    </Screen>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card style={{ flex: 1, height: size.stat, padding: 12, justifyContent: 'space-between', borderRadius: radius.lg }}>
      <T v="caption" color={palette.inkSoft} numberOfLines={1}>
        {label}
      </T>
      <T v="title" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </T>
      <T v="caption" color={palette.inkFaint} numberOfLines={1} style={{ fontWeight: '400' }}>
        {sub ?? ' '}
      </T>
    </Card>
  );
}
