import { Stack, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActionSheetIOS, Alert, AppState, Linking, Platform, View } from 'react-native';
import { BRISTOL } from '../../../components/bristol';
import { SLEEP, STRESS } from '../../../components/checkin';
import { GroupThumb } from '../../../components/MealRow';
import { Mascot, type Mood } from '../../../components/Mascot';
import { QuickLog } from '../../../components/QuickLog';
import { WaterCard } from '../../../components/WaterCard';
import { REACTIONS } from '../../../components/ReactionPicker';
import { Text } from '../../../components/text';
import { Button, Card, Icon, IconBubble, Row, Screen, T, Tap, type SymbolName } from '../../../components/ui';
import { useApp } from '../../../lib/app-state';
import { lastBackup } from '../../../lib/backup';
import { dayKey, daysSince, isoDay, now, relative, startOfDay, timeLabel, todayLabel } from '../../../lib/dates';
import * as db from '../../../lib/db';
import { activeMedClasses } from '../../../lib/med-food';
import { doseWhen, dosesForToday, type Dose } from '../../../lib/meds';
import { alarmSupport } from '../../../lib/alarm';
import { askPermission, cancelMealReminder, permission, syncReminders, type PermissionState } from '../../../lib/reminders';
import { palette, radius, shadow, soft, surface, type } from '../../../lib/theme';
import { slotForHour } from '../../../lib/suggest';
import { SLOT_LABEL, SLOT_SHORT, isSlot, slotAt, slotsFor } from '../../../lib/meal-slot';
import { areasText } from '../../../lib/pain-map';
import { dueText, isDueSoon, kindOf } from '../../../lib/checkups';
import { hbiDue } from '../../../lib/hbi';
import { waterTarget, wateryCount } from '../../../lib/water';
import { hasStoma } from '../../../lib/tolerance';
import { useDayPlan } from '../../../lib/use-day-plan';


/** One-tap daily check-in (stored in daily.feel, 0 … 4). */

