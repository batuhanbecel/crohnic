import { Stack } from 'expo-router';

/**
 * The food list sits in its own stack only so iOS can host the native search
 * field (in the tab bar on iOS 26, this tab has role="search"). The bar itself is
 * transparent and empty: the page draws its own title like every other tab.
 */
export default function FoodsLayout() {
  return (
    <Stack
      screenOptions={{
        title: '',
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitle: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}
