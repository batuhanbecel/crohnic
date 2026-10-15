import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Text, TextInput } from '../components/text';
import { BRISTOL, bristolTone } from '../components/bristol';
import { Suspects } from '../components/Suspects';
import { WhenField } from '../components/WhenField';
import { Button, Card, Icon, Row, Screen, T, Tap, st, type SymbolName } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { palette, radius, soft, surface } from '../lib/theme';

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

  const picked = kind ? BRISTOL[kind - 1] : null;

  return (
    <Screen
      header={false}
      footer={
        <Button
          title={editing ? 'Değişiklikleri kaydet' : picked ? `Kaydet · ${picked.short}` : 'Kıvamı seç'}
          icon="checkmark"
          onPress={save}
          loading={saving}
          disabled={!kind}
        />
      }
    >
      {editing ? <Stack.Screen options={{ title: 'Tuvalet kaydını düzenle' }} /> : null}
      <Card>
        <WhenField value={at} onChange={setAt} />
      </Card>

      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <T v="h3">Kıvam</T>
          <T v="caption" color={palette.inkSoft}>
            3 ve 4 normal
          </T>
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {BRISTOL.map((b) => {
            const on = kind === b.type;
            const tone = bristolTone(b.type);
            return (
              <Tap
                key={b.type}
                onPress={() => setKind(b.type)}
                accessibilityRole="button"
                accessibilityLabel={`${b.type}. ${b.short}: ${b.desc}`}
                accessibilityState={{ selected: on }}
                style={{ width: b.type === 7 ? '100%' : '48.6%' }}
              >
                <Row
                  gap={10}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 10,
                    borderRadius: radius.md,
                    backgroundColor: on ? soft(tone) : surface.well,
                    borderWidth: 2,
                    borderColor: on ? tone : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{b.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <T v="caption" color={on ? tone : palette.inkSoft} style={{ fontWeight: '800' }}>
                      {`TİP ${b.type}`}
                    </T>
                    <T v="callout" numberOfLines={2} style={{ fontWeight: '700', lineHeight: 19 }}>
                      {b.short}
                    </T>
                  </View>
                </Row>
              </Tap>
            );
          })}
        </View>
        <T v="small" color={palette.inkSoft}>
          {picked ? picked.desc : 'Sana en yakın olanı seç.'}
        </T>
      </Card>

      <Card style={{ gap: 12 }}>
        <Row gap={8}>
          <Toggle label="Kan vardı" icon="drop.triangle.fill" fallback="🩸" color={palette.bad} on={blood} onPress={() => setBlood(!blood)} />
          <Toggle label="Zor yetiştim" icon="figure.run" fallback="🏃" color={palette.apricot} on={urgency} onPress={() => setUrgency(!urgency)} />
        </Row>
        <TextInput value={note} onChangeText={setNote} placeholder="Not ekle (isteğe bağlı)" placeholderTextColor={palette.inkFaint} style={st.input} />
      </Card>

      {blood ? (
        <Card tint={palette.badSoft}>
          <T v="small">Dışkıda kan gördüysen doktoruna mutlaka söyle. Yoğun kanama, baş dönmesi ya da ateş varsa acile git.</T>
        </Card>
      ) : null}

      {editing ? <Button title="Kaydı sil" kind="danger" icon="trash" onPress={remove} /> : null}
    </Screen>
  );
}

function Toggle({ label, icon, fallback, color, on, onPress }: { label: string; icon: SymbolName; fallback: string; color: string; on: boolean; onPress: () => void }) {
  return (
    <Tap onPress={onPress} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: on }} style={{ flex: 1 }}>
      <Row
        gap={8}
        style={{ justifyContent: 'center', paddingVertical: 12, borderRadius: radius.md, backgroundColor: on ? soft(color) : surface.well, borderWidth: 2, borderColor: on ? color : 'transparent' }}
      >
        <Icon name={on ? 'checkmark.circle.fill' : icon} size={16} color={on ? color : palette.inkSoft} fallback={on ? '✓' : fallback} />
        <T v="callout" color={on ? color : palette.ink} style={{ fontWeight: '700' }}>
          {label}
        </T>
      </Row>
    </Tap>
  );
}
