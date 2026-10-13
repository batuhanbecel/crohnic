import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { TextInput } from 'react-native';
import { Mascot } from '../components/Mascot';
import { WhenField } from '../components/WhenField';
import { Button, Card, Row, Scale, Screen, T, st } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { palette } from '../lib/theme';

const FIELDS = [
  { key: 'pain', label: 'Karın ağrısı', color: palette.bad },
  { key: 'bloating', label: 'Şişkinlik', color: palette.apricot },
  { key: 'gas', label: 'Gaz', color: palette.sky },
  { key: 'fatigue', label: 'Yorgunluk', color: palette.peri },
] as const;

type Key = (typeof FIELDS)[number]['key'];

export default function Symptom() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [at, setAt] = useState(() => now());
  const [v, setV] = useState<Record<Key, number>>({ pain: 0, bloating: 0, gas: 0, fatigue: 0 });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const total = v.pain + v.bloating + v.gas + v.fatigue;
  const mood = total === 0 ? 'cheer' : v.pain >= 4 || total >= 12 ? 'worried' : total >= 6 ? 'ok' : 'happy';

  const save = async () => {
    setSaving(true);
    await db.addSymptom(sql, { at, ...v, note: note.trim() || null });
    app.bump();
    setSaving(false);
    router.back();
  };

  return (
    <Screen header={false}>
      <Row gap={4}>
        <Mascot mood={mood} size={72} />
        <T v="callout" style={{ flex: 1 }} color={palette.inkSoft}>
          {total === 0 ? 'Şikayet yoksa da kaydet. İyi günler de işe yarar, karşılaştırmayı onlarla yapıyoruz.' : '0 hiç yok, 5 çok şiddetli.'}
        </T>
      </Row>
      <Card>
        <WhenField value={at} onChange={setAt} />
      </Card>
      {FIELDS.map((f) => (
        <Card key={f.key} style={{ gap: 12 }}>
          <T v="h3">{f.label}</T>
          <Scale value={v[f.key]} onChange={(n) => setV((p) => ({ ...p, [f.key]: n }))} color={f.color} labels={['Yok', 'Çok şiddetli']} />
        </Card>
      ))}
      <Card style={{ gap: 10 }}>
        <T v="h3">Not</T>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="ör. öğleden sonra kramp, ateş yok"
          placeholderTextColor={palette.inkFaint}
          style={[st.input, { minHeight: 80, textAlignVertical: 'top' }]}
          multiline
        />
      </Card>
      {v.pain >= 5 ? (
        <Card tint={palette.badSoft}>
          <T v="small">Şiddetli ağrı, ateş, kusma ya da kanama varsa beklemeden doktoruna veya acile başvur.</T>
        </Card>
      ) : null}
      <Button title="Kaydet" icon="checkmark" onPress={save} loading={saving} />
    </Screen>
  );
}
