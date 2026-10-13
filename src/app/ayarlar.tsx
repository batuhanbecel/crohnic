import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Updates from 'expo-updates';
import { useCallback, useState } from 'react';
import { Alert, Linking, Switch, TextInput, View } from 'react-native';
import { Button, Card, Icon, Row, Screen, T, Tap, st } from '../components/ui';
import { DEFAULT_AI, analyze, type AiConfig } from '../lib/ai';
import { useApp } from '../lib/app-state';
import { applyBackup, lastBackup, pickBackup, shareBackup } from '../lib/backup';
import { daysSince, relative } from '../lib/dates';
import * as db from '../lib/db';
import { SETTINGS, askPermission, isOn, permission, syncReminders, type PermissionState } from '../lib/reminders';
import { palette } from '../lib/theme';

export default function Settings() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [name, setName] = useState(app.name);
  const [url, setUrl] = useState(app.ai?.url ?? '');
  const [token, setToken] = useState(app.ai?.token ?? '');
  const [testing, setTesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [perm, setPerm] = useState<PermissionState>('undetermined');
  const [remindMeals, setRemindMeals] = useState(true);
  const [remindDaily, setRemindDaily] = useState(true);
  const [backupAt, setBackupAt] = useState<number | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setPerm(await permission());
        setRemindMeals(await isOn(sql, SETTINGS.meals));
        setRemindDaily(await isOn(sql, SETTINGS.daily));
        setBackupAt(await lastBackup(sql));
      })();
    }, [sql]),
  );

  const toggle = async (key: string, on: boolean, set: (v: boolean) => void) => {
    set(on);
    await db.setSetting(sql, key, on ? '1' : '0');
    if (on && perm !== 'granted') {
      const ok = await askPermission();
      setPerm(ok ? 'granted' : await permission());
      if (!ok && (await permission()) === 'denied') {
        Alert.alert('Bildirimler kapalı', 'iPhone Ayarlar > Crohnic > Bildirimler’den açabilirsin.', [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Ayarları aç', onPress: () => Linking.openSettings() },
        ]);
      }
    }
    syncReminders(sql);
  };

  const backup = async () => {
    setBackingUp(true);
    try {
      await shareBackup(sql);
      setBackupAt(await lastBackup(sql));
    } catch (e: any) {
      Alert.alert('Yedeklenemedi', e?.message ?? '');
    } finally {
      setBackingUp(false);
    }
  };

  const restore = async () => {
    try {
      const picked = await pickBackup();
      if (!picked) return;
      const { summary } = picked;
      const when = summary.exported_at ? new Date(summary.exported_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'tarihi bilinmeyen';
      Alert.alert(
        'Yedek yüklensin mi?',
        `${when} yedeği: ${summary.meals} öğün, ${summary.symptoms} semptom, ${summary.bowel} tuvalet, ${summary.meds} ilaç. Bu telefondaki mevcut kayıtların yerini alacak.`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Yükle',
            style: 'destructive',
            onPress: async () => {
              try {
                await applyBackup(sql, picked.data);
                Alert.alert('Yedek yüklendi', 'Uygulama yeniden başlayacak.', [
                  { text: 'Tamam', onPress: () => (Updates.isEnabled && !__DEV__ ? Updates.reloadAsync() : app.bump()) },
                ]);
              } catch (e: any) {
                Alert.alert('Yüklenemedi', e?.message ?? '');
              }
            },
          },
        ],
      );
    } catch (e: any) {
      Alert.alert('Açılamadı', e?.message ?? '');
    }
  };

  const saveAll = async () => {
    await app.saveName(name);
    if (!DEFAULT_AI) await app.saveAi(url.trim() ? { url, token } : null);
    Alert.alert('Kaydedildi');
  };

  const test = async (cfg: AiConfig) => {
    if (!cfg.url) return;
    setTesting(true);
    try {
      const r = await analyze(cfg, { mode: 'food', foodName: 'Haşlanmış yumurta', phase: 'remisyon', history: {} });
      if (!DEFAULT_AI) await app.saveAi(cfg);
      Alert.alert('Bağlantı çalışıyor', r.kind === 'meal' ? r.headline || r.dish : undefined);
    } catch (e: any) {
      Alert.alert('Bağlanamadım', e?.message ?? '');
    } finally {
      setTesting(false);
    }
  };

  const checkUpdate = async () => {
    if (__DEV__ || !Updates.isEnabled) {
      Alert.alert('Geliştirme modundasın', 'Güncellemeler TestFlight sürümünde otomatik gelir.');
      return;
    }
    setChecking(true);
    try {
      const r = await Updates.checkForUpdateAsync();
      if (!r.isAvailable) {
        Alert.alert('Güncelsin');
        return;
      }
      await Updates.fetchUpdateAsync();
      Alert.alert('Yeni sürüm indi', 'Uygulama yeniden başlayacak.', [{ text: 'Tamam', onPress: () => Updates.reloadAsync() }]);
    } catch (e: any) {
      Alert.alert('Kontrol edilemedi', e?.message ?? '');
    } finally {
      setChecking(false);
    }
  };


  return (
    <Screen header={false}>
      <Card style={{ gap: 10 }}>
        <T v="h3">Adın</T>
        <TextInput value={name} onChangeText={setName} placeholder="Ana sayfada böyle selamlarım" placeholderTextColor={palette.inkFaint} style={st.input} />
      </Card>

      {DEFAULT_AI ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Fotoğraf analizi</T>
          <T v="small" color={palette.inkSoft}>
            Sunucu uygulamaya gömülü, ayar gerekmiyor. Çalıştığını görmek için test edebilirsin.
          </T>
          <Button title="Bağlantıyı test et" kind="glass" icon="bolt.fill" onPress={() => test(DEFAULT_AI!)} loading={testing} />
        </Card>
      ) : (
        <Card style={{ gap: 10 }}>
          <T v="h3">Fotoğraf analizi</T>
          <T v="small" color={palette.inkSoft}>
            Bu sürümde sunucu gömülü değil. Adres ve şifreyi elle gir.
          </T>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://crohnic.vercel.app"
            placeholderTextColor={palette.inkFaint}
            style={st.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TextInput
            value={token}
            onChangeText={setToken}
            placeholder="Sunucu şifresi (APP_TOKEN)"
            placeholderTextColor={palette.inkFaint}
            style={st.input}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <Button title="Bağlantıyı test et" kind="glass" icon="bolt.fill" onPress={() => test({ url: url.trim(), token: token.trim() })} loading={testing} disabled={!url.trim()} />
        </Card>
      )}

      <Button title="Kaydet" icon="checkmark" onPress={saveAll} />

      <Card style={{ gap: 4, paddingVertical: 6 }}>
        <LinkRow icon="pills.fill" title="İlaçlarım" onPress={() => router.push('/ilaclar')} />
        <View style={{ height: 1, backgroundColor: palette.hairline }} />
        <LinkRow icon="doc.text.fill" title="Doktor raporu (PDF)" onPress={() => router.push('/rapor')} />
      </Card>

      <Card style={{ gap: 14 }}>
        <T v="h3">Hatırlatmalar</T>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T v="callout">Öğünden sonra sor</T>
            <T v="small" color={palette.inkSoft}>
              Yedikten 3 saat sonra nasıl geçti diye sorar
            </T>
          </View>
          <Switch value={remindMeals && perm === 'granted'} onValueChange={(v) => toggle(SETTINGS.meals, v, setRemindMeals)} trackColor={{ true: palette.lettuce }} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T v="callout">Akşam kontrolü</T>
            <T v="small" color={palette.inkSoft}>
              21:30’da stres ve uykunu sorar
            </T>
          </View>
          <Switch value={remindDaily && perm === 'granted'} onValueChange={(v) => toggle(SETTINGS.daily, v, setRemindDaily)} trackColor={{ true: palette.lettuce }} />
        </Row>
        <T v="caption" color={palette.inkFaint} style={{ fontWeight: '400' }}>
          {perm === 'denied'
            ? 'Bildirim izni kapalı. iPhone Ayarlar > Crohnic > Bildirimler’den açabilirsin.'
            : 'İlaç hatırlatmaları her ilacın kendi ayarında.'}
        </T>
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="h3">Yedek</T>
        <T v="small" color={palette.inkSoft}>
          Kayıtların sadece bu telefonda. Yedeği “Dosyalar’a Kaydet” ile iCloud Drive’a koy; telefon değişirse buradan geri yüklersin. Yemek fotoğrafları yedeğe girmez.
        </T>
        <T v="small" color={backupAt && daysSince(backupAt) < 30 ? palette.good : palette.warn}>
          {backupAt ? `Son yedek: ${relative(backupAt)}` : 'Henüz yedek almadın'}
        </T>
        <Row gap={8}>
          <Button title="Yedekle" icon="icloud.and.arrow.up" onPress={backup} loading={backingUp} style={{ flex: 1 }} />
          <Button title="Geri yükle" kind="glass" icon="icloud.and.arrow.down" onPress={restore} style={{ flex: 1 }} />
        </Row>
      </Card>

      <Card style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h3">Sürüm</T>
          <T v="small" color={palette.inkSoft}>
            {Constants.expoConfig?.version ?? '1.0.0'}
            {Updates.updateId ? ` · ${Updates.updateId.slice(0, 7)}` : ''}
          </T>
        </Row>
        <Button title="Güncelleme var mı?" kind="glass" icon="arrow.down.circle" onPress={checkUpdate} loading={checking} />
      </Card>

      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', lineHeight: 17, fontWeight: '400' }}>
        Crohnic tıbbi tavsiye vermez. Acil durumda 112.
      </T>
    </Screen>
  );
}

function LinkRow({ icon, title, onPress }: { icon: 'pills.fill' | 'doc.text.fill'; title: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress}>
      <Row gap={12} style={{ paddingVertical: 10 }}>
        <Icon name={icon} color={palette.peri} />
        <T v="callout" style={{ flex: 1 }}>
          {title}
        </T>
        <Icon name="chevron.right" size={14} color={palette.inkFaint} fallback="›" />
      </Row>
    </Tap>
  );
}
