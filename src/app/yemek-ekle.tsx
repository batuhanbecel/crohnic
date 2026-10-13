import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Alert, Image, TextInput, View } from 'react-native';
import { ReactionPicker } from '../components/ReactionPicker';
import { WhenField } from '../components/WhenField';
import { Button, Card, Chip, Row, Screen, T, Tap, st } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { searchFoods, type Food } from '../lib/foods';
import { savePhoto } from '../lib/photos';
import { palette, radius } from '../lib/theme';
import { assessFood } from '../lib/tolerance';

export default function AddMeal() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [name, setName] = useState('');
  const [food, setFood] = useState<Food | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [at, setAt] = useState(() => now());
  const [reaction, setReaction] = useState<db.Reaction | null>(null);
  const [saving, setSaving] = useState(false);

  const suggestions = useMemo(() => (name.trim().length < 2 || food ? [] : searchFoods(name).slice(0, 8)), [name, food]);

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
        eaten_at: at,
        ai_verdict: food ? assessFood(food, app.phase, []).verdict : null,
        reaction,
        phase: app.phase,
      });
      app.bump();
      router.back();
    } catch (e: any) {
      Alert.alert('Kaydedilemedi', e?.message ?? '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen header={false}>
      <Card style={{ gap: 12 }}>
        <T v="h3">Ne yedin?</T>
        <TextInput
          value={name}
          onChangeText={(t) => {
            setName(t);
            setFood(null);
          }}
          placeholder="ör. mercimek çorbası"
          placeholderTextColor={palette.inkFaint}
          style={st.input}
          autoFocus
        />
        {food ? (
          <T v="small" color={palette.good}>
            {food.emoji} Listede var, içeriği otomatik eklenecek.
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

      <Card>
        <WhenField value={at} onChange={setAt} />
      </Card>

      <Card style={{ gap: 12 }}>
        <T v="h3">Fotoğraf</T>
        {photo ? (
          <Tap onPress={() => setPhoto(null)}>
            <Image source={{ uri: photo }} style={{ width: '100%', aspectRatio: 1.4, borderRadius: radius.md }} />
            <T v="caption" color={palette.inkSoft} style={{ textAlign: 'center', marginTop: 6 }}>
              Kaldırmak için dokun
            </T>
          </Tap>
        ) : (
          <Row gap={8}>
            <Button title="Çek" kind="glass" icon="camera.fill" style={{ flex: 1 }} onPress={() => pickPhoto(true)} />
            <Button title="Galeri" kind="glass" icon="photo.on.rectangle" style={{ flex: 1 }} onPress={() => pickPhoto(false)} />
          </Row>
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <T v="h3">Nasıl geçti?</T>
        <T v="small" color={palette.inkSoft} style={{ marginTop: -8 }}>
          Şimdi bilmiyorsan boş bırak, sonra soracağım.
        </T>
        <ReactionPicker value={reaction} onChange={(r) => setReaction(reaction === r ? null : r)} />
      </Card>

      <Button title="Kaydet" icon="checkmark" onPress={save} loading={saving} disabled={!name.trim()} />
    </Screen>
  );
}
