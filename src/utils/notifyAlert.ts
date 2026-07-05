import { Platform, Vibration } from 'react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

/** Vibração + som do sistema (notificação local). */
export async function playMessageAlert(title: string, body: string) {
  try {
    Vibration.vibrate(Platform.OS === 'ios' ? [0, 200] : 280);
  } catch {
    // ignore
  }

  try {
    await ensureAudioMode();
    // Beep curto via notificação local (som padrão do sistema).
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