const FEELS: { emoji: string; label: string; mood: Mood; line: string }[] = [
  { emoji: '😣', label: 'Kötü', mood: 'agri', line: 'Zor bir gün. Az ve hafif ye, bol sıvı al. Ağrın varsa semptom olarak yaz.' },
  { emoji: '😕', label: 'Zor', mood: 'worried', line: 'Bugün sana dokunmadığını bildiğin yemeklerle git. Yenilerini başka güne bırak.' },
  { emoji: '😐', label: 'İdare', mood: 'ok', line: 'İdare eder. Ne yediğini yazmaya devam, örüntüyü birlikte görürüz.' },
  { emoji: '🙂', label: 'İyi', mood: 'sevgi', line: 'Güzel. İyi giden günler de karşılaştırma için çok değerli.' },
  { emoji: '😄', label: 'Harika', mood: 'kutlama', line: 'Harika bir gün. Ne yediğini yazarsan böyle günleri tekrarlamak kolaylaşır.' },
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
  // medication reminders that can't reach the user: notifications denied and no alarm permission
  const [medsSilent, setMedsSilent] = useState(false);
  const [factorsSeen, setFactorsSeen] = useState(true);
  const [streak, setStreak] = useState({ days: 0, today: false });
  const [checkups, setCheckups] = useState<db.Checkup[]>([]);
  const [hbiRows, setHbiRows] = useState<db.HbiRow[]>([]);
  const dayPlan = useDayPlan();
  const [thanks, setThanks] = useState<{ text: string; mood: Mood } | null>(null);
  useEffect(() => {
    if (!thanks) return;
    const t = setTimeout(() => setThanks(null), 3500);
    return () => clearTimeout(t);
  }, [thanks]);

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
    // consecutive days with at least one log, counted back from today (yesterday if today is still empty)
    const logged = await db.loggedDays(sql, today - 120 * 86400000);
    setCheckups(await db.listCheckups(sql));
    setHbiRows(await db.listHbi(sql, 2));
    let run = 0;
    for (let i = logged.has(isoDay(t)) ? 0 : 1; logged.has(isoDay(today - i * 86400000 + 3600000)); i++) run++;
    setStreak({ days: run, today: logged.has(isoDay(t)) });
    setFactorsSeen(!!factorsSeenV);
    const k = dayKey(t);
    setPendingMeals(db.groupMeals(p));
    setMeals(db.groupMeals(mealRows.filter((m) => dayKey(m.eaten_at) === k)));
    setBowel(bowelRows.filter((b) => dayKey(b.at) === k));
    setSymptoms(symptomRows.filter((s) => dayKey(s.at) === k));
    setDoses(dosesForToday(meds, logs, t));
    // remind 1 = alarm (AlarmKit rings without notification permission), 2 = notification only
    const alarmsOk = (await alarmSupport()) === 'ok';
    setMedsSilent(p2 === 'denied' && meds.some((m) => m.remind === 2 || (m.remind === 1 && !alarmsOk)));
    setDaily(d);
    setPerm(p2);
    setPromptSeen(!!seen);
    setBackupDue(count >= 20 && (!last || t - last > 90 * 86400000));
    const week = t - 7 * 86400000;
    const recent = bowelRows.filter((b) => b.at >= week);
    const severePain = symptomRows.some((s) => s.at >= t - 2 * 86400000 && s.pain >= 5);
    // fever of 38 °C or more in the last two days also counts
    const recentDays = await db.listDaily(sql, 3);
    const fever = recentDays.some((x) => (x.temp ?? 0) >= 38 && x.day >= isoDay(t - 2 * 86400000));
    setRedFlag(recent.some((b) => b.blood) || recent.filter((b) => b.bristol === 7).length >= 6 || severePain || fever);
    setLoadedAt(t);
  }, [sql]);

  useFocusEffect(
    useCallback(() => {
      load();
      // what Kıvırcık says depends on the clock (a dose comes due, a meal waits for its answer):
      // reload every half minute and on return to the app, so it never says something stale
      const tick = setInterval(load, 30000);
      const sub = AppState.addEventListener('change', (s) => {
        if (s === 'active') load();
      });
      return () => {
        clearInterval(tick);
        sub.remove();
      };
    }, [load, app.dataVersion]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const mood = useMemo((): Mood => {
    const hour = new Date(loadedAt || 0).getHours();
    if (redFlag) return 'worried';
    if (daily?.feel != null && FEELS[daily.feel]) return FEELS[daily.feel].mood;
    if (meals.some((m) => m.reaction === 2)) return 'agri';
    if (app.phase === 'atak') return 'ok';
    if (meals.length >= 2 && meals.every((m) => m.reaction === 0)) return 'cheer';
    if (!meals.length && hour >= 5 && hour < 11) return 'merhaba';
    return 'happy';
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

  // answers given right in Kıvırcık's bubble
  const answerMeal = async (group: db.MealGroup, r: db.Reaction) => {
    setThanks(
      r === 0
        ? { text: 'Süper, kaydettim! Sana dokunmayanları daha çok öneririm.', mood: 'mutlu' }
        : r === 1
          ? { text: 'Not ettim. Bunu bir süre az ve dikkatli yiyelim.', mood: 'dusunuyor' }
          : { text: 'Geçmiş olsun. Kaydettim, bir dahaki sefere seni uyarırım.', mood: 'sevgi' },
    );
    await react(group, r);
  };
  const answerDose = async (d: Dose) => {
    setThanks({ text: `Aferin! ${d.med.name} kaydedildi.`, mood: 'kutlama' });
    await take(d);
  };

  const dismissFactors = async (open: boolean) => {
    await db.setSetting(sql, 'factors_seen', '1');
    setFactorsSeen(true);
    if (open) router.push('/durumlar');
  };

  const addWater = async (delta: 1 | -1) => {
    const day = isoDay(now());
    setDaily((d) => ({ ...(d ?? { day, stress: null, sleep_q: null, sleep_h: null, note: null, at: now() }), water: Math.max(0, (d?.water ?? 0) + delta) }));
    await db.addWater(sql, day, delta);
  };

  const checkupDone = async (c: db.Checkup) => {
    await db.completeCheckup(sql, c.id);
    await syncReminders(sql);
    app.bump();
  };

  const enableNotifs = async () => {
    await askPermission();
    await db.setSetting(sql, 'notif_prompt_seen', '1');
    setPromptSeen(true);
    setPerm(await permission());
    syncReminders(sql);
  };

  // ----- what needs an answer now -----
  const at = loadedAt || 0;
  const dayStart = startOfDay(at);
  // unmarked doses up to two hours ahead; only those whose time has come are asked about
  const dueDoses = doses.filter((d) => !d.log && d.due <= at + 2 * 3600000);
  const checkedIn = !!daily && (daily.stress != null || daily.sleep_q != null || daily.sleep_h != null);
  const askCheckIn = !checkedIn && new Date(at).getHours() >= 18;
  const askNotifs = perm === 'undetermined' && !promptSeen;
  // Kıvırcık asks about one thing in the bubble and takes the answer there; the "Sıradaki"
  // card lists the rest, so nothing is asked twice
  const askDose = !redFlag
    ? dueDoses.find((d) => {
        const w = doseWhen(d.due, at).when;
        return w === 'now' || w === 'late';
      })
    : undefined;
  const askMeal = !redFlag && !askDose ? pending[0] : undefined;
  const next = pending.filter((m) => m !== askMeal).slice(0, 2);
  const dueCheckups = checkups.filter((c) => isDueSoon(c, at)).slice(0, 2);
  const askHbi = !!at && hbiDue(at, hbiRows);
  const dow = new Date(at).getDay();
  // the week's summary: Sunday evening and Monday morning
  const weekReady = (dow === 0 && new Date(at).getHours() >= 18) || (dow === 1 && new Date(at).getHours() < 13);

  const realMeals = meals.filter((g) => g.items.some((m) => !db.isTobacco(m)));
  // suggest the current meal, or the next one when this one is already logged (no "akşam için
  // ne yesem?" right after dinner); a snack after midnight doesn't count as breakfast
  const slotOf = (t: number) => (new Date(t).getHours() < 5 ? null : slotForHour(new Date(t).getHours()));
  const slotKeys = dayPlan.plan?.map((x) => x.key) ?? [];
  const mealSlot = slotKeys.slice(Math.max(0, slotKeys.indexOf(dayPlan.current))).find((k) => !realMeals.some((g) => slotOf(g.eaten_at) === k));
  const nextMeal = mealSlot ? dayPlan.plan?.find((x) => x.key === mealSlot) : undefined;
  const morePending = pending.length - (askMeal ? 1 : 0) - next.length;
  const nextItems = [
    ...next.map((m) => (
      <TodoRow
        key={`p${m.key}`}
        lead={<GroupThumb group={m} size={38} />}
        title={`${SLOT_LABEL[isSlot(m.slot) ? m.slot : slotAt(m.eaten_at)]}${dayKey(m.eaten_at) === dayKey(at) ? '' : `, ${relative(m.eaten_at)}`}`}
        sub={m.name}
        onPress={() => router.push(`/ogun/${m.ids[0]}`)}
        right={<QuickReact name={m.name} onPick={(r) => answerMeal(m, r)} />}
      />
    )),
    ...(morePending > 0
      ? [
          <TodoRow
            key="more-meals"
            lead={<IconBubble name="ellipsis" color={palette.good} dim={38} fallback="…" />}
            title={`${morePending} öğün daha nasıl geçti diye bekliyor`}
            sub="Günlük’te hepsini gör"
            onPress={() => router.navigate('/gunluk')}
          />,
        ]
      : []),
    ...dueDoses
      .filter((d) => d !== askDose)
      .map((d) => {
        const w = doseWhen(d.due, at);
        const overdue = w.when === 'missed' || w.when === 'late';
        return (
          <TodoRow
            key={`d${d.med.id}:${d.due}`}
            lead={<IconBubble name="pills.fill" color={palette.peri} dim={38} fallback="💊" />}
            title={d.med.name}
            sub={w.when === 'missed' ? w.text : [timeLabel(d.due), w.text, d.med.dose].filter(Boolean).join(' · ')}
            subColor={overdue ? palette.bad : undefined}
            right={<Button title="Aldım" kind={w.when === 'soon' ? 'glass' : 'primary'} compact onPress={() => take(d)} />}
          />
        );
      }),
    ...dueCheckups.map((c) => {
      const k = kindOf(c.kind);
      const late = c.due_at < startOfDay(at);
      const report = k.after === 'report' && !late;
      return (
        <TodoRow
          key={`c${c.id}`}
          lead={
            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: surface.well, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>{k.emoji}</Text>
            </View>
          }
          title={c.title}
          sub={report ? `${dueText(c, at)} · raporunu hazırla` : dueText(c, at)}
          subColor={late ? palette.bad : undefined}
          onPress={() => router.push('/kontroller')}
          right={report ? <Button title="Rapor" kind="glass" icon="doc.text" compact onPress={() => router.push('/rapor')} /> : <Button title="Yapıldı" compact onPress={() => checkupDone(c)} />}
        />
      );
    }),
    ...(askHbi
      ? [
          <TodoRow
            key="hbi"
            lead={<IconBubble name="checklist" color={palette.lettuceDeep} dim={38} fallback="📋" />}
            title="Haftalık aktivite skoru"
            sub="3 soru, 1 dakika; çoğunu ben doldurdum"
            onPress={() => router.push('/skor')}
          />,
        ]
      : []),
    ...(weekReady
      ? [
          <TodoRow
            key="week"
            lead={<IconBubble name="calendar" color={palette.plum} dim={38} fallback="🗓️" />}
            title={dow === 1 ? 'Geçen haftanın özeti' : 'Haftanın özeti hazır'}
            sub="Geçen haftayla karşılaştırma ve tek öneri"
            onPress={() => router.push({ pathname: '/hafta', params: dow === 1 ? { offset: '-1' } : {} })}
          />,
        ]
      : []),
    ...(medsSilent
      ? [
          <TodoRow
            key="meds-silent"
            lead={<IconBubble name="bell.slash.fill" color={palette.bad} dim={38} fallback="🔕" />}
            title="İlaç hatırlatmaları kapalı"
            sub="Bildirim izni yok, ilaç saatinde ulaşamıyorum"
            right={<Button title="Aç" compact onPress={() => Linking.openSettings()} />}
          />,
        ]
      : []),
    ...(askCheckIn
      ? [
          <TodoRow
            key="checkin"
            lead={<IconBubble name="moon.stars.fill" color={palette.plum} dim={38} fallback="🌙" />}
            title="Stres ve uyku"
            sub="Akşam kontrolü, 10 saniye"
            onPress={() => router.push('/gun')}
          />,
        ]
      : []),
    ...(!factorsSeen
      ? [
          <TodoRow
            key="factors"
            lead={<IconBubble name="slider.horizontal.3" color={palette.plum} dim={38} fallback="🩺" />}
            title="Darlık, laktoz ya da kortizon?"
            sub="Varsa yemekleri ona göre değerlendiririm"
            onPress={() => dismissFactors(true)}
            right={<Button title="Yok" kind="plain" compact onPress={() => dismissFactors(false)} />}
          />,
        ]
      : []),
    ...(askNotifs
      ? [
          <TodoRow
            key="notif"
            lead={<IconBubble name="bell.fill" color={palette.water} dim={38} fallback="🔔" />}
            title="Hatırlatmaları aç"
            sub="Öğün sonrası, ilaç ve akşam soruları"
            right={<Button title="Aç" compact onPress={enableNotifs} />}
          />,
        ]
      : []),
    ...(nextMeal && nextMeal.items.length
      ? [
          <TodoRow
            key="suggest"
            lead={<IconBubble name="fork.knife" color={palette.good} dim={38} fallback="🍽️" />}
            title={`${nextMeal.title} için ne yesem?`}
            sub={nextMeal.items.map((x) => x.food.name).join(', ')}
            onPress={() => router.push('/oneriler')}
          />,
        ]
      : []),
  ];

  // ----- today's timeline -----
  const mealSlots = slotsFor(meals.filter((g) => !g.items.every(db.isTobacco)).map((g) => ({ key: g.key, eaten_at: g.eaten_at, slot: g.slot })));
  const entries: Entry[] = [
    ...meals.map((g) => ({
      key: `m${g.key}`,
      at: g.eaten_at,
      icon: 'fork.knife' as SymbolName,
      fallback: '🍽️',
      color: palette.lettuce,
      title: g.name,
      sub: mealSlots.get(g.key)
        ? `${SLOT_LABEL[mealSlots.get(g.key)!]} · ${g.reaction != null ? REACTIONS[g.reaction].phrase : 'nasıl geçti?'}`
        : g.reaction != null
          ? REACTIONS[g.reaction].phrase
          : 'Nasıl geçti?',
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
        [s.pain ? `ağrı ${s.pain}${areasText(s.areas) ? ` (${areasText(s.areas)})` : ''}` : null, s.bloating ? `şişkinlik ${s.bloating}` : null, s.gas ? `gaz ${s.gas}` : null, s.fatigue ? `yorgunluk ${s.fatigue}` : null]
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

  const todayDoses = doses.filter((d) => d.due >= dayStart);
  const maxPain = symptoms.length ? Math.max(...symptoms.map((s) => s.pain)) : null;
  const lastMeal = realMeals.reduce<db.MealGroup | null>((a, g) => (!a || g.eaten_at > a.eaten_at ? g : a), null);
  const lastBowel = bowel.reduce<db.BowelLog | null>((a, b) => (!a || b.at > a.at ? b : a), null);
  const takenToday = todayDoses.filter((d) => d.log?.taken_at).length;
  const nextDose = todayDoses.find((d) => !d.log);
  const counts = {
    meals: realMeals.length,
    toilet: bowel.length,
    symptoms: symptoms.length,
    doses: { taken: takenToday, total: todayDoses.length },
    subs: {
      meal: lastMeal ? `${mealSlots.get(lastMeal.key) ? SLOT_SHORT[mealSlots.get(lastMeal.key)!] : 'Son'} ${timeLabel(lastMeal.eaten_at)}` : undefined,
      toilet: lastBowel ? `Tip ${lastBowel.bristol}, son ${timeLabel(lastBowel.at)}` : undefined,
      symptom: maxPain == null ? undefined : maxPain === 0 ? 'Şikayet yok' : `En yüksek ağrı ${maxPain}/5`,
      med: !todayDoses.length
        ? undefined
        : !nextDose
          ? takenToday === todayDoses.length
            ? 'Hepsi alındı'
            : 'Bugünlük bitti'
          : doseWhen(nextDose.due, at).when === 'late'
            ? `${timeLabel(nextDose.due)} dozu bekliyor`
            : doseWhen(nextDose.due, at).when === 'now'
              ? 'Saati geldi'
              : `Sıradaki ${timeLabel(nextDose.due)}`,
    },
  };

  const summary = [`${realMeals.length} öğün`, `${bowel.length} tuvalet`, maxPain == null ? null : maxPain === 0 ? 'ağrı yok' : `ağrı ${maxPain}/5`]
    .filter(Boolean)
    .join(', ');

  const flare = app.phase === 'atak';
  const phaseTone = flare ? palette.flareDeep : palette.lettuceDeep;
  const phaseDays = app.phaseSince ? daysSince(app.phaseSince) + 1 : null;

  const shown = entries.slice(-5);

  // what Kıvırcık says: the single most useful thing right now
  // every line has to be true at this moment: no "saatin geldi" an hour early, no "günaydın" at 2 am
  const hour = new Date(at).getHours();
  const doseLine = (d: Dose) =>
    doseWhen(d.due, at).when === 'now'
      ? `${d.med.name} saati geldi${d.med.dose ? ` (${d.med.dose})` : ''}. Aldın mı?`
      : `${d.med.name} saati geçti (${[timeLabel(d.due), d.med.dose].filter(Boolean).join(', ')}). Aldın mı?`;
  // on cortisone Kıvırcık keeps sugar, salt and "with food" in mind (medsKey keeps it current)
  const onSteroid = !!app.medsKey && activeMedClasses().includes('steroid');
  const message = thanks
    ? thanks.text
    : redFlag
    ? 'Son günlerde zorlanmışsın. Aşağıdaki notu doktorunla paylaşmanı isterim.'
    : askDose
      ? doseLine(askDose)
      : askMeal
        ? `${askMeal.name} nasıl geçti?`
        : !realMeals.length && hour < 5
          ? 'Gece geç oldu. Bir şey yediysen yazalım, sonra biraz dinlen.'
          : !realMeals.length && hour < 11
          ? onSteroid
            ? 'Günaydın! Kortizonu tok karnına almak mideni korur. Kahvaltıda ne var?'
            : 'Günaydın! Kahvaltıda ne var?'
          : !realMeals.length
            ? 'Bugün henüz bir şey yazmadın. İlk öğünle başlayalım mı?'
            : meals.some((m) => m.reaction === 2)
              ? hour < 16
                ? 'Bir şey dokunmuş. Günün kalanını hafif geçirelim: çorba, pilav, haşlama.'
                : hour < 22
                  ? 'Bir şey dokunmuş. Akşamı hafif geçirelim: çorba, pilav, haşlama.'
                  : 'Bir şey dokunmuş. Bu gece mideni dinlendir, yarına hafif başlayalım.'
              : flare
                ? 'Atak günlerinde yumuşak, az yağlı ve küçük porsiyonlarla gidelim.'
                : daily?.feel != null && daily.feel >= 3
                  ? 'İyi bir gün gibi görünüyor. Yazmaya devam, neyin dokunduğunu böyle buluruz.'
                  : onSteroid
                    ? 'Kortizon kullanırken tuzu ve şekeri azaltalım; tatlıyı küçük porsiyonla, yemekten sonra.'
                    : `Bugün ${realMeals.length} öğün yazdın. Böyle devam, örüntüleri birlikte göreceğiz.`;

  return (
    <Screen tone={flare ? 'flare' : 'calm'}>
      {/* the bar shows no title, only the glass settings button (and with it the scroll edge blur) */}
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            { type: 'button', label: 'Ayarlar', icon: { type: 'sfSymbol', name: 'gearshape' }, onPress: () => router.push('/ayarlar') },
          ],
        }}
      />
      {/* greeting and phase */}
      <View style={{ gap: 6, marginTop: 2 }}>
        <T v="small" color={palette.inkSoft}>
          {todayLabel()}
        </T>
        <T v="large" accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit>
          {app.name ? `Selam ${app.name}` : 'Selam'}
        </T>
        <Tap onPress={changePhase} accessibilityRole="button" accessibilityLabel={`${flare ? 'Atak' : 'Remisyon'} dönemi. Değiştirmek için dokun`} style={{ alignSelf: 'flex-start' }}>
          <Row gap={6} style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: flare ? palette.flareSoft : palette.lettuceSoft }}>
            <Icon name={flare ? 'flame.fill' : 'leaf.fill'} size={12} color={phaseTone} fallback={flare ? '🔥' : '🌿'} />
            <T v="caption" color={phaseTone} style={{ fontWeight: '800' }}>
              {flare ? 'Atak' : 'Remisyon'}
              {phaseDays ? `, ${phaseDays}. gün` : ''}
            </T>
            <Icon name="chevron.down" size={9} color={phaseTone} fallback="˅" />
          </Row>
        </Tap>
      </View>

      {/* Kıvırcık tells the one thing that matters now */}
      <Row gap={0} style={{ alignItems: 'center' }}>
        <Mascot mood={thanks?.mood ?? mood} size={104} />
        {/* the bubble's tail, pointing at Kıvırcık */}
        <View style={{ width: 16, height: 16, marginRight: -9, marginLeft: -2, zIndex: 1, backgroundColor: surface.card, borderRadius: 3, transform: [{ rotate: '45deg' }] }} />
        <View style={{ flex: 1 }}>
          <View style={[{ backgroundColor: surface.card, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 16, gap: 8 }, shadow]}>
            <T v="callout" style={{ fontWeight: '600', lineHeight: 22 }}>
              {message}
            </T>
            {!thanks && askMeal ? (
              <Row gap={6}>
                {REACTIONS.map((r) => (
                  <Tap
                    key={r.value}
                    press="scale"
                    onPress={() => answerMeal(askMeal, r.value)}
                    accessibilityRole="button"
                    accessibilityLabel={`${askMeal.name}: ${r.phrase}`}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: radius.md, backgroundColor: r.bg }}
                  >
                    <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                    <T v="caption" color={r.color} style={{ fontWeight: '800' }} numberOfLines={1}>
                      {r.label}
                    </T>
                  </Tap>
                ))}
              </Row>
            ) : null}
            {!thanks && askDose ? (
              <Button title="Aldım" icon="checkmark" compact onPress={() => answerDose(askDose)} style={{ alignSelf: 'flex-start' }} />
            ) : null}
            {!thanks && !askMeal && !askDose && streak.days >= 2 ? (
              <Row gap={5} style={{ alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 9, borderRadius: radius.pill, backgroundColor: palette.warnSoft }}>
                <Icon name="flame.fill" size={11} color={palette.warn} fallback="🔥" />
                <T v="caption" color={palette.warn} style={{ fontWeight: '800' }}>
                  {`${streak.days} gündür kayıttasın`}
                </T>
              </Row>
            ) : null}
          </View>
        </View>
      </Row>

      {redFlag ? (
        <Card tint={palette.badSoft} style={{ gap: 8 }}>
          <Row gap={10}>
            <IconBubble name="exclamationmark.triangle.fill" color={palette.bad} dim={32} fallback="⚠️" />
            <T v="h3" color={palette.bad}>
              Doktoruna haber ver
            </T>
          </Row>
          <T v="small">
            Son günlerde kan, ateş, şiddetli ağrı ya da çok sık sulu dışkılama kaydettin. Bunu gastroenteroloğunla paylaş. Ateş, şiddetli ağrı veya yoğun kanama varsa
            beklemeden acile git.
          </T>
        </Card>
      ) : null}

      <QuickLog counts={counts} />

      {/* everything that wants an answer or a decision now, in one short list */}
      {nextItems.length ? (
        <View style={{ gap: 8 }}>
          <T v="h2" style={{ paddingHorizontal: 2, marginTop: 4 }}>
            Sırada
          </T>
          <Card style={{ paddingVertical: 2, paddingHorizontal: 14 }}>
            {nextItems.map((el, i) => (
              <Fragment key={i}>
                {i > 0 ? <View style={{ height: 1, backgroundColor: palette.hairline, marginLeft: 50 }} /> : null}
                {el}
              </Fragment>
            ))}
          </Card>
        </View>
      ) : null}

      {/* how the day feels and what's been drunk, in one card */}
      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h3">Bugün nasılsın?</T>
          {daily?.feel != null ? (
            <T v="caption" color={palette.lettuceDeep} style={{ fontWeight: '700' }}>
              {FEELS[daily.feel]?.label}
            </T>
          ) : null}
        </Row>
        <Row gap={6}>
          {FEELS.map((f, i) => {
            const on = daily?.feel === i;
            return (
              <Tap key={f.label} onPress={() => feel(i)} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={f.label} accessibilityState={{ selected: on }}>
                <View style={{ height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? palette.lettuceSoft : surface.well, borderWidth: 2, borderColor: on ? palette.lettuce : 'transparent' }}>
                  <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
                </View>
              </Tap>
            );
          })}
        </Row>
        <View style={{ height: 1, backgroundColor: palette.hairline }} />
        <WaterCard
          bare
          glasses={daily?.water ?? 0}
          target={waterTarget({ phase: app.phase, watery: wateryCount(bowel), fever: (daily?.temp ?? 0) >= 38, stoma: hasStoma() })}
          watery={wateryCount(bowel)}
          hour={new Date(at).getHours()}
          stoma={hasStoma()}
          onAdd={addWater}
        />
      </Card>

      <Row style={{ justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6, paddingHorizontal: 2 }}>
        <T v="h2">Bugünkü kayıtlar</T>
        {entries.length > shown.length ? (
          <Tap onPress={() => router.navigate('/gunluk')} hitSlop={10} accessibilityRole="button">
            <T v="callout" color={palette.lettuceDeep} style={type.semibold}>
              {`Hepsi (${entries.length})`}
            </T>
          </Tap>
        ) : (
          <T v="small" color={palette.inkSoft}>
            {summary}
          </T>
        )}
      </Row>
      {shown.length ? (
        <Card style={{ paddingVertical: 8 }}>
          {shown.map((e, i) => (
            <Tap key={e.key} onPress={e.onPress ?? (() => router.navigate('/gunluk'))} haptic={false}>
              <Row gap={12} style={{ alignItems: 'stretch' }}>
                <T v="caption" color={palette.inkFaint} style={{ width: 38, paddingTop: 22, fontVariant: ['tabular-nums'] }}>
                  {timeLabel(e.at)}
                </T>
                {/* the day's thread: one coloured bead per entry */}
                <View style={{ width: 14, alignItems: 'center' }}>
                  <View style={{ width: 2, height: 22, backgroundColor: i === 0 ? 'transparent' : palette.hairline }} />
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: e.color, borderWidth: 3, borderColor: soft(e.color, 0.35) }} />
                  <View style={{ width: 2, flex: 1, backgroundColor: i === shown.length - 1 ? 'transparent' : palette.hairline }} />
                </View>
                <Row gap={10} style={{ flex: 1, paddingVertical: 10 }}>
                  {e.group ? <GroupThumb group={e.group} size={38} /> : <IconBubble name={e.icon} color={e.color} dim={38} fallback={e.fallback} />}
                  <View style={{ flex: 1 }}>
                    <T v="callout" numberOfLines={1} style={{ fontWeight: '700' }}>
                      {e.title}
                    </T>
                    <T v="small" color={palette.inkSoft} numberOfLines={1}>
                      {e.sub}
                    </T>
                  </View>
                </Row>
              </Row>
            </Tap>
          ))}
        </Card>
      ) : (
        <T v="small" color={palette.inkSoft} style={{ textAlign: 'center', paddingVertical: 8 }}>
          Henüz kayıt yok. Yukarıdaki kutulara dokunup ekle.
        </T>
      )}

      {backupDue ? (
        <Tap onPress={() => router.push('/yedek')}>
          <Row gap={10} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
            <Icon name="icloud.and.arrow.up" size={16} color={palette.warn} fallback="☁️" />
            <T v="small" color={palette.inkSoft} style={{ flex: 1 }}>
              Kayıtların iPhone’un iCloud Yedeklemesi açıksa güvende. Emin değilsen buradan ayrı bir kopya al ›
            </T>
          </Row>
        </Tap>
      ) : null}
    </Screen>
  );
}

