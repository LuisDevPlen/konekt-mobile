import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { isExpoGo } from '../utils/googleAuth';
import {
  getNotificationPermissionStatus,
  openNotificationSettings,
  requestNotificationPermission,
  type NotificationPermissionStatus,
} from '../utils/notifyAlert';
import { colors, radius, spacing } from '../theme/ifood';

const PROMPT_KEY = 'konekt_customer_notif_prompt_v1';
const LOGO = require('../../assets/platform-logo.png');

function NotificationPermissionModalComponent() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [status, setStatus] = useState<NotificationPermissionStatus>('undetermined');

  const expoGo = isExpoGo();

  const refresh = useCallback(async () => {
    const next = await getNotificationPermissionStatus();
    setStatus(next);
    return next;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setHydrated(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROMPT_KEY);
        const dismissed = raw ? Boolean(JSON.parse(raw)?.dismissed) : false;
        const next = await getNotificationPermissionStatus();
        if (cancelled) return;
        setPromptDismissed(dismissed);
        setStatus(next);
        setHydrated(true);
      } catch {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || expoGo) return;
    const timer = setInterval(() => {
      void refresh();
    }, 4000);
    return () => clearInterval(timer);
  }, [hydrated, isAuthenticated, refresh, expoGo]);

  const dismissPrompt = useCallback(() => {
    setPromptDismissed(true);
    void AsyncStorage.setItem(PROMPT_KEY, JSON.stringify({ dismissed: true }));
  }, []);

  const onAllow = useCallback(async () => {
    if (expoGo) {
      dismissPrompt();
      return;
    }
    if (status === 'denied') {
      await openNotificationSettings();
      return;
    }
    const ok = await requestNotificationPermission();
    const next = await refresh();
    if (ok || next === 'granted') {
      setPromptDismissed(true);
      void AsyncStorage.setItem(PROMPT_KEY, JSON.stringify({ dismissed: true }));
    } else {
      dismissPrompt();
    }
  }, [dismissPrompt, expoGo, refresh, status]);

  const visible =
    isAuthenticated
    && hydrated
    && !promptDismissed
    && (expoGo || status === 'undetermined' || status === 'denied');

  if (!visible) return null;

  const denied = !expoGo && status === 'denied';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismissPrompt}>
      <View
        style={[
          styles.backdrop,
          {
            paddingTop: spacing.lg + insets.top,
            paddingBottom: spacing.lg + insets.bottom,
          },
        ]}
      >
        <View style={styles.card}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>
            {expoGo ? 'Alertas no Expo Go' : 'Ative os alertas sonoros'}
          </Text>
          <Text style={styles.body}>
            {expoGo
              ? 'Neste modo o Android não permite o módulo de notificações do Expo. Os alertas usam vibração. Para som completo, use o APK Dino Eats.'
              : 'Para tocar som quando a loja enviar uma mensagem — inclusive com o telefone minimizado — o Dino Eats precisa da permissão de notificações.'}
          </Text>

          {!expoGo ? (
            <View style={styles.bullets}>
              <Bullet icon="chatbubbles-outline" text="Som de nova mensagem da loja" />
              <Bullet icon="phone-portrait-outline" text="Toca mesmo com o app minimizado" />
            </View>
          ) : null}

          <Pressable style={styles.primary} onPress={() => void onAllow()}>
            <Text style={styles.primaryText}>
              {expoGo ? 'Entendi' : denied ? 'Abrir configurações' : 'Permitir notificações'}
            </Text>
          </Pressable>
          {!expoGo ? (
            <Pressable style={styles.secondary} onPress={dismissPrompt}>
              <Text style={styles.secondaryText}>Agora não</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function Bullet({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
}) {
  return (
    <View style={styles.bullet}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export const NotificationPermissionModal = memo(NotificationPermissionModalComponent);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  logo: {
    width: 56,
    height: 56,
    alignSelf: 'center',
    borderRadius: 14,
    backgroundColor: colors.chipBg,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  body: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bullets: { gap: spacing.sm, marginTop: spacing.xs },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bulletText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  primary: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  secondary: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.textMuted, fontWeight: '700', fontSize: 14 },
});
