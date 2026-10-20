import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Updates from 'expo-updates';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Card, ListGroup, ListRow, Row, Screen, T } from '../components/ui';
import { useApp } from '../lib/app-state';
import { applyBackup, lastAutoBackup, lastBackup, latestSnapshot, pickBackup, shareBackup } from '../lib/backup';
import { daysSince, relative } from '../lib/dates';
import { palette } from '../lib/theme';

/** Backups: where the records live, the automatic copies, and a manual file to keep elsewhere. */
export default function Backup() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [backupAt, setBackupAt] = useState<number | null>(null);
  const [autoAt, setAutoAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setBackupAt(await lastBackup(sql));
        setAutoAt(await lastAutoBackup(sql));
      })();
    }, [sql]),
  );

  const backup = async () => {
    setBusy(true);
    try {
      await shareBackup(sql);
      setBackupAt(await lastBackup(sql));
    } catch (e: any) {
      Alert.alert('Yedeklenemedi', e?.message ?? '');
    } finally {
      setBusy(false);
    }
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

  return (
    <Screen title="Yedekleme">
      <ListGroup>
        <ListRow
          icon="arrow.clockwise.icloud.fill"
          color={autoAt && daysSince(autoAt) < 3 ? palette.good : palette.inkSoft}
          title="Otomatik kopya"
          sub="Her gün uygulamanın içine, son 7 gün durur"
          value={autoAt ? relative(autoAt) : 'Henüz yok'}
        />
        <ListRow
          icon="doc.on.doc.fill"
          color={backupAt && daysSince(backupAt) < 30 ? palette.good : palette.warn}
          title="Elle yedek"
          sub="iCloud Drive ya da e-postaya ayrı bir kopya"
          value={backupAt ? relative(backupAt) : 'Hiç alınmadı'}
        />
      </ListGroup>

      <Row gap={8}>
        <Button title="Yedekle" icon="icloud.and.arrow.up" onPress={backup} loading={busy} style={{ flex: 1 }} />
        <Button title="Geri yükle" kind="glass" icon="icloud.and.arrow.down" onPress={restore} style={{ flex: 1 }} />
      </Row>

      <Card style={{ gap: 6 }}>
        <T v="h3">Kayıtların nerede?</T>
        <T v="small" color={palette.inkSoft}>
          Bu telefonda. iPhone’un iCloud Yedeklemesi açıksa her gece onunla birlikte yedeklenir; yeni telefonu bu yedekten kurunca hepsi geri gelir.
        </T>
        <View style={{ height: 1, backgroundColor: palette.hairline, marginVertical: 4 }} />
        <T v="small" color={palette.inkSoft}>
          Açık mı diye bakmak için: iPhone Ayarlar › adın › iCloud › iCloud Yedeklemesi.
        </T>
      </Card>
    </Screen>
  );
}
