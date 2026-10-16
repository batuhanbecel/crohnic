import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

/**
 * Medication alarms (AlarmKit, iOS 26+), from the local module in modules/crohnic-alarm.
 * The module is optional: an over-the-air update can reach a build made before it existed,
 * so every call checks it first and falls back to plain notifications.
 */
type Native = {
  isSupported(): boolean;
  authorization(): Promise<'authorized' | 'denied' | 'notDetermined' | 'unsupported'>;
  requestAuthorization(): Promise<boolean>;
  count(): Promise<number>;
  cancelAll(): Promise<void>;
  scheduleDaily(title: string, hour: number, minute: number): Promise<string>;
  scheduleAt(title: string, timestamp: number): Promise<string>;
  /** since build 17: 2 = alarms snooze ("Ertele"), App Intents hand routes over */
  version?(): number;
  takePendingRoute?(): string | null;
};

const native = Platform.OS === 'ios' ? requireOptionalNativeModule<Native>('CrohnicAlarm') : null;

export type AlarmSupport = 'ok' | 'denied' | 'ask' | 'old-ios' | 'old-build';

/** Why alarms can or can't ring on this phone. */
export async function alarmSupport(): Promise<AlarmSupport> {
  if (Platform.OS !== 'ios') return 'old-ios';
  if (!native) return 'old-build';
  try {
    if (!native.isSupported()) return 'old-ios';
    const a = await native.authorization();
    return a === 'authorized' ? 'ok' : a === 'denied' ? 'denied' : a === 'unsupported' ? 'old-ios' : 'ask';
  } catch {
    return 'old-build';
  }
}

export async function askAlarmPermission() {
  try {
    return native?.isSupported() ? await native.requestAuthorization() : false;
  } catch {
    return false;
  }
}

export type AlarmSpec = { title: string } & ({ hour: number; minute: number } | { at: number });

function moduleVersion() {
  try {
    return native?.version?.() ?? 1;
  } catch {
    return 1;
  }
}

/** True on builds whose alarms have the 10-minute "Ertele" button. */
export function alarmsSnooze() {
  return moduleVersion() >= 2;
}

/** True on builds with Siri phrases, Shortcuts actions and Control Center controls (same build as snooze). */
export function hasSystemActions() {
  return Platform.OS === 'ios' && moduleVersion() >= 2;
}

/**
 * The screen a Siri, Shortcuts, Control Center or Action button action asked for, once.
 * null when there is none (or on builds without App Intents).
 */
export function takePendingRoute(): string | null {
  try {
    return native?.takePendingRoute?.() ?? null;
  } catch {
    return null;
  }
}

let lastSig: string | null = null;

/**
 * Makes the system's alarms match `specs`. Only touches them when something changed
 * (re-creating an alarm while it's ringing would silence it), or when the system dropped
 * some (one-off alarms disappear after they ring).
 */
export async function syncAlarms(specs: AlarmSpec[], savedSig: string | null): Promise<string | null> {
  if (!native) return savedSig;
  try {
    if (!native.isSupported() || (await native.authorization()) !== 'authorized') return savedSig;
    // the module version is part of the signature: alarms set by an older build get re-created
    // with the new presentation (snooze) once the app updates
    const sig = JSON.stringify({ v: moduleVersion(), specs });
    const prev = lastSig ?? savedSig;
    if (prev === sig && (await native.count()) === specs.length) return sig;
    await native.cancelAll();
    for (const s of specs) {
      if ('at' in s) await native.scheduleAt(s.title, s.at);
      else await native.scheduleDaily(s.title, s.hour, s.minute);
    }
    lastSig = sig;
    return sig;
  } catch (e) {
    console.warn('alarm sync failed', e);
    return savedSig;
  }
}
