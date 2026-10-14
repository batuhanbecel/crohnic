import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, View } from 'react-native';
import { AddMenu } from '../../components/AddMenu';
import { BRISTOL } from '../../components/bristol';
import { SLEEP, STRESS } from '../../components/checkin';
import { GroupThumb } from '../../components/MealRow';
import { Mascot, type Mood } from '../../components/Mascot';
import { REACTIONS, ReactionPicker } from '../../components/ReactionPicker';
import { Text } from '../../components/text';
import { Button, Card, Icon, IconBubble, IconButton, Row, Screen, T, Tap, type SymbolName } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { lastBackup } from '../../lib/backup';
import { dayKey, daysSince, isoDay, now, relative, startOfDay, timeLabel, todayLabel } from '../../lib/dates';
import * as db from '../../lib/db';
import { dosesForToday, type Dose } from '../../lib/meds';
import { askPermission, cancelMealReminder, permission, syncReminders, type PermissionState } from '../../lib/reminders';
import { palette, radius, surface, type } from '../../lib/theme';

const TIPS = [
  'Yeni bir yemeği küçük bir porsiyonla dene, birkaç saat sonra nasıl hissettiğini yaz.',
  'Gün içine yayılmış küçük öğünler, iki büyük öğünden genelde daha rahat geçer.',
  'İshalli günlerde su ve tuz kaybı artar. Ayran ya da tuzlu bir çorba iyi gelebilir.',
  'Kabuğu soyulmuş, iyice pişmiş sebze çiğine göre çok daha kolay sindirilir.',
  'Yavaş yemek ve iyi çiğnemek, bağırsağın işini gerçekten azaltır.',
  'Bir yemek bir kere dokundu diye listeden çıkarma. İki üç kayıt sonra daha net görürüz.',
];

/** One-tap daily check-in (stored in daily.feel, 0 … 4). */
const FEELS: { emoji: string; label: string; mood: Mood; line: string }[] = [
  { emoji: '😣', label: 'Kötü', mood: 'agri', line: 'Zor bir gün. Az ve hafif ye, bol sıvı al. Ağrın varsa semptom olarak yaz.' },
  { emoji: '😕', label: 'Zor', mood: 'worried', line: 'Bugün denenmiş, sana iyi gelen yemeklerle git. Yenilerini başka güne bırak.' },
  { emoji: '😐', label: 'İdare', mood: 'ok', line: 'İdare eder. Ne yediğini yazmaya devam, örüntüyü birlikte görürüz.' },
  { emoji: '🙂', label: 'İyi', mood: 'sevgi', line: 'Güzel. İyi giden günler de karşılaştırma için çok değerli.' },
  { emoji: '😄', label: 'Harika', mood: 'kutlama', line: 'Harika bir gün. Neyin iyi geldiğini yazarsan tekrarlaması kolaylaşır.' },
];

type Entry = {
  key: string;
  at: number;
  icon: SymbolName;
  fallback: string;
  color: string;
  title: string;
  sub: string;
  onPress?: () => void;
  group?: db.MealGroup;
};

