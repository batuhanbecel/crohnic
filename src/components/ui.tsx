import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { Verdict } from '../lib/foods';
import { palette, radius, shadow, surface, type } from '../lib/theme';

// ---------- liquid glass ----------
let glassOk: boolean | null = null;
export function hasLiquidGlass() {
  if (glassOk === null) {
    try {
      glassOk = Platform.OS === 'ios' && isLiquidGlassAvailable();
    } catch {
      glassOk = false;
    }
  }
  return glassOk;
}

/** iOS 26 liquid glass, with a frosted blur fallback on older systems. */
export function Glass({
  children,
  style,
  tint,
  interactive,
  clear,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tint?: string;
  interactive?: boolean;
  clear?: boolean;
}) {
  if (hasLiquidGlass()) {
    return (
      <GlassView glassEffectStyle={clear ? 'clear' : 'regular'} tintColor={tint} isInteractive={interactive} style={[{ overflow: 'hidden' }, style]}>
        {children}
      </GlassView>
    );
  }
  return (
    <View style={[{ overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.8)' }, style]}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint ?? 'rgba(255,255,255,0.45)' }]} />
      {children}
    </View>
  );
}

// ---------- background ----------
export function Backdrop({ tone = 'calm' }: { tone?: 'calm' | 'flare' }) {
  const a = tone === 'flare' ? '#C9C5FF' : '#C6E89B';
  const b = tone === 'flare' ? '#BFE0F7' : '#FFD9B0';
  const c = tone === 'flare' ? '#E7D7FF' : '#D9D7FF';
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="a" cx="10%" cy="0%" r="70%">
            <Stop offset="0" stopColor={a} stopOpacity={0.9} />
            <Stop offset="1" stopColor={a} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="b" cx="100%" cy="30%" r="60%">
            <Stop offset="0" stopColor={b} stopOpacity={0.75} />
            <Stop offset="1" stopColor={b} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="c" cx="20%" cy="100%" r="70%">
            <Stop offset="0" stopColor={c} stopOpacity={0.7} />
            <Stop offset="1" stopColor={c} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={palette.paper} />
        <Rect width="100%" height="100%" fill="url(#a)" />
        <Rect width="100%" height="100%" fill="url(#b)" />
        <Rect width="100%" height="100%" fill="url(#c)" />
      </Svg>
    </View>
  );
}

// ---------- text ----------
type Variant = 'large' | 'title' | 'h2' | 'h3' | 'body' | 'callout' | 'small' | 'caption';
const variantStyle: Record<Variant, TextStyle> = {
  large: { ...type.display, fontSize: 34, lineHeight: 40, letterSpacing: 0.2 },
  title: { ...type.display, fontSize: 26, lineHeight: 31 },
  h2: { ...type.rounded, fontSize: 20, lineHeight: 25 },
  h3: { ...type.semibold, fontSize: 17, lineHeight: 22 },
  body: { ...type.body, fontSize: 17, lineHeight: 23 },
  callout: { ...type.body, fontSize: 16, lineHeight: 21 },
  small: { ...type.body, fontSize: 14, lineHeight: 19 },
  caption: { ...type.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
};

export function T({ v = 'body', color = palette.ink, style, ...rest }: TextProps & { v?: Variant; color?: string }) {
  return <Text {...rest} style={[variantStyle[v], { color }, style]} />;
}

// ---------- icon ----------
export function Icon({ name, size = 20, color = palette.ink, fallback }: { name: SymbolViewProps['name']; size?: number; color?: string; fallback?: string }) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight="semibold"
      fallback={<Text style={{ fontSize: size * 0.9 }}>{fallback ?? '•'}</Text>}
    />
  );
}

