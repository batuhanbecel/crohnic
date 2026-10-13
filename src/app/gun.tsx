import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Mascot } from '../components/Mascot';
import { Button, Card, Chip, OptionTiles, Row, Screen, Segmented, T, st } from '../components/ui';
import { useApp } from '../lib/app-state';
import { isoDay, now } from '../lib/dates';
import * as db from '../lib/db';
import { palette } from '../lib/theme';
import { SLEEP, STRESS } from '../components/checkin';

const HOURS = [4, 5, 6, 7, 8, 9];

export default function DayCheckIn() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [which, setWhich] = useState<'bugun' | 'dun'>(() => (new Date().getHours() < 5 ? 'dun' : 'bugun'));
  const day = isoDay(now() - (which === 'dun' ? 86400000 : 0));
  const [stress, setStress] = useState<number | null>(null);
  const [sleepQ, setSleepQ] = useState<number | null>(null);
  const [sleepH, setSleepH] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.getDaily(sql, day).then((d) => {
      setStress(d?.stress ?? null);
      setSleepQ(d?.sleep_q ?? null);
      setSleepH(d?.sleep_h ?? null);
      setNote(d?.note ?? '');
    });
  }, [sql, day]);

  const save = async () => {
    setSaving(true);
    await db.saveDaily(sql, { day, stress, sleep_q: sleepQ, sleep_h: sleepH, note: note.trim() || null });
    app.bump();
    setSaving(false);
    router.back();
  };

  const mood = stress === 3 || sleepQ === 0 ? 'worried' : stress === 0 && sleepQ === 2 ? 'cheer' : stress == null && sleepQ == null ? 'sleepy' : 'happy';

  return (
    <Screen header={false}>
      <Row gap={4}>
        <Mascot mood={mood} size={72} />
        <T v="callout" style={{ flex: 1 }} color={palette.inkSoft}>
          Stres ve uyku da bağırsağı etkiler. Her akşam iki dokunuş yeter, gerisini örüntülerde ben bağlarım.
        </T>
      </Row>

      <Segmented
        value={which}
        onChange={setWhich}
        items={[
          { key: 'bugun', label: 'Bugün' },
          { key: 'dun', label: 'Dün' },
        ]}
      />

      <Card style={{ gap: 12 }}>
        <T v="h3">Stres</T>
        <OptionTiles compact items={STRESS} value={stress} onChange={setStress} />
      </Card>

      <Card style={{ gap: 12 }}>
        <T v="h3">{which === 'dun' ? 'Önceki gece uyku' : 'Dün gece uyku'}</T>
        <OptionTiles compact items={SLEEP} value={sleepQ} onChange={setSleepQ} />
        <T v="small" color={palette.inkSoft}>
          Kaç saat uyudun?
        </T>
        <Row gap={6}>
          {HOURS.map((h) => (
            <View key={h} style={{ flex: 1 }}>
              <Chip label={h === 4 ? '≤4' : h === 9 ? '9+' : String(h)} active={sleepH === h} onPress={() => setSleepH(sleepH === h ? null : h)} />
            </View>
          ))}
        </Row>
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="h3">Not</T>
        <TextInput value={note} onChangeText={setNote} placeholder="ör. sınav haftası, geç yattım" placeholderTextColor={palette.inkFaint} style={st.input} />
      </Card>

      <Button title="Kaydet" icon="checkmark" onPress={save} loading={saving} disabled={stress == null && sleepQ == null && sleepH == null} />
    </Screen>
  );
}
