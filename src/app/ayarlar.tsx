import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Share, TextInput } from 'react-native';
import { Button, Card, Row, Screen, T, s as ui } from '../components/ui';
import { analyze } from '../lib/ai';
import { useApp } from '../lib/app-state';
import * as db from '../lib/db';
import { colors } from '../lib/theme';

export default function Settings() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [name, setName] = useState(app.name);
  const [url, setUrl] = useState(app.ai?.url ?? '');
  const [token, setToken] = useState(app.ai?.token ?? '');
  const [testing, setTesting] = useState(false);

  const saveAll = async () => {
    await app.saveName(name);
    await app.saveAi(url.trim() ? { url, token } : null);
    Alert.alert('Kaydedildi ✨');
  };

  const test = async () => {
    if (!url.trim()) return;
    setTesting(true);
    try {
      const r = await analyze({ url: url.trim(), token: token.trim() }, { mode: 'food', foodName: 'Haşlanmış yumurta', phase: 'remisyon', history: {} });
      await app.saveAi({ url, token });
      Alert.alert('Bağlantı çalışıyor 🎉', r.kind === 'meal' ? r.headline || r.dish : 'Tamam');
    } catch (e: any) {
      Alert.alert('Bağlanamadım', e?.message ?? '');
    } finally {
      setTesting(false);
    }
  };

  const exportData = async () => {
    const data = await db.exportAll(sql);
    await Share.share({ title: 'Crohnic verilerim', message: JSON.stringify(data, null, 2) });
  };

  return (
    <Screen padTop={false}>
      <Card style={{ gap: 10 }}>
        <T v="h3">Sana nasıl hitap edeyim?</T>
        <TextInput value={name} onChangeText={setName} placeholder="Adın" placeholderTextColor={colors.inkFaint} style={ui.input} />
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="h3">✨ AI sunucusu</T>
        <T v="small" color={colors.inkSoft}>
          Fotoğraf ve menü analizi için Vercel’e kurduğun Crohnic sunucusunun adresi ve şifresi. API anahtarın telefonda değil, sunucuda durur.
        </T>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://crohnic-api.vercel.app"
          placeholderTextColor={colors.inkFaint}
          style={ui.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TextInput
          value={token}
          onChangeText={setToken}
          placeholder="Sunucu şifresi (APP_TOKEN)"
          placeholderTextColor={colors.inkFaint}
          style={ui.input}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <Row>
          <Button title="Test et" kind="soft" icon="bolt.fill" onPress={test} loading={testing} disabled={!url.trim()} style={{ flex: 1 }} />
        </Row>
      </Card>

      <Button title="Kaydet" icon="checkmark" onPress={saveAll} />

      <Card style={{ gap: 10 }}>
        <T v="h3">Verilerin</T>
        <T v="small" color={colors.inkSoft}>
          Tüm kayıtların sadece bu telefonda duruyor. Yedeklemek ya da doktoruna göndermek için dışa aktarabilirsin.
        </T>
        <Button title="Verilerimi dışa aktar" kind="soft" icon="square.and.arrow.up" onPress={exportData} />
      </Card>

      <T v="tiny" color={colors.inkFaint} style={{ textAlign: 'center', lineHeight: 17 }}>
        Crohnic v1.0 · Kıvırcık sevgiyle yaptı{'\n'}Tıbbi tavsiye değildir. Acil durumda 112.
      </T>
    </Screen>
  );
}
