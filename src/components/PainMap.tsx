import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { EXTRA, GRID } from '../lib/pain-map';
import { onTint, palette, radius, soft, surface } from '../lib/theme';
import { Chip, Row, T, Tap } from './ui';

const W = 280;
const H = 250;

/** A belly seen from above: rounded torso, navel in the middle. */
function Torso() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute' }}>
      <Path
        d={`M40 6 C20 40 14 90 18 140 C22 190 50 236 140 244 C230 236 258 190 262 140 C266 90 260 40 240 6 Z`}
        fill={surface.well}
        stroke={palette.hairline}
        strokeWidth={2}
      />
      <Path d="M136 125 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" fill={palette.inkFaint} />
    </Svg>
  );
}

/**
 * Tap where it hurts (several places are fine). With `counts` it turns into a read-only heat
 * map: the more often a place was marked, the deeper the colour, with the count on it.
 */
export function PainMap({
  value = [],
  onChange,
  counts,
  color = palette.bad,
}: {
  value?: string[];
  onChange?: (keys: string[]) => void;
  counts?: Map<string, number>;
  color?: string;
}) {
  const max = counts ? Math.max(1, ...counts.values()) : 1;
  const toggle = (k: string) => onChange?.(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <View style={{ gap: 10 }}>
      <View style={{ width: '100%', maxWidth: 320, alignSelf: 'center', aspectRatio: W / H }}>
        <Torso />
        <View style={{ flex: 1, paddingTop: '9%', paddingBottom: '11%', paddingHorizontal: '11%', gap: 6 }}>
          {GRID.map((row, r) => (
            <Row key={r} gap={6} style={{ flex: 1, alignItems: 'stretch' }}>
              {row.map((a) => {
                const n = counts?.get(a.key) ?? 0;
                const on = counts ? n > 0 : value.includes(a.key);
                const fill = counts ? (n ? soft(color, 0.25 + 0.6 * (n / max)) : 'transparent') : on ? color : 'transparent';
                const fg = counts ? (n / max > 0.5 ? onTint(color) : palette.ink) : on ? onTint(color) : palette.inkSoft;
                return (
                  <Tap
                    key={a.key}
                    onPress={onChange ? () => toggle(a.key) : undefined}
                    haptic={!!onChange}
                    accessibilityRole={onChange ? 'button' : undefined}
                    accessibilityState={onChange ? { selected: on } : undefined}
                    accessibilityLabel={counts ? `${a.label}: ${n} kez` : a.label}
                    style={{
                      flex: 1,
                      borderRadius: radius.md,
                      backgroundColor: fill,
                      borderWidth: 1.5,
                      borderColor: on ? color : soft(palette.inkFaint, 0.5),
                      borderStyle: on ? 'solid' : 'dashed',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 2,
                    }}
                  >
                    <T v="caption" color={fg} style={{ fontWeight: on ? '800' : '600', textAlign: 'center', fontSize: 11 }} numberOfLines={2}>
                      {counts ? (n ? `${a.label}\n${n}` : a.label) : a.label}
                    </T>
                  </Tap>
                );
              })}
            </Row>
          ))}
        </View>
      </View>
      <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', fontWeight: '400' }}>
        Kendi karnına yukarıdan bakar gibi: sağın ekranın sağında.
      </T>
      {counts ? (
        EXTRA.some((a) => counts.get(a.key)) ? (
          <Row gap={8} style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            {EXTRA.filter((a) => counts.get(a.key)).map((a) => (
              <T key={a.key} v="small" color={palette.inkSoft}>{`${a.label}: ${counts.get(a.key)}`}</T>
            ))}
          </Row>
        ) : null
      ) : (
        <Row gap={8} style={{ justifyContent: 'center' }}>
          {EXTRA.map((a) => (
            <Chip key={a.key} label={a.label} active={value.includes(a.key)} color={color} onPress={() => toggle(a.key)} />
          ))}
        </Row>
      )}
    </View>
  );
}
