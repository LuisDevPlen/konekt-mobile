import React from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
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
import { MainTabParamList, HomeStackParamList, Tenant } from '../types';
import { Button, ErrorBox, Loading, SearchBar, SectionHeader } from '../components/ui';
import { TenantCard } from '../components/TenantCard';
import { CategoryRow } from '../components/CategoryChip';
import { FilterChips } from '../components/FilterChips';
import { storeApi } from '../services/storeApi';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getFriendlyErrorMessage, AppApiError } from '../utils/errors';
import { getFabBottom } from '../utils/safeArea';
import { ifood } from '../theme/ifood';
import {
  filterAndSortStores,
  StoreCategoryFilter,
} from '../utils/storeFilters';
import { goToAddresses, goToNotifications } from '../navigation/routes';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'StoresHome'>,
  BottomTabScreenProps<MainTabParamList, 'Home'>
>;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function StoresHomeScreen({ navigation }: Props) {
  const { enterStore } = useStore();
  const { isAuthenticated, customer } = useAuth();
  const { itemCount } = useCart();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();
  const [stores, setStores] = React.useState<Tenant[]>([]);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<StoreCategoryFilter>('all');
  const [activeFilters, setActiveFilters] = React.useState<Set<string>>(new Set());
  const [sortId, setSortId] = React.useState('sort_name');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadStores = React.useCallback(async () => {
    try {
      const data = await storeApi.listTenants();
      setStores(data.filter((t) => t.slug !== 'system'));
      setError('');
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
      if (e instanceof AppApiError && (e.status === 0 || e.code === 'NETWORK_ERROR')) {
        navigation.navigate('ConnectionError');
      }
    }
  }, [navigation]);

  React.useEffect(() => {
    loadStores().finally(() => setLoading(false));
  }, [loadStores]);

  const filtered = React.useMemo(
    () => filterAndSortStores(stores, {
      search,
      category,
      activeFilters,
      sort: sortId === 'sort_rating' ? 'rating' : sortId === 'sort_free' ? 'free' : 'name',
    }),
    [stores, search, category, activeFilters, sortId]
  );

  const featured = React.useMemo(
    () => filtered.filter((s) => (s.rating_count ?? 0) > 0 || s.has_promo).slice(0, 10),
    [filtered]
  );

  const openStore = async (store: Tenant) => {
    await enterStore(store);
    navigation.navigate('StoreHome');
  };

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) return <Loading />;

  const firstName = customer?.name?.split(' ')[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={ifood.colors.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.addressRow}>
          <View style={styles.addressText}>
            <Text style={styles.greetingLine}>
              {greeting()}{firstName ? `, ${firstName}` : ''}
            </Text>
            <TouchableOpacity
              style={styles.addressBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (isAuthenticated) goToAddresses(navigation);
              }}
            >
              <Text style={styles.addressLabel} numberOfLines={1}>
                {customer?.address || 'Escolha um endereço'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={ifood.colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => {
                if (isAuthenticated) goToNotifications(navigation);
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={ifood.colors.text} />
              {isAuthenticated && unreadCount > 0 ? (
                <View style={styles.notifDot}>
                  <Text style={styles.notifDotText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        <SearchBar
          placeholder="Busque por loja ou endereço"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadStores();
              setRefreshing(false);
            }}
            colors={[ifood.colors.primary]}
            tintColor={ifood.colors.primary}
          />
        }
      >
        {error ? (
          <View style={styles.errorWrap}>
            <ErrorBox message={error} />
            <Button label="Tentar novamente" onPress={loadStores} />
          </View>
        ) : null}

        <View style={styles.connectBanner}>
          <View style={styles.connectBadge}>
            <Text style={styles.connectBadgeText}>Connect</Text>
          </View>
          <View style={styles.connectText}>
            <Text style={styles.connectTitle}>Peça no Connect</Text>
            <Text style={styles.connectSub}>
              Encontre restaurantes, lojas e mercados parceiros perto de você
            </Text>
          </View>
        </View>

        <CategoryRow activeId={category} onSelect={setCategory} />

        <FilterChips
          activeIds={activeFilters}
          sortId={sortId}
          onToggle={toggleFilter}
          onSortChange={(id) => setSortId(id)}
        />

        {featured.length > 0 ? (
          <>
            <View style={styles.sectionPad}>
              <SectionHeader title="Em destaque" />
            </View>
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(item) => `feat-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              renderItem={({ item }) => (
                <TenantCard tenant={item} onPress={() => openStore(item)} variant="featured" />
              )}
            />
          </>
        ) : null}

        <View style={styles.sectionPad}>
          <SectionHeader title={search.trim() ? 'Resultados' : 'Lojas'} />
          {filtered.length === 0 && !error ? (
            <Text style={styles.empty}>Nenhuma loja encontrada com esses filtros</Text>
          ) : (
            filtered.map((item) => (
              <TenantCard key={item.id} tenant={item} onPress={() => openStore(item)} variant="list" />
            ))
          )}
        </View>
      </ScrollView>

      {isAuthenticated && itemCount > 0 ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: getFabBottom(insets) }]}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <Ionicons name="bag-handle" size={22} color={ifood.colors.white} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ifood.colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: ifood.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  addressText: { flex: 1 },
  greetingLine: { fontSize: 12, color: ifood.colors.textSecondary, marginBottom: 2 },
  addressBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressLabel: { fontSize: 15, fontWeight: '700', color: ifood.colors.text, maxWidth: '90%' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ifood.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifDotText: {
    color: ifood.colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  scroll: { flex: 1 },
  connectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: ifood.colors.white,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    gap: 12,
  },
  connectBadge: {
    backgroundColor: ifood.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectBadgeText: { color: ifood.colors.white, fontWeight: '800', fontSize: 12 },
  connectText: { flex: 1 },
  connectTitle: { fontSize: 15, fontWeight: '700', color: ifood.colors.text },
  connectSub: { fontSize: 13, color: ifood.colors.textSecondary, marginTop: 2, lineHeight: 18 },
  sectionPad: { paddingHorizontal: 16, marginTop: 8 },
  featuredList: { paddingHorizontal: 16, paddingBottom: 8 },
  empty: { color: ifood.colors.textSecondary, textAlign: 'center', paddingVertical: 32 },
  errorWrap: { padding: 16 },
  fab: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ifood.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...ifood.shadow.card,
  },
});
