import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import React from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { Verdict } from '../lib/foods';
import { isDark, onTint, palette, radius, size, soft, surface, type } from '../lib/theme';
import { Text } from './text';

/*
 * Crohnic design system v2 (Apple HIG)
 * - Content layer: opaque grouped cards on the background. No glass here.
 * - Functional layer: Liquid Glass only for things that float (tab bar, search, the add
 *   panel, the floating gear / + buttons).
 * - Controls in content are filled: one prominent (accent) action per view, the rest gray.
 * - Selection = accent (or the item's signal colour); signal colours mean one thing each.
 * - Labels inside controls never wrap: one line, shrink to fit.
 */

export type SymbolName = SymbolViewProps['name'];

// ---------- system settings ----------
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

// Reduce Transparency: glass and blur become opaque surfaces.
let reduceTransparency = false;
AccessibilityInfo.isReduceTransparencyEnabled?.()
  .then((v) => {
    reduceTransparency = v;
  })
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceTransparencyChanged', (v) => {
  reduceTransparency = v;
});

// Reduce Motion: slides and looping animations give way to fades or stillness.
let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.()
  .then((v) => {
    reduceMotion = v;
  })
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => {
  reduceMotion = v;
});
export function prefersReducedMotion() {
  return reduceMotion;
}

const hapticTap = () => Haptics.selectionAsync().catch(() => {});

// ---------- glass (functional layer only) ----------
/** Liquid Glass on iOS 26, blur below that, opaque with Reduce Transparency. Only for floating controls. */
export function Glass({ children, style, tint, interactive }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; tint?: string; interactive?: boolean }) {
  if (reduceTransparency) {
    return (
      <View style={[{ overflow: 'hidden', backgroundColor: tint ?? surface.sheet, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.hairline }, style]}>
        {children}
      </View>
    );
  }
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

/**
 * Pressable control surface. Filled (gray, or `tint`) in the content layer; pass `glass`
 * for controls that float over content. Highlights on press-in, haptic on press.
 */
export function GlassPress({
  children,
  onPress,
  onLongPress,
  tint,
  style,
  disabled,
  haptic = 'select',
  accessibilityLabel,
  glass,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  tint?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: 'select' | 'impact' | 'none';
  accessibilityLabel?: string;
  glass?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onLongPress={onLongPress}
      onPress={() => {
        if (haptic === 'select') hapticTap();
        if (haptic === 'impact') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.7 : 1, transform: [{ scale: pressed && !(glass && hasLiquidGlass()) ? 0.97 : 1 }] })}
    >
      {glass ? (
        <Glass interactive tint={tint} style={style}>
          {children}
        </Glass>
      ) : (
        <View style={[{ backgroundColor: tint ?? surface.well, overflow: 'hidden' }, style]}>{children}</View>
      )}
    </Pressable>
  );
}

// ---------- background ----------
/** Flat grouped background; during a flare a soft warm light at the top marks the mode. */
export function Backdrop({ tone = 'calm' }: { tone?: 'calm' | 'flare' }) {
  if (tone !== 'flare') return <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.paper }]} pointerEvents="none" />;
  const [a] = surface.glow.flare;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="flare" cx="50%" cy="0%" r="75%">
            <Stop offset="0" stopColor={a} stopOpacity={0.9} />
            <Stop offset="1" stopColor={a} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={palette.paper} />
        <Rect width="100%" height="100%" fill="url(#flare)" />
      </Svg>
    </View>
  );
}

// ---------- text ----------
// iOS text-style sizes (Large Title 34 … Caption 12) set in Nunito; Nunito brings its own spacing.
type Variant = 'large' | 'title' | 'h2' | 'h3' | 'body' | 'callout' | 'small' | 'caption';
const variantStyle: Record<Variant, TextStyle> = {
  large: { ...type.display, fontSize: 34, lineHeight: 41, letterSpacing: -0.3 },
  title: { ...type.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.2 },
  h2: { fontWeight: '800', fontSize: 22, lineHeight: 28, letterSpacing: -0.1 },
  h3: { fontWeight: '700', fontSize: 17, lineHeight: 22, letterSpacing: 0 },
  body: { ...type.body, fontSize: 17, lineHeight: 23, letterSpacing: 0 },
  callout: { ...type.body, fontSize: 16, lineHeight: 22, letterSpacing: 0 },
  small: { ...type.body, fontSize: 15, lineHeight: 20, letterSpacing: 0 },
  caption: { ...type.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0 },
};

export function T({ v = 'body', color = palette.ink, style, ...rest }: TextProps & { v?: Variant; color?: string }) {
  // page and section titles are headings for VoiceOver's rotor
  const role = rest.accessibilityRole ?? (v === 'large' || v === 'h2' ? 'header' : undefined);
  return <Text {...rest} accessibilityRole={role} style={[variantStyle[v], { color }, style]} />;
}

