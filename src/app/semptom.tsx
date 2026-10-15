import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { TextInput } from '../components/text';
import { Mascot } from '../components/Mascot';
import { Suspects } from '../components/Suspects';
import { WhenField } from '../components/WhenField';
import { Button, Card, Row, Screen, T, Tap, st } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { onTint, palette, soft, surface } from '../lib/theme';

const FIELDS = [
  { key: 'pain', label: 'Karın ağrısı', color: palette.bad },
  { key: 'bloating', label: 'Şişkinlik', color: palette.apricot },
  { key: 'gas', label: 'Gaz', color: palette.sky },
  { key: 'fatigue', label: 'Yorgunluk', color: palette.plum },
] as const;

type Key = (typeof FIELDS)[number]['key'];

const LEVELS = ['Yok', 'Çok hafif', 'Hafif', 'Orta', 'Şiddetli', 'Çok şiddetli'];

export default function Symptom() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [at, setAt] = useState(() => now());
  const [v, setV] = useState<Record<Key, number>>({ pain: 0, bloating: 0, gas: 0, fatigue: 0 });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [asking, setAsking] = useState(false);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = id ? Number(id) : null;

  useEffect(() => {
    if (!editing) return;
    db.getSymptom(sql, editing).then((s) => {
      if (!s) return;
      setAt(s.at);
      setV({ pain: s.pain, bloating: s.bloating, gas: s.gas, fatigue: s.fatigue });
      setNote(s.note ?? '');
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
          await db.deleteSymptom(sql, editing);
          app.bump();
          router.back();
        },
      },
    ]);

  const total = v.pain + v.bloating + v.gas + v.fatigue;
  const mood = total === 0 ? 'cheer' : v.pain >= 4 || total >= 12 ? 'agri' : total >= 6 ? 'ok' : 'happy';

  const save = async () => {
    setSaving(true);
    if (editing) {
      await db.updateSymptom(sql, { id: editing, at, ...v, note: note.trim() || null });
      app.bump();
      setSaving(false);
      router.back();
      return;
    }
    await db.addSymptom(sql, { at, ...v, note: note.trim() || null });
    app.bump();
    setSaving(false);
    // a rough day: ask which recent meal might be behind it
    if ((v.pain >= 2 || v.bloating >= 3 || v.gas >= 3) && (await db.mealsBefore(sql, at)).length) setAsking(true);
    else router.back();
  };

  if (asking)
    return (
      <Screen header={false}>
        <Suspects at={at} onDone={() => router.back()} />
      </Screen>
    );

  return (
    <Screen
      title={editing ? 'Semptomu düzenle' : 'Semptom'}
      footer={
        <Button
          title={editing ? 'Değişiklikleri kaydet' : total === 0 ? 'Şikayetim yok, kaydet' : 'Kaydet'}
          icon="checkmark"
          onPress={save}
          loading={saving}
        />
      }
    >
      <Row gap={4}>
        <Mascot mood={mood} size={64} />
        <T v="callout" style={{ flex: 1 }} color={palette.inkSoft}>
          {total === 0 ? 'Şikayet yoksa direkt kaydet. İyi günler de karşılaştırma için çok değerli.' : '0 hiç yok, 5 çok şiddetli.'}
        </T>
      </Row>
      <Card>
        <WhenField value={at} onChange={setAt} />
      </Card>
      <Card style={{ gap: 4 }}>
        {FIELDS.map((f, i) => (
          <View key={f.key} style={{ gap: 8, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: palette.hairline }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="callout" style={{ fontWeight: '700' }}>
                {f.label}
              </T>
              <T v="caption" color={v[f.key] ? f.color : palette.inkFaint} style={{ fontWeight: '700' }}>
                {LEVELS[v[f.key]]}
              </T>
            </Row>
            <Row gap={6}>
              {[0, 1, 2, 3, 4, 5].map((n) => {
                const on = v[f.key] === n;
                return (
                  <Tap
                    key={n}
                    onPress={() => setV((p) => ({ ...p, [f.key]: n }))}
                    accessibilityRole="button"
                    accessibilityLabel={`${f.label} ${n}, ${LEVELS[n]}`}
                    accessibilityState={{ selected: on }}
                    style={{ flex: 1 }}
                  >
                    <View
                      style={{
                        height: 38,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: on ? (n === 0 ? palette.good : f.color) : n > 0 && n <= v[f.key] ? soft(f.color) : surface.well,
                      }}
                    >
                      <T v="callout" color={on ? onTint(n === 0 ? palette.good : f.color) : palette.ink} style={{ fontWeight: '800' }}>
                        {String(n)}
                      </T>
                    </View>
                  </Tap>
                );
              })}
            </Row>
          </View>
        ))}
      </Card>
      <Card style={{ gap: 10 }}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Not (isteğe bağlı): ör. öğleden sonra kramp"
          placeholderTextColor={palette.inkFaint}
          style={[st.input, { minHeight: 64, textAlignVertical: 'top' }]}
          multiline
        />
      </Card>
      {v.pain >= 5 ? (
        <Card tint={palette.badSoft}>
          <T v="small">Şiddetli ağrı, ateş, kusma ya da kanama varsa beklemeden doktoruna veya acile başvur.</T>
        </Card>
      ) : null}
      {editing ? <Button title="Kaydı sil" kind="danger" icon="trash" onPress={remove} /> : null}
    </Screen>
  );
}
