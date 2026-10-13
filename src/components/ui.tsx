import * as Haptics from 'expo-haptics';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import React from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Verdict } from '../lib/foods';
import { colors, fonts, radius, shadow } from '../lib/theme';

// ---------- text ----------
type Variant = 'title' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'tiny';
const variantStyle: Record<Variant, TextStyle> = {
  title: { fontFamily: fonts.black, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  h1: { fontFamily: fonts.black, fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  h2: { fontFamily: fonts.heavy, fontSize: 20, lineHeight: 26 },
  h3: { fontFamily: fonts.heavy, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  tiny: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },
};

export function T({ v = 'body', color = colors.ink, style, ...rest }: TextProps & { v?: Variant; color?: string }) {
  return <Text {...rest} style={[variantStyle[v], { color }, style]} />;
}

// ---------- icon ----------
export function Icon({
  name,
  size = 20,
  color = colors.ink,
  fallback,
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color?: string;
  fallback?: string;
}) {
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
  scroll = true,
  padTop = true,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padTop?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: padTop ? insets.top + 12 : 16, paddingBottom: insets.bottom + 110, paddingHorizontal: 20 };
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: colors.bg }, pad, contentStyle]}>{children}</View>;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[pad, { gap: 16 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, tint }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  return <View style={[s.card, tint ? { backgroundColor: tint, shadowOpacity: 0 } : null, style]}>{children}</View>;
}

export function Row({ children, gap = 10, style }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

// ---------- buttons ----------
type BtnKind = 'primary' | 'soft' | 'ghost' | 'danger';
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
  const bg =
    kind === 'primary' ? color ?? colors.coral : kind === 'soft' ? colors.coralSoft : kind === 'danger' ? colors.tomatoSoft : 'transparent';
  const fg = kind === 'primary' ? '#fff' : kind === 'danger' ? colors.tomato : kind === 'soft' ? colors.ink : colors.inkSoft;
  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} color={fg} size={18} /> : null}
      <T v="h3" color={fg}>
        {title}
      </T>
    </Pressable>
  );
}

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

export function Chip({
  label,
  active,
  onPress,
  color = colors.coral,
  emoji,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  emoji?: string;
}) {
  return (
    <Tap onPress={onPress} style={[s.chip, active ? { backgroundColor: color, borderColor: color } : null]}>
      <T v="small" color={active ? '#fff' : colors.ink} style={{ fontFamily: fonts.bold }}>
        {emoji ? `${emoji} ` : ''}
        {label}
      </T>
    </Tap>
  );
}

// ---------- verdict ----------
export const VERDICT_UI: Record<Verdict, { label: string; short: string; emoji: string; fg: string; bg: string }> = {
  iyi: { label: 'Gönül rahatlığıyla', short: 'İyi gelir', emoji: '💚', fg: colors.mint, bg: colors.mintSoft },
  dikkat: { label: 'Az ve dikkatli', short: 'Dikkat', emoji: '💛', fg: '#C98A06', bg: colors.butterSoft },
  riskli: { label: 'Bugün pas geç', short: 'Riskli', emoji: '❤️‍🩹', fg: colors.tomato, bg: colors.tomatoSoft },
};

export function VerdictBadge({ verdict, size = 'md' }: { verdict: Verdict; size?: 'sm' | 'md' }) {
  const u = VERDICT_UI[verdict];
  return (
    <View style={[s.badge, { backgroundColor: u.bg }, size === 'sm' && { paddingHorizontal: 8, paddingVertical: 3 }]}>
      <View style={[s.dot, { backgroundColor: u.fg }]} />
      <T v="tiny" color={u.fg}>
        {size === 'sm' ? u.short.toLocaleUpperCase('tr-TR') : u.label.toLocaleUpperCase('tr-TR')}
      </T>
    </View>
  );
}

// ---------- inputs ----------
export function Scale({
  value,
  onChange,
  max = 5,
  color = colors.coral,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  color?: string;
  labels?: [string, string];
}) {
  return (
    <View style={{ gap: 6 }}>
      <Row gap={8}>
        {Array.from({ length: max + 1 }, (_, i) => (
          <Tap
            key={i}
            onPress={() => onChange(i)}
            style={[s.scaleDot, i <= value && i > 0 ? { backgroundColor: color, borderColor: color } : null, i === value ? { borderColor: color } : null]}
          >
            <T v="h3" color={i <= value && i > 0 ? '#fff' : colors.inkSoft}>
              {i}
            </T>
          </Tap>
        ))}
      </Row>
      {labels ? (
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="tiny" color={colors.inkFaint}>
            {labels[0]}
          </T>
          <T v="tiny" color={colors.inkFaint}>
            {labels[1]}
          </T>
        </Row>
      ) : null}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
      <T v="h2">{title}</T>
      {action ? (
        <Tap onPress={onAction} hitSlop={10}>
          <T v="small" color={colors.coral} style={{ fontFamily: fonts.heavy }}>
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
      <Text style={{ fontSize: 40 }}>{emoji}</Text>
      <T v="h3">{title}</T>
      {text ? (
        <T v="small" color={colors.inkSoft} style={{ textAlign: 'center' }}>
          {text}
        </T>
      ) : null}
    </Card>
  );
}

export const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, ...shadow },
  btn: {
    height: 54,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  scaleDot: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
});
