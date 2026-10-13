import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useRef, useState } from 'react';
import { Alert, Image, Text, TextInput, View } from 'react-native';
import { ReactionPicker } from '../components/ReactionPicker';
import { WhenField } from '../components/WhenField';
import { Button, Card, Chip, GlassPress, Icon, Row, Screen, T, Tap, st } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { findFoodByName, searchFoods, type Food } from '../lib/foods';
import { savePhoto } from '../lib/photos';
import { palette, radius, surface } from '../lib/theme';
import { generalVerdict } from '../lib/tolerance';

type Item = { key: string; name: string; food: Food | null };

export default function AddMeal() {
  const sql = useSQLiteContext();
  const app = useApp();
  const input = useRef<TextInput>(null);
  const [text, setText] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [at, setAt] = useState(() => now());
  const [reaction, setReaction] = useState<db.Reaction | null>(null);
  const [saving, setSaving] = useState(false);

  const suggestions = useMemo(() => {
    if (text.trim().length < 2) return [];
    const taken = new Set(items.map((i) => i.food?.id));
    return searchFoods(text)
      .filter((f) => !taken.has(f.id))
      .slice(0, 8);
  }, [text, items]);

  const add = (name: string, food: Food | null) => {
    const n = name.trim();
    if (!n) return;
    const f = food ?? findFoodByName(n) ?? null;
    setItems((prev) => [...prev, { key: `${Date.now()}-${prev.length}`, name: f?.name ?? n, food: f }]);
    setText('');
    input.current?.focus();
  };

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
      await db.addMealGroup(
        sql,
        all.map((it, i) => ({
          name: it.food?.name ?? it.name,
          food_id: it.food?.id ?? null,
          tags: it.food?.tags.join(',') ?? '',
          photo: i === 0 ? file : null,
          ai_verdict: it.food ? generalVerdict(it.food.tags, app.phase).verdict : null,
        })),
        { eaten_at: at, phase: app.phase, reaction },
      );
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

        <Row gap={8}>
          <TextInput
            ref={input}
            value={text}
            onChangeText={setText}
            placeholder={items.length ? 'Bir şey daha ekle' : 'ör. mercimek çorbası'}
            placeholderTextColor={palette.inkFaint}
            style={[st.input, { flex: 1, minWidth: 0 }]}
            autoFocus
            returnKeyType="done"
            blurOnSubmit={false}
            onSubmitEditing={() => add(text, null)}
          />
          <GlassPress
            onPress={() => add(text, null)}
            disabled={!text.trim()}
            tint={text.trim() ? palette.ink : undefined}
            accessibilityLabel="Ekle"
            style={{ width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="plus" size={20} color={text.trim() ? '#fff' : palette.inkFaint} fallback="+" />
          </GlassPress>
        </Row>

        {suggestions.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {suggestions.map((f) => (
              <Chip key={f.id} label={f.name} emoji={f.emoji} onPress={() => add(f.name, f)} />
            ))}
          </View>
        ) : (
          <T v="small" color={palette.inkSoft}>
            Her yemeği ayrı ekle. Hangisinin dokunduğunu zamanla ayırt etmek kolaylaşır.
          </T>
        )}
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
