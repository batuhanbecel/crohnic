import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { AREAS, EXTRA, GRID } from '../lib/pain-map';
import { isDark, onTint, palette, soft, surface } from '../lib/theme';
import { Chip, Row, T, Tap } from './ui';

/**
 * The belly drawn as the bowel itself, seen as if looking down at your own body (your right
 * is on the right of the screen): stomach at the top, the large intestine framing the belly,
 * the small intestine coiled in the middle, and the end of the small intestine meeting the
 * caecum at the lower right, where Crohn's most often sits. The nine classic areas of the
 * abdomen are tap targets laid over it; a marked area lights up the bowel inside it.
 */

const W = 300;
const H = 330;

/** Column and row edges of the 3×3 areas, in drawing units. */
const XS = [46, 118, 184, 256];
const YS = [26, 118, 206, 292];
/** The area around the anus, below the belly. */
const ANUS = { x: 120, y: 292, w: 60, h: 34 };

const COLON =
  'M224 262 C228 210 228 150 224 118 C222 98 208 90 192 94 C166 100 146 112 120 104 C102 98 84 92 80 106 C74 140 74 186 78 222 C82 250 100 270 124 264 C144 259 152 272 150 292 L150 308';
const SMALL =
  'M150 112 C186 116 196 132 182 142 C166 152 118 140 112 158 C106 176 164 170 190 176 C208 180 204 202 182 204 C152 208 114 196 112 216 C110 236 162 232 194 240 C204 243 208 252 214 260';
const STOMACH = 'M100 34 C80 36 74 58 92 68 C108 76 126 72 140 78 C150 82 158 76 152 68 C144 58 128 54 120 46 C112 38 110 33 100 34 Z';
const DUODENUM = 'M152 72 C166 84 168 102 150 112';
const APPENDIX = 'M220 278 C216 290 210 296 204 296';
const BELLY = 'M54 24 C96 6 204 6 246 24 C272 70 282 130 278 186 C272 252 230 304 150 318 C70 304 28 252 22 186 C18 130 28 70 54 24 Z';

const TUBE = isDark ? '#C9897A' : '#EDB7A6';
const TUBE_LIGHT = isDark ? '#E3A898' : '#F8D6CB';
const SMALL_TUBE = isDark ? '#D79A8A' : '#F2C4B6';

function rectOf(key: string) {
  if (key === 'makat') return ANUS;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) if (GRID[r][c].key === key) return { x: XS[c], y: YS[r], w: XS[c + 1] - XS[c], h: YS[r + 1] - YS[r] };
  return null;
}

/** The organs; `tone` recolours them (used clipped to an area to light it up). */
function Organs({ tone, light }: { tone?: string; light?: string }) {
  return (
    <>
      <Path d={DUODENUM} stroke={tone ?? SMALL_TUBE} strokeWidth={11} strokeLinecap="round" fill="none" />
      <Path d={SMALL} stroke={tone ?? SMALL_TUBE} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={SMALL} stroke={light ?? TUBE_LIGHT} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.7} />
      <Path d={APPENDIX} stroke={tone ?? TUBE} strokeWidth={7} strokeLinecap="round" fill="none" />
      <Path d={COLON} stroke={tone ?? TUBE} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={COLON} stroke={light ?? TUBE_LIGHT} strokeWidth={8} strokeLinecap="round" strokeDasharray="10 12" fill="none" opacity={0.8} />
      <Circle cx={226} cy={266} r={15} fill={tone ?? TUBE} />
      <Path d={STOMACH} fill={tone ?? TUBE} />
      <Path d="M96 46 C90 56 96 62 108 64" stroke={light ?? TUBE_LIGHT} strokeWidth={4} strokeLinecap="round" fill="none" />
    </>
  );
}

