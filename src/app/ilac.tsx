import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { TextInput } from '../components/text';
import { Button, Card, Chip, GlassPress, Icon, Row, Screen, Segmented, T, st } from '../components/ui';
import { useApp } from '../lib/app-state';
import { fromIsoDay, isoDay, now } from '../lib/dates';
import * as db from '../lib/db';
import { fmtTime, parseTimes } from '../lib/meds';
import { askPermission, permission } from '../lib/reminders';
import { isDark, palette } from '../lib/theme';

const EVERY = [
  { days: 7, label: 'Haftada bir' },
  { days: 14, label: '2 haftada bir' },
  { days: 28, label: '4 haftada bir' },
  { days: 56, label: '8 haftada bir' },
];

const toDate = ([h, m]: [number, number]) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

export default function MedEdit() {
  const sql = useSQLiteContext();
  const app = useApp();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = id ? Number(id) : null;

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [kind, setKind] = useState<db.MedKind>('daily');
  const [times, setTimes] = useState<[number, number][]>([[9, 0]]);
  const [every, setEvery] = useState(14);
  const [customEvery, setCustomEvery] = useState('');
  const [anchor, setAnchor] = useState(() => now());
  const [remind, setRemind] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    db.getMed(sql, editing).then((m) => {
      if (!m) return;
      setName(m.name);
      setDose(m.dose ?? '');
      setKind(m.kind);
      setTimes(parseTimes(m.times).length ? parseTimes(m.times) : [[9, 0]]);
      if (EVERY.some((e) => e.days === m.every_days)) setEvery(m.every_days);
      else {
        setEvery(0);
        setCustomEvery(String(m.every_days));
      }
      setAnchor(fromIsoDay(m.start_day));
      setRemind(!!m.remind);
    });
  }, [sql, editing]);

  const everyDays = every || Math.max(1, parseInt(customEvery, 10) || 0);
  const valid = !!name.trim() && times.length > 0 && (kind === 'daily' || everyDays >= 1);

  const setTime = (i: number, d: Date) => setTimes((p) => p.map((t, j) => (j === i ? [d.getHours(), d.getMinutes()] : t)));

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const sorted = [...times].sort((a, b) => a[0] * 60 + a[1] - (b[0] * 60 + b[1]));
      await db.saveMed(sql, {
        id: editing ?? undefined,
        name: name.trim(),
        dose: dose.trim() || null,
        kind,
        times: (kind === 'daily' ? sorted : sorted.slice(0, 1)).map(fmtTime).join(','),
        every_days: kind === 'daily' ? 1 : everyDays,
        start_day: kind === 'daily' && !editing ? isoDay(now()) : isoDay(anchor),
        remind: remind ? 1 : 0,
      });
      if (remind && (await permission()) === 'undetermined') await askPermission();
      app.bump();
      router.back();
    } catch (e: any) {
      Alert.alert('Kaydedilemedi', e?.message ?? '');
    } finally {
      setSaving(false);
    }
  };

  const stop = () =>
    Alert.alert('İlacı bıraktın mı?', 'Listeden kalkar, hatırlatmalar durur. Geçmiş kayıtlar raporda kalır.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Bıraktım',
        style: 'destructive',
        onPress: async () => {
          if (!editing) return;
          await db.archiveMed(sql, editing);
          app.bump();
          router.back();
        },
      },
    ]);

  return (
    <Screen header={false}>
      <Card style={{ gap: 10 }}>
        <T v="h3">İlaç</T>
        <TextInput value={name} onChangeText={setName} placeholder="ör. Mesalazin, Humira" placeholderTextColor={palette.inkFaint} style={st.input} autoFocus={!editing} />
        <TextInput value={dose} onChangeText={setDose} placeholder="Doz (ör. 2 tablet, 40 mg)" placeholderTextColor={palette.inkFaint} style={st.input} />
      </Card>

      <Card style={{ gap: 14 }}>
        <T v="h3">Ne sıklıkla</T>
        <Segmented
          value={kind}
          onChange={setKind}
          items={[
            { key: 'daily', label: 'Her gün', icon: 'sun.max.fill' },
            { key: 'interval', label: 'Aralıklı', icon: 'calendar' },
          ]}
        />

        {kind === 'interval' ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {EVERY.map((e) => (
                <Chip key={e.days} label={e.label} active={every === e.days} onPress={() => setEvery(e.days)} />
              ))}
              <Chip label="Başka" active={every === 0} onPress={() => setEvery(0)} />
            </View>
            {every === 0 ? (
              <Row gap={10}>
                <TextInput
                  value={customEvery}
                  onChangeText={(t) => setCustomEvery(t.replace(/[^0-9]/g, ''))}
                  placeholder="10"
                  placeholderTextColor={palette.inkFaint}
                  keyboardType="number-pad"
                  style={[st.input, { width: 90, textAlign: 'center' }]}
                />
                <T v="callout">günde bir</T>
              </Row>
            ) : null}
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <T v="callout">Doz günlerinden biri</T>
                <T v="small" color={palette.inkSoft}>
                  Son ya da sıradaki doz günü
                </T>
              </View>
              <DateTimePicker
                value={new Date(anchor)}
                mode="date"
                display="compact"
                locale="tr-TR"
                accentColor={palette.ink}
                themeVariant={isDark ? 'dark' : 'light'}
                onChange={(_, d) => d && setAnchor(d.getTime())}
              />
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="callout">Saat</T>
              <DateTimePicker
                value={toDate(times[0] ?? [9, 0])}
                mode="time"
                display="compact"
                locale="tr-TR"
                accentColor={palette.ink}
                themeVariant={isDark ? 'dark' : 'light'}
                onChange={(_, d) => d && setTime(0, d)}
              />
            </Row>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {times.map((t, i) => (
              <Row key={i} style={{ justifyContent: 'space-between' }}>
                <T v="callout">{times.length > 1 ? `${i + 1}. doz` : 'Saat'}</T>
                <Row gap={8}>
                  <DateTimePicker
                    value={toDate(t)}
                    mode="time"
                    display="compact"
                    locale="tr-TR"
                    accentColor={palette.ink}
                    themeVariant={isDark ? 'dark' : 'light'}
                    onChange={(_, d) => d && setTime(i, d)}
                  />
                  {times.length > 1 ? (
                    <GlassPress
                      onPress={() => setTimes((p) => p.filter((_, j) => j !== i))}
                      accessibilityLabel="Saati sil"
                      style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name="xmark" size={13} color={palette.inkSoft} fallback="✕" />
                    </GlassPress>
                  ) : null}
                </Row>
              </Row>
            ))}
            {times.length < 4 ? (
              <Button
                title="Saat ekle"
                kind="glass"
                compact
                icon="plus"
                onPress={() => setTimes((p) => [...p, p.length ? [Math.min(23, p[p.length - 1][0] + 8), p[p.length - 1][1]] : [9, 0]])}
              />
            ) : null}
          </View>
        )}
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T v="callout">Hatırlat</T>
            <T v="small" color={palette.inkSoft}>
              Doz saatinde bildirim gelir
            </T>
          </View>
          <Switch value={remind} onValueChange={setRemind} trackColor={{ true: palette.lettuce }} />
        </Row>
      </Card>

      <Button title="Kaydet" icon="checkmark" onPress={save} loading={saving} disabled={!valid} />
      {editing ? <Button title="Bu ilacı bıraktım" kind="plain" onPress={stop} /> : null}
    </Screen>
  );
}
