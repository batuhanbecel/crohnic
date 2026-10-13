import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import type { Mode } from '../lib/ai';
import { palette } from '../lib/theme';
import { Mascot } from './Mascot';
import { T } from './ui';

const LINES: Record<Mode, string[]> = {
  meal: ['Tabağa bakıyorum', 'İçindekileri çıkarıyorum', 'Geçmiş kayıtlarınla karşılaştırıyorum'],
  menu: ['Menüyü okuyorum', 'Yemekleri tek tek ayırıyorum', 'Sana uygun olanları seçiyorum'],
  food: ['Bakıyorum', 'Kayıtlarına göz atıyorum'],
};

export function ThinkingOverlay({ mode }: { mode: Mode | null }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!mode) return;
    const t = setInterval(() => setI((x) => x + 1), 2200);
    return () => clearInterval(t);
  }, [mode]);

  const lines = mode ? LINES[mode] : LINES.food;
  return (
    <Modal visible={!!mode} transparent animationType="fade">
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30, backgroundColor: 'rgba(244,246,238,0.55)' }}>
        <Mascot mood="ok" size={140} />
        <T v="h2" style={{ textAlign: 'center' }}>
          {lines[i % lines.length]}…
        </T>
        <T v="small" color={palette.inkSoft}>
          Birkaç saniye sürer
        </T>
      </View>
    </Modal>
  );
}
