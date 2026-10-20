import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Updates from 'expo-updates';
import { useCallback, useState } from 'react';
import { Alert, DevSettings, Linking, Switch, View } from 'react-native';
import { TextInput } from '../components/text';
import { Logo } from '../components/Mascot';
import { Button, Card, Chip, Icon, Row, Screen, T, Tap, st } from '../components/ui';
import { DEFAULT_AI, analyze, type AiConfig } from '../lib/ai';
import { useApp } from '../lib/app-state';
import { applyBackup, lastAutoBackup, lastBackup, latestSnapshot, pickBackup, shareBackup } from '../lib/backup';
import { daysSince, relative } from '../lib/dates';
import * as db from '../lib/db';
import { SETTINGS, askPermission, isOn, permission, syncReminders, type PermissionState } from '../lib/reminders';
import { palette } from '../lib/theme';
import { hasLactose, hasStoma, hasStricture, setLactose, setStoma, setStricture } from '../lib/tolerance';
import { hasSystemActions } from '../lib/alarm';
import { wipeEverything } from '../lib/wipe';
import { MED_CLASSES, MED_ORDER, classesIn, namesIn } from '../lib/med-food';

const PRIVACY_URL = 'https://crohnic.vercel.app/gizlilik';

export default function Settings() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [name, setName] = useState(app.name);
  const [url, setUrl] = useState(app.ai?.url ?? '');
  const [token, setToken] = useState(app.ai?.token ?? '');
  const [testing, setTesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [perm, setPerm] = useState<PermissionState>('undetermined');
  const [remindMeals, setRemindMeals] = useState(true);
  const [remindDaily, setRemindDaily] = useState(true);
  const [remindWeekly, setRemindWeekly] = useState(true);
  const [remindWater, setRemindWater] = useState(true);
  const [backupAt, setBackupAt] = useState<number | null>(null);
  const [autoAt, setAutoAt] = useState<number | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [medNames, setMedNames] = useState<string[]>([]);
  // personal factors that change how foods are rated
  const [factors, setFactors] = useState({ stricture: hasStricture(), stoma: hasStoma(), lactose: hasLactose() });
  const SETTERS = { stricture: setStricture, stoma: setStoma, lactose: setLactose };
  const toggleFactor = async (key: keyof typeof factors, on: boolean) => {
    setFactors((f) => ({ ...f, [key]: on }));
    SETTERS[key](on);
    await db.setSetting(sql, key, on ? '1' : '0');
    await db.setSetting(sql, 'factors_seen', '1');
    app.bump();
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setPerm(await permission());
        setRemindMeals(await isOn(sql, SETTINGS.meals));
        setRemindDaily(await isOn(sql, SETTINGS.daily));
        setRemindWeekly(await isOn(sql, SETTINGS.weekly));
        setRemindWater(await isOn(sql, SETTINGS.water));
        setBackupAt(await lastBackup(sql));
        setAutoAt(await lastAutoBackup(sql));
        setMedNames((await db.listMeds(sql)).map((m) => m.name));
      })();
    }, [sql]),
  );

  const toggle = async (key: string, on: boolean, set: (v: boolean) => void) => {
    set(on);
    await db.setSetting(sql, key, on ? '1' : '0');
    if (on && perm !== 'granted') {
      const ok = await askPermission();
      setPerm(ok ? 'granted' : await permission());
      if (!ok && (await permission()) === 'denied') {
        Alert.alert('Bildirimler kapalı', 'iPhone Ayarlar > Crohnic > Bildirimler’den açabilirsin.', [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Ayarları aç', onPress: () => Linking.openSettings() },
        ]);
      }
    }
    syncReminders(sql);
  };

  const backup = async () => {
    setBackingUp(true);
    try {
      await shareBackup(sql);
      setBackupAt(await lastBackup(sql));
    } catch (e: any) {
      Alert.alert('Yedeklenemedi', e?.message ?? '');
    } finally {
      setBackingUp(false);
    }
  };

  const restore = async () => {
    const snap = await latestSnapshot();
    if (!snap) return restoreFrom(pickBackup);
    const when = snap.summary.exported_at ? new Date(snap.summary.exported_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : '';
    Alert.alert('Nereden geri yükleyeyim?', undefined, [
      { text: `Otomatik yedek (${when})`, onPress: () => restoreFrom(async () => snap) },
      { text: 'Dosya seç', onPress: () => restoreFrom(pickBackup) },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  };

  const restoreFrom = async (source: () => Promise<Awaited<ReturnType<typeof pickBackup>>>) => {
    try {
      const picked = await source();
      if (!picked) return;
      const { summary } = picked;
      const when = summary.exported_at ? new Date(summary.exported_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'tarihi bilinmeyen';
      Alert.alert(
        'Yedek yüklensin mi?',
        `${when} yedeği: ${summary.meals} öğün, ${summary.symptoms} semptom, ${summary.bowel} tuvalet, ${summary.meds} ilaç. Bu telefondaki mevcut kayıtların yerini alacak.`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Yükle',
            style: 'destructive',
            onPress: async () => {
              try {
                await applyBackup(sql, picked.data);
                Alert.alert('Yedek yüklendi', 'Uygulama yeniden başlayacak.', [
                  { text: 'Tamam', onPress: () => (Updates.isEnabled && !__DEV__ ? Updates.reloadAsync() : app.bump()) },
                ]);
              } catch (e: any) {
                Alert.alert('Yüklenemedi', e?.message ?? '');
              }
            },
          },
        ],
      );
    } catch (e: any) {
      Alert.alert('Açılamadı', e?.message ?? '');
    }
  };

  const aiReady = !!DEFAULT_AI || !!app.ai?.url;
  const [advanced, setAdvanced] = useState(!aiReady);

  const saveAi = async () => {
    await app.saveAi(url.trim() ? { url, token } : null);
    Alert.alert('Kaydedildi');
  };

  const test = async (cfg: AiConfig) => {
    if (!cfg.url) return;
    setTesting(true);
    try {
      const r = await analyze(cfg, { mode: 'food', foodName: 'Haşlanmış yumurta', phase: 'remisyon', history: {} });
      if (!DEFAULT_AI) await app.saveAi(cfg);
      Alert.alert('Bağlantı çalışıyor', r.kind === 'meal' ? r.headline || r.dish : undefined);
    } catch (e: any) {
      Alert.alert('Bağlanamadım', e?.message ?? '');
    } finally {
      setTesting(false);
    }
  };

  const [wiping, setWiping] = useState(false);
  // a fresh start: everything on this phone goes, then the app opens to the intro again
  const wipe = () =>
    Alert.alert(
      'Tüm verilerin silinsin mi?',
      'Öğünler, tuvalet ve semptom kayıtları, ilaçlar, tahliller, dönemler, fotoğraflar ve otomatik yedekler bu telefondan silinir. Geri alınamaz. Dışarı aktardığın yedek dosyaları yerinde kalır; istersen önce yedek al.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hepsini sil',
          style: 'destructive',
          onPress: async () => {
            setWiping(true);
            try {
              await wipeEverything(sql);
            } finally {
              setWiping(false);
            }
            if (__DEV__ || !Updates.isEnabled) DevSettings.reload();
            else Updates.reloadAsync().catch(() => DevSettings.reload());
          },
        },
      ],
    );

  const checkUpdate = async () => {
    if (__DEV__ || !Updates.isEnabled) {
      Alert.alert('Geliştirme modundasın', 'Güncellemeler TestFlight sürümünde otomatik gelir.');
      return;
    }
    setChecking(true);
    try {
      const r = await Updates.checkForUpdateAsync();
      if (!r.isAvailable) {
        Alert.alert('Güncelsin');
        return;
      }
      await Updates.fetchUpdateAsync();
      Alert.alert('Yeni sürüm indi', 'Uygulama yeniden başlayacak.', [{ text: 'Tamam', onPress: () => Updates.reloadAsync() }]);
    } catch (e: any) {
      Alert.alert('Kontrol edilemedi', e?.message ?? '');
    } finally {
      setChecking(false);
    }
  };


  return (
    <Screen title="Ayarlar">
      <Card style={{ gap: 4, paddingVertical: 6 }}>
        <LinkRow icon="pills.fill" title="İlaçlarım" onPress={() => router.push('/ilaclar')} />
        <View style={{ height: 1, backgroundColor: palette.hairline }} />
        <LinkRow icon="doc.text.fill" title="Doktor raporu (PDF)" onPress={() => router.push('/rapor')} />
        <View style={{ height: 1, backgroundColor: palette.hairline }} />
        <LinkRow icon="testtube.2" title="Tahliller ve kilo" onPress={() => router.push('/tahliller')} />
        <View style={{ height: 1, backgroundColor: palette.hairline }} />
        <LinkRow icon="calendar.badge.clock" title="Kontrol takvimi" onPress={() => router.push('/kontroller')} />
        <View style={{ height: 1, backgroundColor: palette.hairline }} />
        <LinkRow icon="calendar" title="Haftalık özet" onPress={() => router.push('/hafta')} />
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="h3">Adın</T>
        <TextInput
          value={name}
          onChangeText={setName}
          onEndEditing={() => app.saveName(name)}
          returnKeyType="done"
          placeholder="Ana sayfada böyle selamlarım"
          // iOS suggests the owner's first name from their contact card above the keyboard
          textContentType="givenName"
          autoComplete="name-given"
          autoCapitalize="words"
          autoCorrect={false}
          placeholderTextColor={palette.inkFaint}
          style={st.input}
        />
      </Card>


      <Card style={{ gap: 14 }}>
        <View style={{ gap: 2 }}>
          <T v="h3">Sana özel durumlar</T>
          <T v="small" color={palette.inkSoft}>
            Yemek değerlendirmeleri bunlara göre değişir. Doktorunun söylediklerini aç.
          </T>
        </View>
        {(
          [
            { key: 'stricture', title: 'Bağırsakta darlık (striktür) var', text: 'Remisyonda da lifli, kabuklu, çekirdekli ve posalı yiyecekleri temkinli değerlendiririm.' },
            { key: 'stoma', title: 'Stoman (ileostomi) var', text: 'Tıkanma riskine karşı lifli ve posalı yiyecekleri temkinli değerlendiririm.' },
            { key: 'lactose', title: 'Laktoz intoleransım var', text: 'Süt, krema ve sütlü tatlıları daha riskli sayarım. Yoğurt, kefir ve eski peynirler genelde daha iyi tolere edilir.' },
          ] as const
        ).map((x) => (
          <Row key={x.key} style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T v="callout">{x.title}</T>
              <T v="small" color={palette.inkSoft}>
                {x.text}
              </T>
            </View>
            <Switch value={factors[x.key]} onValueChange={(on) => toggleFactor(x.key, on)} trackColor={{ true: palette.lettuce }} accessibilityLabel={x.title} />
          </Row>
        ))}
        <View style={{ height: 1, backgroundColor: palette.hairline }} />
        <MedFactors on={app.medFactors} names={medNames} onToggle={app.setMedFactor} />
      </Card>

      <Card style={{ gap: 14 }}>
        <T v="h3">Hatırlatmalar</T>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T v="callout">Öğünden sonra sor</T>
            <T v="small" color={palette.inkSoft}>
              Yedikten 3 saat sonra nasıl geçti diye sorar
            </T>
          </View>
          <Switch value={remindMeals && perm === 'granted'} onValueChange={(v) => toggle(SETTINGS.meals, v, setRemindMeals)} trackColor={{ true: palette.lettuce }} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T v="callout">Akşam kontrolü</T>
            <T v="small" color={palette.inkSoft}>
              21:30’da stres ve uykunu sorar
            </T>
          </View>
          <Switch value={remindDaily && perm === 'granted'} onValueChange={(v) => toggle(SETTINGS.daily, v, setRemindDaily)} trackColor={{ true: palette.lettuce }} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T v="callout">Pazar özeti</T>
            <T v="small" color={palette.inkSoft}>
              Pazar 20:00’de haftanın özeti ve aktivite skoru
            </T>
          </View>
          <Switch value={remindWeekly && perm === 'granted'} onValueChange={(v) => toggle(SETTINGS.weekly, v, setRemindWeekly)} trackColor={{ true: palette.lettuce }} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T v="callout">Su hatırlatması</T>
            <T v="small" color={palette.inkSoft}>
              Sulu dışkı sık olduğu günlerde su içmeyi hatırlatır
            </T>
          </View>
          <Switch value={remindWater && perm === 'granted'} onValueChange={(v) => toggle(SETTINGS.water, v, setRemindWater)} trackColor={{ true: palette.lettuce }} />
        </Row>
        <T v="caption" color={palette.inkFaint} style={{ fontWeight: '400' }}>
          {perm === 'denied'
            ? 'Bildirim izni kapalı. iPhone Ayarlar > Crohnic > Bildirimler’den açabilirsin.'
            : 'İlaç hatırlatmaları (alarm ya da bildirim) her ilacın kendi ayarında.'}
        </T>
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="h3">Yedek</T>
        <T v="small" color={palette.inkSoft}>
          Kayıtların ve fotoğrafların bu telefonda durur ve iPhone’un iCloud Yedeklemesi açıksa her gece otomatik yedeklenir. Yeni telefonu bu yedekten kurunca hepsi geri gelir. Açık mı diye bakmak için: Ayarlar › adın › iCloud › iCloud Yedeklemesi.{'\n\n'}Ayrıca her gün uygulamanın içine otomatik bir kopya alırım, son 7 gün durur. Elle yedek ise başka bir yere (iCloud Drive, e-posta) ayrı bir kopya koymak içindir.
        </T>
        <T v="small" color={autoAt && daysSince(autoAt) < 3 ? palette.good : palette.inkSoft}>
          {autoAt ? `Son otomatik kopya: ${relative(autoAt)}` : 'Otomatik kopya ilk kayıttan sonra başlar'}
        </T>
        <T v="small" color={backupAt && daysSince(backupAt) < 30 ? palette.good : palette.warn}>
          {backupAt ? `Son elle yedek: ${relative(backupAt)}` : 'Henüz elle yedek almadın'}
        </T>
        <Row gap={8}>
          <Button title="Yedekle" icon="icloud.and.arrow.up" onPress={backup} loading={backingUp} style={{ flex: 1 }} />
          <Button title="Geri yükle" kind="glass" icon="icloud.and.arrow.down" onPress={restore} style={{ flex: 1 }} />
        </Row>
      </Card>

      <Card style={{ gap: 12 }}>
        <Tap onPress={() => setAdvanced(!advanced)} accessibilityRole="button" accessibilityState={{ expanded: advanced }}>
          <Row gap={10}>
            <Icon name="camera.viewfinder" size={18} color={palette.lettuceDeep} fallback="📷" />
            <View style={{ flex: 1 }}>
              <T v="h3">Fotoğraf analizi</T>
              <T v="small" color={aiReady ? palette.good : palette.warn}>
                {aiReady ? 'Bağlı, ayar gerekmiyor' : 'Kurulmadı'}
              </T>
            </View>
            <Icon name={advanced ? 'chevron.up' : 'chevron.down'} size={13} color={palette.inkFaint} fallback={advanced ? '˄' : '˅'} />
          </Row>
        </Tap>
        {!advanced ? null : DEFAULT_AI ? (
          <View style={{ gap: 10 }}>
            <T v="small" color={palette.inkSoft}>
              Sunucu uygulamaya gömülü, ayar gerekmiyor. Çalıştığını görmek için test edebilirsin.
            </T>
            <Button title="Bağlantıyı test et" kind="glass" icon="bolt.fill" onPress={() => test(DEFAULT_AI!)} loading={testing} />
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <T v="small" color={palette.inkSoft}>
              Bu sürümde sunucu gömülü değil. Adres ve şifreyi elle gir.
            </T>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://crohnic.vercel.app"
              placeholderTextColor={palette.inkFaint}
              style={st.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TextInput
              value={token}
              onChangeText={setToken}
              placeholder="Sunucu şifresi (APP_TOKEN)"
              placeholderTextColor={palette.inkFaint}
              style={st.input}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <Row gap={8}>
              <Button title="Kaydet" icon="checkmark" compact style={{ flex: 1 }} onPress={saveAi} />
              <Button title="Test et" kind="glass" compact icon="bolt.fill" style={{ flex: 1 }} onPress={() => test({ url: url.trim(), token: token.trim() })} loading={testing} disabled={!url.trim()} />
            </Row>
          </View>
        )}
      </Card>

      {hasSystemActions() ? (
        <Card style={{ gap: 10 }}>
          <T v="h3">Siri ve kısayollar</T>
          <T v="small" color={palette.inkSoft}>
            Uygulamayı açmadan kayda başla. Siri’ye söyle ya da Kestirmeler’den, Spotlight’tan veya Eylem düğmesinden çalıştır:
          </T>
          {['Crohnic tuvalet kaydet', 'Crohnic öğün ekle', 'Crohnic semptom kaydet', 'Crohnic bugün ne yesem', 'Crohnic doktor raporu'].map((p) => (
            <Row key={p} gap={10}>
              <Icon name="waveform" size={14} color={palette.lettuceDeep} fallback="🎙️" />
              <T v="callout" style={{ flex: 1 }}>{`“${p}”`}</T>
            </Row>
          ))}
          <T v="small" color={palette.inkSoft}>
            Denetim Merkezi ya da kilit ekranı için: Denetim Merkezi’ni aç, sol üstteki + ile “Kontrol ekle”ye dokun ve Crohnic’i seç. Tuvalet, öğün, semptom, ilaç ve “Bunu yesem mi?” düğmeleri var.
          </T>
        </Card>
      ) : null}

      <Card style={{ gap: 10 }}>
        <T v="h3">Gizlilik ve verilerin</T>
        <T v="small" color={palette.inkSoft}>
          Hesap, reklam ya da takip yok. Kayıtların yalnızca bu telefonda durur. Fotoğraf analizi kullandığında sadece o fotoğraf ve değerlendirme için gereken bilgiler sunucuya gider, saklanmaz.
        </T>
        <Tap onPress={() => Linking.openURL(PRIVACY_URL)} accessibilityRole="link">
          <Row gap={12} style={{ paddingVertical: 6 }}>
            <Icon name="hand.raised.fill" color={palette.lettuceDeep} fallback="🛡️" />
            <T v="callout" style={{ flex: 1 }}>
              Gizlilik politikası
            </T>
            <Icon name="arrow.up.right" size={13} color={palette.inkFaint} fallback="↗" />
          </Row>
        </Tap>
        <Button title="Tüm verilerimi sil" kind="danger" icon="trash" onPress={wipe} loading={wiping} />
      </Card>

      <Card style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h3">Sürüm</T>
          <T v="small" color={palette.inkSoft}>
            {Constants.expoConfig?.version ?? '1.0.0'}
            {Updates.updateId ? ` · ${Updates.updateId.slice(0, 7)}` : ''}
          </T>
        </Row>
        <Button title="Güncelleme var mı?" kind="glass" icon="arrow.down.circle" onPress={checkUpdate} loading={checking} />
      </Card>

      <View style={{ alignItems: 'center', marginTop: 12 }}>
        <Logo size={30} tagline />
      </View>
      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', lineHeight: 17, fontWeight: '400' }}>
        Crohnic tıbbi tavsiye vermez. Acil durumda 112.
      </T>
    </Screen>
  );
}

