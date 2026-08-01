import React from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, SupportStackParamList, SupportCategory, SupportTicket } from '../types';
import { SacolaHeader } from '../components/layout';
import { Button, ErrorBox, Input } from '../components/ui';
import { GuestAccessPanel } from '../components/GuestAccessPanel';
import { storeApi } from '../services/storeApi';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { goToLogin } from '../navigation/routes';
import { getFriendlyErrorMessage } from '../utils/errors';
import { colors, radius, spacing } from '../theme/ifood';

const STATUS_LABELS: Record<string, string> = {
  open: 'Aberto',
  in_review: 'Em análise',
  answered: 'Respondido',
  waiting_user: 'Aguardando você',
  resolved: 'Resolvido',
  cancelled: 'Cancelado',
};

const FAQ = [
  {
    q: 'Quanto tempo leva para responder?',
    a: 'Nossa equipe responde em até 24 horas úteis. Chamados urgentes são priorizados.',
  },
  {
    q: 'Como acompanho meu chamado?',
    a: 'Acesse Meus chamados e abra o protocolo para ver o histórico completo.',
  },
  {
    q: 'Posso anexar prints?',
    a: 'Sim. Ao abrir um chamado, descreva o problema com o máximo de detalhes possível.',
  },
];

function statusColor(status: string) {
  if (status === 'resolved') return '#1b7f4b';
  if (status === 'cancelled') return colors.textMuted;
  if (status === 'answered') return '#2563eb';
  return colors.primary;
}

type HomeProps = NativeStackScreenProps<SupportStackParamList, 'SupportHome'>;
type ListProps = NativeStackScreenProps<SupportStackParamList, 'SupportTickets'>;
type CreateProps = NativeStackScreenProps<SupportStackParamList, 'SupportCreate'>;
type DetailProps = NativeStackScreenProps<SupportStackParamList, 'SupportDetail'>;

