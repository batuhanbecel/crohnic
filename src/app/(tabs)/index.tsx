import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { SymbolViewProps } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Doses } from '../../components/Doses';
import { GroupThumb, MealRow } from '../../components/MealRow';
import { Mascot, type Mood } from '../../components/Mascot';
import { ReactionPicker } from '../../components/ReactionPicker';
import { Button, Card, IconBubble, IconButton, Row, Screen, SectionTitle, Segmented, T, Tap } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { dayKey, daysSince, isoDay, now, relative, todayLabel } from '../../lib/dates';
import * as db from '../../lib/db';
import { lastBackup } from '../../lib/backup';
import { askPermission, cancelMealReminder, permission, syncReminders, type PermissionState } from '../../lib/reminders';
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
  { label: 'İlaç', sub: 'Doz ve hatırlatma', icon: 'pills.fill', fallback: '💊', color: palette.lettuceDeep, to: '/ilaclar' },
  { label: 'Gün nasıldı', sub: 'Stres ve uyku', icon: 'moon.stars.fill', fallback: '🌙', color: palette.flare, to: '/gun' },
];

export default function Home() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [pending, setPendingMeals] = useState<db.MealGroup[]>([]);
  const [today, setToday] = useState<db.MealGroup[]>([]);
  const [lastBowel, setLastBowel] = useState<db.BowelLog | null>(null);
  const [bowelToday, setBowelToday] = useState(0);
  const [lastSymptom, setLastSymptom] = useState<db.SymptomLog | null>(null);
  const [redFlag, setRedFlag] = useState(false);
  const [loadedAt, setLoadedAt] = useState(0);
  const [checkedIn, setCheckedIn] = useState(true);
  const [perm, setPerm] = useState<PermissionState>('granted');
  const [promptSeen, setPromptSeen] = useState(true);
  const [backupDue, setBackupDue] = useState(false);

  useEffect(() => {
    if (app.ready && !app.onboarded) router.push('/hosgeldin');
  }, [app.ready, app.onboarded]);

  const load = useCallback(async () => {
    const [p, meals, bowel, symptoms] = await Promise.all([db.pendingReactions(sql), db.listMeals(sql, 40), db.listBowel(sql, 40), db.listSymptoms(sql, 5)]);
    const t = now();
    const k = dayKey(t);
    setPendingMeals(db.groupMeals(p));
    setToday(db.groupMeals(meals.filter((m) => dayKey(m.eaten_at) === k)));
    setLastBowel(bowel[0] ?? null);
    setBowelToday(bowel.filter((b) => dayKey(b.at) === k).length);
    setLastSymptom(symptoms[0] ?? null);
    const week = t - 7 * 86400000;
    const recent = bowel.filter((b) => b.at >= week);
    const severePain = symptoms.some((s) => s.at >= t - 2 * 86400000 && s.pain >= 5);
    setRedFlag(recent.some((b) => b.blood) || recent.filter((b) => b.bristol === 7).length >= 6 || severePain);
    setLoadedAt(t);
    const [daily, p2, seen, last, count] = await Promise.all([
      db.getDaily(sql, isoDay(t)),
      permission(),
      db.getSetting(sql, 'notif_prompt_seen'),
      lastBackup(sql),
      db.countMeals(sql),
    ]);
    setCheckedIn(!!daily);
    setPerm(p2);
    setPromptSeen(!!seen);
    setBackupDue(count >= 20 && (!last || t - last > 30 * 86400000));
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

  const dismissPrompt = async () => {
    setPromptSeen(true);
    await db.setSetting(sql, 'notif_prompt_seen', '1');
  };

  const enableNotifs = async () => {
    await askPermission();
    await dismissPrompt();
    setPerm(await permission());
    syncReminders(sql);
  };

  const react = async (group: db.MealGroup, r: db.Reaction) => {
    await db.setGroupReaction(sql, group.ids, r, null);
    cancelMealReminder(group.ids);
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

      {perm === 'undetermined' && !promptSeen ? (
        <Card style={{ gap: 12 }}>
          <Row gap={10}>
            <IconBubble name="bell.fill" color={palette.peri} dim={32} fallback="🔔" />
            <T v="h3" style={{ flex: 1 }}>
              Hatırlatayım mı?
            </T>
          </Row>
          <T v="small" color={palette.inkSoft}>
            Yedikten birkaç saat sonra nasıl geçtiğini, ilaç saatini ve akşam gününü sorarım. Kayıtlar böyle çok daha işe yarar.
          </T>
          <Row gap={8}>
            <Button title="Şimdi değil" kind="glass" compact onPress={dismissPrompt} style={{ flex: 1 }} />
            <Button title="Bildirimleri aç" compact color={palette.peri} onPress={enableNotifs} style={{ flex: 1 }} />
          </Row>
        </Card>
      ) : null}

      <Doses />

      {!checkedIn && new Date(loadedAt || 0).getHours() >= 18 ? (
        <Tap onPress={() => router.push('/gun')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconBubble name="moon.stars.fill" color={palette.flare} fallback="🌙" />
            <View style={{ flex: 1 }}>
              <T v="h3">Bugün nasıldı?</T>
              <T v="small" color={palette.inkSoft}>
                Stres ve uyku, 10 saniye
              </T>
            </View>
          </Card>
        </Tap>
      ) : null}

      {pending.slice(0, 2).map((m) => (
        <Card key={m.key} style={{ gap: 12 }}>
          <Row gap={12}>
            <GroupThumb group={m} size={44} />
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

      {backupDue ? (
        <Tap onPress={() => router.push('/ayarlar')}>
          <Card tint={palette.warnSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconBubble name="icloud.and.arrow.up" color={palette.warn} dim={32} fallback="☁️" />
            <T v="small" style={{ flex: 1 }}>
              Bir aydır yedek almadın. Telefon kaybolursa kayıtların da gider. Ayarlar’dan bir dokunuşla yedekle.
            </T>
          </Card>
        </Tap>
      ) : null}

      <SectionTitle title="Bugün" action={today.length ? 'Günlüğe git' : undefined} onAction={() => router.navigate('/gunluk')} />
      <Row gap={8}>
        <Stat label="Öğün" value={String(today.length)} sub={today[0] ? relative(today[0].eaten_at) : undefined} />
        <Stat label="Tuvalet" value={String(bowelToday)} sub={lastBowel ? relative(lastBowel.at) : undefined} />
        <Stat label="Ağrı" value={lastSymptom ? `${lastSymptom.pain}/5` : '–'} sub={lastSymptom ? relative(lastSymptom.at) : undefined} />
      </Row>
      {today.length ? (
        today.map((m) => <MealRow key={m.key} group={m} />)
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
