import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Alert, Image, View } from 'react-native';
import { Text } from '../components/text';
import { FoodPicker } from '../components/FoodPicker';
import { ReactionPicker } from '../components/ReactionPicker';
import { WhenField } from '../components/WhenField';
import { Button, Card, Icon, Row, Screen, T, Tap } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { afterMealSaved } from '../lib/reminders';
import { FOOD_BY_ID, findFoodByName, type Food, type Phase } from '../lib/foods';
import { savePhoto } from '../lib/photos';
import { palette, radius, surface } from '../lib/theme';
import { generalVerdict } from '../lib/tolerance';

type Item = { key: string; name: string; food: Food | null };

export default function AddMeal() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [text, setText] = useState('');
  // follows the app's phase until the user picks one here (app state may still be loading)
  const [picked, setPhase] = useState<Phase | null>(null);
  const phase = picked ?? app.phase;
  // "Bunu yedim" on a suggestion opens this screen with ?foods=id1,id2
  const { foods } = useLocalSearchParams<{ foods?: string }>();
  const [items, setItems] = useState<Item[]>(() =>
    (foods ?? '')
      .split(',')
      .map((id) => FOOD_BY_ID[id])
      .filter((f): f is Food => !!f)
      .map((f, i) => ({ key: `pre-${i}`, name: f.name, food: f })),
  );
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
    <Screen
      header={false}
      footer={
        <Button
          title={all.length > 1 ? `${all.length} yemeği kaydet` : all.length ? 'Kaydet' : 'Önce yemeği yaz'}
          icon="checkmark"
          onPress={save}
          loading={saving}
          disabled={!all.length}
        />
      }
    >
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
          autoFocus={!foods}
        />
      </Card>

      <Card style={{ gap: 14 }}>
        <WhenField value={at} onChange={setAt} />
        <Tap
          onPress={() => setPhase(phase === 'atak' ? 'remisyon' : 'atak')}
          accessibilityRole="button"
          accessibilityLabel={`Dönem: ${phase === 'atak' ? 'atak' : 'remisyon'}. Değiştirmek için dokun`}
        >
          <Row gap={8} style={{ paddingTop: 2 }}>
            <Icon name={phase === 'atak' ? 'flame.fill' : 'leaf.fill'} size={14} color={phase === 'atak' ? palette.flareDeep : palette.lettuceDeep} fallback={phase === 'atak' ? '🔥' : '🌿'} />
            <T v="small" color={phase === 'atak' ? palette.flareDeep : palette.lettuceDeep} style={{ flex: 1, fontWeight: '700' }}>
              {phase === 'atak' ? 'Atak döneminde' : 'Remisyon döneminde'}
            </T>
            <T v="small" color={palette.inkSoft}>
              Değiştir
            </T>
          </Row>
        </Tap>
      </Card>

      <Card style={{ gap: 12 }}>
        <T v="h3">Nasıl geçti?</T>
        <T v="small" color={palette.inkSoft} style={{ marginTop: -8 }}>
          Şimdi bilmiyorsan boş bırak, 3 saat sonra soracağım.
        </T>
        <ReactionPicker value={reaction} onChange={(r) => setReaction(reaction === r ? null : r)} />
      </Card>

      <Card style={{ gap: 12 }}>
        {photo ? (
          <Tap onPress={() => setPhoto(null)}>
            <Image source={{ uri: photo }} style={{ width: '100%', aspectRatio: 1.4, borderRadius: radius.md }} />
            <T v="caption" color={palette.inkSoft} style={{ textAlign: 'center', marginTop: 6 }}>
              Kaldırmak için dokun
            </T>
          </Tap>
        ) : (
          <Row gap={8}>
            <T v="callout" style={{ flex: 1, fontWeight: '700' }}>
              Fotoğraf
              <T v="small" color={palette.inkSoft}>
                {'  isteğe bağlı'}
              </T>
            </T>
            <Button title="Çek" kind="glass" compact icon="camera.fill" onPress={() => pickPhoto(true)} />
            <Button title="Galeri" kind="glass" compact icon="photo.on.rectangle" onPress={() => pickPhoto(false)} />
          </Row>
        )}
      </Card>

    </Screen>
  );
}
