import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { Mascot } from '../components/Mascot';
import { Text } from '../components/text';
import { Button, Card, Chip, Icon, Row, Screen, SectionTitle, T, Tap } from '../components/ui';
import { useApp } from '../lib/app-state';
import { KINDS, daysUntil, dueText, kindOf, repeatLabel } from '../lib/checkups';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { syncReminders } from '../lib/reminders';
import { palette, surface } from '../lib/theme';

/** Starting points for an empty calendar; one tap opens the form already filled in. */
const STARTERS = ['randevu', 'kan', 'kalprotektin', 'asi'];

export default function Checkups() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [list, setList] = useState<db.Checkup[]>([]);
  const [at, setAt] = useState(0);

  const load = useCallback(async () => {
    setList(await db.listCheckups(sql));
    setAt(now());
  }, [sql]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, app.dataVersion]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const upcoming = list.filter((c) => !c.done_at);
  const past = list.filter((c) => c.done_at).sort((a, b) => (b.done_at ?? 0) - (a.done_at ?? 0)).slice(0, 10);

  const done = (c: db.Checkup) =>
    Alert.alert(`${c.title} yapıldı mı?`, c.every_days ? `Bir sonrakini ${repeatLabel(c.every_days).toLocaleLowerCase('tr')} için kurarım.` : undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Yapıldı',
        onPress: async () => {
          await db.completeCheckup(sql, c.id);
          await syncReminders(sql);
          app.bump();
          await load();
          if (kindOf(c.kind).after === 'labs') {
            Alert.alert('Sonuçlar çıkınca', 'Değerleri Tahliller’e girersen raporda ve grafikte görünür.', [
              { text: 'Sonra', style: 'cancel' },
              { text: 'Tahliller', onPress: () => router.push('/tahliller') },
            ]);
          }
        },
      },
    ]);

  return (
    <Screen title="Kontrol takvimi">
      <Row gap={4}>
        <Mascot mood="arastirma" size={64} />
        <T v="callout" color={palette.inkSoft} style={{ flex: 1 }}>
          Randevular, tahliller ve aşılar. Zamanı yaklaşınca hatırlatırım; randevudan önce raporunu hazırlarsın.
        </T>
      </Row>

      <SectionTitle title="Yaklaşanlar" action="Ekle" onAction={() => router.push('/kontrol')} />
      {upcoming.length ? (
        <Card style={{ paddingVertical: 4 }}>
          {upcoming.map((c, i) => {
            const k = kindOf(c.kind);
            const d = daysUntil(c.due_at, at);
            const late = d < 0;
            return (
              <View key={c.id}>
                {i > 0 ? <View style={{ height: 1, backgroundColor: palette.hairline }} /> : null}
                <Row gap={12} style={{ paddingVertical: 12 }}>
                  <Tap onPress={() => router.push({ pathname: '/kontrol', params: { id: String(c.id) } })} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={`${c.title}, ${dueText(c, at)}. Düzenlemek için dokun`}>
                    <Row gap={12}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surface.well, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 20 }}>{k.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <T v="h3" numberOfLines={1}>
                          {c.title}
                        </T>
                        <T v="small" color={late ? palette.bad : d <= 1 ? palette.warn : palette.inkSoft} numberOfLines={1}>
                          {[dueText(c, at), c.every_days ? repeatLabel(c.every_days).toLocaleLowerCase('tr') : null].filter(Boolean).join(' · ')}
                        </T>
                      </View>
                    </Row>
                  </Tap>
                  {d <= Math.max(1, c.remind_days) ? (
                    k.after === 'report' && d >= 0 ? (
                      <Button title="Rapor" kind="glass" compact icon="doc.text" onPress={() => router.push('/rapor')} />
                    ) : (
                      <Button title="Yapıldı" compact icon="checkmark" onPress={() => done(c)} />
                    )
                  ) : (
                    <Icon name="chevron.right" size={13} color={palette.inkFaint} fallback="›" />
                  )}
                </Row>
              </View>
            );
          })}
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          <T v="small" color={palette.inkSoft}>
            Henüz bir şey eklemedin. Sık kullanılanlardan başla:
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {STARTERS.map((key) => {
              const k = kindOf(key);
              return <Chip key={key} label={k.label} emoji={k.emoji} onPress={() => router.push({ pathname: '/kontrol', params: { kind: key } })} />;
            })}
          </View>
        </Card>
      )}

      {upcoming.length ? <Button title="Yeni kontrol ekle" kind="glass" icon="plus" onPress={() => router.push('/kontrol')} /> : null}

      {past.length ? (
        <>
          <SectionTitle title="Yapılanlar" />
          <Card style={{ paddingVertical: 4 }}>
            {past.map((c, i) => (
              <View key={c.id}>
                {i > 0 ? <View style={{ height: 1, backgroundColor: palette.hairline }} /> : null}
                <Row gap={12} style={{ paddingVertical: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: palette.goodSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="checkmark" size={13} color={palette.good} fallback="✓" />
                  </View>
                  <T v="callout" style={{ flex: 1 }} numberOfLines={1}>
                    {c.title}
                  </T>
                  <T v="small" color={palette.inkSoft}>
                    {new Date(c.done_at!).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </T>
                </Row>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', lineHeight: 17, fontWeight: '400', marginTop: 4 }}>
        {`Aralıklar genel önerilerdir (${KINDS.filter((k) => k.every).map((k) => `${k.label.toLocaleLowerCase('tr')} ${repeatLabel(k.every).toLocaleLowerCase('tr')}`).slice(0, 2).join(', ')}).\nDoktorunun planı her zaman önce gelir.`}
      </T>
    </Screen>
  );
}

