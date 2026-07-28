import { Linking, Platform, Vibration } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';
import { isExpoGo } from './googleAuth';

type NotificationsModule = typeof import('expo-notifications');

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

let notificationsMod: NotificationsModule | null | undefined;
let handlerConfigured = false;
let channelReady = false;
let soundReady = false;

function loadNotifications(): NotificationsModule | null {
  if (isExpoGo()) return null;
  if (notificationsMod !== undefined) return notificationsMod;
  try {
    // Lazy require: import estático dispara DevicePushTokenAutoRegistration no Expo Go (SDK 53+).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsMod = require('expo-notifications') as NotificationsModule;
    if (!handlerConfigured && notificationsMod) {
      notificationsMod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerConfigured = true;
    }
    return notificationsMod;
  } catch {
    notificationsMod = null;
    return null;
  }
}

async function ensureAudioMode() {
  if (soundReady) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: false,
    shouldPlayInBackground: true,
    interruptionMode: 'duckOthers',
    shouldRouteThroughEarpiece: false,
  });
  soundReady = true;
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Mensagens da loja',
    description: 'Alertas sonoros de novas mensagens, mesmo com o app minimizado',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 200, 100, 200],
    sound: 'default',
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  channelReady = true;
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const Notifications = loadNotifications();
  if (!Notifications) return 'unavailable';
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return 'granted';
    if (current.status === 'denied' || current.canAskAgain === false) return 'denied';
    return 'undetermined';
  } catch {
    return 'unavailable';
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = loadNotifications();
  if (!Notifications) return false;
  try {
    await ensureAndroidChannel(Notifications);
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      await ensureAudioMode();
      return true;
    }
    if (current.canAskAgain === false) return false;
    const asked = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    if (asked.granted) {
      await ensureAudioMode();
    }
    return asked.granted;
  } catch {
    return false;
  }
}

export async function openNotificationSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    // ignore
  }
}

/** Vibração + som do sistema (notificação local). No Expo Go: só vibração. */
export async function playMessageAlert(title: string, body: string) {
  try {
    Vibration.vibrate(Platform.OS === 'ios' ? [0, 200] : 280);
  } catch {
    // ignore
  }

  const Notifications = loadNotifications();
  if (!Notifications) {
    return;
  }

  try {
    await ensureAudioMode();
    await ensureAndroidChannel(Notifications);
    const permission = await getNotificationPermissionStatus();
    if (permission !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'android'
          ? { channelId: 'messages', vibrate: [0, 200, 100, 200] }
          : {}),
      },
      trigger: null,
    });
  } catch {
    // Sem permissão ou ambiente sem suporte — vibração já ocorreu.
  }
}
