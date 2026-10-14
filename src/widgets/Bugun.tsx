import { AccessoryWidgetBackground, Circle, HStack, Image, Link, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { background, containerBackground, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, padding, resizable, shapes, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type BugunProps = {
  /** today's counts */
  toilet: number;
  meals: number;
  symptoms: number;
  /** next medication still to take today, e.g. "Mesalazin 21:00"; '' when none */
  dose: string;
  /** file URI of Kıvırcık in the shared widgets folder; '' until the app copied it */
  img: string;
};
// No nulls in props: the timeline is kept in UserDefaults, which can't store null.

/**
 * "Bugün" widget, in the app's look: Krem page, white tiles, the brand icon colours
 * (toilet = warm brown on peach, meal = green, symptom = coral), SF Rounded numbers.
 *
 * - systemMedium: header + three tiles; each shows today's count and opens that log screen.
 * - systemSmall: the three counts as a list; a tap opens the toilet log (the most frequent one).
 * - Lock screen: symbol + number rows (rectangular), the toilet count in a ring (circular),
 *   one line (inline). iOS tints lock screen widgets, so they rely on symbols, not colour.
 *
 * Runs in the widget runtime: no hooks, no imports used inside, no module-scope values.
 * babel-preset-expo turns the body into plain JS (types are stripped).
 */
const Bugun = (props: BugunProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const c = {
    page: dark ? '#0D1A12' : '#FFF8E1',
    tile: dark ? '#16271C' : '#FFFFFF',
    ink: dark ? '#F5F1DE' : '#17301F',
    soft: dark ? '#B7C2B6' : '#5E6B62',
    green: dark ? '#CFEA8E' : '#145A32',
    accent: dark ? '#7CC36A' : '#145A32',
    onAccent: dark ? '#0D1A12' : '#FFFFFF',
  };

  // before the app has written anything (widget gallery, fresh install) props is {}
  const raw = props || {};
  const num = (v: unknown) => (typeof v === 'number' ? v : 0);
  const dose = typeof raw.dose === 'string' ? raw.dose : '';
  const img = typeof raw.img === 'string' ? raw.img : '';

  const kinds = [
    { key: 't', n: num(raw.toilet), label: 'Tuvalet', lower: 'tuvalet', symbol: 'drop.fill', url: 'crohnic:///tuvalet', fg: dark ? '#E9AE7C' : '#8A5228', bg: dark ? '#38261A' : '#FFE8D6' },
    { key: 'm', n: num(raw.meals), label: 'Öğün', lower: 'öğün', symbol: 'fork.knife', url: 'crohnic:///yemek-ekle', fg: dark ? '#7FD08A' : '#246D2F', bg: dark ? '#173320' : '#E4F4D9' },
    { key: 's', n: num(raw.symptoms), label: 'Semptom', lower: 'semptom', symbol: 'waveform.path.ecg', url: 'crohnic:///semptom', fg: dark ? '#FF8F80' : '#B5382F', bg: dark ? '#3D1E1A' : '#FFE6E2' },
  ];
  const toilet = kinds[0].n;

  const numberFont = (size: number) => font({ size, weight: 'bold', design: 'rounded' });

  // ---------- lock screen ----------
  if (env.widgetFamily === 'accessoryInline') {
    return <Text modifiers={[widgetURL('crohnic:///tuvalet')]}>{`${kinds[0].n} tuvalet · ${kinds[1].n} öğün · ${kinds[2].n} semptom`}</Text>;
  }

  if (env.widgetFamily === 'accessoryCircular') {
    return (
      <ZStack modifiers={[widgetURL('crohnic:///tuvalet')]}>
        <AccessoryWidgetBackground />
        <VStack spacing={0}>
          <Image systemName="drop.fill" size={12} />
          <Text modifiers={[numberFont(22), minimumScaleFactor(0.6), lineLimit(1)]}>{String(toilet)}</Text>
          <Text modifiers={[font({ size: 9, weight: 'semibold' })]}>tuvalet</Text>
        </VStack>
      </ZStack>
    );
  }

  if (env.widgetFamily === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={2} modifiers={[widgetURL('crohnic:///tuvalet'), frame({ maxWidth: 1000, alignment: 'leading' })]}>
        <HStack spacing={4}>
          <Image systemName="leaf.fill" size={11} />
          <Text modifiers={[font({ size: 13, weight: 'semibold', design: 'rounded' })]}>Crohnic · Bugün</Text>
        </HStack>
        <HStack spacing={12}>
          {kinds.map((k) => (
            <HStack key={k.key} spacing={4}>
              <Image systemName={k.symbol as never} size={14} />
              <Text modifiers={[numberFont(22)]}>{String(k.n)}</Text>
            </HStack>
          ))}
        </HStack>
        {dose ? (
          <HStack spacing={4}>
            <Image systemName="pills.fill" size={10} />
            <Text modifiers={[font({ size: 11, weight: 'medium' }), lineLimit(1)]}>{dose}</Text>
          </HStack>
        ) : null}
      </VStack>
    );
  }

  // ---------- home screen ----------
  const mascot = (size: number) =>
    img ? <Image uiImage={img} modifiers={[resizable(), frame({ width: size, height: size })]} /> : <Image systemName="leaf.fill" size={size * 0.6} color={c.green} />;

  const badge = (fg: string, bg: string, symbol: string, size: number) => (
    <ZStack>
      <Circle modifiers={[foregroundStyle(bg), frame({ width: size, height: size })]} />
      <Image systemName={symbol as never} size={size * 0.46} color={fg} />
    </ZStack>
  );

  if (env.widgetFamily === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={0} modifiers={[containerBackground(c.page, 'widget'), widgetURL('crohnic:///tuvalet')]}>
        <HStack spacing={6}>
          {mascot(32)}
          <Spacer />
          <ZStack>
            <Circle modifiers={[foregroundStyle(c.accent), frame({ width: 26, height: 26 })]} />
            <Image systemName="plus" size={12} color={c.onAccent} />
          </ZStack>
        </HStack>
        <Spacer />
        <VStack alignment="leading" spacing={7}>
          {kinds.map((k) => (
            <HStack key={k.key} spacing={8}>
              {badge(k.fg, k.bg, k.symbol, 22)}
              <Text modifiers={[numberFont(17), foregroundStyle(c.ink)]}>{String(k.n)}</Text>
              <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(c.soft), lineLimit(1)]}>{k.lower}</Text>
            </HStack>
          ))}
        </VStack>
      </VStack>
    );
  }

  // systemMedium: header, then one tile per log type; each tile adds that kind of log
  return (
    <VStack alignment="leading" spacing={8} modifiers={[containerBackground(c.page, 'widget')]}>
      <HStack spacing={6}>
        {mascot(24)}
        <Text modifiers={[font({ size: 16, weight: 'bold', design: 'rounded' }), foregroundStyle(c.ink)]}>Bugün</Text>
        <Spacer />
        {dose ? (
          <HStack spacing={4}>
            <Image systemName="pills.fill" size={11} color={c.soft} />
            <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(c.soft), lineLimit(1)]}>{dose}</Text>
          </HStack>
        ) : (
          <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(c.soft)]}>Eklemek için dokun</Text>
        )}
      </HStack>
      <HStack spacing={8}>
        {kinds.map((k) => (
          <Link key={k.key} destination={k.url}>
            <VStack
              alignment="leading"
              spacing={1}
              modifiers={[
                padding({ all: 9 }),
                frame({ maxWidth: 1000, maxHeight: 1000, alignment: 'topLeading' }),
                background(c.tile, shapes.roundedRectangle({ cornerRadius: 16, roundedCornerStyle: 'continuous' })),
              ]}
            >
              <HStack>
                {badge(k.fg, k.bg, k.symbol, 24)}
                <Spacer />
                <Image systemName="plus.circle.fill" size={16} color={k.fg} />
              </HStack>
              <Spacer />
              <Text modifiers={[numberFont(24), foregroundStyle(c.ink), lineLimit(1)]}>{String(k.n)}</Text>
              <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(c.soft), lineLimit(1)]}>{k.label}</Text>
            </VStack>
          </Link>
        ))}
      </HStack>
    </VStack>
  );
};

export default createWidget<BugunProps>('Bugun', Bugun);
