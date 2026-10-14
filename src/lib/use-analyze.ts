import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { analyze, prepareImage, type Mode } from './ai';
import { useApp } from './app-state';
import * as db from './db';
import { hasLactose, hasStoma, hasStricture, historyForAI } from './tolerance';

export function useAnalyze() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [busy, setBusy] = useState<Mode | null>(null);

  const needsSetup = useCallback(() => {
    if (app.ai) return false;
    Alert.alert('Fotoğraf analizi kapalı', 'Açmak için Ayarlar\'a sunucu adresini gir.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Ayarlar', onPress: () => router.push('/ayarlar') },
    ]);
    return true;
  }, [app.ai]);

  const context = useCallback(async () => {
    const [rated, symptoms, bowel] = await Promise.all([db.allRatedMeals(sql), db.listSymptoms(sql, 3), db.listBowel(sql, 3)]);
    const dayAgo = Date.now() - 86400000;
    const s = symptoms.find((x) => x.at >= dayAgo);
    const b = bowel.find((x) => x.at >= dayAgo);
    const recent = [
      s ? `Son 24 saatte ağrı ${s.pain}/5, şişkinlik ${s.bloating}/5, gaz ${s.gas}/5` : null,
      b ? `Son tuvalet Bristol tip ${b.bristol}${b.blood ? ', kan var' : ''}` : null,
      hasStricture() ? 'Bağırsakta bilinen darlık (striktür) var: posalı ve lifli yiyeceklerde temkinli ol' : null,
      hasStoma() ? 'İleostomisi var: tıkanma riskine karşı lifli, kabuklu ve posalı yiyeceklerde temkinli ol' : null,
      hasLactose() ? 'Laktoz intoleransı var: süt, krema ve sütlü tatlıları riskli say; yoğurt, kefir ve eski peynir genelde tolere edilir' : null,
    ]
      .filter(Boolean)
      .join('. ');
    return { history: historyForAI(rated), recent: recent || undefined };
  }, [sql]);

  const run = useCallback(
    async (mode: Mode, opts: { imageUri?: string; foodName?: string; foodId?: string | null }) => {
      if (!app.ai) return;
      setBusy(mode);
      try {
        let base64: string | undefined;
        let preparedUri: string | null = null;
        if (opts.imageUri) {
          const p = await prepareImage(opts.imageUri, mode === 'menu' ? 1500 : 1024);
          base64 = p.base64;
          preparedUri = p.uri;
        }
        const ctx = await context();
        const analysis = await analyze(app.ai, {
          mode,
          imageBase64: base64,
          foodName: opts.foodName,
          phase: app.phase,
          ...ctx,
        });
        app.setPending({ analysis, photoUri: mode === 'meal' ? preparedUri : null, foodId: opts.foodId ?? null });
        router.push('/sonuc');
      } catch (e: any) {
        Alert.alert('Olmadı', e?.message ?? 'Bir sorun çıktı, tekrar dener misin?');
      } finally {
        setBusy(null);
      }
    },
    [app, context],
  );

  const fromPhoto = useCallback(
    async (mode: 'meal' | 'menu', source: 'camera' | 'library') => {
      if (needsSetup()) return;
      const perm =
        source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('İzin gerekli', source === 'camera' ? 'Ayarlar > Crohnic > Kamera iznini aç.' : 'Ayarlar > Crohnic > Fotoğraflar iznini aç.');
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: mode === 'meal' };
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets?.[0]) return;
      await run(mode, { imageUri: res.assets[0].uri });
    },
    [needsSetup, run],
  );

  const byName = useCallback(
    async (foodName: string, foodId?: string | null) => {
      if (needsSetup()) return;
      await run('food', { foodName, foodId });
    },
    [needsSetup, run],
  );

  return { busy, fromPhoto, byName, hasAi: !!app.ai };
}
