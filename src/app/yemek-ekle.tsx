import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Alert, Image, TextInput, View } from 'react-native';
import { ReactionPicker } from '../components/ReactionPicker';
import { Button, Card, Chip, Row, Screen, T, Tap, s as ui } from '../components/ui';
import { useApp } from '../lib/app-state';
import * as db from '../lib/db';
import { FOODS, normalizeName, type Food } from '../lib/foods';
import { savePhoto } from '../lib/photos';
import { colors, radius } from '../lib/theme';
import { assessFood } from '../lib/tolerance';

const WHEN: { label: string; ms: () => number }[] = [
  { label: 'Şimdi', ms: () => Date.now() },
  { label: '1 saat önce', ms: () => Date.now() - 3600000 },
  { label: '3 saat önce', ms: () => Date.now() - 3 * 3600000 },
  {
    label: 'Dün akşam',
    ms: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      d.setHours(20, 0, 0, 0);
      return d.getTime();
    },
  },
];

export default function AddMeal() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [name, setName] = useState('');
  const [food, setFood] = useState<Food | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [when, setWhen] = useState(0);
  const [reaction, setReaction] = useState<db.Reaction | null>(null);
  const [saving, setSaving] = useState(false);

  const suggestions = useMemo(() => {
    const n = normalizeName(name);
    if (!n || food) return [];
    return FOODS.filter((f) => normalizeName(f.name).includes(n)).slice(0, 6);
  }, [name, food]);

  const pickPhoto = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets?.[0]) setPhoto(res.assets[0].uri);
  };

  const save = async () => {
    const n = name.trim();
    if (!n) return;
    setSaving(true);
    try {
      let file: string | null = null;
      if (photo) {
        try {
          file = savePhoto(photo);
        } catch {
          file = null;
        }
      }
      await db.addMeal(sql, {
        name: food?.name ?? n,
        food_id: food?.id ?? null,
        tags: food?.tags.join(',') ?? '',
        photo: file,
        eaten_at: WHEN[when].ms(),
        ai_verdict: food ? assessFood(food, app.phase, []).verdict : null,
        reaction,
        phase: app.phase,
      });
      app.bump();
      router.back();
    } catch (e: any) {
      Alert.alert('Kaydedemedim', e?.message ?? '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen padTop={false}>
      <Card style={{ gap: 12 }}>
        <T v="h3">Ne yedin?</T>
        <TextInput
          value={name}
          onChangeText={(t) => {
            setName(t);
            setFood(null);
          }}
          placeholder="ör. mercimek çorbası"
          placeholderTextColor={colors.inkFaint}
          style={ui.input}
          autoFocus
        />
        {food ? (
          <T v="small" color={colors.mint}>
            {food.emoji} Listeden eşleşti, etiketleri otomatik eklenecek.
          </T>
        ) : null}
        {suggestions.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {suggestions.map((f) => (
              <Chip
                key={f.id}
                label={f.name}
                emoji={f.emoji}
                onPress={() => {
                  setFood(f);
                  setName(f.name);
                }}
              />
            ))}
          </View>
        ) : null}
      </Card>

      <Card style={{ gap: 12 }}>
        <T v="h3">Ne zaman?</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {WHEN.map((w, i) => (
            <Chip key={w.label} label={w.label} active={when === i} onPress={() => setWhen(i)} />
          ))}
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <T v="h3">Fotoğraf (isteğe bağlı)</T>
        {photo ? (
          <Tap onPress={() => setPhoto(null)}>
            <Image source={{ uri: photo }} style={{ width: '100%', aspectRatio: 1.4, borderRadius: radius.md }} />
            <T v="tiny" color={colors.inkSoft} style={{ textAlign: 'center', marginTop: 6 }}>
              KALDIRMAK İÇİN DOKUN
            </T>
          </Tap>
        ) : (
          <Row>
            <Button title="Çek" kind="soft" icon="camera.fill" style={{ flex: 1 }} onPress={() => pickPhoto(true)} />
            <Button title="Galeri" kind="soft" icon="photo.on.rectangle" style={{ flex: 1 }} onPress={() => pickPhoto(false)} />
          </Row>
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <T v="h3">Nasıl geldi? (sonra da söyleyebilirsin)</T>
        <ReactionPicker value={reaction} onChange={(r) => setReaction(reaction === r ? null : r)} />
      </Card>

      <Button title="Kaydet" icon="checkmark" onPress={save} loading={saving} disabled={!name.trim()} />
    </Screen>
  );
}
