import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { BRISTOL } from '../components/bristol';
import { Button, Card, Row, Screen, T, Tap, s as ui } from '../components/ui';
import { useApp } from '../lib/app-state';
import * as db from '../lib/db';
import { colors, radius } from '../lib/theme';

export default function Bowel() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [type, setType] = useState<number | null>(null);
  const [blood, setBlood] = useState(false);
  const [urgency, setUrgency] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!type) return;
    setSaving(true);
    await db.addBowel(sql, { at: Date.now(), bristol: type, blood: blood ? 1 : 0, urgency: urgency ? 1 : 0, note: note.trim() || null });
    app.bump();
    setSaving(false);
    router.back();
  };

  return (
    <Screen padTop={false}>
      <T v="body" color={colors.inkSoft}>
        Utanacak bir şey yok, ben bir bağırsağım. Bristol skalasında hangisine benziyordu?
      </T>
      <View style={{ gap: 8 }}>
        {BRISTOL.map((b) => {
          const active = type === b.type;
          const tone = b.type <= 2 ? colors.butter : b.type <= 4 ? colors.mint : b.type === 5 ? colors.butter : colors.tomato;
          return (
            <Tap key={b.type} onPress={() => setType(b.type)}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: radius.md,
                  backgroundColor: active ? tone : colors.card,
                  borderWidth: 2,
                  borderColor: active ? tone : colors.line,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: active ? 'rgba(255,255,255,0.35)' : colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>{b.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <T v="h3" color={active ? '#fff' : colors.ink}>
                    Tip {b.type} · {b.short}
                  </T>
                  <T v="small" color={active ? '#fff' : colors.inkSoft}>
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
          <T v="h3">🩸 Kan gördüm</T>
          <Switch value={blood} onValueChange={setBlood} trackColor={{ true: colors.tomato }} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h3">⚡ Acil yetiştim</T>
          <Switch value={urgency} onValueChange={setUrgency} trackColor={{ true: colors.coral }} />
        </Row>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Not (isteğe bağlı)"
          placeholderTextColor={colors.inkFaint}
          style={ui.input}
        />
      </Card>

      {blood ? (
        <Card tint={colors.tomatoSoft}>
          <T v="small">Dışkıda kan gördüysen bunu doktoruna mutlaka bildir. Yoğun kanama, baş dönmesi ya da ateş varsa acile git.</T>
        </Card>
      ) : null}

      <Button title="Kaydet" icon="checkmark" color={colors.sky} onPress={save} loading={saving} disabled={!type} />
    </Screen>
  );
}
