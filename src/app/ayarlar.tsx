import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Updates from 'expo-updates';
import { useCallback, useState } from 'react';
import { Alert, DevSettings, Linking, View } from 'react-native';
import { Logo } from '../components/Mascot';
import { TextInput } from '../components/text';
import { Card, IconBubble, ListGroup, ListRow, Row, Screen, T } from '../components/ui';
import { DEFAULT_AI } from '../lib/ai';
import { hasSystemActions } from '../lib/alarm';
import { useApp } from '../lib/app-state';
import { lastAutoBackup, lastBackup } from '../lib/backup';
import { dueText } from '../lib/checkups';
import { daysSince, relative } from '../lib/dates';
import * as db from '../lib/db';
import { MED_CLASSES, MED_ORDER } from '../lib/med-food';
import { SETTINGS, isOn, permission } from '../lib/reminders';
import { palette } from '../lib/theme';
import { hasLactose, hasStoma, hasStricture } from '../lib/tolerance';
import { wipeEverything } from '../lib/wipe';

const PRIVACY_URL = 'https://crohnic.vercel.app/gizlilik';

/** Ayarlar: a short grouped list; every topic opens its own page. */
export default function Settings() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [name, setName] = useState(app.name);
  const [meds, setMeds] = useState<number | null>(null);
  const [nextCheckup, setNextCheckup] = useState<string | null>(null);
  const [notif, setNotif] = useState<string | null>(null);
  const [backup, setBackup] = useState<{ text: string; stale: boolean } | null>(null);
  const [checking, setChecking] = useState(false);
  const [wiping, setWiping] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setMeds((await db.listMeds(sql)).length);
        const open = (await db.listCheckups(sql)).find((c) => !c.done_at);
        setNextCheckup(open ? dueText(open, Date.now()) : null);
        const perm = await permission();
        if (perm !== 'granted') setNotif('Kapalı');
        else {
          const keys = [SETTINGS.meals, SETTINGS.daily, SETTINGS.weekly, SETTINGS.water];
          const on = (await Promise.all(keys.map((k) => isOn(sql, k)))).filter(Boolean).length;
          setNotif(on === keys.length ? 'Açık' : on ? `${on}/${keys.length} açık` : 'Kapalı');
        }
        const manual = await lastBackup(sql);
        const auto = await lastAutoBackup(sql);
        const last = Math.max(manual ?? 0, auto ?? 0);
        setBackup(last ? { text: relative(last), stale: daysSince(last) > 3 } : { text: 'Hiç alınmadı', stale: true });
      })();
    }, [sql]),
  );

  // what's switched on in "Sana özel durumlar", as one short line
  const special = [
    ...(hasStricture() ? ['Darlık'] : []),
    ...(hasStoma() ? ['Stoma'] : []),
    ...(hasLactose() ? ['Laktoz'] : []),
    ...MED_ORDER.filter((c) => app.medFactors.includes(c)).map((c) => MED_CLASSES[c].label),
  ];

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

  const version = `${Constants.expoConfig?.version ?? '1.0.0'}${Updates.updateId ? ` · ${Updates.updateId.slice(0, 7)}` : ''}`;
  const aiReady = !!DEFAULT_AI || !!app.ai?.url;

  return (
    <Screen title="Ayarlar">
      <Card style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
        <Row gap={12}>
          <IconBubble name="person.fill" color={palette.lettuceDeep} dim={32} />
          <View style={{ flex: 1, gap: 1 }}>
            <T v="caption" color={palette.inkSoft} style={{ fontWeight: '600' }}>
              Adın
            </T>
            <TextInput
              value={name}
              onChangeText={setName}
              onEndEditing={() => app.saveName(name)}
              onBlur={() => app.saveName(name)}
              returnKeyType="done"
              placeholder="Ana sayfada böyle selamlarım"
              // iOS suggests the owner's first name from their contact card above the keyboard
              textContentType="givenName"
              autoComplete="name-given"
              autoCapitalize="words"
              autoCorrect={false}
              placeholderTextColor={palette.inkFaint}
              accessibilityLabel="Adın"
              style={{ fontSize: 17, fontFamily: 'Nunito_700Bold', color: palette.ink, paddingVertical: 2 }}
            />
          </View>
        </Row>
      </Card>

      <ListGroup title="Sağlık">
        <ListRow icon="pills.fill" color={palette.peri} title="İlaçlarım" value={meds ? `${meds} ilaç` : undefined} onPress={() => router.push('/ilaclar')} />
        <ListRow
          icon="slider.horizontal.3"
          color={palette.plum}
          title="Sana özel durumlar"
          value={special.length ? special.join(', ') : 'Yok'}
          onPress={() => router.push('/durumlar')}
        />
        <ListRow icon="calendar.badge.clock" color={palette.plum} title="Kontrol takvimi" value={nextCheckup ?? undefined} onPress={() => router.push('/kontroller')} />
        <ListRow icon="testtube.2" color={palette.apricot} title="Tahliller ve kilo" onPress={() => router.push('/tahliller')} />
      </ListGroup>

      <ListGroup title="Raporlar">
        <ListRow icon="doc.text.fill" color={palette.lettuceDeep} title="Doktor raporu" sub="PDF olarak paylaş" onPress={() => router.push('/rapor')} />
        <ListRow icon="calendar" color={palette.lettuceDeep} title="Haftalık özet" onPress={() => router.push('/hafta')} />
      </ListGroup>

      <ListGroup title="Uygulama">
        <ListRow icon="bell.fill" color={palette.warn} title="Bildirimler" value={notif ?? undefined} onPress={() => router.push('/bildirimler')} />
        <ListRow
          icon="icloud.fill"
          color={backup?.stale ? palette.warn : palette.water}
          title="Yedekleme"
          value={backup?.text}
          onPress={() => router.push('/yedek')}
        />
        <ListRow icon="camera.viewfinder" color={palette.lettuceDeep} title="Fotoğraf analizi" value={aiReady ? 'Bağlı' : 'Kurulmadı'} onPress={() => router.push('/baglanti')} />
        {hasSystemActions() ? <ListRow icon="waveform" color={palette.plum} title="Siri ve kısayollar" onPress={() => router.push('/kisayollar')} /> : null}
      </ListGroup>

      <ListGroup title="Gizlilik" footer="Hesap, reklam ya da takip yok. Kayıtların yalnızca bu telefonda durur.">
        <ListRow icon="hand.raised.fill" color={palette.lettuceDeep} title="Gizlilik politikası" external onPress={() => Linking.openURL(PRIVACY_URL)} />
        <ListRow icon="trash.fill" title={wiping ? 'Siliniyor…' : 'Tüm verilerimi sil'} destructive onPress={wiping ? undefined : wipe} />
      </ListGroup>

      <ListGroup title="Hakkında">
        <ListRow icon="info.circle.fill" color={palette.inkSoft} title="Sürüm" value={version} />
        <ListRow
          icon="arrow.down.circle.fill"
          color={palette.lettuceDeep}
          title="Güncelleme var mı?"
          value={checking ? 'Bakılıyor…' : undefined}
          onPress={checking ? undefined : checkUpdate}
        />
      </ListGroup>

      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Logo size={30} tagline />
      </View>
      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', lineHeight: 17, fontWeight: '400' }}>
        Crohnic tıbbi tavsiye vermez. Acil durumda 112.
      </T>
    </Screen>
  );
}
