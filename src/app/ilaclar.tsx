import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Doses } from '../components/Doses';
import { Button, Card, Icon, Screen, SectionTitle, T, Tap } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { adherence, scheduleLabel } from '../lib/meds';
import { palette } from '../lib/theme';

export default function Meds() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [meds, setMeds] = useState<db.Med[]>([]);
  const [rates, setRates] = useState<Map<number, { due: number; taken: number }>>(new Map());

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const t = now();
        const from = t - 30 * 86400000;
        const list = await db.listMeds(sql);
        const logs = await db.medLogsBetween(sql, from, t);
        setMeds(list);
        setRates(new Map(adherence(list, logs, from, t).map((a) => [a.med.id, { due: a.due, taken: a.taken }])));
      })();
    }, [sql, app.dataVersion]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <Screen header={false}>
      <Doses showEmpty title="Bugün" link={false} />

      <SectionTitle title="Kullandıkların" action="Ekle" onAction={() => router.push('/ilac')} />
      {meds.length ? (
        meds.map((m) => {
          const r = rates.get(m.id);
          const pct = r && r.due ? Math.round((r.taken / r.due) * 100) : null;
          return (
            <Tap key={m.id} onPress={() => router.push({ pathname: '/ilac', params: { id: String(m.id) } })}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="h3" numberOfLines={1}>
                    {m.name}
                    {m.dose ? <T v="small" color={palette.inkSoft}>{`  ${m.dose}`}</T> : null}
                  </T>
                  <T v="small" color={palette.inkSoft} numberOfLines={1}>
                    {scheduleLabel(m)}
                    {m.remind === 0 ? ' · hatırlatma kapalı' : m.remind === 2 ? ' · bildirim' : ' · alarm'}
                    {m.stock != null ? ` · evde ${m.stock} doz` : ''}
                  </T>
                </View>
                {pct != null ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <T v="h3" color={pct >= 90 ? palette.good : pct >= 70 ? palette.warn : palette.bad}>
                      %{pct}
                    </T>
                    <T v="caption" color={palette.inkFaint} style={{ fontWeight: '400' }}>
                      30 gün
                    </T>
                  </View>
                ) : null}
                <Icon name="chevron.right" size={14} color={palette.inkFaint} fallback="›" />
              </Card>
            </Tap>
          );
        })
      ) : (
        <Button title="İlk ilacını ekle" icon="plus" onPress={() => router.push('/ilac')} />
      )}

      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', lineHeight: 17, fontWeight: '400', marginTop: 8 }}>
        Dozları doktorunun söylediği gibi kullan.{'\n'}Crohnic sadece hatırlatır ve kaydeder.
      </T>
    </Screen>
  );
}
