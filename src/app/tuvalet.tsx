import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { BRISTOL, bristolTone } from '../components/bristol';
import { WhenField } from '../components/WhenField';
import { Button, Card, Row, Screen, T, Tap, st } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { palette, radius } from '../lib/theme';

export default function Bowel() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [at, setAt] = useState(() => now());
  const [kind, setKind] = useState<number | null>(null);
  const [blood, setBlood] = useState(false);
  const [urgency, setUrgency] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!kind) return;
    setSaving(true);
    await db.addBowel(sql, { at, bristol: kind, blood: blood ? 1 : 0, urgency: urgency ? 1 : 0, note: note.trim() || null });
    app.bump();
    setSaving(false);
    router.back();
  };

  return (
    <Screen header={false}>
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
        {BRISTOL.map((b) => {
          const active = kind === b.type;
          const tone = bristolTone(b.type);
          return (
            <Tap key={b.type} onPress={() => setKind(b.type)}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 10,
                  borderRadius: radius.md,
                  backgroundColor: active ? tone : 'rgba(255,255,255,0.72)',
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: active ? 'rgba(255,255,255,0.3)' : 'rgba(29,43,34,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{b.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <T v="h3" color={active ? '#fff' : palette.ink}>
                    {b.type}. {b.short}
                  </T>
                  <T v="small" color={active ? '#fff' : palette.inkSoft}>
                    {b.desc}
                  </T>
                </View>
              </View>
            </Tap>
          );
        })}
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

      <Button title="Kaydet" icon="checkmark" onPress={save} loading={saving} disabled={!kind} />
    </Screen>
  );
}
