import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Mascot } from '../components/Mascot';
import { Button, Card, Chip, GlassPress, Icon, Row, Screen, T, Tap } from '../components/ui';
import { useApp } from '../lib/app-state';
import { now } from '../lib/dates';
import * as db from '../lib/db';
import { COMPLICATIONS, PAIN, WELLBEING, hbiBand, hbiScore, parseComplications, prefill, weekKey, weekLabel, weekStart } from '../lib/hbi';
import { onTint, palette, radius, surface } from '../lib/theme';

/**
 * The weekly activity score: three questions and a checklist, mostly filled in from the logs.
 * The score and what it means update live; saving replaces this week's answer.
 */
export default function Score() {
  const sql = useSQLiteContext();
  const app = useApp();
  const [at] = useState(() => now());
  const [wellbeing, setWellbeing] = useState<number | null>(null);
  const [pain, setPain] = useState<number | null>(null);
  const [liquid, setLiquid] = useState(0);
  const [comps, setComps] = useState<string[]>([]);
  const [hint, setHint] = useState<{ liquid: number; bowelDays: number; pain: number | null; wellbeing: number | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const [bowel, symptoms, daily, existing] = await Promise.all([db.listBowel(sql, 200), db.listSymptoms(sql, 200), db.listDaily(sql, 14), db.getHbi(sql, weekKey(at))]);
      const p = prefill(at, bowel, symptoms, daily);
      setHint(p);
      if (existing) {
        setWellbeing(existing.wellbeing);
        setPain(existing.pain);
        setLiquid(existing.liquid);
        setComps(parseComplications(existing));
      } else {
        setWellbeing(p.wellbeing);
        setPain(p.pain);
        setLiquid(p.liquid);
      }
    })();
  }, [sql, at]);

  const ready = wellbeing != null && pain != null;
  const score = hbiScore({ wellbeing: wellbeing ?? 0, pain: pain ?? 0, liquid, complications: comps });
  const band = hbiBand(score);

  const save = async () => {
    if (!ready) return;
    setSaving(true);
    await db.saveHbi(sql, { week: weekKey(at), wellbeing: wellbeing!, pain: pain!, liquid, complications: comps.join(',') || null, score });
    app.bump();
    setSaving(false);
    setSaved(true);
  };

  if (saved)
    return (
      <Screen title="Haftalık skor" footer={<Button title="Tamam" icon="checkmark" onPress={() => router.back()} />}>
        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
          <Mascot mood={band.key === 'remisyon' ? 'kutlama' : band.key === 'hafif' ? 'dusunuyor' : 'worried'} size={110} />
          <T v="large" color={band.color}>
            {score.toLocaleString('tr-TR')}
          </T>
          <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: band.bg }}>
            <T v="callout" color={band.color} style={{ fontWeight: '800' }}>
              {band.label}
            </T>
          </View>
          <T v="callout" style={{ textAlign: 'center' }}>
            {band.text}
          </T>
          <T v="small" color={palette.inkSoft} style={{ textAlign: 'center' }}>
            Haftalık gidişatı Örüntüler’de ve doktor raporunda görürsün.
          </T>
        </Card>
        {band.key !== 'remisyon' ? <Button title="Doktor raporunu hazırla" kind="glass" icon="doc.text" onPress={() => router.replace('/rapor')} /> : null}
      </Screen>
    );

  return (
    <Screen
      title="Haftalık skor"
      footer={<Button title={ready ? `Kaydet · ${score.toLocaleString('tr-TR')} puan` : 'İlk iki soruyu cevapla'} icon="checkmark" onPress={save} loading={saving} disabled={!ready} />}
    >
      <Row gap={4}>
        <Mascot mood="arastirma" size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <T v="callout" color={palette.inkSoft}>
            {`${weekLabel(weekStart(at))}, son 7 gün. Harvey-Bradshaw ölçeğine göre; kayıtlarından doldurabildiklerimi doldurdum.`}
          </T>
        </View>
      </Row>

      <Card style={{ gap: 10 }}>
        <T v="h3">Genel olarak nasıldın?</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {WELLBEING.map((l, i) => (
            <Chip key={l} label={`${l} · ${i}`} active={wellbeing === i} color={i <= 1 ? palette.lettuce : i === 2 ? palette.warn : palette.bad} onPress={() => setWellbeing(i)} />
          ))}
        </View>
        {hint?.wellbeing != null ? <Hint text={`Günlük ruh hâline göre: ${WELLBEING[hint.wellbeing].toLocaleLowerCase('tr')}`} /> : null}
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="h3">Karın ağrın?</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PAIN.map((l, i) => (
            <Chip key={l} label={`${l} · ${i}`} active={pain === i} color={i === 0 ? palette.lettuce : i === 1 ? palette.warn : palette.bad} onPress={() => setPain(i)} />
          ))}
        </View>
        {hint?.pain != null ? <Hint text={`Semptom kayıtlarına göre: ${PAIN[hint.pain].toLocaleLowerCase('tr')}`} /> : null}
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="h3">Günde kaç kez sulu ya da yumuşak dışkı?</T>
        <Row gap={14} style={{ justifyContent: 'center' }}>
          <Stepper icon="minus" label="Azalt" onPress={() => setLiquid((v) => Math.max(0, Math.round((v - 1) * 10) / 10))} />
          <T v="large" style={{ minWidth: 80, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
            {liquid.toLocaleString('tr-TR')}
          </T>
          <Stepper icon="plus" label="Artır" onPress={() => setLiquid((v) => Math.round((v + 1) * 10) / 10)} />
        </Row>
        {hint ? (
          <Hint
            text={
              hint.bowelDays >= 4
                ? `Tuvalet kayıtlarından (Bristol 5–7): günde ortalama ${hint.liquid.toLocaleString('tr-TR')}`
                : `Bu hafta yalnızca ${hint.bowelDays} günde tuvalet kaydın var; sayıyı kendin düzelt.`
            }
          />
        ) : null}
      </Card>

      <Card style={{ gap: 4 }}>
        <T v="h3">Bu hafta bunlardan biri oldu mu?</T>
        <T v="small" color={palette.inkSoft} style={{ marginBottom: 6 }}>
          Her biri 1 puan. Crohn bağırsak dışında da kendini gösterebilir.
        </T>
        {COMPLICATIONS.map((c, i) => {
          const on = comps.includes(c.key);
          return (
            <Tap
              key={c.key}
              onPress={() => setComps((p) => (on ? p.filter((x) => x !== c.key) : [...p, c.key]))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={c.label}
            >
              {i > 0 ? <View style={{ height: 1, backgroundColor: palette.hairline }} /> : null}
              <Row gap={12} style={{ paddingVertical: 10 }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? palette.bad : surface.well,
                    borderWidth: on ? 0 : 1.5,
                    borderColor: palette.hairline,
                  }}
                >
                  {on ? <Icon name="checkmark" size={13} color={onTint(palette.bad)} fallback="✓" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <T v="callout">{c.label}</T>
                  {c.hint ? (
                    <T v="small" color={palette.inkSoft}>
                      {c.hint}
                    </T>
                  ) : null}
                </View>
              </Row>
            </Tap>
          );
        })}
      </Card>

      {ready ? (
        <Card tint={band.bg} style={{ gap: 4 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="h3" color={band.color}>{`${score.toLocaleString('tr-TR')} puan · ${band.label}`}</T>
          </Row>
          <T v="small">{band.text}</T>
        </Card>
      ) : null}

      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', lineHeight: 17, fontWeight: '400' }}>
        {'5’in altı sakin, 5–7 hafif, 8–16 orta, 16 üstü ağır.\nKarında ele gelen kitle maddesini doktorun muayenede değerlendirir; burada sayılmaz.'}
      </T>
    </Screen>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <Row gap={6}>
      <Icon name="sparkles" size={11} color={palette.lettuceDeep} fallback="✨" />
      <T v="small" color={palette.lettuceDeep} style={{ flex: 1 }}>
        {text}
      </T>
    </Row>
  );
}

function Stepper({ icon, label, onPress }: { icon: 'plus' | 'minus'; label: string; onPress: () => void }) {
  return (
    <GlassPress onPress={onPress} accessibilityLabel={label} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={18} color={palette.ink} fallback={icon === 'plus' ? '+' : '−'} />
    </GlassPress>
  );
}
