import React from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { OrderMessage, OrdersStackParamList } from '../types';
import { SacolaHeader } from '../components/layout';
import { storeApi } from '../services/storeApi';
import { useNotifications } from '../contexts/NotificationContext';
import { getFriendlyErrorMessage } from '../utils/errors';
import { isOrderActive } from '../utils/orderStatus';
import { ifood } from '../theme/ifood';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderChat'>;

function formatMessageTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function messageAuthor(msg: OrderMessage) {
  return msg.sender_type === 'store'
    ? (msg.sender_user_name || 'Loja')
    : (msg.sender_customer_name || 'Você');
}

export function OrderChatScreen({ route, navigation }: Props) {
  const { orderId, tenantSlug, storeName } = route.params;
  const insets = useSafeAreaInsets();
  const { setActiveChatOrderId, refreshNotifications } = useNotifications();
  const listRef = React.useRef<FlatList<OrderMessage>>(null);
  const [messages, setMessages] = React.useState<OrderMessage[]>([]);
  const [orderActive, setOrderActive] = React.useState(true);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [order, msgs] = await Promise.all([
        storeApi.getOrder(tenantSlug, orderId),
        storeApi.getOrderMessages(tenantSlug, orderId),
      ]);
      setOrderActive(isOrderActive(order.status));
      setMessages(msgs);
      setError('');
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, orderId]);

  useFocusEffect(
    React.useCallback(() => {
      setActiveChatOrderId(orderId);
      void load();
      void refreshNotifications();
      const interval = setInterval(() => {
        void load();
      }, 8000);
      return () => {
        setActiveChatOrderId(null);
        clearInterval(interval);
      };
    }, [load, orderId, setActiveChatOrderId, refreshNotifications])
  );

  React.useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardOpen(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOpen(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  React.useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length, keyboardOpen]);

  const sendMessage = async () => {
    const body = draft.trim();
    if (!body || sending || !orderActive) return;

    setSending(true);
    setError('');
    try {
      const message = await storeApi.sendOrderMessage(tenantSlug, orderId, body);
      setMessages((prev) => [...prev, message]);
      setDraft('');
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const composerPadBottom = keyboardOpen ? 8 : Math.max(insets.bottom, 10);

  return (
    <View style={styles.container}>
      <SacolaHeader
        title={storeName ? `Chat · ${storeName}` : 'Conversar com a loja'}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {loading && messages.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.hint}>Carregando mensagens...</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.list,
              messages.length === 0 && styles.listEmpty,
              { paddingBottom: 12 },
            ]}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubbles-outline" size={40} color={ifood.colors.textMuted} />
                <Text style={styles.emptyTitle}>Nenhuma mensagem ainda</Text>
                <Text style={styles.emptyText}>
                  Envie uma dúvida sobre o pedido. A loja responde por aqui.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const mine = item.sender_type === 'customer';
              return (
                <View style={[styles.row, mine && styles.rowMine]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleStore]}>
                    {!mine ? <Text style={styles.author}>{messageAuthor(item)}</Text> : null}
                    <Text style={[styles.text, mine && styles.textMine]}>{item.body}</Text>
                    <Text style={[styles.time, mine && styles.timeMine]}>
                      {formatMessageTime(item.created_at)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {orderActive ? (
          <View style={[styles.composer, { paddingBottom: composerPadBottom }]}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Escreva uma mensagem..."
              placeholderTextColor={ifood.colors.textMuted}
              editable={!sending}
              multiline
              maxLength={1000}
              onFocus={() => {
                setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
              }}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (sending || !draft.trim()) && styles.sendBtnDisabled]}
              onPress={() => void sendMessage()}
              disabled={sending || !draft.trim()}
              activeOpacity={0.85}
            >
              <Ionicons name="send" size={18} color={ifood.colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.closedBar, { paddingBottom: composerPadBottom }]}>
            <Text style={styles.closedText}>Conversa encerrada para este pedido.</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ifood.colors.bg },
  body: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { color: ifood.colors.textSecondary, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingTop: 12, flexGrow: 1 },
  listEmpty: { justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: ifood.colors.text,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: ifood.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  row: { marginBottom: 10, alignItems: 'flex-start' },
  rowMine: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleStore: {
    backgroundColor: ifood.colors.white,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    borderTopLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: ifood.colors.primary,
    borderTopRightRadius: 4,
  },
  author: {
    fontSize: 11,
    fontWeight: '700',
    color: ifood.colors.primary,
    marginBottom: 4,
  },
  text: {
    fontSize: 15,
    color: ifood.colors.text,
    lineHeight: 21,
  },
  textMine: { color: ifood.colors.white },
  time: {
    fontSize: 11,
    color: ifood.colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMine: { color: 'rgba(255,255,255,0.8)' },
  error: {
    color: ifood.colors.danger,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: ifood.colors.border,
    backgroundColor: ifood.colors.white,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: ifood.colors.text,
    backgroundColor: ifood.colors.bgSecondary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ifood.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
  closedBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ifood.colors.border,
    backgroundColor: ifood.colors.white,
  },
  closedText: {
    fontSize: 13,
    color: ifood.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
