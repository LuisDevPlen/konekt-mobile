import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification } from '../types';
import { storeApi } from '../services/storeApi';
import { useAuth } from './AuthContext';
import { playMessageAlert } from '../utils/notifyAlert';
import { isExpoGo } from '../utils/googleAuth';
import { navigateToOrderChat, navigateToOrderStatus } from '../navigation/ref';
import { ifood } from '../theme/ifood';

interface BannerState {
  id: string;
  title: string;
  body: string;
  orderId?: string | null;
  tenantSlug?: string | null;
  tenantName?: string | null;
  type: string;
}

interface NotificationContextValue {
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  /** Evita alerta sonoro enquanto o cliente está no chat desse pedido. */
  setActiveChatOrderId: (orderId: string | null) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const POLL_MS = 10000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);
  const activeChatOrderIdRef = useRef<string | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveChatOrderId = useCallback((orderId: string | null) => {
    activeChatOrderIdRef.current = orderId;
  }, []);

  const showBanner = useCallback((payload: BannerState) => {
    setBanner(payload);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => setBanner(null), 6000);
  }, []);

  const handleNewNotifications = useCallback(async (items: AppNotification[]) => {
    const known = knownIdsRef.current;
    const fresh = items.filter((n) => !known.has(n.id));

    for (const n of items) known.add(n.id);

    if (!primedRef.current) {
      primedRef.current = true;
      return;
    }

    for (const n of fresh) {
      if (n.read_at) continue;

      const isMessage = n.type === 'order_message';
      const inSameChat = isMessage
        && n.order_id
        && activeChatOrderIdRef.current === n.order_id;

      if (isMessage && !inSameChat) {
        await playMessageAlert(n.title, n.body || 'Nova mensagem da loja');
        showBanner({
          id: n.id,
          title: n.title,
          body: n.body || 'Nova mensagem da loja',
          orderId: n.order_id,
          tenantSlug: n.tenant_slug,
          tenantName: n.tenant_name,
          type: n.type,
        });
      } else if (!isMessage && !n.read_at) {
        // Outras notificações: só atualiza contador (sem spam sonoro).
      }
    }
  }, [showBanner]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      knownIdsRef.current = new Set();
      primedRef.current = false;
      return;
    }

    try {
      const res = await storeApi.listNotifications();
      setUnreadCount(res.unreadCount);
      await handleNewNotifications(res.data);
    } catch {
      // silencioso em background
    }
  }, [isAuthenticated, handleNewNotifications]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    (async () => {
      // Expo Go (SDK 53+) não tem push remoto — não carregar expo-notifications.
      if (!isExpoGo()) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const Notifications = require('expo-notifications') as typeof import('expo-notifications');
          const { status } = await Notifications.getPermissionsAsync();
          if (status !== 'granted') {
            await Notifications.requestPermissionsAsync();
          }
        } catch {
          // build sem suporte nativo
        }
      }
      if (!cancelled) void refreshNotifications();
    })();

    const interval = setInterval(() => {
      void refreshNotifications();
    }, POLL_MS);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') void refreshNotifications();
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.remove();
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [isAuthenticated, refreshNotifications]);

  const openBanner = () => {
    if (!banner) return;
    const { orderId, tenantSlug, tenantName, type } = banner;
    setBanner(null);
    if (!orderId || !tenantSlug) return;
    if (type === 'order_message') {
      navigateToOrderChat({
        orderId,
        tenantSlug,
        storeName: tenantName ?? undefined,
      });
    } else {
      navigateToOrderStatus({ orderId, tenantSlug });
    }
  };

  const value = useMemo(
    () => ({ unreadCount, refreshNotifications, setActiveChatOrderId }),
    [unreadCount, refreshNotifications, setActiveChatOrderId]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {banner ? (
        <TouchableOpacity
          style={[styles.banner, { top: insets.top + 8 }]}
          onPress={openBanner}
          activeOpacity={0.92}
        >
          <View style={styles.bannerIcon}>
            <Ionicons name="chatbubbles" size={18} color={ifood.colors.white} />
          </View>
          <View style={styles.bannerBody}>
            <Text style={styles.bannerTitle} numberOfLines={1}>{banner.title}</Text>
            <Text style={styles.bannerText} numberOfLines={2}>{banner.body}</Text>
          </View>
          <TouchableOpacity onPress={() => setBanner(null)} hitSlop={10}>
            <Ionicons name="close" size={18} color={ifood.colors.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      ) : null}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ifood.colors.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  bannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBody: { flex: 1 },
  bannerTitle: {
    color: ifood.colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  bannerText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
