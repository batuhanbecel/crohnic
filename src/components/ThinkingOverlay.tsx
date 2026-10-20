import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Modal, StyleSheet, View } from 'react-native';
import type { Mode } from '../lib/ai';
import { isDark, palette, surface } from '../lib/theme';
import { Mascot } from './Mascot';
import { T, prefersReducedTransparency } from './ui';

const LINES: Record<Mode, string[]> = {
  meal: ['Tabağa bakıyorum', 'İçindekileri çıkarıyorum', 'Geçmiş kayıtlarınla karşılaştırıyorum'],
  menu: ['Menüyü okuyorum', 'Yemekleri tek tek ayırıyorum', 'Sana uygun olanları seçiyorum'],
  food: ['Bakıyorum', 'Kayıtlarına göz atıyorum'],
  recipe: ['Tarifi düşünüyorum', 'Dönemine ve ilaçlarına göre uyarlıyorum', 'Adımları sadeleştiriyorum'],
};

export function ThinkingOverlay({ mode }: { mode: Mode | null }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!mode) return;
    // the changing lines are visual only; VoiceOver hears once what's going on
    AccessibilityInfo.announceForAccessibility('Kıvırcık bakıyor, birkaç saniye sürer');
    const t = setInterval(() => setI((x) => x + 1), 2200);
    return () => clearInterval(t);
  }, [mode]);

  const lines = mode ? LINES[mode] : LINES.food;
  return (
    <Modal visible={!!mode} transparent animationType="fade">
      {/* Reduce Transparency: a solid page instead of the blur */}
      {prefersReducedTransparency() ? null : <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30, backgroundColor: prefersReducedTransparency() ? palette.paper : surface.scrim }}>
        <Mascot mood="arastirma" size={150} />
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
