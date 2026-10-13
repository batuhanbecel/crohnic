import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { Mascot, type Mood } from '../components/Mascot';
import { Button, Card, IconBubble, Row, Screen, Segmented, T, st, type SymbolName } from '../components/ui';
import { useApp } from '../lib/app-state';
import { applyBackup, pickBackup } from '../lib/backup';
import * as db from '../lib/db';
import type { Phase } from '../lib/foods';
import { askPermission, syncReminders } from '../lib/reminders';
import { palette, type } from '../lib/theme';

const POINTS: { icon: SymbolName; color: string; title: string; text: string }[] = [
  { icon: 'fork.knife', color: palette.lettuce, title: 'Ne yedin, nasıl geçti', text: 'Öğünlerini ve sonrasını yaz. Tuvalet ve semptomlar da tek dokunuş.' },
  { icon: 'camera.fill', color: palette.peri, title: 'Yemeden önce sor', text: 'Tabağın ya da menünün fotoğrafını çek, sana iyi gelir mi söyleyeyim.' },
  { icon: 'chart.bar.fill', color: palette.flare, title: 'Neyin dokunduğunu bul', text: 'Kayıtlar biriktikçe tetikleyicilerini çıkarırım, doktoruna rapor hazırlarım.' },
];

const STEPS = 3;

export default function Welcome() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<Phase>('remisyon');
  const [busy, setBusy] = useState(false);

  const finish = async (notify: boolean) => {
    setBusy(true);
    try {
      await app.saveName(name);
      await app.changePhase(phase);
      if (notify) await askPermission();
      await db.setSetting(sql, 'notif_prompt_seen', '1');
      await app.finishOnboarding();
      syncReminders(sql);
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    try {
      const picked = await pickBackup();
      if (!picked) return;
      await applyBackup(sql, picked.data);
      Alert.alert('Yedek yüklendi', `${picked.summary.meals} öğün ve diğer kayıtların geri geldi.`, [
        {
          text: 'Tamam',
          onPress: async () => {
            await app.finishOnboarding();
            if (Updates.isEnabled && !__DEV__) Updates.reloadAsync();
            else router.back();
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('Açılamadı', e?.message ?? '');
    }
  };

  const mood: Mood = step === 0 ? 'cheer' : step === 1 ? 'happy' : 'ok';

  return (
    <Screen tone={phase === 'atak' && step === 1 ? 'flare' : 'calm'} contentStyle={{ paddingTop: 24, gap: 16 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Mascot mood={mood} size={step === 0 ? 150 : 110} />
        <Row gap={6}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 4, backgroundColor: i === step ? palette.ink : palette.hairline }} />
          ))}
        </Row>
      </View>

      {step === 0 ? (
        <>
          <View style={{ gap: 6 }}>
            <T v="large" style={{ textAlign: 'center' }}>
              Selam, ben Kıvırcık
            </T>
            <T v="callout" color={palette.inkSoft} style={{ textAlign: 'center' }}>
              Crohn’la yemek yemeyi biraz daha kolay hale getirmeye çalışan bir marulum.
            </T>
          </View>
          <Card style={{ gap: 16 }}>
            {POINTS.map((p) => (
              <Row key={p.title} gap={12} style={{ alignItems: 'flex-start' }}>
                <IconBubble name={p.icon} color={p.color} dim={36} />
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="h3">{p.title}</T>
                  <T v="small" color={palette.inkSoft}>
                    {p.text}
                  </T>
                </View>
              </Row>
            ))}
          </Card>
          <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', fontWeight: '400', lineHeight: 17 }}>
            Kayıtların sadece bu telefonda durur. Crohnic tıbbi tavsiye vermez, tedavi kararlarını doktorunla al.
          </T>
          <Button title="Başlayalım" icon="arrow.right" onPress={() => setStep(1)} />
        </>
      ) : step === 1 ? (
        <>
          <T v="title" style={{ textAlign: 'center' }}>
            Seni tanıyayım
          </T>
          <Card style={{ gap: 10 }}>
            <T v="h3">Adın</T>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ana sayfada böyle selamlarım"
              placeholderTextColor={palette.inkFaint}
              style={st.input}
              returnKeyType="done"
            />
          </Card>
          <Card style={{ gap: 12 }}>
            <T v="h3">Şu an hangi dönemdesin?</T>
            <Segmented
              value={phase}
              onChange={setPhase}
              items={[
                { key: 'remisyon', label: 'Remisyon', color: palette.lettuceDeep, icon: 'leaf.fill' },
                { key: 'atak', label: 'Atak', color: palette.flare, icon: 'flame.fill' },
              ]}
            />
            <T v="small" color={palette.inkSoft}>
              {phase === 'atak'
                ? 'Atak döneminde önerilerim daha temkinli olur: püre, haşlama, az yağ.'
                : 'Remisyonda daha geniş bir listeyle çalışırım. Değişince ana sayfadan değiştirirsin.'}
            </T>
          </Card>
          <Button title="Devam" icon="arrow.right" onPress={() => setStep(2)} />
          <Button title="Eski telefonumdan yedeğim var" kind="plain" compact onPress={restore} />
        </>
      ) : (
        <>
          <T v="title" style={{ textAlign: 'center' }}>
            Hatırlatayım mı?
          </T>
          <Card style={{ gap: 14 }}>
            {[
              { icon: 'fork.knife' as SymbolName, c: palette.lettuce, t: 'Yedikten 3 saat sonra “nasıl geçti?”' },
              { icon: 'pills.fill' as SymbolName, c: palette.peri, t: 'İlaç saatinde, eklediğin ilaçlar için' },
              { icon: 'moon.stars.fill' as SymbolName, c: palette.flare, t: 'Akşam 21:30’da stres ve uyku' },
            ].map((x) => (
              <Row key={x.t} gap={12}>
                <IconBubble name={x.icon} color={x.c} dim={32} />
                <T v="callout" style={[{ flex: 1 }, type.medium]}>
                  {x.t}
                </T>
              </Row>
            ))}
            <T v="small" color={palette.inkSoft}>
              Gece 23 ile sabah 8 arası rahatsız etmem. Hepsini Ayarlar’dan kapatabilirsin.
            </T>
          </Card>
          <Button title="Bildirimlere izin ver" icon="bell.fill" color={palette.peri} onPress={() => finish(true)} loading={busy} />
          <Button title="Şimdilik geç" kind="plain" compact onPress={() => finish(false)} disabled={busy} />
        </>
      )}
    </Screen>
  );
}
