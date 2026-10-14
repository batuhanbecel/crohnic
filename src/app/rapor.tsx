import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Mascot } from '../components/Mascot';
import { Button, Card, Row, Screen, Segmented, T } from '../components/ui';
import { useApp } from '../lib/app-state';
import { isoDay, now, startOfDay } from '../lib/dates';
import * as db from '../lib/db';
import { reportHtml, summarize, type ReportInput } from '../lib/report';
import { palette, size } from '../lib/theme';

type Range = '30' | '90';

export default function Report() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [range, setRange] = useState<Range>('30');
  const [input, setInput] = useState<ReportInput | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const to = startOfDay(now()) + 86400000;
    const from = to - Number(range) * 86400000;
    db.rangeData(sql, from, to).then((d) => setInput({ ...d, name: app.name, from, to }));
  }, [sql, range, app.name, app.dataVersion]);

  const s = input ? summarize(input) : null;

  const share = async () => {
    if (!input) return;
    setBusy(true);
    try {
      const { uri } = await Print.printToFileAsync({
        html: reportHtml(input),
        width: 595, // A4 at 72 dpi
        height: 842,
      });
      // a readable file name for the doctor's inbox
      let out = uri;
      try {
        const named = new File(Paths.cache, `Crohnic-rapor-${isoDay(now())}.pdf`);
        if (named.exists) named.delete();
        new File(uri).copySync(named);
        out = named.uri;
      } catch {
        out = uri;
      }
      await Sharing.shareAsync(out, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf', dialogTitle: 'Doktor raporu' });
    } catch (e: any) {
      Alert.alert('Rapor oluşturulamadı', e?.message ?? '');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen header={false}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
        <Mascot mood="rapor" size={88} />
        <T v="callout" style={{ flex: 1 }}>
          Kontrole hazır git. Tek sayfalık özetini PDF olarak hazırlarım, mail, WhatsApp ya da yazıcıyla paylaşırsın.
        </T>
      </Card>

      <Segmented
        value={range}
        onChange={setRange}
        items={[
          { key: '30', label: 'Son 30 gün' },
          { key: '90', label: 'Son 90 gün' },
        ]}
      />

      {s ? (
        <View style={{ gap: 8 }}>
          <Row gap={8}>
            <Stat label="Tuvalet / gün" value={s.perDay ? s.perDay.toFixed(1) : '–'} />
            <Stat label="Sulu" value={String(s.loose)} color={s.loose ? palette.bad : undefined} />
            <Stat label="Kanlı gün" value={String(s.bloodDays)} color={s.bloodDays ? palette.bad : undefined} />
          </Row>
          <Row gap={8}>
            <Stat label="Ağrı ort." value={s.painAvg != null ? `${s.painAvg.toFixed(1)}/5` : '–'} />
            <Stat label="Atak günü" value={String(s.flareDays)} color={s.flareDays ? palette.flare : undefined} />
            <Stat label="İlaç uyumu" value={s.adherence != null ? `%${Math.round(s.adherence * 100)}` : '–'} />
          </Row>
          <T v="small" color={palette.inkSoft} style={{ paddingHorizontal: 4 }}>
            {s.loggedDays} günde kayıt var. Raporda günlük seyir grafiği, Bristol dağılımı, semptomlar, ilaçlar, olası tetikleyiciler ve notların yer alır.
          </T>
        </View>
      ) : null}

      <Button title="PDF oluştur ve paylaş" icon="square.and.arrow.up" onPress={share} loading={busy} disabled={!input} />
      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', lineHeight: 17, fontWeight: '400' }}>
        Rapor telefonunda oluşturulur, bir yere gönderilmez.{'\n'}Paylaşacağın kişiyi sen seçersin.
      </T>
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Card style={{ flex: 1, minHeight: size.stat, padding: 12, justifyContent: 'space-between' }}>
      <T v="caption" color={palette.inkSoft} numberOfLines={1}>
        {label}
      </T>
      <T v="title" numberOfLines={1} adjustsFontSizeToFit color={color}>
        {value}
      </T>
    </Card>
  );
}