/** Single-line label for controls: never wraps, shrinks a little if it must. */
function Label({ children, color, small }: { children: string; color: string; small?: boolean }) {
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.75}
      style={[type.semibold, { fontSize: small ? 15 : 17, lineHeight: small ? 20 : 22, letterSpacing: small ? -0.23 : -0.43, color, flexShrink: 1 }]}
    >
      {children}
    </Text>
  );
}

// ---------- icons ----------
export function Icon({ name, size: s = 20, color = palette.ink, fallback }: { name: SymbolName; size?: number; color?: string; fallback?: string }) {
  return <SymbolView name={name} size={s} tintColor={color} weight="semibold" fallback={<Text style={{ fontSize: s * 0.9 }}>{fallback ?? '•'}</Text>} />;
}

/** Settings-style icon tile: rounded square in the item's colour, white (or dark) glyph. */
export function IconBubble({ name, color, dim = size.icon, fallback }: { name: SymbolName; color: string; dim?: number; fallback?: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: dim, height: dim, borderRadius: dim * 0.3, backgroundColor: soft(color), alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name={name} size={dim * 0.52} color={color} fallback={fallback} />
    </View>
  );
}

/** Round button that floats over content (gear, +): the one place content screens use glass. */
export function IconButton({ name, onPress, label, fallback }: { name: SymbolName; onPress: () => void; label: string; fallback?: string }) {
  return (
    <GlassPress glass onPress={onPress} accessibilityLabel={label} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} color={palette.ink} fallback={fallback} />
    </GlassPress>
  );
}

// ---------- layout ----------
/**
 * Scrolling page. Insets are applied explicitly (not via contentInsetAdjustmentBehavior):
 * native tabs on iOS 26 don't pass the top safe area to RN scroll views, which pushed titles
 * under the status bar.
 */
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
  const insets = useSafeAreaInsets();
  const page = (
    <View style={{ flex: 1, backgroundColor: palette.paper }}>
      {header ? <Backdrop tone={tone} /> : null}
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustKeyboardInsets
        scrollIndicatorInsets={{ top: header ? insets.top : 0, bottom: header ? insets.bottom + 60 : insets.bottom }}
        contentContainerStyle={[
          {
            paddingHorizontal: 16,
            paddingTop: header ? insets.top + 8 : 16,
            paddingBottom: header ? insets.bottom + 100 : insets.bottom + 24,
            gap: size.gap,
          },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
  return page;
}

export function Card({
  children,
  style,
  tint,
  ...a11y
}: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tint?: string } & Pick<ViewProps, 'accessible' | 'accessibilityLabel' | 'accessibilityRole'>) {
  return (
    <View {...a11y} style={[st.card, tint ? { backgroundColor: tint } : null, style]}>
      {children}
    </View>
  );
}

export function Row({ children, gap = 10, style }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/** Press feedback for content rows and cards: highlight on press-in. */
export function Tap({ children, style, onPress, haptic = true, ...rest }: PressableProps & { haptic?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      {...rest}
      onPress={(e) => {
        if (haptic) hapticTap();
        onPress?.(e);
      }}
      style={({ pressed }) => [style, { opacity: pressed ? 0.6 : 1 }]}
    >
      {children as React.ReactNode}
    </Pressable>
  );
}

// ---------- buttons ----------
/**
 * primary: filled accent, one per view · glass (legacy name) = gray secondary ·
 * danger: red label on gray · plain: text only
 */
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
  /** fill for primary buttons (defaults to the accent) */
  color?: string;
  compact?: boolean;
}) {
  const fill = kind === 'primary' ? (color ?? palette.lettuce) : kind === 'plain' ? 'transparent' : surface.well;
  const fg = kind === 'primary' ? onTint(fill) : kind === 'danger' ? palette.bad : kind === 'plain' ? palette.lettuceDeep : palette.ink;
  const h = compact ? size.buttonSm : size.button;
  return (
    <View style={style}>
      <GlassPress tint={fill} disabled={disabled || loading} haptic="impact" onPress={onPress} accessibilityLabel={title} style={{ borderRadius: radius.pill }}>
        <View style={[st.btnInner, { minHeight: h, paddingHorizontal: compact ? 14 : 20, paddingVertical: 6 }]}>
          {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} color={fg} size={compact ? 15 : 17} /> : null}
          <Label color={fg} small={compact}>
            {title}
          </Label>
        </View>
      </GlassPress>
    </View>
  );
}

