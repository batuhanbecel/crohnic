import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { FoodPicker } from '../components/FoodPicker';
import { ReactionPicker } from '../components/ReactionPicker';
import { WhenField } from '../components/WhenField';
import { Button, Card, Icon, Row, Screen, Segmented, T, Tap } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { afterMealSaved } from '../lib/reminders';
import { findFoodByName, type Food, type Phase } from '../lib/foods';
import { savePhoto } from '../lib/photos';
import { palette, radius, surface } from '../lib/theme';
import { generalVerdict } from '../lib/tolerance';

type Item = { key: string; name: string; food: Food | null };

export default function AddMeal() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<Phase>(app.phase);
  const [items, setItems] = useState<Item[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [at, setAt] = useState(() => now());
  const [reaction, setReaction] = useState<db.Reaction | null>(null);
  const [saving, setSaving] = useState(false);

  const add = (name: string, food: Food | null) =>
    setItems((prev) => [...prev, { key: `${Date.now()}-${prev.length}`, name: food?.name ?? name, food }]);

  const remove = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));

  const pickPhoto = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets?.[0]) setPhoto(res.assets[0].uri);
  };

  // Whatever is still in the box counts as an item too, so nothing typed gets lost.
  const all = useMemo(() => (text.trim() ? [...items, { key: 'typing', name: text.trim(), food: findFoodByName(text) ?? null }] : items), [items, text]);

  const save = async () => {
    if (!all.length) return;
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
      const saved = await db.addMealGroup(
        sql,
        all.map((it, i) => ({
          name: it.food?.name ?? it.name,
          food_id: it.food?.id ?? null,
          tags: it.food?.tags.join(',') ?? '',
          photo: i === 0 ? file : null,
          ai_verdict: it.food ? generalVerdict(it.food.tags, phase).verdict : null,
        })),
        { eaten_at: at, phase, reaction },
      );
      await afterMealSaved(sql, saved.ids, reaction);
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
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h3">Tabağında ne vardı?</T>
          {all.length ? (
            <T v="small" color={palette.inkSoft}>
              {all.length} yemek
            </T>
          ) : null}
        </Row>

        {items.length ? (
          <View style={{ gap: 6 }}>
            {items.map((it) => (
              <Row key={it.key} gap={10} style={{ backgroundColor: surface.well, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 12 }}>
                <Text style={{ fontSize: 20 }}>{it.food?.emoji ?? '🍽️'}</Text>
                <T v="callout" style={{ flex: 1 }} numberOfLines={1}>
                  {it.name}
                </T>
                <Tap onPress={() => remove(it.key)} hitSlop={10} accessibilityLabel={`${it.name} çıkar`}>
                  <Icon name="xmark.circle.fill" size={20} color={palette.inkFaint} fallback="✕" />
                </Tap>
              </Row>
            ))}
          </View>
        ) : null}

        <FoodPicker
          onAdd={add}
          onTextChange={setText}
          exclude={items.map((i) => i.food?.id)}
          placeholder={items.length ? 'Bir şey daha ekle' : 'ör. mercimek çorbası'}
          hint="Her yemeği ayrı ekle. Hangisinin dokunduğunu zamanla ayırt etmek kolaylaşır."
          autoFocus
        />
      </Card>

      <Card style={{ gap: 14 }}>
        <WhenField value={at} onChange={setAt} />
        <View style={{ gap: 8 }}>
          <T v="h3">Dönem</T>
          <Segmented
            value={phase}
            onChange={setPhase}
            items={[
              { key: 'remisyon', label: 'Remisyon', color: palette.lettuceDeep, icon: 'leaf.fill' },
              { key: 'atak', label: 'Atak', color: palette.flare, icon: 'flame.fill' },
            ]}
          />
        </View>
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

      <Button
        title={all.length > 1 ? `${all.length} yemeği kaydet` : 'Kaydet'}
        icon="checkmark"
        onPress={save}
        loading={saving}
        disabled={!all.length}
      />
    </Screen>
  );
}
