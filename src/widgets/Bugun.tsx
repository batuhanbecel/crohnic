import { HStack, Image, Link, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { background, containerBackground, font, foregroundStyle, frame, padding, resizable, shapes, widgetURL } from '@expo/ui/swift-ui/modifiers';
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
 * "Bugün" widget: today's counts and one-tap logging.
 * Runs in the widget runtime: no hooks, no imports used inside, no module-scope values.
 */
// The body is turned into plain JS for the widget runtime by babel-preset-expo (types are stripped).
const Bugun = (props: BugunProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const ink = dark ? '#F5F1DE' : '#17301F';
  const soft = dark ? '#B7C2B6' : '#4F6155';
  const green = dark ? '#CFEA8E' : '#145A32';
  const bg = dark ? '#0D1A12' : '#FFF8E1';
  const chip = dark ? '#16271C' : '#FFFFFF';
  // before the app has written anything (widget gallery, fresh install) props is {}
  const raw = props || {};
  const p = {
    toilet: typeof raw.toilet === 'number' ? raw.toilet : 0,
    meals: typeof raw.meals === 'number' ? raw.meals : 0,
    symptoms: typeof raw.symptoms === 'number' ? raw.symptoms : 0,
    dose: typeof raw.dose === 'string' ? raw.dose : '',
    img: typeof raw.img === 'string' ? raw.img : '',
  };
  const summary = `${p.toilet} tuvalet · ${p.meals} öğün`;

  if (env.widgetFamily === 'accessoryInline') {
    return <Text modifiers={[widgetURL('crohnic:///tuvalet')]}>{`Crohnic: ${summary}`}</Text>;
  }

  if (env.widgetFamily === 'accessoryCircular') {
    return (
      <VStack spacing={0} modifiers={[widgetURL('crohnic:///tuvalet')]}>
        <Image systemName="drop.fill" size={16} />
        <Text modifiers={[font({ size: 20, weight: 'bold', design: 'rounded' })]}>{String(p.toilet)}</Text>
      </VStack>
    );
  }

  if (env.widgetFamily === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={2} modifiers={[widgetURL('crohnic:///tuvalet')]}>
        <Text modifiers={[font({ size: 13, weight: 'bold' })]}>Crohnic · Bugün</Text>
        <Text modifiers={[font({ size: 13 })]}>{summary}</Text>
        <Text modifiers={[font({ size: 12 })]}>{p.dose ? `İlaç: ${p.dose}` : 'Kaydetmek için dokun'}</Text>
      </VStack>
    );
  }

  const mascot = p.img ? <Image uiImage={p.img} modifiers={[resizable(), frame({ width: 46, height: 46 })]} /> : <Image systemName="leaf.fill" size={30} color={green} />;

  const stat = (n: number, label: string) => (
    <VStack alignment="leading" spacing={0}>
      <Text modifiers={[font({ size: 22, weight: 'heavy', design: 'rounded' }), foregroundStyle(ink)]}>{String(n)}</Text>
      <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(soft)]}>{label}</Text>
    </VStack>
  );

  if (env.widgetFamily === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={6} modifiers={[containerBackground(bg, 'widget'), widgetURL('crohnic:///tuvalet')]}>
        <HStack>
          {mascot}
          <Spacer />
        </HStack>
        <Spacer />
        <HStack spacing={14}>
          {stat(p.toilet, 'tuvalet')}
          {stat(p.meals, 'öğün')}
        </HStack>
        <HStack spacing={4}>
          <Image systemName="plus.circle.fill" size={13} color={green} />
          <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(green)]}>Tuvalet kaydet</Text>
        </HStack>
      </VStack>
    );
  }

  const button = (title: string, symbol: string, url: string) => (
    <Link destination={url}>
      <HStack spacing={6} modifiers={[padding({ vertical: 8, horizontal: 10 }), frame({ maxWidth: 1000, alignment: 'leading' }), background(chip, shapes.roundedRectangle({ cornerRadius: 12 }))]}>
        <Image systemName={symbol as never} size={13} color={green} />
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(ink)]}>{title}</Text>
      </HStack>
    </Link>
  );

  // systemMedium: counts on the left, the three most common logs on the right
  return (
    <HStack spacing={12} modifiers={[containerBackground(bg, 'widget')]}>
      <VStack alignment="leading" spacing={6}>
        {mascot}
        <Spacer />
        <HStack spacing={14}>
          {stat(p.toilet, 'tuvalet')}
          {stat(p.meals, 'öğün')}
          {stat(p.symptoms, 'semptom')}
        </HStack>
        {p.dose ? <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(soft)]}>{`Sıradaki ilaç: ${p.dose}`}</Text> : null}
      </VStack>
      <VStack spacing={6}>
        {button('Tuvalet', 'drop.fill', 'crohnic:///tuvalet')}
        {button('Öğün', 'fork.knife', 'crohnic:///yemek-ekle')}
        {button('Semptom', 'waveform.path.ecg', 'crohnic:///semptom')}
      </VStack>
    </HStack>
  );
};

export default createWidget<BugunProps>('Bugun', Bugun);