/** Filter / suggestion chip. Selected = filled with its colour (accent by default). */
export function Chip({ label, active, onPress, color = palette.lettuce, emoji }: { label: string; active?: boolean; onPress?: () => void; color?: string; emoji?: string }) {
  const fill = color === palette.ink ? palette.lettuce : color;
  return (
    <GlassPress onPress={onPress} tint={active ? fill : surface.well} style={st.chip} accessibilityLabel={label}>
      <Label small color={active ? onTint(fill) : palette.ink}>
        {`${emoji ? `${emoji}  ` : ''}${label}`}
      </Label>
    </GlassPress>
  );
}

/** iOS segmented control: gray track, raised selected segment. Colour only marks the selected label. */
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
    <View style={{ borderRadius: radius.md, padding: 3, backgroundColor: surface.well, flexDirection: 'row', gap: 2 }} accessibilityRole="tablist">
      {items.map((it) => {
        const on = it.key === value;
        const c = on ? (it.color ?? palette.ink) : palette.inkSoft;
        return (
          <Pressable
            key={it.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              hapticTap();
              onChange(it.key);
            }}
            style={{ flex: 1 }}
          >
            <View style={[st.segment, on ? st.segmentOn : null]}>
              {it.icon ? <Icon name={it.icon} size={14} color={c} /> : null}
              <Label small color={c}>
                {it.label}
              </Label>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 0–5 rating. Selected values fill with the scale's colour. */
export function Scale({ value, onChange, max = 5, color = palette.lettuce, labels }: { value: number; onChange: (v: number) => void; max?: number; color?: string; labels?: [string, string] }) {
  return (
    <View style={{ gap: 6 }}>
      <Row gap={6}>
        {Array.from({ length: max + 1 }, (_, i) => {
          const on = i === 0 ? value === 0 : i <= value;
          const fill = on ? (i === 0 ? palette.inkSoft : color) : surface.well;
          return (
            <View key={i} style={{ flex: 1 }}>
              <GlassPress onPress={() => onChange(i)} tint={fill} style={st.scaleDot} accessibilityLabel={`${i}`}>
                <Label color={on ? onTint(fill) : palette.inkSoft}>{String(i)}</Label>
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

/** Equal-width choices with an emoji on top (reactions, stress, sleep). Selected = filled with its colour. */
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
            <GlassPress
              onPress={() => onChange(it.key)}
              tint={on ? it.color : surface.well}
              style={[st.option, { minHeight: compact ? 70 : 80, paddingVertical: 8 }]}
              accessibilityLabel={it.label}
            >
              <Text style={{ fontSize: compact ? 22 : 26 }}>{it.emoji}</Text>
              <Label small color={on ? onTint(it.color) : palette.ink}>
                {it.label}
              </Label>
            </GlassPress>
          </View>
        );
      })}
    </Row>
  );
}

/** Full-width selectable row (e.g. Bristol types). */
export function ChoiceRow({ title, subtitle, emoji, active, color, onPress }: { title: string; subtitle?: string; emoji: string; active?: boolean; color: string; onPress: () => void }) {
  const fg = active ? onTint(color) : palette.ink;
  return (
    <GlassPress onPress={onPress} tint={active ? color : surface.card} style={st.choice} accessibilityLabel={title}>
      <View style={[st.choiceIcon, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : surface.well }]}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Label color={fg}>{title}</Label>
        {subtitle ? (
          <Text numberOfLines={1} style={{ fontSize: 15, lineHeight: 20, color: active ? fg : palette.inkSoft, opacity: active ? 0.85 : 1 }}>
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
      <Text numberOfLines={1} style={[type.semibold, { fontSize: 13, color: u.fg }]}>
        {sz === 'sm' ? u.short : u.label}
      </Text>
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 }}>
      <T v="h2">{title}</T>
      {action && onAction ? (
        <Tap onPress={onAction} hitSlop={10} accessibilityRole="button">
          <T v="callout" color={palette.lettuceDeep} style={type.semibold}>
            {action}
          </T>
        </Tap>
      ) : null}
    </Row>
  );
}

/** Empty state; `art` is usually a Kıvırcık pose (passed in to keep ui.tsx free of Mascot). */
export function Empty({ art, title, text }: { art: React.ReactNode; title: string; text?: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
      {art}
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
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chip: { minHeight: 36, paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' },
  segment: { minHeight: 36, paddingVertical: 6, borderRadius: radius.md - 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4 },
  segmentOn: {
    backgroundColor: isDark ? '#3A3F3C' : '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: isDark ? 0 : 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  scaleDot: { minHeight: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  choice: { minHeight: 64, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  choiceIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  option: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 6 },
  input: {
    backgroundColor: surface.cardStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 17,
    color: palette.ink,
  },
});
