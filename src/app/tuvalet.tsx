import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { TextInput } from '../components/text';
import { BRISTOL, bristolTone } from '../components/bristol';
import { Suspects } from '../components/Suspects';
import { WhenField } from '../components/WhenField';
import { Button, Card, ChoiceRow, Row, Screen, T, st } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { palette } from '../lib/theme';

export default function Bowel() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [at, setAt] = useState(() => now());
  const [kind, setKind] = useState<number | null>(null);
  const [blood, setBlood] = useState(false);
  const [urgency, setUrgency] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [asking, setAsking] = useState(false);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = id ? Number(id) : null;

  useEffect(() => {
    if (!editing) return;
    db.getBowel(sql, editing).then((b) => {
      if (!b) return;
      setAt(b.at);
      setKind(b.bristol);
      setBlood(!!b.blood);
      setUrgency(!!b.urgency);
      setNote(b.note ?? '');
    });
  }, [sql, editing]);

  const remove = () =>
    Alert.alert('Bu kayıt silinsin mi?', undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          if (!editing) return;
          await db.deleteBowel(sql, editing);
          app.bump();
          router.back();
        },
      },
    ]);

  const save = async () => {
    if (!kind) return;
    setSaving(true);
    if (editing) {
      await db.updateBowel(sql, { id: editing, at, bristol: kind, blood: blood ? 1 : 0, urgency: urgency ? 1 : 0, note: note.trim() || null });
      app.bump();
      setSaving(false);
      router.back();
      return;
    }
    await db.addBowel(sql, { at, bristol: kind, blood: blood ? 1 : 0, urgency: urgency ? 1 : 0, note: note.trim() || null });
    app.bump();
    setSaving(false);
    if ((kind >= 6 || blood) && (await db.mealsBefore(sql, at)).length) setAsking(true);
    else router.back();
  };

  if (asking)
    return (
      <Screen header={false}>
        <Suspects at={at} onDone={() => router.back()} />
      </Screen>
    );

  return (
    <Screen header={false}>
      {editing ? <Stack.Screen options={{ title: 'Tuvalet kaydını düzenle' }} /> : null}
      <Card>
        <WhenField value={at} onChange={setAt} />
      </Card>

      <View style={{ gap: 6 }}>
        <T v="h3" style={{ paddingHorizontal: 4 }}>
          Kıvam
        </T>
        <T v="small" color={palette.inkSoft} style={{ paddingHorizontal: 4, marginBottom: 4 }}>
          Bristol skalası. 3 ve 4 normal kabul edilir.
        </T>
        <View style={{ gap: 8 }}>
          {BRISTOL.map((b) => (
            <ChoiceRow
              key={b.type}
              title={`${b.type}. ${b.short}`}
              subtitle={b.desc}
              emoji={b.emoji}
              color={bristolTone(b.type)}
              active={kind === b.type}
              onPress={() => setKind(b.type)}
            />
          ))}
        </View>
      </View>

      <Card style={{ gap: 14 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="callout">Kan vardı</T>
          <Switch value={blood} onValueChange={setBlood} trackColor={{ true: palette.bad }} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="callout">Zor yetiştim</T>
          <Switch value={urgency} onValueChange={setUrgency} trackColor={{ true: palette.apricot }} />
        </Row>
        <TextInput value={note} onChangeText={setNote} placeholder="Not ekle" placeholderTextColor={palette.inkFaint} style={st.input} />
      </Card>

      {blood ? (
        <Card tint={palette.badSoft}>
          <T v="small">Dışkıda kan gördüysen doktoruna mutlaka söyle. Yoğun kanama, baş dönmesi ya da ateş varsa acile git.</T>
        </Card>
      ) : null}

      <Button title={editing ? 'Değişiklikleri kaydet' : 'Kaydet'} icon="checkmark" onPress={save} loading={saving} disabled={!kind} />
      {editing ? <Button title="Kaydı sil" kind="danger" icon="trash" onPress={remove} /> : null}
    </Screen>
  );
}
