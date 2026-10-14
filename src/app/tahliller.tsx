import DateTimePicker from '@react-native-community/datetimepicker';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { Mascot } from '../components/Mascot';
import { TextInput } from '../components/text';
import { Button, Card, Chip, Icon, Row, Screen, T, Tap, st } from '../components/ui';
import { useApp } from '../lib/app-state';
import { dayLabel, now } from '../lib/dates';
import * as db from '../lib/db';
import { LAB_BY_KEY, LAB_KINDS, fmtLab, parseLabValue } from '../lib/labs';
import { isDark, palette, radius, surface } from '../lib/theme';

/** Lab results and weight: quick entry on top, latest value and trend per test below. */
export default function Labs() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [labs, setLabs] = useState<db.Lab[]>([]);
  const [kind, setKind] = useState('kilo');
  const [value, setValue] = useState('');
  const [at, setAt] = useState(() => now());
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => db.listLabs(sql).then(setLabs), [sql]);
  useEffect(() => {
    load();
  }, [load, app.dataVersion]);

  const byKind = useMemo(() => {
    const m = new Map<string, db.Lab[]>();
    for (const l of labs) m.set(l.kind, [...(m.get(l.kind) ?? []), l]);
    return m;
  }, [labs]);

  const parsed = parseLabValue(value);
  const k = LAB_BY_KEY[kind];

  const save = async () => {
    if (parsed == null) return;
    await db.addLab(sql, { at, kind, value: parsed, note: null });
    setValue('');
    app.bump();
    load();
  };

  const remove = (l: db.Lab) =>
    Alert.alert('Silinsin mi?', `${LAB_BY_KEY[l.kind]?.label ?? l.kind}: ${fmtLab(l.kind, l.value)}, ${dayLabel(l.at)}`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await db.deleteLab(sql, l.id);
          app.bump();
          load();
        },
      },
    ]);

  const filled = LAB_KINDS.filter((x) => byKind.has(x.key));

  return (
    <Screen header={false}>
      <Row gap={4}>
        <Mascot mood="doktor" size={76} />
        <T v="callout" color={palette.inkSoft} style={{ flex: 1 }}>
          Tahlil sonuçlarını ve kilonu buraya yaz. Doktor raporunda gelişimiyle birlikte görünür.
        </T>
      </Row>

      <Card style={{ gap: 12 }}>
        <T v="h3">Yeni sonuç</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LAB_KINDS.map((x) => (
            <Chip key={x.key} label={x.label} active={kind === x.key} onPress={() => setKind(x.key)} />
          ))}
        </View>
        {k?.hint ? (
          <T v="small" color={palette.inkSoft}>
            {k.hint}
          </T>
        ) : null}
        <Row gap={10}>
          <TextInput
            value={value}
            onChangeText={(t) => setValue(t.replace(/[^0-9.,]/g, ''))}
            placeholder="Değer"
            placeholderTextColor={palette.inkFaint}
            keyboardType="decimal-pad"
            accessibilityLabel={`${k?.label ?? ''} değeri`}
            style={[st.input, { flex: 1 }]}
          />
          <T v="callout" color={palette.inkSoft} style={{ minWidth: 52 }}>
            {k?.unit}
          </T>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="callout">Tarih</T>
          <DateTimePicker
            value={new Date(at)}
            mode="date"
            display="compact"
            locale="tr-TR"
            maximumDate={new Date()}
            accentColor={palette.ink}
            themeVariant={isDark ? 'dark' : 'light'}
            onChange={(_, d) => d && setAt(d.getTime())}
          />
        </Row>
        <Button title="Kaydet" icon="checkmark" onPress={save} disabled={parsed == null} />
      </Card>

      {filled.length ? (
        filled.map((x) => {
          const list = byKind.get(x.key)!; // newest first
          const [last, prev] = list;
          const diff = prev ? last.value - prev.value : null;
          const expanded = open === x.key;
          return (
            <Card key={x.key} style={{ gap: 10 }} accessible={false}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <T v="h3">{x.label}</T>
                  <T v="small" color={palette.inkSoft}>
                    {dayLabel(last.at)}
                    {list.length > 1 ? ` · ${list.length} ölçüm` : ''}
                  </T>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T v="title">{fmtLab(x.key, last.value)}</T>
                  {diff != null && diff !== 0 ? (
                    <Row gap={4}>
                      <Icon name={diff > 0 ? 'arrow.up' : 'arrow.down'} size={11} color={palette.inkSoft} fallback={diff > 0 ? '↑' : '↓'} />
                      <T v="caption" color={palette.inkSoft}>
                        {`öncekinden ${fmtLab(x.key, Math.abs(diff))}`}
                      </T>
                    </Row>
                  ) : null}
                </View>
              </Row>
              {list.length > 1 ? <Trend values={[...list].reverse().map((l) => l.value)} /> : null}
              <Button title={expanded ? 'Geçmişi gizle' : 'Geçmiş'} kind="plain" compact onPress={() => setOpen(expanded ? null : x.key)} />
              {expanded ? (
                <View style={{ borderRadius: radius.md, overflow: 'hidden', backgroundColor: surface.card }}>
                  {list.map((l, i) => (
                    <View key={l.id}>
                      {i > 0 ? <View style={{ height: 1, backgroundColor: palette.hairline }} /> : null}
                      <Row gap={10} style={{ paddingVertical: 8, paddingHorizontal: 4 }}>
                        <T v="callout" style={{ flex: 1 }}>
                          {dayLabel(l.at)}
                        </T>
                        <T v="callout">{fmtLab(x.key, l.value)}</T>
                        <Tap onPress={() => remove(l)} accessibilityLabel={`${dayLabel(l.at)} ölçümünü sil`} style={{ padding: 8 }}>
                          <Icon name="trash" size={15} color={palette.bad} fallback="🗑" />
                        </Tap>
                      </Row>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })
      ) : (
        <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 22 }}>
          <T v="h3">Henüz sonuç yok</T>
          <T v="small" color={palette.inkSoft} style={{ textAlign: 'center' }}>
            Son tahlilinden kalprotektin ve CRP ile başla, kilonu da ayda bir yaz.
          </T>
        </Card>
      )}
    </Screen>
  );
}

/** Tiny bar trend, oldest → newest, scaled to the series. */
function Trend({ values }: { values: number[] }) {
  const last = values.slice(-12);
  const max = Math.max(...last);
  const min = Math.min(...last);
  const span = max - min || 1;
  return (
    <View accessible accessibilityLabel={`Son ${last.length} ölçüm, en düşük ${min}, en yüksek ${max}`} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 36 }}>
      {last.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 6 + ((v - min) / span) * 30,
            borderRadius: 3,
            backgroundColor: i === last.length - 1 ? palette.lettuce : palette.lettuceSoft,
          }}
        />
      ))}
    </View>
  );
}
