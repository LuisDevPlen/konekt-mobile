import React from 'react';
import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, Order, OrdersStackParamList } from '../types';
import { Button, Loading } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { storeApi } from '../services/storeApi';
import { formatCurrency } from '../utils/errors';
import { getOrderStatusLabel } from '../utils/orderStatus';
import { goToHome, goToLogin, goToRegister } from '../navigation/routes';
import { ifood } from '../theme/ifood';

type Props = CompositeScreenProps<
  NativeStackScreenProps<OrdersStackParamList, 'OrdersHome'>,
  BottomTabScreenProps<MainTabParamList, 'Orders'>
>;

export function OrdersScreen({ navigation }: Props) {
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadOrders = React.useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      return;
    }
    try {
      const data = await storeApi.listMyOrders();
      setOrders(data);
    } catch {
      setOrders([]);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    loadOrders().finally(() => setLoading(false));
  }, [loadOrders]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Pedidos</Text>
          <TouchableOpacity style={styles.homeBtn} onPress={() => goToHome(navigation)} activeOpacity={0.8}>
            <Ionicons name="home-outline" size={18} color={ifood.colors.primary} />
            <Text style={styles.homeBtnText}>Início</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Entre para acompanhar seus pedidos em todas as lojas</Text>
        <Button label="Entrar" onPress={() => goToLogin(navigation)} />
        <Button label="Criar conta" variant="secondary" onPress={() => goToRegister(navigation)} />
      </View>
    );
  }

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Pedidos</Text>
          <TouchableOpacity style={styles.homeBtn} onPress={() => goToHome(navigation)} activeOpacity={0.8}>
            <Ionicons name="home-outline" size={18} color={ifood.colors.primary} />
            <Text style={styles.homeBtnText}>Início</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadOrders();
              setRefreshing(false);
            }}
            colors={[ifood.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={ifood.colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
            <Text style={styles.emptySub}>Seus pedidos aparecerão aqui</Text>
            <TouchableOpacity style={styles.emptyHomeBtn} onPress={() => goToHome(navigation)} activeOpacity={0.85}>
              <Text style={styles.emptyHomeText}>Explorar lojas</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() =>
              navigation.navigate('OrderStatus', {
                orderId: item.id,
                tenantSlug: item.tenant_slug!,
              })
            }
            activeOpacity={0.85}
          >
            <View style={styles.orderTop}>
              <Text style={styles.orderStore}>{item.tenant_name}</Text>
              <Text style={styles.orderTotal}>{formatCurrency(Number(item.total_amount))}</Text>
            </View>
            <Text style={styles.orderMeta}>
              {getOrderStatusLabel(item.status)} · {new Date(item.created_at).toLocaleDateString('pt-BR')}
            </Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderLink}>Ver detalhes</Text>
              <Ionicons name="chevron-forward" size={16} color={ifood.colors.primary} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ifood.colors.bg, paddingHorizontal: 16 },
  header: { paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '800', color: ifood.colors.text },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ifood.radius.md,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    backgroundColor: ifood.colors.white,
  },
  homeBtnText: { fontSize: 13, fontWeight: '700', color: ifood.colors.primary },
  subtitle: { fontSize: 14, color: ifood.colors.textSecondary, marginVertical: 12, lineHeight: 20 },
  list: { paddingBottom: 24 },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: ifood.colors.text, marginTop: 12 },
  emptySub: { fontSize: 14, color: ifood.colors.textSecondary, marginTop: 4 },
  emptyHomeBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: ifood.radius.md,
    backgroundColor: ifood.colors.primary,
  },
  emptyHomeText: { color: ifood.colors.white, fontWeight: '700', fontSize: 14 },
  orderCard: {
    backgroundColor: ifood.colors.white,
    borderRadius: ifood.radius.lg,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    padding: 16,
    marginBottom: 12,
    ...ifood.shadow.card,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderStore: { fontSize: 16, fontWeight: '700', color: ifood.colors.text, flex: 1, marginRight: 8 },
  orderTotal: { fontSize: 16, fontWeight: '800', color: ifood.colors.text },
  orderMeta: { fontSize: 13, color: ifood.colors.textSecondary, marginTop: 6 },
  orderFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  orderLink: { fontSize: 14, fontWeight: '600', color: ifood.colors.primary, marginRight: 4 },
});
