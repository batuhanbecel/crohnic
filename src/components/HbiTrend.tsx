import { router } from 'expo-router';
import { View } from 'react-native';
import type { HbiRow } from '../lib/db';
import { fromIsoDay } from '../lib/dates';
import { hbiBand } from '../lib/hbi';
import { palette, radius, surface } from '../lib/theme';
import { Button, Card, Row, T } from './ui';

/**
 * The weekly activity score over the last weeks as bars coloured by band, with the latest
 * score and what it means. `due` adds the button for this week's questions.
 */
export function HbiTrend({ rows, due }: { rows: HbiRow[]; due?: boolean }) {
  const weeks = [...rows].sort((a, b) => a.week.localeCompare(b.week)).slice(-8);
  const last = weeks[weeks.length - 1];
  const max = Math.max(10, ...weeks.map((w) => w.score));
  const band = last ? hbiBand(last.score) : null;
  const prev = weeks[weeks.length - 2];
  const delta = last && prev ? Math.round((last.score - prev.score) * 10) / 10 : null;
  return (
    <Card style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="h3">Aktivite skoru</T>
          <T v="small" color={palette.inkSoft}>
            {last && band
              ? `Son: ${last.score.toLocaleString('tr-TR')} puan, ${band.label.toLocaleLowerCase('tr')}${delta ? ` (${delta > 0 ? '+' : ''}${delta.toLocaleString('tr-TR')})` : ''}`
              : 'Haftada bir, 1 dakika. Gidişatı doktorunla paylaşırsın.'}
          </T>
        </View>
        {band ? (
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: band.bg }}>
            <T v="caption" color={band.color} style={{ fontWeight: '800' }}>
              {band.label}
            </T>
          </View>
        ) : null}
      </Row>
      {weeks.length >= 2 ? (
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Haftalık aktivite skoru: ${weeks.map((w) => `${w.score.toLocaleString('tr-TR')}`).join(', ')}`}
          style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 6 }}
        >
          {weeks.map((w) => {
            const b = hbiBand(w.score);
            return (
              <View key={w.week} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <T v="caption" color={palette.inkSoft} style={{ fontSize: 10 }}>
                  {w.score.toLocaleString('tr-TR')}
                </T>
                <View style={{ width: '100%', height: Math.max(6, (w.score / max) * 60), borderRadius: 6, backgroundColor: b.color }} />
                <T v="caption" color={palette.inkFaint} style={{ fontSize: 10 }}>
                  {new Date(fromIsoDay(w.week)).toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' })}
                </T>
              </View>
            );
          })}
        </View>
      ) : weeks.length === 1 ? null : (
        <View style={{ height: 6, borderRadius: 3, backgroundColor: surface.well }} />
      )}
      {band ? (
        <T v="small" color={palette.inkSoft}>
          {band.text}
        </T>
      ) : null}
      {due ? <Button title="Bu haftanın skoru" icon="checklist" compact onPress={() => router.push('/skor')} style={{ alignSelf: 'flex-start' }} /> : null}
    </Card>
  );
}
