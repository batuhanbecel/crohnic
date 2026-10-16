import { router, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/build/react-navigation/core';
import { useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

/**
 * A form sheet with unsaved input asks before it goes away, whether it is swiped down or
 * closed with ×, the way iOS's own forms do. Returns `leave()`: call it instead of
 * router.back() after saving, so the sheet closes without asking.
 */
export function useConfirmDiscard(dirty: boolean) {
  const navigation = useNavigation();
  const [leaving, setLeaving] = useState(false);

  usePreventRemove(dirty && !leaving, ({ data }) => {
    const discard = () => navigation.dispatch(data.action);
    const title = 'Kaydetmeden kapatılsın mı?';
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title, options: ['Kaydetmeden kapat', 'Düzenlemeye devam et'], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
        (i) => {
          if (i === 0) discard();
        },
      );
    } else if (Platform.OS === 'web') {
      if (window.confirm(title)) discard();
    } else {
      Alert.alert(title, undefined, [
        { text: 'Düzenlemeye devam et', style: 'cancel' },
        { text: 'Kaydetmeden kapat', style: 'destructive', onPress: discard },
      ]);
    }
  });

  // runs after the render that lifted the guard, so this back isn't stopped
  useEffect(() => {
    if (leaving) router.back();
  }, [leaving]);

  return () => setLeaving(true);
}