function LinkRow({ icon, title, onPress }: { icon: 'pills.fill' | 'doc.text.fill' | 'testtube.2' | 'calendar.badge.clock' | 'calendar'; title: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress}>
      <Row gap={12} style={{ paddingVertical: 10 }}>
        <Icon name={icon} color={icon === 'pills.fill' ? palette.peri : palette.sky} />
        <T v="callout" style={{ flex: 1 }}>
          {title}
        </T>
        <Icon name="chevron.right" size={14} color={palette.inkFaint} fallback="›" />
      </Row>
    </Tap>
  );
}

/**
 * "Şu an kullandığım ilaçlar": the medicine groups foods are rated with. Switched on by the user,
 * not taken from İlaçlarım, because cortisone is usually for weeks, not for life.
 */
function MedFactors({ on, names, onToggle }: { on: string[]; names: string[]; onToggle: (cls: (typeof MED_ORDER)[number], on: boolean) => void }) {
  const inList = classesIn(names).filter((c) => !on.includes(c));
  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 2 }}>
        <T v="callout" style={{ fontWeight: '600' }}>
          Şu an kullandığım ilaçlar
        </T>
        <T v="small" color={palette.inkSoft}>
          Seçtiklerine göre yemekleri değerlendiririm. İlacı bırakınca kapat, uyarıları da kalkar.
        </T>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {MED_ORDER.map((cls) => {
          const active = on.includes(cls);
          return <Chip key={cls} label={MED_CLASSES[cls].label} active={active} color={palette.peri} onPress={() => onToggle(cls, !active)} />;
        })}
      </View>
      {MED_ORDER.filter((c) => on.includes(c)).map((cls) => {
        const mine = namesIn(cls, names);
        return (
          <View key={cls} style={{ gap: 1 }}>
            <T v="small" style={{ fontWeight: '700' }}>
              {`${MED_CLASSES[cls].label}${mine.length ? ` (${[...new Set(mine)].join(', ')})` : ''}`}
            </T>
            <T v="small" color={palette.inkSoft}>
              {MED_CLASSES[cls].effect}
            </T>
          </View>
        );
      })}
      {inList.length ? (
        <T v="small" color={palette.inkSoft}>
          {`İlaçlarında ${inList.map((c) => `${namesIn(c, names)[0]} (${MED_CLASSES[c].label.toLocaleLowerCase('tr-TR')})`).join(', ')} var ama seçili değil. Şu an kullanıyorsan seç.`}
        </T>
      ) : null}
      <T v="caption" color={palette.inkFaint} style={{ fontWeight: '400' }}>
        {`Örnekler: ${MED_ORDER.slice(0, 4).map((c) => `${MED_CLASSES[c].label}: ${MED_CLASSES[c].examples}`).join(' · ')}`}
      </T>
    </View>
  );
}