// ---------- layout ----------
export function Screen({
  children,
  contentStyle,
  tone,
  header = true,
}: {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  tone?: 'calm' | 'flare';
  /** false when a native header sits above the screen */
  header?: boolean;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.paper }}>
      <Backdrop tone={tone} />
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[{ paddingHorizontal: 18, paddingTop: header ? 8 : 12, paddingBottom: 40, gap: 14 }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Card({ children, style, tint }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  return <View style={[st.card, tint ? { backgroundColor: tint, borderColor: 'transparent' } : null, style]}>{children}</View>;
}

export function Row({ children, gap = 10, style }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

// ---------- pressables ----------
export function Tap({ children, style, onPress, haptic = true, ...rest }: PressableProps & { haptic?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      {...rest}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={({ pressed }) => [style, { opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      {children as React.ReactNode}
    </Pressable>
  );
}

type BtnKind = 'primary' | 'glass' | 'plain' | 'danger';
export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  loading,
  disabled,
  style,
  color,
}: {
  title: string;
  onPress?: () => void;
  kind?: BtnKind;
  icon?: SymbolViewProps['name'];
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  color?: string;
}) {
  const fg = kind === 'primary' ? '#fff' : kind === 'danger' ? palette.bad : kind === 'plain' ? palette.inkSoft : palette.ink;
  const inner = (
    <>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} color={fg} size={17} /> : null}
      <T v="h3" color={fg}>
        {title}
      </T>
    </>
  );
  const press = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };
  if (kind === 'glass') {
    return (
      <Pressable onPress={press} style={[{ opacity: disabled ? 0.4 : 1 }, style]}>
        <Glass interactive style={st.btn}>
          <View style={[st.btnInner, { flex: 1 }]}>{inner}</View>
        </Glass>
      </Pressable>
    );
  }
  const bg = kind === 'primary' ? color ?? palette.ink : kind === 'danger' ? palette.badSoft : 'transparent';
  return (
    <Pressable
      onPress={press}
      style={({ pressed }) => [st.btn, st.btnInner, { backgroundColor: bg, opacity: disabled ? 0.35 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
    >
      {inner}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color = palette.ink, emoji }: { label: string; active?: boolean; onPress?: () => void; color?: string; emoji?: string }) {
  return (
    <Tap onPress={onPress} style={[st.chip, active ? { backgroundColor: color, borderColor: color } : null]}>
      <T v="small" color={active ? '#fff' : palette.ink} style={type.semibold}>
        {emoji ? `${emoji}  ` : ''}
        {label}
      </T>
    </Tap>
  );
}

/** iOS style segmented control on glass. */
export function Segmented<K extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: K; label: string; color?: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  return (
    <Glass style={{ borderRadius: radius.pill, padding: 4 }}>
      <View style={{ flexDirection: 'row' }}>
        {items.map((it) => {
          const on = it.key === value;
          return (
            <Tap
              key={it.key}
              onPress={() => onChange(it.key)}
              style={{ flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center', backgroundColor: on ? it.color ?? palette.ink : 'transparent' }}
            >
              <T v="callout" color={on ? '#fff' : palette.inkSoft} style={type.semibold}>
                {it.label}
              </T>
            </Tap>
          );
        })}
      </View>
    </Glass>
  );
}

// ---------- verdict ----------
export const VERDICT_UI: Record<Verdict, { label: string; short: string; icon: SymbolViewProps['name']; dot: string; fg: string; bg: string }> = {
  iyi: { label: 'Rahat ye', short: 'İyi gelir', icon: 'checkmark.circle.fill', dot: '🟢', fg: palette.good, bg: palette.goodSoft },
  dikkat: { label: 'Az ve dikkatli', short: 'Dikkat', icon: 'exclamationmark.circle.fill', dot: '🟠', fg: palette.warn, bg: palette.warnSoft },
  riskli: { label: 'Bugün geç', short: 'Riskli', icon: 'xmark.circle.fill', dot: '🔴', fg: palette.bad, bg: palette.badSoft },
};

export function VerdictBadge({ verdict, size = 'md' }: { verdict: Verdict; size?: 'sm' | 'md' }) {
  const u = VERDICT_UI[verdict];
  return (
    <View style={[st.badge, { backgroundColor: u.bg }, size === 'sm' && { paddingHorizontal: 8, paddingVertical: 3 }]}>
      <Icon name={u.icon} size={size === 'sm' ? 12 : 14} color={u.fg} fallback={u.dot} />
      <T v="caption" color={u.fg}>
        {size === 'sm' ? u.short : u.label}
      </T>
    </View>
  );
}

// ---------- inputs ----------
export function Scale({ value, onChange, max = 5, color = palette.ink, labels }: { value: number; onChange: (v: number) => void; max?: number; color?: string; labels?: [string, string] }) {
  return (
    <View style={{ gap: 6 }}>
      <Row gap={6}>
        {Array.from({ length: max + 1 }, (_, i) => {
          const on = i <= value && i > 0;
          return (
            <Tap key={i} onPress={() => onChange(i)} style={[st.scaleDot, on ? { backgroundColor: color } : null, i === value && i === 0 ? { backgroundColor: palette.ink } : null]}>
              <T v="h3" color={on || (i === 0 && value === 0) ? '#fff' : palette.inkSoft}>
                {i}
              </T>
            </Tap>
          );
        })}
      </Row>
      {labels ? (
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="caption" color={palette.inkFaint}>
            {labels[0]}
          </T>
          <T v="caption" color={palette.inkFaint}>
            {labels[1]}
          </T>
        </Row>
      ) : null}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 2 }}>
      <T v="h2">{title}</T>
      {action ? (
        <Tap onPress={onAction} hitSlop={10}>
          <T v="callout" color={palette.peri} style={type.semibold}>
            {action}
          </T>
        </Tap>
      ) : null}
    </Row>
  );
}

export function Empty({ emoji, title, text }: { emoji: string; title: string; text?: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 28, gap: 6 }}>
      <Text style={{ fontSize: 38 }}>{emoji}</Text>
      <T v="h3">{title}</T>
      {text ? (
        <T v="small" color={palette.inkSoft} style={{ textAlign: 'center' }}>
          {text}
        </T>
      ) : null}
    </Card>
  );
}

export const st = StyleSheet.create({
  card: {
    backgroundColor: surface.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: surface.cardBorder,
    ...shadow,
  },
  btn: { height: 52, borderRadius: radius.pill },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: surface.card,
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  scaleDot: { flex: 1, height: 44, borderRadius: 14, backgroundColor: surface.well, alignItems: 'center', justifyContent: 'center' },
  input: {
    backgroundColor: surface.cardStrong,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: palette.ink,
  },
});