export function SupportHomeScreen({ navigation }: HomeProps) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <GuestAccessPanel
        variant="support"
        onPrimaryPress={() => {
          const parent = navigation.getParent<NavigationProp<MainTabParamList>>();
          if (parent) goToLogin(parent);
        }}
        onSecondaryPress={() => {
          const parent = navigation.getParent<NavigationProp<MainTabParamList>>();
          parent?.navigate('Profile', { screen: 'Register' });
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <SacolaHeader title="Suporte" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.lg }]}>
        <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('SupportTickets')}>
          <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
          <View style={styles.menuCardText}>
            <Text style={styles.menuCardTitle}>Meus chamados</Text>
            <Text style={styles.menuCardSub}>Acompanhe protocolos e respostas</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('SupportCreate')}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          <View style={styles.menuCardText}>
            <Text style={styles.menuCardTitle}>Abrir novo chamado</Text>
            <Text style={styles.menuCardSub}>Relate bugs e problemas de uso da plataforma</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Perguntas frequentes</Text>
        {FAQ.map((item) => (
          <View key={item.q} style={styles.faqCard}>
            <Text style={styles.faqQ}>{item.q}</Text>
            <Text style={styles.faqA}>{item.a}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function SupportTicketsScreen({ navigation }: ListProps) {
  const [tickets, setTickets] = React.useState<SupportTicket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      setTickets(await storeApi.listSupportTickets());
      setError('');
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.container}>
      <SacolaHeader title="Meus chamados" onBack={() => navigation.goBack()} />
      {error ? <ErrorBox message={error} /> : null}
      {loading ? (
        <Text style={styles.loadingText}>Carregando...</Text>
      ) : tickets.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Nenhum chamado ainda</Text>
          <Button label="Abrir chamado" onPress={() => navigation.navigate('SupportCreate')} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.ticketCard}
              onPress={() => navigation.navigate('SupportDetail', { ticketId: item.id })}
            >
              <View style={styles.ticketTop}>
                <Text style={styles.ticketProtocol}>{item.protocol}</Text>
                <Text style={[styles.ticketStatus, { color: statusColor(item.status) }]}>
                  {STATUS_LABELS[item.status] || item.status}
                </Text>
              </View>
              <Text style={styles.ticketTitle}>{item.title}</Text>
              <Text style={styles.ticketMeta}>
                {new Date(item.createdAt).toLocaleDateString('pt-BR')} · {item.category}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

export function SupportCreateScreen({ navigation }: CreateProps) {
  const { store } = useStore();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = React.useState<SupportCategory[]>([]);
  const [category, setCategory] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    storeApi.getSupportCategories().then(setCategories).catch(() => {});
  }, []);

  const submit = async () => {
    if (!category || !title.trim() || description.trim().length < 10) {
      setError('Preencha categoria, título e descrição (mín. 10 caracteres).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ticket = await storeApi.createSupportTicket({
        category,
        title: title.trim(),
        description: description.trim(),
        tenantId: store?.id ?? null,
      });
      navigation.replace('SupportDetail', { ticketId: ticket.id });
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SacolaHeader title="Novo chamado" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.formScroll, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.supportScope}>
          Para itens, pagamento, entrega ou atendimento do pedido, fale diretamente com a loja.
          Este suporte atende bugs e problemas de usabilidade da plataforma.
        </Text>
        {error ? <ErrorBox message={error} /> : null}
        <Text style={styles.fieldLabel}>Categoria</Text>
        <View style={styles.chipWrap}>
          {categories.map((cat) => (
            <Pressable
              key={cat.slug}
              style={[styles.chip, category === cat.slug && styles.chipActive]}
              onPress={() => setCategory(cat.slug)}
            >
              <Text style={[styles.chipText, category === cat.slug && styles.chipTextActive]}>{cat.name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.fieldLabel}>Título</Text>
        <Input placeholder="Resumo do problema" value={title} onChangeText={setTitle} />
        <Text style={styles.fieldLabel}>Descrição</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Descreva o que aconteceu com detalhes"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />
        <Button label={loading ? 'Enviando...' : 'Enviar chamado'} onPress={submit} disabled={loading} />
      </ScrollView>
    </View>
  );
}

export function SupportDetailScreen({ navigation, route }: DetailProps) {
  const { ticketId } = route.params;
  const insets = useSafeAreaInsets();
  const [ticket, setTicket] = React.useState<SupportTicket | null>(null);
  const [draft, setDraft] = React.useState('');
  const [rating, setRating] = React.useState(5);
  const [ratingComment, setRatingComment] = React.useState('');
  const [error, setError] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);

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

  const load = React.useCallback(async () => {
    try {
      setTicket(await storeApi.getSupportTicket(ticketId));
      setError('');
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    }
  }, [ticketId]);

  React.useEffect(() => {
    void load();
    const interval = setInterval(() => { void load(); }, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const send = async () => {
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      await storeApi.sendSupportMessage(ticketId, { message });
      setDraft('');
      await load();
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const submitRating = async () => {
    try {
      await storeApi.rateSupportTicket(ticketId, { rating, comment: ratingComment.trim() || undefined });
      await load();
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    }
  };

  if (!ticket) {
    return (
      <View style={styles.container}>
        <SacolaHeader title="Chamado" onBack={() => navigation.goBack()} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SacolaHeader title={ticket.protocol} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.detailScroll} keyboardShouldPersistTaps="handled">
          {error ? <ErrorBox message={error} /> : null}
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{ticket.title}</Text>
            <Text style={[styles.ticketStatus, { color: statusColor(ticket.status) }]}>
              {STATUS_LABELS[ticket.status] || ticket.status}
            </Text>
            <Text style={styles.ticketMeta}>
              Aberto em {new Date(ticket.createdAt).toLocaleString('pt-BR')}
            </Text>
            <Text style={styles.detailDesc}>{ticket.description}</Text>
          </View>

          <Text style={styles.sectionTitle}>Conversa</Text>
          {(ticket.messages ?? []).map((msg) => {
            const mine = msg.senderType === 'customer';
            return (
              <View key={msg.id} style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={styles.bubbleAuthor}>{msg.senderName}</Text>
                <Text style={styles.bubbleText}>{msg.message}</Text>
                <Text style={styles.bubbleTime}>
                  {new Date(msg.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          })}

          {ticket.status === 'resolved' && !ticket.rating ? (
            <View style={styles.rateBox}>
              <Text style={styles.sectionTitle}>Avalie o atendimento</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setRating(n)}>
                    <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={28} color="#F5A623" />
                  </Pressable>
                ))}
              </View>
              <Input placeholder="Comentário (opcional)" value={ratingComment} onChangeText={setRatingComment} />
              <Button label="Enviar avaliação" onPress={submitRating} />
            </View>
          ) : null}
        </ScrollView>

        {ticket.status !== 'resolved' && ticket.status !== 'cancelled' ? (
          <View
            style={[
              styles.composer,
              { paddingBottom: keyboardOpen ? spacing.sm : Math.max(insets.bottom, spacing.sm) },
            ]}
          >
            <TextInput
              style={styles.composerInput}
              placeholder="Escreva uma mensagem..."
              value={draft}
              onChangeText={setDraft}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={sending}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.md },
  formScroll: { padding: spacing.lg, gap: spacing.sm },
  supportScope: {
    color: colors.textSecondary,
    lineHeight: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  detailScroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  listContent: { padding: spacing.lg, gap: spacing.sm },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuCardText: { flex: 1 },
  menuCardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  menuCardSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqQ: { fontWeight: '700', color: colors.text, marginBottom: 4 },
  faqA: { color: colors.textSecondary, lineHeight: 20 },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ticketProtocol: { fontWeight: '700', color: colors.primary },
  ticketStatus: { fontWeight: '600', fontSize: 12 },
  ticketTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  ticketMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  fieldLabel: { fontWeight: '600', color: colors.text, marginTop: spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#fff5f5' },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: '#fff',
    fontSize: 15,
    color: colors.text,
  },
  detailHeader: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  detailTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  detailDesc: { marginTop: spacing.sm, color: colors.textSecondary, lineHeight: 20 },
  bubble: {
    maxWidth: '88%',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: '#ffe8ea' },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  bubbleAuthor: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 20 },
  bubbleTime: { fontSize: 11, color: colors.textMuted, marginTop: 6, alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#fff',
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.bg,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateBox: {
    marginTop: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  starsRow: { flexDirection: 'row', gap: 4 },
  loadingText: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  emptyBox: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
});
