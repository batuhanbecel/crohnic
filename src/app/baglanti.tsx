import { useState } from 'react';
import { Alert, View } from 'react-native';
import { TextInput } from '../components/text';
import { Button, Card, ListGroup, ListRow, Row, Screen, T, st } from '../components/ui';
import { DEFAULT_AI, analyze, type AiConfig } from '../lib/ai';
import { useApp } from '../lib/app-state';
import { palette } from '../lib/theme';

/** Photo analysis, recipes and "ask by name": the server connection. */
export default function Connection() {
  const app = useApp();
  const [url, setUrl] = useState(app.ai?.url ?? '');
  const [token, setToken] = useState(app.ai?.token ?? '');
  const [testing, setTesting] = useState(false);
  const ready = !!DEFAULT_AI || !!app.ai?.url;

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

  const save = async () => {
    await app.saveAi(url.trim() ? { url, token } : null);
    Alert.alert('Kaydedildi');
  };

  return (
    <Screen title="Fotoğraf analizi">
      <ListGroup footer="Fotoğraf, menü analizi, tarif ve listede olmayan yemekleri sormak bu bağlantıyla çalışır. Sadece o istek için gereken bilgi gider, saklanmaz.">
        <ListRow icon="camera.viewfinder" color={ready ? palette.good : palette.warn} title="Durum" value={ready ? 'Bağlı' : 'Kurulmadı'} />
      </ListGroup>

      {DEFAULT_AI ? (
        <Button title="Bağlantıyı test et" kind="glass" icon="bolt.fill" onPress={() => test(DEFAULT_AI!)} loading={testing} />
      ) : (
        <Card style={{ gap: 10 }}>
          <T v="small" color={palette.inkSoft}>
            Bu sürümde sunucu gömülü değil. Adres ve şifreyi elle gir.
          </T>
          <TextInput value={url} onChangeText={setUrl} placeholder="https://crohnic.vercel.app" placeholderTextColor={palette.inkFaint} style={st.input} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
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
          <View>
            <Row gap={8}>
              <Button title="Kaydet" icon="checkmark" compact style={{ flex: 1 }} onPress={save} />
              <Button title="Test et" kind="glass" compact icon="bolt.fill" style={{ flex: 1 }} onPress={() => test({ url: url.trim(), token: token.trim() })} loading={testing} disabled={!url.trim()} />
            </Row>
          </View>
        </Card>
      )}
    </Screen>
  );
}
