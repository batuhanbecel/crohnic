import { router } from 'expo-router';
import type { SymbolViewProps } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Mascot } from '../../components/Mascot';
import { ThinkingOverlay } from '../../components/ThinkingOverlay';
import { Button, Card, Chip, Icon, Row, Screen, T, Tap, st } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { findFoodByName, searchFoods } from '../../lib/foods';
import { palette, radius, type } from '../../lib/theme';
import { useAnalyze } from '../../lib/use-analyze';

export default function Ask() {
  const app = useApp();
  const { busy, fromPhoto, byName, hasAi } = useAnalyze();
  const [text, setText] = useState('');
  const hits = useMemo(() => (text.trim().length >= 2 ? searchFoods(text).slice(0, 4) : []), [text]);

  const askText = () => {
    const q = text.trim();
    if (!q) return;
    const known = findFoodByName(q);
    if (!hasAi && known) {
      router.push(`/besin/${known.id}`);
      return;
    }
    byName(q, known?.id ?? null);
  };

  return (
    <Screen tone={app.phase === 'atak' ? 'flare' : 'calm'}>
      <ThinkingOverlay mode={busy} />
      <Row gap={4} style={{ alignItems: 'flex-end', marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <T v="caption" color={palette.inkSoft} style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {app.phase === 'atak' ? 'Atak modunda bakıyorum' : 'Remisyon modunda bakıyorum'}
          </T>
          <T v="large">Bu bana iyi gelir mi?</T>
        </View>
        <Mascot mood="happy" size={72} />
      </Row>

      {!hasAi ? (
        <Tap onPress={() => router.push('/ayarlar')}>
          <Card tint={palette.apricotSoft} style={{ gap: 4 }}>
            <T v="h3">Fotoğraf analizi henüz kapalı</T>
            <T v="small">Ayarlar’a sunucu adresini girince açılır. O zamana kadar listeden seçip sorabilirsin.</T>
          </Card>
        </Tap>
      ) : null}

      <PhotoCard
        title="Tabağı çek"
        sub="Önündeki yemeğin fotoğrafından ne olduğunu ve sana uyup uymadığını söylerim."
        icon="fork.knife"
        color={palette.lettuceDeep}
        onCamera={() => fromPhoto('meal', 'camera')}
        onLibrary={() => fromPhoto('meal', 'library')}
      />
      <PhotoCard
        title="Menüyü çek"
        sub="Restoran menüsündeki yemekleri tek tek işaretlerim, hangisini söyleyeceğini seçersin."
        icon="list.bullet.rectangle"
        color={palette.peri}
        onCamera={() => fromPhoto('menu', 'camera')}
        onLibrary={() => fromPhoto('menu', 'library')}
      />

      <Card style={{ gap: 12 }}>
        <T v="h3">Ya da adını yaz</T>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="ör. fırın mantı, tavuk köri"
          placeholderTextColor={palette.inkFaint}
          style={st.input}
          returnKeyType="search"
          onSubmitEditing={askText}
        />
        {hits.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {hits.map((f) => (
              <Chip key={f.id} label={f.name} emoji={f.emoji} onPress={() => router.push(`/besin/${f.id}`)} />
            ))}
          </View>
        ) : null}
        <Button title={hasAi ? 'Sor' : 'Listede ara'} icon="sparkles" onPress={hasAi ? askText : () => router.navigate('/liste')} disabled={hasAi && !text.trim()} />
      </Card>
    </Screen>
  );
}

function PhotoCard({
  title,
  sub,
  icon,
  color,
  onCamera,
  onLibrary,
}: {
  title: string;
  sub: string;
  icon: SymbolViewProps['name'];
  color: string;
  onCamera: () => void;
  onLibrary: () => void;
}) {
  return (
    <Card style={{ gap: 14 }}>
      <Row gap={14} style={{ alignItems: 'flex-start' }}>
        <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} color="#fff" size={20} fallback="📷" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="h2">{title}</T>
          <T v="small" color={palette.inkSoft}>
            {sub}
          </T>
        </View>
      </Row>
      <Row gap={8}>
        <Tap onPress={onCamera} style={{ flex: 1 }}>
          <View style={{ height: 46, borderRadius: radius.pill, backgroundColor: palette.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="camera.fill" color="#fff" size={16} fallback="📷" />
            <Text style={[{ color: '#fff', fontSize: 16 }, type.semibold]}>Çek</Text>
          </View>
        </Tap>
        <Tap onPress={onLibrary} style={{ flex: 1 }}>
          <View style={{ height: 46, borderRadius: radius.pill, backgroundColor: 'rgba(29,43,34,0.06)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="photo.on.rectangle" color={palette.ink} size={16} fallback="🖼️" />
            <Text style={[{ color: palette.ink, fontSize: 16 }, type.semibold]}>Galeriden</Text>
          </View>
        </Tap>
      </Row>
    </Card>
  );
}
