import { router } from 'expo-router';
import type { SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Mascot } from '../../components/Mascot';
import { ThinkingOverlay } from '../../components/ThinkingOverlay';
import { Button, Card, Icon, Row, Screen, T, Tap, s as ui } from '../../components/ui';
import { useApp } from '../../lib/app-state';
import { findFoodByName } from '../../lib/foods';
import { colors, fonts, radius } from '../../lib/theme';
import { useAnalyze } from '../../lib/use-analyze';

export default function Ask() {
  const app = useApp();
  const { busy, fromPhoto, byName, hasAi } = useAnalyze();
  const [text, setText] = useState('');

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
    <Screen>
      <ThinkingOverlay mode={busy} />
      <Row gap={4} style={{ alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <T v="small" color={colors.inkSoft}>
            {app.phase === 'atak' ? 'Atak modunda, temkinli bakarım' : 'Remisyon modunda bakıyorum'}
          </T>
          <T v="title">Bu bana iyi gelir mi?</T>
        </View>
        <Mascot mood="cheer" size={78} />
      </Row>

      {!hasAi ? (
        <Tap onPress={() => router.push('/ayarlar')}>
          <Card tint={colors.butterSoft} style={{ gap: 4 }}>
            <T v="h3">✨ Fotoğraf analizi kapalı</T>
            <T v="small">Sunucu adresini Ayarlar’a girince açılır. Listeden seçme ve kayıt tutma şimdiden çalışıyor.</T>
          </Card>
        </Tap>
      ) : null}

      <PhotoCard
        title="Tabağımı çek"
        sub="Önündeki yemeğin fotoğrafını çek, malzemelerine bakıp yorumlayayım."
        emoji="🍛"
        bg={colors.coralSoft}
        fg={colors.coral}
        onCamera={() => fromPhoto('meal', 'camera')}
        onLibrary={() => fromPhoto('meal', 'library')}
      />
      <PhotoCard
        title="Menüyü çek"
        sub="Restoran menüsünü çek, her yemeği iyi / dikkat / riskli diye işaretleyeyim."
        emoji="📜"
        bg={colors.lavSoft}
        fg={colors.lavender}
        onCamera={() => fromPhoto('menu', 'camera')}
        onLibrary={() => fromPhoto('menu', 'library')}
      />

      <Tap onPress={() => router.navigate('/liste')}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: colors.mintSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 26 }}>📋</Text>
          </View>
          <View style={{ flex: 1 }}>
            <T v="h3">Listeden seç</T>
            <T v="small" color={colors.inkSoft}>
              90+ Türk yemeği, sana göre işaretli
            </T>
          </View>
          <Icon name="chevron.right" color={colors.inkFaint} size={16} fallback="›" />
        </Card>
      </Tap>

      <Card style={{ gap: 12 }}>
        <T v="h3">Ya da adını yaz</T>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="ör. tavuklu mantar sote"
          placeholderTextColor={colors.inkFaint}
          style={ui.input}
          returnKeyType="search"
          onSubmitEditing={askText}
        />
        <Button title="Kıvırcık’a sor" icon="sparkles" onPress={askText} disabled={!text.trim()} />
      </Card>
    </Screen>
  );
}

function PhotoCard({
  title,
  sub,
  emoji,
  bg,
  fg,
  onCamera,
  onLibrary,
}: {
  title: string;
  sub: string;
  emoji: string;
  bg: string;
  fg: string;
  onCamera: () => void;
  onLibrary: () => void;
}) {
  return (
    <Card style={{ gap: 14 }}>
      <Row gap={14} style={{ alignItems: 'flex-start' }}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 26 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="h2">{title}</T>
          <T v="small" color={colors.inkSoft}>
            {sub}
          </T>
        </View>
      </Row>
      <Row gap={10}>
        <SmallBtn label="Çek" icon="camera.fill" fallback="📷" bg={fg} fg="#fff" onPress={onCamera} />
        <SmallBtn label="Galeriden" icon="photo.on.rectangle" fallback="🖼️" bg={bg} fg={fg} onPress={onLibrary} />
      </Row>
    </Card>
  );
}

function SmallBtn({
  label,
  icon,
  fallback,
  bg,
  fg,
  onPress,
}: {
  label: string;
  icon: SymbolViewProps['name'];
  fallback: string;
  bg: string;
  fg: string;
  onPress: () => void;
}) {
  return (
    <Tap onPress={onPress} style={{ flex: 1 }}>
      <View style={{ height: 48, borderRadius: radius.pill, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icon name={icon} color={fg} size={17} fallback={fallback} />
        <T v="h3" color={fg} style={{ fontFamily: fonts.heavy }}>
          {label}
        </T>
      </View>
    </Tap>
  );
}