export default function Home() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [pending, setPendingMeals] = useState<db.MealGroup[]>([]);
  const [meals, setMeals] = useState<db.MealGroup[]>([]);
  const [bowel, setBowel] = useState<db.BowelLog[]>([]);
  const [symptoms, setSymptoms] = useState<db.SymptomLog[]>([]);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [daily, setDaily] = useState<db.Daily | null>(null);
  const [redFlag, setRedFlag] = useState(false);
  const [loadedAt, setLoadedAt] = useState(0);
  const [perm, setPerm] = useState<PermissionState>('granted');
  const [promptSeen, setPromptSeen] = useState(true);
  const [backupDue, setBackupDue] = useState(false);
  const [factorsSeen, setFactorsSeen] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (app.ready && !app.onboarded) router.push('/hosgeldin');
  }, [app.ready, app.onboarded]);

  const load = useCallback(async () => {
    const t = now();
    const today = startOfDay(t);
    const [p, mealRows, bowelRows, symptomRows, meds, logs, d, p2, seen, last, count, factorsSeenV] = await Promise.all([
      db.pendingReactions(sql),
      db.listMeals(sql, 60),
      db.listBowel(sql, 60),
      db.listSymptoms(sql, 30),
      db.listMeds(sql),
      db.medLogsBetween(sql, today - 4 * 86400000, today + 86400000),
      db.getDaily(sql, isoDay(t)),
      permission(),
      db.getSetting(sql, 'notif_prompt_seen'),
      lastBackup(sql),
      db.countMeals(sql),
      db.getSetting(sql, 'factors_seen'),
    ]);
    setFactorsSeen(!!factorsSeenV);
    const k = dayKey(t);
    setPendingMeals(db.groupMeals(p));
    setMeals(db.groupMeals(mealRows.filter((m) => dayKey(m.eaten_at) === k)));
    setBowel(bowelRows.filter((b) => dayKey(b.at) === k));
    setSymptoms(symptomRows.filter((s) => dayKey(s.at) === k));
    setDoses(dosesForToday(meds, logs, t));
    setDaily(d);
    setPerm(p2);
    setPromptSeen(!!seen);
    setBackupDue(count >= 20 && (!last || t - last > 90 * 86400000));
    const week = t - 7 * 86400000;
    const recent = bowelRows.filter((b) => b.at >= week);
    const severePain = symptomRows.some((s) => s.at >= t - 2 * 86400000 && s.pain >= 5);
    setRedFlag(recent.some((b) => b.blood) || recent.filter((b) => b.bristol === 7).length >= 6 || severePain);
    setLoadedAt(t);
  }, [sql]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, app.dataVersion]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const { mood, line } = useMemo((): { mood: Mood; line: string } => {
    const hour = new Date(loadedAt || 0).getHours();
    if (redFlag) return { mood: 'worried', line: 'Son günlerin zor geçmiş görünüyor. Aşağıdaki notu oku, doktorunla paylaşmanı isterim.' };
    if (daily?.feel != null && FEELS[daily.feel]) return { mood: FEELS[daily.feel].mood, line: FEELS[daily.feel].line };
    if (meals.some((m) => m.reaction === 2)) return { mood: 'agri', line: 'Bugün bir şey dokunmuş. Akşamı hafif geçir: çorba, pilav, haşlama.' };
    if (app.phase === 'atak') return { mood: 'ok', line: 'Atak dönemindesin. Bu günlerde püre, haşlama ve az yağlı yemekleri öne çıkarıyorum.' };
    if (meals.length >= 2 && meals.every((m) => m.reaction === 0)) return { mood: 'cheer', line: 'Bugün yediklerin iyi gelmiş görünüyor.' };
    if (!meals.length && hour < 11) return { mood: 'merhaba', line: 'Günaydın. Kahvaltıda ne var?' };
    return { mood: 'happy', line: TIPS[new Date(loadedAt || 0).getDate() % TIPS.length] };
  }, [meals, app.phase, loadedAt, redFlag, daily]);

  // a choice between options is an action sheet on iOS, not an alert
  const changePhase = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Hangi dönemdesin?',
          message: 'Önerilerim ve yemek değerlendirmeleri buna göre değişir.',
          options: ['Remisyon', 'Atak', 'Vazgeç'],
          cancelButtonIndex: 2,
        },
        (i) => {
          const next = i === 0 ? 'remisyon' : i === 1 ? 'atak' : null;
          if (next && next !== app.phase) app.changePhase(next);
        },
      );
      return;
    }
    Alert.alert('Hangi dönemdesin?', 'Önerilerim ve yemek değerlendirmeleri buna göre değişir.', [
      { text: 'Remisyon', onPress: () => app.phase !== 'remisyon' && app.changePhase('remisyon') },
      { text: 'Atak', onPress: () => app.phase !== 'atak' && app.changePhase('atak') },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  };

  const react = async (group: db.MealGroup, r: db.Reaction) => {
    await db.setGroupReaction(sql, group.ids, r, null);
    cancelMealReminder(group.ids);
    app.bump();
  };

  const feel = async (f: number) => {
    const next = daily?.feel === f ? null : f; // tap again to clear
    setDaily((d) => ({ ...(d ?? { day: isoDay(now()), stress: null, sleep_q: null, sleep_h: null, note: null, at: now() }), feel: next }));
    await db.setFeel(sql, isoDay(now()), next);
  };

  const take = async (d: Dose) => {
    await db.logDose(sql, d.med.id, d.due, true);
    app.bump();
  };

  const dismissFactors = async (open: boolean) => {
    await db.setSetting(sql, 'factors_seen', '1');
    setFactorsSeen(true);
    if (open) router.push('/ayarlar');
  };

  const enableNotifs = async () => {
    await askPermission();
    await db.setSetting(sql, 'notif_prompt_seen', '1');
    setPromptSeen(true);
    setPerm(await permission());
    syncReminders(sql);
  };

  // ----- what needs an answer now -----
  const dayStart = startOfDay(loadedAt || 0);
  const dueDoses = doses.filter((d) => !d.log && d.due <= (loadedAt || 0) + 2 * 3600000);
  const checkedIn = !!daily && (daily.stress != null || daily.sleep_q != null || daily.sleep_h != null);
  const askCheckIn = !checkedIn && new Date(loadedAt || 0).getHours() >= 18;
  const askNotifs = perm === 'undetermined' && !promptSeen;
  const next = pending.slice(0, 2);

  const nextItems = [
    ...next.map((m) => (
      <View key={`p${m.key}`} style={{ gap: 12, paddingVertical: 12 }}>
        <Row gap={12}>
          <GroupThumb group={m} size={40} />
          <View style={{ flex: 1 }}>
            <T v="h3" numberOfLines={2}>
              {m.name} nasıl geçti?
            </T>
            <T v="small" color={palette.inkSoft}>
              {relative(m.eaten_at)}
            </T>
          </View>
        </Row>
        <ReactionPicker compact onChange={(r) => react(m, r)} />
      </View>
    )),
    ...dueDoses.map((d) => (
      <Row key={`d${d.med.id}:${d.due}`} gap={12} style={{ paddingVertical: 12 }}>
        <IconBubble name="pills.fill" color={palette.peri} dim={40} fallback="💊" />
        <View style={{ flex: 1 }}>
          <T v="h3" numberOfLines={1}>
            {d.med.name}
          </T>
          <T v="small" color={d.due < dayStart ? palette.bad : palette.inkSoft}>
            {d.due < dayStart ? 'Kaçırılmış doz' : `${timeLabel(d.due)}${d.med.dose ? `, ${d.med.dose}` : ''}`}
          </T>
        </View>
        <Button title="Aldım" compact onPress={() => take(d)} />
      </Row>
    )),
    ...(askCheckIn
      ? [
          <Tap key="checkin" onPress={() => router.push('/gun')}>
            <Row gap={12} style={{ paddingVertical: 12 }}>
              <IconBubble name="moon.stars.fill" color={palette.plum} dim={40} fallback="🌙" />
              <View style={{ flex: 1 }}>
                <T v="h3">Bugün nasıldı?</T>
                <T v="small" color={palette.inkSoft}>
                  Stres ve uyku, 10 saniye
                </T>
              </View>
              <Icon name="chevron.right" size={14} color={palette.inkFaint} fallback="›" />
            </Row>
          </Tap>,
        ]
      : []),
    ...(!factorsSeen
      ? [
          <Row key="factors" gap={12} style={{ paddingVertical: 12 }}>
            <IconBubble name="person.fill" color={palette.plum} dim={40} fallback="🩺" />
            <View style={{ flex: 1 }}>
              <T v="h3">Darlık, stoma ya da laktoz?</T>
              <T v="small" color={palette.inkSoft}>
                Varsa söyle, yemekleri sana göre değerlendireyim
              </T>
            </View>
            <View style={{ gap: 4, alignItems: 'flex-end' }}>
              <Button title="Ayarla" compact onPress={() => dismissFactors(true)} />
              <Button title="Yok" kind="plain" compact onPress={() => dismissFactors(false)} />
            </View>
          </Row>,
        ]
      : []),
    ...(askNotifs
      ? [
          <Row key="notif" gap={12} style={{ paddingVertical: 12 }}>
            <IconBubble name="bell.fill" color={palette.sky} dim={40} fallback="🔔" />
            <View style={{ flex: 1 }}>
              <T v="h3">Hatırlatmaları aç</T>
              <T v="small" color={palette.inkSoft}>
                Öğün sonrası, ilaç ve akşam soruları
              </T>
            </View>
            <Button title="Aç" compact onPress={enableNotifs} />
          </Row>,
        ]
      : []),
  ];

  // ----- today's timeline -----
  const entries: Entry[] = [
    ...meals.map((g) => ({
      key: `m${g.key}`,
      at: g.eaten_at,
      icon: 'fork.knife' as SymbolName,
      fallback: '🍽️',
      color: palette.lettuce,
      title: g.name,
      sub: g.reaction != null ? REACTIONS[g.reaction].label : 'Nasıl geçtiği bekleniyor',
      onPress: () => router.push(`/ogun/${g.ids[0]}`),
      group: g,
    })),
    ...bowel.map((b) => ({
      key: `b${b.id}`,
      at: b.at,
      icon: 'drop.fill' as SymbolName,
      fallback: '💧',
      color: b.blood ? palette.bad : palette.sky,
      title: `Tuvalet, ${(BRISTOL[b.bristol - 1]?.short ?? `tip ${b.bristol}`).toLocaleLowerCase('tr')}`,
      sub: [`Bristol ${b.bristol}`, b.blood ? 'kan vardı' : null, b.urgency ? 'acil' : null].filter(Boolean).join(', '),
    })),
    ...symptoms.map((s) => ({
      key: `s${s.id}`,
      at: s.at,
      icon: 'waveform.path.ecg' as SymbolName,
      fallback: '🌡️',
      color: s.pain >= 4 ? palette.bad : palette.apricot,
      title: s.pain + s.bloating + s.gas + s.fatigue === 0 ? 'Şikayet yok' : 'Semptom',
      sub:
        [s.pain ? `ağrı ${s.pain}` : null, s.bloating ? `şişkinlik ${s.bloating}` : null, s.gas ? `gaz ${s.gas}` : null, s.fatigue ? `yorgunluk ${s.fatigue}` : null]
          .filter(Boolean)
          .join(', ') || 'Her şey yolunda',
    })),
    ...doses
      .filter((d) => d.log?.taken_at && d.log.taken_at >= dayStart)
      .map((d) => ({
        key: `d${d.med.id}:${d.due}`,
        at: d.log!.taken_at!,
        icon: 'pills.fill' as SymbolName,
        fallback: '💊',
        color: palette.peri,
        title: d.med.name,
        sub: d.med.dose ? `${d.med.dose} alındı` : 'Alındı',
        onPress: () => router.push('/ilaclar'),
      })),
    ...(daily && checkedIn
      ? [
          {
            key: 'daily',
            at: daily.at,
            icon: 'moon.stars.fill' as SymbolName,
            fallback: '🌙',
            color: palette.plum,
            title: 'Gün nasıldı',
            sub: [
              daily.stress != null ? `stres: ${STRESS[daily.stress]?.label.toLocaleLowerCase('tr')}` : null,
              daily.sleep_q != null ? `uyku: ${SLEEP[daily.sleep_q]?.label.toLocaleLowerCase('tr')}` : null,
            ]
              .filter(Boolean)
              .join(', '),
            onPress: () => router.push('/gun'),
          },
        ]
      : []),
  ].sort((a, b) => a.at - b.at);

  const maxPain = symptoms.length ? Math.max(...symptoms.map((s) => s.pain)) : null;
  const summary = [`${meals.length} öğün`, `${bowel.length} tuvalet`, maxPain == null ? null : maxPain === 0 ? 'ağrı yok' : `ağrı ${maxPain}/5`]
    .filter(Boolean)
    .join(', ');

  const flare = app.phase === 'atak';
  const phaseTone = flare ? palette.flareDeep : palette.lettuceDeep;
  const phaseDays = app.phaseSince ? daysSince(app.phaseSince) + 1 : null;

  return (
    <Screen tone={flare ? 'flare' : 'calm'}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <T v="small" color={palette.inkSoft}>
            {todayLabel()}
          </T>
          <T v="large" numberOfLines={1} adjustsFontSizeToFit>
            {app.name ? `Selam ${app.name}` : 'Selam'}
          </T>
        </View>
        <IconButton name="gearshape" label="Ayarlar" fallback="⚙️" onPress={() => router.push('/ayarlar')} />
      </Row>

      <Card style={{ gap: 14 }}>
        <Row gap={12} style={{ alignItems: 'center' }}>
          <Mascot mood={mood} size={76} />
          <View style={{ flex: 1, gap: 3 }}>
            <T v="h2">Bugün nasılsın?</T>
            <T v="small" color={palette.inkSoft}>
              {line}
            </T>
          </View>
        </Row>
        <Row gap={6}>
          {FEELS.map((f, i) => {
            const on = daily?.feel === i;
            return (
              <Tap key={f.label} onPress={() => feel(i)} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={f.label} accessibilityState={{ selected: on }}>
                <View style={{ height: 64, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: on ? palette.lettuceSoft : surface.well, borderWidth: 2, borderColor: on ? palette.lettuce : 'transparent' }}>
                  <Text style={{ fontSize: 24 }}>{f.emoji}</Text>
                  <T v="caption" color={on ? palette.lettuceDeep : palette.inkSoft} numberOfLines={1}>
                    {f.label}
                  </T>
                </View>
              </Tap>
            );
          })}
        </Row>
        <View style={{ height: 1, backgroundColor: palette.hairline }} />
        <Tap onPress={changePhase} accessibilityRole="button" accessibilityLabel="Dönemi değiştir">
          <Row gap={8}>
            <Icon name={flare ? 'flame.fill' : 'leaf.fill'} size={15} color={phaseTone} fallback={flare ? '🔥' : '🌿'} />
            <T v="callout" color={phaseTone} style={[type.semibold, { flex: 1 }]}>
              {flare ? 'Atak' : 'Remisyon'}
              {phaseDays ? `, ${phaseDays}. gün` : ''}
            </T>
            <T v="small" color={palette.inkSoft}>
              Değiştir
            </T>
            <Icon name="chevron.right" size={12} color={palette.inkFaint} fallback="›" />
          </Row>
        </Tap>
      </Card>

      <Button title="Kayıt ekle" icon="plus" onPress={() => setAdding(true)} />
      <AddMenu visible={adding} onClose={() => setAdding(false)} />

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

      {nextItems.length ? (
        <>
          <T v="h2" style={{ marginTop: 8, paddingHorizontal: 2 }}>
            Sıradaki
          </T>
          <Card style={{ paddingVertical: 4 }}>
            {nextItems.map((el, i) => (
              <Fragment key={i}>
                {i > 0 ? <View style={{ height: 1, backgroundColor: palette.hairline }} /> : null}
                {el}
              </Fragment>
            ))}
          </Card>
        </>
      ) : null}

      <Row style={{ justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, paddingHorizontal: 2 }}>
        <T v="h2">Bugün</T>
        <T v="small" color={palette.inkSoft}>
          {summary}
        </T>
      </Row>
      {entries.length ? (
        <Card style={{ paddingVertical: 6 }}>
          {entries.map((e, i) => (
            <Tap key={e.key} onPress={e.onPress ?? (() => router.navigate('/gunluk'))} haptic={false}>
              <Row gap={12} style={{ paddingVertical: 10 }}>
                <T v="small" color={palette.inkFaint} style={{ width: 42 }}>
                  {timeLabel(e.at)}
                </T>
                {e.group ? <GroupThumb group={e.group} size={34} /> : <IconBubble name={e.icon} color={e.color} dim={34} fallback={e.fallback} />}
                <View style={{ flex: 1 }}>
                  <T v="callout" numberOfLines={1} style={type.medium}>
                    {e.title}
                  </T>
                  <T v="small" color={palette.inkSoft} numberOfLines={1}>
                    {e.sub}
                  </T>
                </View>
              </Row>
              {i < entries.length - 1 ? <View style={{ height: 1, backgroundColor: palette.hairline, marginLeft: 100 }} /> : null}
            </Tap>
          ))}
        </Card>
      ) : (
        <Card style={{ alignItems: 'center', gap: 4, paddingVertical: 22 }}>
          <T v="h3">Bugün henüz kayıt yok</T>
          <T v="small" color={palette.inkSoft} style={{ textAlign: 'center' }}>
            Yediğin ilk şeyi “Kayıt ekle”den yaz.
          </T>
        </Card>
      )}

      {backupDue ? (
        <Tap onPress={() => router.push('/ayarlar')}>
          <Row gap={10} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
            <Icon name="icloud.and.arrow.up" size={16} color={palette.warn} fallback="☁️" />
            <T v="small" color={palette.inkSoft} style={{ flex: 1 }}>
              Kayıtların iPhone’un iCloud Yedeklemesi açıksa güvende. Emin değilsen Ayarlar’dan ayrı bir kopya al.
            </T>
          </Row>
        </Tap>
      ) : null}

      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', marginTop: 10, lineHeight: 17, fontWeight: '400' }}>
        Crohnic bir takip aracıdır, tıbbi tavsiye vermez. Tedavi ve diyet kararlarını doktorunla birlikte al.
      </T>
    </Screen>
  );
}