/**
 * Tap where it hurts (several places are fine). With `counts` it is a read-only heat map:
 * the more often a place was marked, the deeper the colour, with the count on it.
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
  const level = (k: string) => (counts ? (counts.get(k) ?? 0) / max : value.includes(k) ? 1 : 0);
  const toggle = (k: string) => onChange?.(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  const lit = [...GRID.flat(), EXTRA[0]].filter((a) => level(a.key) > 0);
  const marked = counts ? AREAS.filter((a) => counts.get(a.key)) : AREAS.filter((a) => value.includes(a.key));
  const pct = (n: number, of: number) => `${(n / of) * 100}%` as const;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ width: '100%', maxWidth: 300, alignSelf: 'center', aspectRatio: W / H }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <ClipPath id="pm-belly">
              <Path d={BELLY} />
            </ClipPath>
            {lit.map((a) => {
              const r = rectOf(a.key)!;
              return (
                <ClipPath key={a.key} id={`pm-${a.key}`}>
                  <Rect x={r.x} y={r.y} width={r.w} height={r.h} />
                </ClipPath>
              );
            })}
          </Defs>
          <Path d={BELLY} fill={surface.well} stroke={palette.hairline} strokeWidth={2} />
          {/* the nine areas as faint lines across the belly, so it's clear where to tap */}
          {onChange ? (
            <G clipPath="url(#pm-belly)">
              {[XS[1], XS[2]].map((x) => (
                <Path key={`x${x}`} d={`M${x} 0 L${x} ${H}`} stroke={palette.hairline} strokeWidth={1.5} strokeDasharray="4 6" />
              ))}
              {[YS[1], YS[2]].map((y) => (
                <Path key={`y${y}`} d={`M0 ${y} L${W} ${y}`} stroke={palette.hairline} strokeWidth={1.5} strokeDasharray="4 6" />
              ))}
            </G>
          ) : null}
          {lit.map((a) => {
            const r = rectOf(a.key)!;
            return <Rect key={`g-${a.key}`} x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} rx={16} fill={soft(color, 0.1 + 0.18 * level(a.key))} />;
          })}
          <Organs />
          <Circle cx={150} cy={312} r={5} fill={TUBE} />
          {lit.map((a) => (
            <G key={`o-${a.key}`} clipPath={`url(#pm-${a.key})`} opacity={0.45 + 0.55 * level(a.key)}>
              <Organs tone={color} light={soft(color, 0.45)} />
              {a.key === 'makat' ? <Circle cx={150} cy={312} r={7} fill={color} /> : null}
            </G>
          ))}
          {counts
            ? lit.map((a) => {
                const r = rectOf(a.key)!;
                const cx = a.key === 'makat' ? r.x + r.w + 4 : r.x + r.w - 16;
                const cy = a.key === 'makat' ? r.y + 20 : r.y + 16;
                return (
                  <G key={`n-${a.key}`}>
                    <Circle cx={cx} cy={cy} r={11} fill={color} />
                    <SvgText x={cx} y={cy + 4} fontSize={12} fontFamily="Nunito_800ExtraBold" fill={onTint(color)} textAnchor="middle">
                      {String(counts.get(a.key))}
                    </SvgText>
                  </G>
                );
              })
            : null}
        </Svg>
        {/* tap targets over the drawing */}
        {[...GRID.flat(), EXTRA[0]].map((a) => {
          const r = rectOf(a.key)!;
          const on = level(a.key) > 0;
          const n = counts?.get(a.key) ?? 0;
          return (
            <Tap
              key={a.key}
              onPress={onChange ? () => toggle(a.key) : undefined}
              haptic={!!onChange}
              accessibilityRole={onChange ? 'button' : undefined}
              accessibilityState={onChange ? { selected: on } : undefined}
              accessibilityLabel={counts ? `${a.label}, ${a.organ}: ${n} kez` : `${a.label}, ${a.organ}`}
              style={{ position: 'absolute', left: pct(r.x, W), top: pct(r.y, H), width: pct(r.w, W), height: pct(r.h, H) }}
            />
          );
        })}
      </View>

      {marked.length ? (
        <View style={{ gap: 4 }}>
          {marked.map((a) => (
            <Row key={a.key} gap={8}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
              <T v="small" style={{ flex: 1 }}>
                <T v="small" style={{ fontWeight: '700' }}>
                  {a.label}
                </T>
                <T v="small" color={palette.inkSoft}>{` · ${a.organ}${counts ? ` · ${counts.get(a.key)} kez` : ''}`}</T>
              </T>
            </Row>
          ))}
        </View>
      ) : (
        <T v="caption" color={palette.inkFaint} style={{ textAlign: 'center', fontWeight: '400' }}>
          {onChange ? 'Ağrıyan yere dokun. Kendi karnına bakar gibi: sağın ekranın sağında.' : 'Kendi karnına bakar gibi: sağın ekranın sağında.'}
        </T>
      )}

      {onChange ? (
        <Row gap={8} style={{ justifyContent: 'center' }}>
          {EXTRA.map((a) => (
            <Chip key={a.key} label={a.label} active={value.includes(a.key)} color={color} onPress={() => toggle(a.key)} />
          ))}
        </Row>
      ) : null}
    </View>
  );
}
