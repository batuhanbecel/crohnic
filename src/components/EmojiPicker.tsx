import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radius, surface } from '../lib/theme';
import { TextInput } from './text';
import { Button, Row, T, Tap, st } from './ui';

const COLS = 6;
const GAP = 8;

const GROUPS: { title: string; emojis: string[] }[] = [
  {
    title: 'Yemekler',
    emojis: ['🍲', '🥘', '🍛', '🍝', '🍜', '🥣', '🍚', '🍙', '🥟', '🥙', '🌯', '🌮', '🫔', '🥪', '🍔', '🍕', '🌭', '🍟', '🥗', '🍳', '🥚', '🧆', '🍖', '🍗', '🥩', '🥓', '🐟', '🍣', '🍤', '🦐', '🦑', '🥧', '🫕', '🥐', '🥖', '🍞', '🫓', '🥯', '🧇', '🥞', '🧀', '🥫'],
  },
  {
    title: 'Sebze ve meyve',
    emojis: ['🥕', '🥒', '🍅', '🥔', '🍠', '🧅', '🧄', '🫑', '🌶️', '🥦', '🥬', '🫛', '🌽', '🍄', '🫘', '🥜', '🌰', '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍈', '🫒', '🥑'],
  },
  {
    title: 'Tatlı ve atıştırmalık',
    emojis: ['🍰', '🎂', '🧁', '🍮', '🍩', '🍪', '🍫', '🍬', '🍭', '🍯', '🍦', '🍨', '🍧', '🥮', '🍡', '🥨', '🍿', '🧈'],
  },
  {
    title: 'İçecekler',
    emojis: ['☕', '🫖', '🍵', '🧋', '🥤', '🧃', '🥛', '🍼', '🧉', '🍹', '🍸', '🍷', '🍺', '🥂', '🥃', '🧊', '💧', '🫗'],
  },
];

/**
 * Bottom sheet for choosing a food's emoji: the common food emojis in a grid, or any emoji
 * typed from the keyboard.
 */
export function EmojiPicker({ name, visible, onPick, onClose }: { name: string; visible: boolean; onPick: (emoji: string) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [typed, setTyped] = useState('');
  // six tiles to a row, filling the sheet's width edge to edge
  const [gridW, setGridW] = useState(0);
  const tile = gridW ? Math.floor((gridW - GAP * (COLS - 1)) / COLS) : 50;
  // keep only what isn't plain letters, digits or spaces: the emoji
  const emoji = typed.replace(/[\s0-9A-Za-zÇĞİÖŞÜçğıöşü.,!?'"()-]/g, '').slice(0, 8);

  const pick = (e: string) => {
    setTyped('');
    onPick(e);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: palette.paper }}>
        <Row style={{ justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <T v="title">Emoji seç</T>
            <T v="small" color={palette.inkSoft} numberOfLines={1}>
              {name}
            </T>
          </View>
          <Button title="Vazgeç" kind="plain" compact onPress={onClose} />
        </Row>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Row gap={10}>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              placeholder="Ya da klavyeden bir emoji yaz"
              placeholderTextColor={palette.inkFaint}
              style={[st.input, { flex: 1 }]}
              autoCorrect={false}
            />
            <Button title={emoji ? `${emoji} Seç` : 'Seç'} compact disabled={!emoji} onPress={() => pick(emoji)} />
          </Row>
          {GROUPS.map((g) => (
            <View key={g.title} style={{ gap: 8 }}>
              <T v="h3">{g.title}</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
                {g.emojis.map((e) => (
                  <Tap
                    key={e}
                    press="scale"
                    onPress={() => pick(e)}
                    accessibilityRole="button"
                    accessibilityLabel={e}
                    style={{ width: tile, height: tile, borderRadius: radius.md, backgroundColor: surface.card, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <T v="title" style={{ lineHeight: 34 }}>
                      {e}
                    </T>
                  </Tap>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
