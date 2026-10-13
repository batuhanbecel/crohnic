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
import { isDark, onTint, palette, radius, shadow, size, surface, type } from '../lib/theme';

/*
 * Crohnic design system
 * - Content sits on translucent white Cards (radius.lg, padding 16).
 * - Everything you can press is liquid glass: Button, IconButton, Chip, Segmented, Scale, Reaction.
 * - Coloured glass = selected / primary. Clear glass = secondary.
 * - Labels inside controls never wrap: one line, shrink to fit.
 */

export type SymbolName = SymbolViewProps['name'];

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

/** iOS 26 liquid glass. On older systems: frosted blur with the same tint. */
export function Glass({
  children,
  style,
  tint,
  interactive,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tint?: string;
  interactive?: boolean;
}) {
  if (hasLiquidGlass()) {
    return (
      <GlassView glassEffectStyle="regular" tintColor={tint} isInteractive={interactive} style={[{ overflow: 'hidden' }, style]}>
        {children}
      </GlassView>
    );
  }
  return (
    <View style={[{ overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: surface.glassBorder }, style]}>
      <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint ?? surface.glassFill, opacity: tint ? 0.92 : 1 }]} />
      {children}
    </View>
  );
}

/** Pressable liquid glass with haptics. Base for every control. */
export function GlassPress({
  children,
  onPress,
  onLongPress,
  tint,
  style,
  disabled,
  haptic = 'select',
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  tint?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: 'select' | 'impact' | 'none';
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onLongPress={onLongPress}
      onPress={() => {
        if (haptic === 'select') Haptics.selectionAsync().catch(() => {});
        if (haptic === 'impact') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed && !hasLiquidGlass() ? 0.97 : 1 }] })}
    >
      <Glass interactive tint={tint} style={style}>
        {children}
      </Glass>
    </Pressable>
  );
}

// ---------- background ----------
export function Backdrop({ tone = 'calm' }: { tone?: 'calm' | 'flare' }) {
  const [a, b, c] = surface.glow[tone];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="a" cx="10%" cy="0%" r="70%">
            <Stop offset="0" stopColor={a} stopOpacity={0.9 * surface.glowOpacity} />
            <Stop offset="1" stopColor={a} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="b" cx="100%" cy="30%" r="60%">
            <Stop offset="0" stopColor={b} stopOpacity={0.75 * surface.glowOpacity} />
            <Stop offset="1" stopColor={b} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="c" cx="20%" cy="100%" r="70%">
            <Stop offset="0" stopColor={c} stopOpacity={0.7 * surface.glowOpacity} />
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

/** Single-line label for controls: never wraps, shrinks a little if it must. */
function Label({ children, color, small }: { children: string; color: string; small?: boolean }) {
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.75}
      style={[type.semibold, { fontSize: small ? 14 : 16, lineHeight: small ? 18 : 20, color, flexShrink: 1 }]}
    >
      {children}
    </Text>
  );
}

// ---------- icon ----------
export function Icon({ name, size: s = 20, color = palette.ink, fallback }: { name: SymbolName; size?: number; color?: string; fallback?: string }) {
  return (
    <SymbolView name={name} size={s} tintColor={color} weight="semibold" fallback={<Text style={{ fontSize: s * 0.9 }}>{fallback ?? '•'}</Text>} />
  );
}

