import Constants from 'expo-constants';
import { useSQLiteContext } from 'expo-sqlite';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Alert, Share, TextInput } from 'react-native';
import { Button, Card, Row, Screen, T, st } from '../components/ui';
import { DEFAULT_AI, analyze, type AiConfig } from '../lib/ai';
import { useApp } from '../lib/app-state';
import * as db from '../lib/db';
import { palette } from '../lib/theme';

export default function Settings() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [name, setName] = useState(app.name);
  const [url, setUrl] = useState(app.ai?.url ?? '');
  const [token, setToken] = useState(app.ai?.token ?? '');
  const [testing, setTesting] = useState(false);
  const [checking, setChecking] = useState(false);

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

  const exportData = async () => {
    const data = await db.exportAll(sql);
    await Share.share({ title: 'Crohnic verilerim', message: JSON.stringify(data, null, 2) });
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

      <Card style={{ gap: 10 }}>
        <T v="h3">Verilerin</T>
        <T v="small" color={palette.inkSoft}>
          Kayıtların sadece bu telefonda. Yedeklemek ya da doktoruna göndermek için dışa aktarabilirsin.
        </T>
        <Button title="Dışa aktar" kind="glass" icon="square.and.arrow.up" onPress={exportData} />
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
