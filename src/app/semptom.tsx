import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Mascot } from '../components/Mascot';
import { Button, Card, Row, Scale, Screen, T, s as ui } from '../components/ui';
import { useApp } from '../lib/app-state';
import * as db from '../lib/db';
import { colors } from '../lib/theme';

const FIELDS = [
  { key: 'pain', label: 'Karın ağrısı', emoji: '🤕', color: colors.tomato },
  { key: 'bloating', label: 'Şişkinlik', emoji: '🎈', color: colors.butter },
  { key: 'gas', label: 'Gaz', emoji: '💨', color: colors.sky },
  { key: 'fatigue', label: 'Yorgunluk', emoji: '😴', color: colors.lavender },
] as const;

type Key = (typeof FIELDS)[number]['key'];

export default function Symptom() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [v, setV] = useState<Record<Key, number>>({ pain: 0, bloating: 0, gas: 0, fatigue: 0 });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const total = v.pain + v.bloating + v.gas + v.fatigue;
  const mood = total === 0 ? 'cheer' : v.pain >= 4 || total >= 12 ? 'worried' : total >= 6 ? 'ok' : 'happy';

  const save = async () => {
    setSaving(true);
    await db.addSymptom(sql, { at: Date.now(), ...v, note: note.trim() || null });
    app.bump();
    setSaving(false);
    router.back();
  };

  return (
    <Screen padTop={false}>
      <Row gap={4}>
        <Mascot mood={mood} size={80} />
        <T v="body" style={{ flex: 1 }} color={colors.inkSoft}>
          {total === 0 ? 'Hiçbir şikayet yok mu? Harika! Yine de kaydet, iyi günler de veri.' : 'Ne hissettiğini puanla. 0 hiç yok, 5 çok şiddetli.'}
        </T>
      </Row>
      {FIELDS.map((f) => (
        <Card key={f.key} style={{ gap: 12 }}>
          <T v="h3">
            {f.emoji} {f.label}
          </T>
          <Scale value={v[f.key]} onChange={(n) => setV((p) => ({ ...p, [f.key]: n }))} color={f.color} labels={['Yok', 'Çok şiddetli']} />
        </Card>
      ))}
      <Card style={{ gap: 10 }}>
        <T v="h3">Not</T>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="ör. öğleden sonra kramp, ateş yok"
          placeholderTextColor={colors.inkFaint}
          style={[ui.input, { minHeight: 80, textAlignVertical: 'top' }]}
          multiline
        />
      </Card>
      {v.pain >= 5 ? (
        <Card tint={colors.tomatoSoft}>
          <T v="small">Şiddetli ağrı, ateş, kusma ya da kanama varsa beklemeden doktoruna veya acile başvur.</T>
        </Card>
      ) : null}
      <View>
        <Button title="Kaydet" icon="checkmark" color={colors.lavender} onPress={save} loading={saving} />
      </View>
    </Screen>
  );
}
