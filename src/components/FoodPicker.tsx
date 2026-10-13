import { useMemo, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { findFoodByName, searchFoods, type Food } from '../lib/foods';
import { palette } from '../lib/theme';
import { Chip, GlassPress, Icon, Row, T, st } from './ui';

/**
 * Text box + glass "+" button + suggestions from the food list.
 * Calls onAdd with the typed name and the matching food (if any).
 */
export function FoodPicker({
  onAdd,
  exclude = [],
  placeholder = 'ör. mercimek çorbası',
  hint,
  autoFocus,
  onTextChange,
}: {
  onAdd: (name: string, food: Food | null) => void;
  exclude?: (string | null | undefined)[];
  placeholder?: string;
  hint?: string;
  autoFocus?: boolean;
  /** Lets the parent see unsaved text (so nothing typed gets lost on save). */
  onTextChange?: (text: string) => void;
}) {
  const input = useRef<TextInput>(null);
  const [text, setText] = useState('');
  const change = (t: string) => {
    setText(t);
    onTextChange?.(t);
  };

  const suggestions = useMemo(() => {
    if (text.trim().length < 2) return [];
    const taken = new Set(exclude.filter(Boolean));
    return searchFoods(text)
      .filter((f) => !taken.has(f.id))
      .slice(0, 8);
  }, [text, exclude]);

  const add = (name: string, food: Food | null) => {
    const n = name.trim();
    if (!n) return;
    onAdd(food?.name ?? n, food ?? findFoodByName(n) ?? null);
    change('');
    input.current?.focus();
  };

  const ready = !!text.trim();

  return (
    <View style={{ gap: 10 }}>
      <Row gap={8}>
        <TextInput
          ref={input}
          value={text}
          onChangeText={change}
          placeholder={placeholder}
          placeholderTextColor={palette.inkFaint}
          style={[st.input, { flex: 1, minWidth: 0 }]}
          autoFocus={autoFocus}
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={() => add(text, null)}
        />
        <GlassPress
          onPress={() => add(text, null)}
          disabled={!ready}
          tint={ready ? palette.ink : undefined}
          accessibilityLabel="Ekle"
          style={{ width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="plus" size={20} color={ready ? '#fff' : palette.inkFaint} fallback="+" />
        </GlassPress>
      </Row>
      {suggestions.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {suggestions.map((f) => (
            <Chip key={f.id} label={f.name} emoji={f.emoji} onPress={() => add(f.name, f)} />
          ))}
        </View>
      ) : hint ? (
        <T v="small" color={palette.inkSoft}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}
