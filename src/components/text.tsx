import { forwardRef } from 'react';
import { AccessibilityInfo, Text as RNText, TextInput as RNTextInput, StyleSheet, type StyleProp, type TextInputProps, type TextProps, type TextStyle } from 'react-native';

/**
 * Text and TextInput for the whole app:
 * - Brand type: Nunito (loaded in the root layout). The weight in a style picks the matching
 *   Nunito file, since custom fonts can't be bolded synthetically without looking smeared.
 * - Dynamic Type capped at 1.5×: controls have fixed heights (buttons, chips, tiles) and
 *   uncapped system text sizes would overflow them.
 */
const MAX = 1.5;

const FACES: Record<string, string> = {
  '100': 'Nunito_400Regular',
  '200': 'Nunito_400Regular',
  '300': 'Nunito_400Regular',
  '400': 'Nunito_400Regular',
  normal: 'Nunito_400Regular',
  '500': 'Nunito_500Medium',
  '600': 'Nunito_600SemiBold',
  '700': 'Nunito_700Bold',
  bold: 'Nunito_700Bold',
  '800': 'Nunito_800ExtraBold',
  '900': 'Nunito_900Black',
};

/**
 * Settings > Accessibility > Bold Text. iOS bolds the system font by itself but not a custom one,
 * so with the setting on every Nunito weight steps up (regular reads as bold, bold as black).
 */
let boldText = false;
AccessibilityInfo.isBoldTextEnabled?.()
  .then((v) => (boldText = v))
  .catch(() => {});
AccessibilityInfo.addEventListener?.('boldTextChanged', (v) => (boldText = v));

const BOLDER: Record<string, string> = {
  Nunito_400Regular: 'Nunito_700Bold',
  Nunito_500Medium: 'Nunito_700Bold',
  Nunito_600SemiBold: 'Nunito_800ExtraBold',
  Nunito_700Bold: 'Nunito_800ExtraBold',
  Nunito_800ExtraBold: 'Nunito_900Black',
  Nunito_900Black: 'Nunito_900Black',
};

export function brandFont(style: StyleProp<TextStyle>): TextStyle {
  const s = StyleSheet.flatten(style) ?? {};
  const face = s.fontFamily?.startsWith('Nunito_') ? s.fontFamily : (FACES[String(s.fontWeight ?? '400')] ?? FACES['400']);
  return { ...s, fontFamily: boldText ? (BOLDER[face] ?? face) : face, fontWeight: undefined };
}

export const Text = forwardRef<RNText, TextProps>(function Text({ style, ...props }, ref) {
  return <RNText maxFontSizeMultiplier={MAX} {...props} style={brandFont(style)} ref={ref} />;
});

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput({ style, ...props }, ref) {
  return <RNTextInput maxFontSizeMultiplier={MAX} {...props} style={brandFont(style)} ref={ref} />;
});

// same name as the component so `useRef<TextInput>` keeps working where the import is swapped
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TextInput = RNTextInput;
