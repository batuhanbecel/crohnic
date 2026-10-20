import { ListGroup, ListRow, Screen, T } from '../components/ui';
import { palette } from '../lib/theme';

const PHRASES = ['Crohnic tuvalet kaydet', 'Crohnic öğün ekle', 'Crohnic semptom kaydet', 'Crohnic bugün ne yesem', 'Crohnic doktor raporu'];

/** Siri, Shortcuts and Control Center: what to say and where to add it. */
export default function Shortcuts() {
  return (
    <Screen title="Siri ve kısayollar">
      <T v="callout" color={palette.inkSoft}>
        Uygulamayı açmadan kayda başla. Siri’ye söyle ya da Kestirmeler’den, Spotlight’tan veya Eylem düğmesinden çalıştır.
      </T>
      <ListGroup title="Siri’ye söyle">
        {PHRASES.map((p) => (
          <ListRow key={p} icon="waveform" title={`“${p}”`} />
        ))}
      </ListGroup>
      <ListGroup title="Denetim Merkezi ve kilit ekranı" footer="Denetim Merkezi’ni aç, sol üstteki + ile “Kontrol ekle”ye dokun ve Crohnic’i seç.">
        <ListRow icon="switch.2" title="Tuvalet, öğün, semptom, ilaç" sub="ve “Bunu yesem mi?” düğmeleri" />
      </ListGroup>
    </Screen>
  );
}
