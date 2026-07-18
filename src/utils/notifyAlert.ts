import { Platform, Vibration } from 'react-native';
import { Audio } from 'expo-av';
import { isExpoGo } from './googleAuth';

type NotificationsModule = typeof import('expo-notifications');

let notificationsMod: NotificationsModule | null | undefined;
let handlerConfigured = false;

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

let soundReady = false;

async function ensureAudioMode() {
  if (soundReady) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    allowsRecordingIOS: false,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  soundReady = true;
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
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch {
    // Sem permissão ou ambiente sem suporte — vibração já ocorreu.
  }
}
