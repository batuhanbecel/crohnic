import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, View } from 'react-native';
import { now } from '../lib/dates';
import { palette, type } from '../lib/theme';
import { Chip, Row, T } from './ui';

const QUICK: { label: string; minutes: number }[] = [
  { label: 'Şimdi', minutes: 0 },
  { label: '30 dk', minutes: 30 },
  { label: '1 saat', minutes: 60 },
  { label: '2 saat', minutes: 120 },
];

/** Date + time picker with quick presets. Value is epoch ms. */
export function WhenField({ value, onChange, label = 'Ne zaman?' }: { value: number; onChange: (ms: number) => void; label?: string }) {
  const diff = Math.round((now() - value) / 60000);
  return (
    <View style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="h3">{label}</T>
        <DateTimePicker
          value={new Date(value)}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          maximumDate={new Date()}
          locale="tr-TR"
          accentColor={palette.ink}
          themeVariant="light"
          onChange={(_, d) => d && onChange(d.getTime())}
        />
      </Row>
      <Row gap={6}>
        {QUICK.map((q) => (
          <View key={q.label} style={{ flex: 1 }}>
            <Chip label={q.label} active={Math.abs(diff - q.minutes) <= 2} onPress={() => onChange(now() - q.minutes * 60000)} />
          </View>
        ))}
      </Row>
      {diff > 2 && !QUICK.some((q) => Math.abs(diff - q.minutes) <= 2) ? (
        <T v="small" color={palette.inkSoft} style={type.medium}>
          {new Date(value).toLocaleString('tr-TR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
        </T>
      ) : null}
    </View>
  );
}
