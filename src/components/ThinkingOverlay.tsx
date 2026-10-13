import { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import type { Mode } from '../lib/ai';
import { colors } from '../lib/theme';
import { Mascot } from './Mascot';
import { T } from './ui';

const LINES: Record<Mode, string[]> = {
  meal: ['Tabağa bakıyorum…', 'Malzemeleri tek tek kokluyorum…', 'Geçmiş kayıtlarına göz atıyorum…', 'Bağırsaklarla toplantıdayım…'],
  menu: ['Menüyü okuyorum…', 'Garsonla pazarlık ediyorum…', 'Sana uygun olanları ayıklıyorum…', 'Neredeyse bitti…'],
  food: ['Düşünüyorum…', 'Notlarıma bakıyorum…', 'Bağırsaklara soruyorum…'],
};

export function ThinkingOverlay({ mode }: { mode: Mode | null }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!mode) return;
    const t = setInterval(() => setI((x) => x + 1), 1800);
    return () => clearInterval(t);
  }, [mode]);

  const lines = mode ? LINES[mode] : LINES.food;
  return (
    <Modal visible={!!mode} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(255,247,239,0.94)', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 30 }}>
        <Mascot mood="ok" size={150} />
        <T v="h2" style={{ textAlign: 'center' }}>
          {lines[i % lines.length]}
        </T>
        <T v="small" color={colors.inkSoft}>
          Birkaç saniye sürebilir
        </T>
      </View>
    </Modal>
  );
}
