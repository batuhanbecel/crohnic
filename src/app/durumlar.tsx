import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Switch, View } from 'react-native';
import { Card, Chip, Row, Screen, T } from '../components/ui';
import { useApp } from '../lib/app-state';
import * as db from '../lib/db';
import { MED_CLASSES, MED_ORDER, classesIn, namesIn } from '../lib/med-food';
import { palette } from '../lib/theme';
import { hasLactose, hasStoma, hasStricture, setLactose, setStoma, setStricture } from '../lib/tolerance';

const FACTORS = [
  { key: 'stricture', title: 'Bağırsakta darlık (striktür)', text: 'Remisyonda da lifli, kabuklu, çekirdekli ve posalı yiyecekleri temkinli değerlendiririm.' },
  { key: 'stoma', title: 'Stoma (ileostomi)', text: 'Tıkanma riskine karşı lifli ve posalı yiyecekleri temkinli değerlendiririm.' },
  { key: 'lactose', title: 'Laktoz intoleransı', text: 'Süt, krema ve sütlü tatlıları daha riskli sayarım. Yoğurt, kefir ve eski peynirler genelde daha iyi tolere edilir.' },
] as const;

/** "Sana özel durumlar": what changes how every food is rated, from Ayarlar. */
export default function Conditions() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [factors, setFactors] = useState({ stricture: hasStricture(), stoma: hasStoma(), lactose: hasLactose() });
  const [medNames, setMedNames] = useState<string[]>([]);
  const SETTERS = { stricture: setStricture, stoma: setStoma, lactose: setLactose };

  useFocusEffect(
    useCallback(() => {
      db.listMeds(sql).then((m) => setMedNames(m.map((x) => x.name)));
    }, [sql]),
  );

  const toggleFactor = async (key: keyof typeof factors, on: boolean) => {
    setFactors((f) => ({ ...f, [key]: on }));
    SETTERS[key](on);
    await db.setSetting(sql, key, on ? '1' : '0');
    await db.setSetting(sql, 'factors_seen', '1');
    app.bump();
  };

  const inList = classesIn(medNames).filter((c) => !app.medFactors.includes(c));

  return (
    <Screen title="Sana özel durumlar">
      <T v="callout" color={palette.inkSoft}>
        Yemekleri bunlara göre değerlendiririm. Doktorunun söylediklerini aç.
      </T>

      <Card style={{ gap: 14 }}>
        {FACTORS.map((x, i) => (
          <View key={x.key} style={{ gap: 14 }}>
            {i > 0 ? <View style={{ height: 1, backgroundColor: palette.hairline }} /> : null}
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <T v="callout" style={{ fontWeight: '600' }}>
                  {x.title}
                </T>
                <T v="small" color={palette.inkSoft}>
                  {x.text}
                </T>
              </View>
              <Switch value={factors[x.key]} onValueChange={(on) => toggleFactor(x.key, on)} trackColor={{ true: palette.lettuce }} accessibilityLabel={x.title} />
            </Row>
          </View>
        ))}
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={{ gap: 2 }}>
          <T v="h3">Şu an kullandığım ilaçlar</T>
          <T v="small" color={palette.inkSoft}>
            Seçtiklerine göre yemekleri değerlendiririm. İlacı bırakınca kapat, uyarıları da kalkar.
          </T>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {MED_ORDER.map((cls) => {
            const active = app.medFactors.includes(cls);
            return <Chip key={cls} label={MED_CLASSES[cls].label} active={active} color={palette.peri} onPress={() => app.setMedFactor(cls, !active)} />;
          })}
        </View>
        {MED_ORDER.filter((c) => app.medFactors.includes(c)).map((cls) => {
          const mine = namesIn(cls, medNames);
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
          <T v="small" color={palette.warn}>
            {`İlaçlarında ${inList.map((c) => `${namesIn(c, medNames)[0]} (${MED_CLASSES[c].label.toLocaleLowerCase('tr-TR')})`).join(', ')} var ama seçili değil. Şu an kullanıyorsan seç.`}
          </T>
        ) : null}
      </Card>

      <T v="caption" color={palette.inkFaint} style={{ fontWeight: '400', paddingHorizontal: 4 }}>
        {`Hangi ilaç hangi grupta: ${MED_ORDER.slice(0, 4)
          .map((c) => `${MED_CLASSES[c].label}: ${MED_CLASSES[c].examples}`)
          .join(' · ')}.`}
      </T>
    </Screen>
  );
}
