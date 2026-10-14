import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActionSheetIOS, Platform, View } from 'react-native';
import { useApp } from '../lib/app-state';
import { dayLabel, now, startOfDay, timeLabel } from '../lib/dates';
import * as db from '../lib/db';
import { INJECTION_SITES, dosesForToday, lowStock, nextSite, type Dose } from '../lib/meds';
import { onTint, palette } from '../lib/theme';
import { Button, Card, GlassPress, Icon, IconBubble, Row, T } from './ui';

/** Today's medication doses with one-tap "Aldım". Renders nothing when there are no meds. */
export function Doses({ showEmpty, title = 'İlaçlar', link = true }: { showEmpty?: boolean; title?: string; link?: boolean }) {
  const sql = useSQLiteContext();
  const app = useApp();
  const [doses, setDoses] = useState<Dose[] | null>(null);

  const load = useCallback(async () => {
    const t = now();
    const meds = await db.listMeds(sql);
    const logs = meds.length ? await db.medLogsBetween(sql, startOfDay(t) - 4 * 86400000, startOfDay(t) + 86400000) : [];
    setDoses(dosesForToday(meds, logs, t));
  }, [sql]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, app.dataVersion]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!doses) return null;
  if (!doses.length) {
    if (!showEmpty) return null;
    return (
      <Card style={{ gap: 10, alignItems: 'center', paddingVertical: 22 }}>
        <IconBubble name="pills.fill" color={palette.peri} fallback="💊" />
        <T v="h3">Bugün ilaç yok</T>
        <T v="small" color={palette.inkSoft} style={{ textAlign: 'center' }}>
          Düzenli kullandığın ilaçları ekle, saatinde hatırlatayım.
        </T>
      </Card>
    );
  }

  const mark = async (d: Dose, taken: boolean) => {
    if (d.log) await db.undoDose(sql, d.med.id, d.due);
    else if (taken && d.med.injection) {
      const site = await pickSite(d.med.id);
      if (site === undefined) return; // cancelled
      await db.logDose(sql, d.med.id, d.due, true, site);
    } else await db.logDose(sql, d.med.id, d.due, taken);
    app.bump();
    load();
  };

  /** Ask where the injection went, with the rotation's next spot on top. undefined = cancelled. */
  const pickSite = async (medId: number): Promise<string | null | undefined> => {
    const recent = await db.recentSites(sql, medId);
    const suggested = nextSite(recent);
    if (Platform.OS !== 'ios') return suggested;
    const options = [suggested, ...INJECTION_SITES.filter((x) => x !== suggested)];
    return new Promise((resolve) =>
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Nereye yaptın?',
          message: recent[0] ? `Geçen sefer: ${recent[0]}. Sıradaki önerim: ${suggested}` : `Önerim: ${suggested}`,
          options: [...options.map((o, i) => (i === 0 ? `${o} (önerilen)` : o)), 'Vazgeç'],
          cancelButtonIndex: options.length,
        },
        (i) => resolve(i === options.length ? undefined : options[i]),
      ),
    );
  };

  const low = [...new Map(doses.map((d) => [d.med.id, d.med])).values()].filter(lowStock);

  const today = startOfDay(now());
  const left = doses.filter((d) => !d.log).length;

  return (
    <Card style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={8}>
          <IconBubble name="pills.fill" color={palette.peri} dim={30} fallback="💊" />
          <T v="h3">{title}</T>
        </Row>
        <T v="small" color={left ? palette.inkSoft : palette.good}>
          {left ? `${left} doz kaldı` : 'Hepsi tamam'}
        </T>
      </Row>
      {doses.map((d) => {
        const late = d.due < today;
        const taken = d.log?.taken_at != null;
        const skipped = !!d.log && !taken;
        return (
          <Row key={`${d.med.id}:${d.due}`} gap={10}>
            <View style={{ flex: 1 }}>
              <T v="callout" numberOfLines={1} color={skipped ? palette.inkFaint : palette.ink}>
                {d.med.name}
                {d.med.dose ? <T v="small" color={palette.inkSoft}>{`  ${d.med.dose}`}</T> : null}
              </T>
              <T v="small" color={late && !d.log ? palette.bad : palette.inkSoft}>
                {late ? `${dayLabel(d.due)} kaçırıldı` : timeLabel(d.due)}
                {taken ? ` · ${timeLabel(d.log!.taken_at!)} aldın` : skipped ? ' · atlandı' : ''}
                {taken && d.log?.site ? ` · ${d.log.site}` : ''}
              </T>
            </View>
            {d.log ? (
              <GlassPress
                onPress={() => mark(d, false)}
                tint={taken ? palette.good : undefined}
                accessibilityLabel="Geri al"
                style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name={taken ? 'checkmark' : 'arrow.uturn.backward'} size={16} color={taken ? onTint(palette.good) : palette.inkSoft} fallback={taken ? '✓' : '↺'} />
              </GlassPress>
            ) : (
              <Row gap={6}>
                <Button title="Atla" kind="glass" compact onPress={() => mark(d, false)} />
                <Button title="Aldım" compact onPress={() => mark(d, true)} />
              </Row>
            )}
          </Row>
        );
      })}
      {low.map((m) => (
        <Row key={`low-${m.id}`} gap={8} style={{ backgroundColor: palette.warnSoft, borderRadius: 12, padding: 10 }}>
          <Icon name="exclamationmark.triangle.fill" size={15} color={palette.warn} fallback="!" />
          <T v="small" color={palette.ink} style={{ flex: 1 }}>
            {m.stock === 0 ? `${m.name} evde bitti.` : `${m.name} için evde ${m.stock} doz kaldı.`} Reçeteni yenilemeyi unutma.
          </T>
        </Row>
      ))}
      {link ? <Button title="İlaçlarım" kind="plain" compact onPress={() => router.push('/ilaclar')} /> : null}
    </Card>
  );
}
