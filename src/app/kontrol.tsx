import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Platform, Switch, View } from 'react-native';
import { TextInput } from '../components/text';
import { Button, Card, Chip, Row, Screen, T, st } from '../components/ui';
import { useApp } from '../lib/app-state';
import { KINDS, REMINDS, REPEATS, kindOf } from '../lib/checkups';
import { now, startOfDay } from '../lib/dates';
import * as db from '../lib/db';
import { askPermission, permission, syncReminders } from '../lib/reminders';
import { isDark, palette } from '../lib/theme';

const DAY = 86400000;

/** A sensible first date for a new one: appointments next week at 10:00, tests in a month. */
function defaultDue(kind: string) {
  const k = kindOf(kind);
  const d = new Date(startOfDay(now()) + (k.timed ? 7 : 30) * DAY + 3600000);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0).getTime();
}

export default function CheckupForm() {
  const sql = useSQLiteContext();
  const app = useApp();
  const params = useLocalSearchParams<{ id?: string; kind?: string }>();
  const editing = params.id ? Number(params.id) : null;
  const first = kindOf(params.kind ?? 'randevu');
  const [kind, setKind] = useState(first.key);
  const [title, setTitle] = useState(first.label);
  const [titleTouched, setTitleTouched] = useState(false);
  const [due, setDue] = useState(() => defaultDue(first.key));
  const [timed, setTimed] = useState(first.timed);
  const [every, setEvery] = useState(first.every);
  const [remind, setRemind] = useState(first.remind);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    db.getCheckup(sql, editing).then((c) => {
      if (!c) return;
      setKind(c.kind);
      setTitle(c.title);
      setTitleTouched(true);
      setDue(c.due_at);
      setTimed(!!c.timed);
      setEvery(c.every_days);
      setRemind(c.remind_days);
      setNote(c.note ?? '');
    });
  }, [sql, editing]);

  // picking a kind fills in its usual name, repeat and reminder (until the user changes the name)
  const pickKind = (key: string) => {
    const k = kindOf(key);
    setKind(key);
    if (!titleTouched || !title.trim()) setTitle(k.key === 'diger' ? '' : k.label);
    if (!editing) {
      setTimed(k.timed);
      setEvery(k.every);
      setRemind(k.remind);
      setDue(defaultDue(key));
    }
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const d = new Date(due);
      const at = timed ? due : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0).getTime();
      await db.saveCheckup(sql, { id: editing ?? undefined, kind, title: title.trim(), due_at: at, timed: timed ? 1 : 0, every_days: every, remind_days: remind, note: note.trim() || null });
      if ((await permission()) === 'undetermined') await askPermission();
      await syncReminders(sql);
      app.bump();
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    Alert.alert('Bu kontrol silinsin mi?', title, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          if (!editing) return;
          await db.deleteCheckup(sql, editing);
          await syncReminders(sql);
          app.bump();
          router.back();
        },
      },
    ]);

  return (
    <Screen
      title={editing ? 'Kontrolü düzenle' : 'Yeni kontrol'}
      footer={<Button title="Kaydet" icon="checkmark" onPress={save} loading={saving} disabled={!title.trim()} />}
    >
      <Card style={{ gap: 12 }}>
        <T v="h3">Ne?</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {KINDS.map((k) => (
            <Chip key={k.key} label={k.label} emoji={k.emoji} active={kind === k.key} onPress={() => pickKind(k.key)} />
          ))}
        </View>
        <TextInput
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            setTitleTouched(true);
          }}
          placeholder="ör. Gastroenteroloji, Dr. Yılmaz"
          placeholderTextColor={palette.inkFaint}
          style={st.input}
        />
      </Card>

      <Card style={{ gap: 14 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h3">Ne zaman?</T>
          <DateTimePicker
            value={new Date(due)}
            mode={timed ? 'datetime' : 'date'}
            display={Platform.OS === 'ios' ? 'compact' : 'default'}
            minimumDate={editing ? undefined : new Date(startOfDay(now()))}
            locale="tr-TR"
            accentColor={palette.ink}
            themeVariant={isDark ? 'dark' : 'light'}
            onChange={(_, d) => d && setDue(d.getTime())}
          />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T v="callout">Saati belli</T>
            <T v="small" color={palette.inkSoft}>
              Randevularda aç; saatten 2 saat önce de hatırlatırım
            </T>
          </View>
          <Switch value={timed} onValueChange={setTimed} trackColor={{ true: palette.lettuce }} accessibilityLabel="Saati belli" />
        </Row>
      </Card>

      <Card style={{ gap: 12 }}>
        <T v="h3">Tekrar</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {REPEATS.map((r) => (
            <Chip key={r.days} label={r.label} active={every === r.days} onPress={() => setEvery(r.days)} />
          ))}
        </View>
        <T v="h3" style={{ marginTop: 4 }}>
          Hatırlat
        </T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {REMINDS.map((r) => (
            <Chip key={r.days} label={r.label} active={remind === r.days} onPress={() => setRemind(r.days)} />
          ))}
        </View>
      </Card>

      <Card>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Not (isteğe bağlı): ör. aç karnına gel, sevk kağıdı"
          placeholderTextColor={palette.inkFaint}
          style={[st.input, { minHeight: 64, textAlignVertical: 'top' }]}
          multiline
        />
      </Card>

      {editing ? <Button title="Sil" kind="danger" icon="trash" onPress={remove} /> : null}
    </Screen>
  );
}
