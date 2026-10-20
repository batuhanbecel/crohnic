import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Linking, Switch } from 'react-native';
import { ListGroup, ListRow, Screen } from '../components/ui';
import * as db from '../lib/db';
import { SETTINGS, askPermission, isOn, permission, syncReminders, type PermissionState } from '../lib/reminders';
import { palette } from '../lib/theme';

type Key = 'meals' | 'daily' | 'weekly' | 'water';

const ROWS: { key: Key; icon: 'fork.knife' | 'moon.fill' | 'calendar' | 'drop.fill'; color: string; title: string; sub: string }[] = [
  { key: 'meals', icon: 'fork.knife', color: palette.lettuceDeep, title: 'Öğünden sonra sor', sub: 'Yedikten 3 saat sonra nasıl geçti diye sorar' },
  { key: 'daily', icon: 'moon.fill', color: palette.plum, title: 'Akşam kontrolü', sub: '21:30’da stres ve uykunu sorar' },
  { key: 'weekly', icon: 'calendar', color: palette.plum, title: 'Pazar özeti', sub: 'Pazar 20:00’de haftanın özeti ve aktivite skoru' },
  { key: 'water', icon: 'drop.fill', color: palette.water, title: 'Su hatırlatması', sub: 'Sulu dışkı sık olduğu günlerde' },
];

/** Every reminder switch in one place; medicine alarms stay with each medicine. */
export default function Notifications() {
  const sql = useSQLiteContext();
  const [perm, setPerm] = useState<PermissionState>('undetermined');
  const [on, setOn] = useState<Record<Key, boolean>>({ meals: true, daily: true, weekly: true, water: true });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setPerm(await permission());
        const next = {} as Record<Key, boolean>;
        for (const r of ROWS) next[r.key] = await isOn(sql, SETTINGS[r.key]);
        setOn((o) => ({ ...o, ...next }));
      })();
    }, [sql]),
  );

  const toggle = async (key: Key, value: boolean) => {
    setOn((o) => ({ ...o, [key]: value }));
    await db.setSetting(sql, SETTINGS[key], value ? '1' : '0');
    if (value && perm !== 'granted') {
      const ok = await askPermission();
      setPerm(ok ? 'granted' : await permission());
      if (!ok && (await permission()) === 'denied') {
        Alert.alert('Bildirimler kapalı', 'iPhone Ayarlar › Crohnic › Bildirimler’den açabilirsin.', [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Ayarları aç', onPress: () => Linking.openSettings() },
        ]);
      }
    }
    syncReminders(sql);
  };

  return (
    <Screen title="Bildirimler">
      {perm !== 'granted' ? (
        <ListGroup>
          <ListRow
            icon="bell.slash.fill"
            color={palette.warn}
            title="Bildirim izni kapalı"
            sub={perm === 'denied' ? 'iPhone Ayarları’ndan açmak için dokun' : 'İzin vermek için dokun'}
            external={perm === 'denied'}
            onPress={async () => (perm === 'denied' ? Linking.openSettings() : setPerm((await askPermission()) ? 'granted' : await permission()))}
          />
        </ListGroup>
      ) : null}

      <ListGroup title="Hatırlatmalar" footer="İlaç alarmları ve bildirimleri her ilacın kendi ayarında. Kontrol takvimindeki randevular kendi gününden önce hatırlatılır.">
        {ROWS.map((r) => (
          <ListRow
            key={r.key}
            icon={r.icon}
            color={r.color}
            title={r.title}
            sub={r.sub}
            right={<Switch value={on[r.key] && perm === 'granted'} onValueChange={(v) => toggle(r.key, v)} trackColor={{ true: palette.lettuce }} accessibilityLabel={r.title} />}
          />
        ))}
      </ListGroup>
    </Screen>
  );
}
