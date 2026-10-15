import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { TextInput } from '../components/text';
import { Logo, Mascot, type Mood } from '../components/Mascot';
import { Button, Card, IconBubble, Row, Screen, Segmented, T, st, type SymbolName } from '../components/ui';
import { useApp } from '../lib/app-state';
import { applyBackup, pickBackup } from '../lib/backup';
import * as db from '../lib/db';
import type { Phase } from '../lib/foods';
import { askPermission, syncReminders } from '../lib/reminders';
import { setLactose, setStoma, setStricture } from '../lib/tolerance';
import { palette, type } from '../lib/theme';

const POINTS: { icon: SymbolName; color: string; title: string; text: string }[] = [
  { icon: 'camera.fill', color: palette.good, title: 'Bunu yesem mi?', text: 'Tabağın ya da menünün fotoğrafını çek, sor. Daha güvenle seç.' },
  { icon: 'fork.knife', color: palette.flareDeep, title: 'Yediklerini kolayca kaydet', text: 'Öğün, tuvalet, semptom ve ilaç, her biri birkaç dokunuş.' },
  { icon: 'chart.bar.fill', color: palette.plum, title: 'Neyin iyi geldiğini birlikte bulalım', text: 'Kayıtlar biriktikçe örüntüleri çıkarırım, kontrole hazır gidersin.' },
];

const STEPS = 4;

const FACTORS = [
  { key: 'stricture', title: 'Bağırsakta darlık (striktür)', text: 'Lifli, kabuklu ve çekirdekli yiyecekleri hep temkinli değerlendiririm.' },
  { key: 'stoma', title: 'Stoma (ileostomi)', text: 'Tıkanma riskine karşı posalı yiyeceklerde dikkatli olurum.' },
  { key: 'lactose', title: 'Laktoz intoleransı', text: 'Süt ve sütlü tatlıları daha riskli sayarım, yoğurt ve kefir genelde sorun olmaz.' },
] as const;
type FactorKey = (typeof FACTORS)[number]['key'];

export default function Welcome() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<Phase>('remisyon');
  const [busy, setBusy] = useState(false);
  const [factors, setFactors] = useState<Record<FactorKey, boolean>>({ stricture: false, stoma: false, lactose: false });

  const finish = async (notify: boolean) => {
    setBusy(true);
    try {
      await app.saveName(name);
      await app.changePhase(phase);
      setStricture(factors.stricture);
      setStoma(factors.stoma);
      setLactose(factors.lactose);
      for (const f of FACTORS) await db.setSetting(sql, f.key, factors[f.key] ? '1' : '0');
      await db.setSetting(sql, 'factors_seen', '1');
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

  const mood: Mood = step === 0 ? 'merhaba' : step === 1 ? 'mutlu' : step === 2 ? 'doktor' : 'kayit';

  return (
    <Screen tone={phase === 'atak' && step === 1 ? 'flare' : 'calm'} contentStyle={{ paddingTop: 24, gap: 16 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        {step === 0 ? <Logo size={40} tagline /> : null}
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
              Merhaba, ben Kıvırcık!
            </T>
            <T v="callout" color={palette.inkSoft} style={{ textAlign: 'center' }}>
              Yemek seçerken, günlük kayıt tutarken ve bağırsağını daha iyi tanırken her zaman yanındayım.
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
              // iOS suggests the owner's first name from their contact card above the keyboard
              textContentType="givenName"
              autoComplete="name-given"
              autoCapitalize="words"
              autoCorrect={false}
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
      ) : step === 2 ? (
        <>
          <View style={{ gap: 6 }}>
            <T v="title" style={{ textAlign: 'center' }}>
              Bunlardan biri var mı?
            </T>
            <T v="callout" color={palette.inkSoft} style={{ textAlign: 'center' }}>
              Yemekleri sana göre değerlendirmem için. Emin değilsen kapalı bırak, sonra Ayarlar’dan açarsın.
            </T>
          </View>
          <Card style={{ gap: 16 }}>
            {FACTORS.map((f) => (
              <Row key={f.key} gap={12}>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="h3">{f.title}</T>
                  <T v="small" color={palette.inkSoft}>
                    {f.text}
                  </T>
                </View>
                <Switch
                  value={factors[f.key]}
                  onValueChange={(on) => setFactors((x) => ({ ...x, [f.key]: on }))}
                  trackColor={{ true: palette.lettuce }}
                  accessibilityLabel={f.title}
                />
              </Row>
            ))}
          </Card>
          <Button title="Devam" icon="arrow.right" onPress={() => setStep(3)} />
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
              { icon: 'moon.stars.fill' as SymbolName, c: palette.plum, t: 'Akşam 21:30’da stres ve uyku' },
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
          <Button title="Bildirimlere izin ver" icon="bell.fill" onPress={() => finish(true)} loading={busy} />
          <Button title="Şimdilik geç" kind="plain" compact onPress={() => finish(false)} disabled={busy} />
        </>
      )}
    </Screen>
  );
}