/** One line of "Sırada": what it is, one line of detail, and the action right there. */
function TodoRow({ lead, title, sub, subColor, onPress, right }: { lead: ReactNode; title: string; sub?: string; subColor?: string; onPress?: () => void; right?: ReactNode }) {
  const main = (
    <Row gap={12} style={{ flex: 1 }}>
      {lead}
      <View style={{ flex: 1, gap: 1 }}>
        <T v="callout" numberOfLines={1} style={{ fontWeight: '700' }}>
          {title}
        </T>
        {sub ? (
          <T v="small" color={subColor ?? palette.inkSoft} numberOfLines={1}>
            {sub}
          </T>
        ) : null}
      </View>
    </Row>
  );
  return (
    <Row gap={10} style={{ minHeight: 60, paddingVertical: 10 }}>
      {onPress ? (
        <Tap onPress={onPress} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={[title, sub].filter(Boolean).join(', ')}>
          {main}
        </Tap>
      ) : (
        main
      )}
      {right ?? (onPress ? <Icon name="chevron.right" size={13} color={palette.inkFaint} fallback="›" /> : null)}
    </Row>
  );
}

/** Normal / Dokundu / Kötü as three small faces, for a meal waiting in the list. */
function QuickReact({ name, onPick }: { name: string; onPick: (r: db.Reaction) => void }) {
  return (
    <Row gap={6}>
      {REACTIONS.map((r) => (
        <Tap
          key={r.value}
          press="scale"
          onPress={() => onPick(r.value)}
          accessibilityRole="button"
          accessibilityLabel={`${name}: ${r.phrase}`}
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: r.bg, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 19 }}>{r.emoji}</Text>
        </Tap>
      ))}
    </Row>
  );
}
