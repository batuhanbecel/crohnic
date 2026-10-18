import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Doses } from '../components/Doses';
import { Button, Card, Icon, IconBubble, Row, Screen, SectionTitle, T, Tap } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { MED_CLASSES, classesIn, medGuide, namesIn, type MedClass } from '../lib/med-food';
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
    <Screen title="İlaçlarım">
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

      <FoodGuide meds={meds} on={app.medFactors} onToggle={app.setMedFactor} />

      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', lineHeight: 17, fontWeight: '400', marginTop: 8 }}>
        Dozları doktorunun söylediği gibi kullan.{'\n'}Crohnic sadece hatırlatır ve kaydeder.
      </T>
    </Screen>
  );
}

/**
 * What to watch on the plate while taking these medicines, grouped by kind (Prednol and
 * "kortizon" share one cortisone card). Only the groups switched on in Sana özel durumlar count;
 * a recognised medicine that's off gets a one-tap switch. Unknown ones get a pointer to the doctor.
 */
function FoodGuide({ meds, on, onToggle }: { meds: db.Med[]; on: MedClass[]; onToggle: (cls: MedClass, on: boolean) => void }) {
  const names = meds.map((m) => m.name);
  const guide = medGuide();
  const recognised = classesIn(names);
  const off = recognised.filter((c) => !on.includes(c));
  const unknown = names.filter((n) => !classesIn([n]).length);
  if (!guide.length && !off.length && !unknown.length) return null;
  return (
    <>
      <SectionTitle title="İlaçların ve beslenme" />
      {off.map((cls) => (
        <Card key={cls} style={{ gap: 10 }}>
          <Row gap={10}>
            <IconBubble name="fork.knife" color={palette.inkSoft} dim={30} fallback="🍽️" />
            <View style={{ flex: 1 }}>
              <T v="h3">{`${namesIn(cls, names).join(', ')}: ${MED_CLASSES[cls].label.toLocaleLowerCase('tr-TR')}`}</T>
              <T v="small" color={palette.inkSoft}>
                Yemek uyarıları kapalı. Şu an kullanıyorsan aç, bırakınca kapatırsın.
              </T>
            </View>
          </Row>
          <T v="small">{MED_CLASSES[cls].effect}</T>
          <Button title="Uyarıları aç" kind="glass" icon="checkmark" compact onPress={() => onToggle(cls, true)} style={{ alignSelf: 'flex-start' }} />
        </Card>
      ))}
      {guide.map((g) => (
        <Card key={g.cls} style={{ gap: 10 }}>
          <Row gap={10}>
            <IconBubble name="fork.knife" color={palette.peri} dim={30} fallback="🍽️" />
            <View style={{ flex: 1 }}>
              <T v="h3">{g.label}</T>
              <T v="small" color={palette.inkSoft} numberOfLines={1}>
                {g.names.join(', ')}
              </T>
            </View>
            <Button title="Kapat" kind="plain" compact onPress={() => onToggle(g.cls, false)} />
          </Row>
          {g.tips.map((tip) => (
            <Row key={tip} gap={10} style={{ alignItems: 'flex-start' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.peri, marginTop: 8 }} />
              <T v="callout" style={{ flex: 1 }}>
                {tip}
              </T>
            </Row>
          ))}
        </Card>
      ))}
      {unknown.length ? (
        <T v="small" color={palette.inkSoft} style={{ paddingHorizontal: 4 }}>
          {`${unknown.join(', ')} için kayıtlı bir beslenme notum yok; yiyeceklerle ilgili bir uyarısı var mı, eczacına ya da doktoruna sor.`}
        </T>
      ) : null}
      {guide.length ? (
        <T v="caption" color={palette.inkFaint} style={{ paddingHorizontal: 4 }}>
          Açık olan ilaçların notları yemek listesinde, öğün eklerken ve fotoğraf analizinde de karşına çıkar. Ayarlar › Sana özel durumlar’dan değiştirebilirsin. Genel bilgidir; senin durumunu en iyi doktorun bilir.
        </T>
      ) : null}
    </>
  );
}