/** Glass bubble with a symbol. Tinted = filled colour glass with white glyph. */
export function IconBubble({ name, color, dim = size.icon, fallback }: { name: SymbolName; color: string; dim?: number; fallback?: string }) {
  return (
    <Glass tint={color} style={{ width: dim, height: dim, borderRadius: dim / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={dim * 0.45} color="#fff" fallback={fallback} />
    </Glass>
  );
}

export function IconButton({ name, onPress, label, fallback }: { name: SymbolName; onPress: () => void; label: string; fallback?: string }) {
  return (
    <GlassPress onPress={onPress} accessibilityLabel={label} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} color={palette.ink} fallback={fallback} />
    </GlassPress>
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
        contentContainerStyle={[{ paddingHorizontal: 18, paddingTop: header ? 8 : 12, paddingBottom: 40, gap: size.gap }, contentStyle]}
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

/** Plain press feedback for content (cards, rows). Controls use glass. */
export function Tap({ children, style, onPress, haptic = true, ...rest }: PressableProps & { haptic?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      {...rest}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={({ pressed }) => [style, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
    >
      {children as React.ReactNode}
    </Pressable>
  );
}

// ---------- buttons ----------
type BtnKind = 'primary' | 'glass' | 'danger' | 'plain';
export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  loading,
  disabled,
  style,
  color,
  compact,
}: {
  title: string;
  onPress?: () => void;
  kind?: BtnKind;
  icon?: SymbolName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** tint for primary buttons */
  color?: string;
  compact?: boolean;
}) {
  const tint = kind === 'primary' ? color ?? palette.ink : kind === 'danger' ? palette.bad : undefined;
  const fg = kind === 'primary' || kind === 'danger' ? onTint(tint) : kind === 'plain' ? palette.inkSoft : palette.ink;
  const h = compact ? size.buttonSm : size.button;
  const content = (
    <View style={[st.btnInner, { height: h, paddingHorizontal: compact ? 12 : 18 }]}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} color={fg} size={compact ? 15 : 17} /> : null}
      <Label color={fg} small={compact}>
        {title}
      </Label>
    </View>
  );
  if (kind === 'plain') {
    return (
      <Tap onPress={disabled || loading ? undefined : onPress} style={[{ opacity: disabled ? 0.4 : 1 }, style]}>
        {content}
      </Tap>
    );
  }
  return (
    <View style={style}>
      <GlassPress tint={tint} disabled={disabled || loading} haptic="impact" onPress={onPress} style={{ borderRadius: radius.pill }}>
        {content}
      </GlassPress>
    </View>
  );
}

export function Chip({ label, active, onPress, color = palette.ink, emoji }: { label: string; active?: boolean; onPress?: () => void; color?: string; emoji?: string }) {
  return (
    <GlassPress onPress={onPress} tint={active ? color : undefined} style={st.chip}>
      <Label small color={active ? onTint(color) : palette.ink}>
        {`${emoji ? `${emoji}  ` : ''}${label}`}
      </Label>
    </GlassPress>
  );
}

/** iOS style segmented control on glass. */
export function Segmented<K extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: K; label: string; color?: string; icon?: SymbolName }[];
  value: K;
  onChange: (k: K) => void;
}) {
  return (
    <Glass style={{ borderRadius: radius.pill, padding: 4 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {items.map((it) => {
          const on = it.key === value;
          const c = it.color ?? palette.ink;
          return (
            <Pressable
              key={it.key}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(it.key);
              }}
              style={{ flex: 1 }}
            >
              <View style={[st.segment, on ? { backgroundColor: c, ...shadow, shadowColor: c, shadowOpacity: 0.3, shadowRadius: 8 } : null]}>
                {it.icon ? <Icon name={it.icon} size={14} color={on ? onTint(c) : palette.inkSoft} /> : null}
                <Label small={items.length > 3} color={on ? onTint(c) : palette.inkSoft}>
                  {it.label}
                </Label>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Glass>
  );
}

/** 0–5 rating on glass dots. */
export function Scale({ value, onChange, max = 5, color = palette.ink, labels }: { value: number; onChange: (v: number) => void; max?: number; color?: string; labels?: [string, string] }) {
  return (
    <View style={{ gap: 6 }}>
      <Row gap={6}>
        {Array.from({ length: max + 1 }, (_, i) => {
          const on = i === 0 ? value === 0 : i <= value;
          const tint = on ? (i === 0 ? palette.ink : color) : undefined;
          return (
            <View key={i} style={{ flex: 1 }}>
              <GlassPress onPress={() => onChange(i)} tint={tint} style={st.scaleDot}>
                <Label color={on ? onTint(tint) : palette.inkSoft}>{String(i)}</Label>
              </GlassPress>
            </View>
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

/** Equal-width glass options with an emoji on top (used for reactions). */
export function OptionTiles<K extends string | number>({
  items,
  value,
  onChange,
  compact,
}: {
  items: { key: K; emoji: string; label: string; color: string }[];
  value?: K | null;
  onChange: (k: K) => void;
  compact?: boolean;
}) {
  return (
    <Row gap={8}>
      {items.map((it) => {
        const on = value === it.key;
        return (
          <View key={String(it.key)} style={{ flex: 1 }}>
            <GlassPress onPress={() => onChange(it.key)} tint={on ? it.color : undefined} style={[st.option, { height: compact ? 66 : 78 }]}>
              <Text style={{ fontSize: compact ? 22 : 26 }}>{it.emoji}</Text>
              <Label small color={on ? '#fff' : it.color}>
                {it.label}
              </Label>
            </GlassPress>
          </View>
        );
      })}
    </Row>
  );
}

/** Full-width selectable glass row (e.g. Bristol types). */
export function ChoiceRow({
  title,
  subtitle,
  emoji,
  active,
  color,
  onPress,
}: {
  title: string;
  subtitle?: string;
  emoji: string;
  active?: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <GlassPress onPress={onPress} tint={active ? color : undefined} style={st.choice}>
      <View style={[st.choiceIcon, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : surface.well }]}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Label color={active ? '#fff' : palette.ink}>{title}</Label>
        {subtitle ? (
          <Text numberOfLines={1} style={{ fontSize: 14, lineHeight: 19, color: active ? 'rgba(255,255,255,0.9)' : palette.inkSoft }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </GlassPress>
  );
}

// ---------- verdict ----------
export const VERDICT_UI: Record<Verdict, { label: string; short: string; icon: SymbolName; dot: string; fg: string; bg: string }> = {
  iyi: { label: 'Rahat ye', short: 'İyi gelir', icon: 'checkmark.circle.fill', dot: '🟢', fg: palette.good, bg: palette.goodSoft },
  dikkat: { label: 'Az ve dikkatli', short: 'Dikkat', icon: 'exclamationmark.circle.fill', dot: '🟡', fg: palette.warn, bg: palette.warnSoft },
  riskli: { label: 'Bugün geç', short: 'Riskli', icon: 'xmark.circle.fill', dot: '🔴', fg: palette.bad, bg: palette.badSoft },
};

export function VerdictBadge({ verdict, size: sz = 'md' }: { verdict: Verdict; size?: 'sm' | 'md' }) {
  const u = VERDICT_UI[verdict];
  return (
    <View style={[st.badge, { backgroundColor: u.bg }, sz === 'sm' && { paddingHorizontal: 8, paddingVertical: 3 }]}>
      <Icon name={u.icon} size={sz === 'sm' ? 12 : 14} color={u.fg} fallback={u.dot} />
      <Text numberOfLines={1} style={[type.semibold, { fontSize: 12, color: u.fg }]}>
        {sz === 'sm' ? u.short : u.label}
      </Text>
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 2 }}>
      <T v="h2">{title}</T>
      {action && onAction ? <Button title={action} kind="glass" compact onPress={onAction} /> : null}
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
    padding: size.pad,
    borderWidth: 1,
    borderColor: surface.cardBorder,
    ...shadow,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  chip: { height: 36, paddingHorizontal: 12, borderRadius: radius.pill, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' },
  segment: { height: 40, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  scaleDot: { height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  choice: { height: 64, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 },
  choiceIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  option: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 6 },
  input: {
    backgroundColor: surface.cardStrong,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: palette.ink,
  },
});
