import { forwardRef } from 'react';
import { Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps } from 'react-native';

/**
 * Text and TextInput with Dynamic Type capped at 1.5×. Controls have fixed
 * heights (buttons, chips, tiles); uncapped system text sizes would overflow them.
 */
const MAX = 1.5;

export const Text = forwardRef<RNText, TextProps>(function Text(props, ref) {
  return <RNText maxFontSizeMultiplier={MAX} {...props} ref={ref} />;
});

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(props, ref) {
  return <RNTextInput maxFontSizeMultiplier={MAX} {...props} ref={ref} />;
});

// same name as the component so `useRef<TextInput>` keeps working where the import is swapped
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TextInput = RNTextInput;
