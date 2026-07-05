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
import { MainTabParamList, SearchStackParamList, Tenant } from '../types';
import { Button, ErrorBox, Loading, SearchBar } from '../components/ui';
import { TenantCard } from '../components/TenantCard';
import { FilterChips } from '../components/FilterChips';
import { CategoryRow } from '../components/CategoryChip';
import { storeApi } from '../services/storeApi';
import { useStore } from '../contexts/StoreContext';
import { getFriendlyErrorMessage, AppApiError } from '../utils/errors';
import { ifood } from '../theme/ifood';
import { filterAndSortStores, StoreCategoryFilter } from '../utils/storeFilters';

type Props = CompositeScreenProps<
  NativeStackScreenProps<SearchStackParamList, 'SearchHome'>,
  BottomTabScreenProps<MainTabParamList, 'Search'>
>;

export function SearchScreen({ navigation }: Props) {
  const { enterStore } = useStore();
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

  const openStore = async (store: Tenant) => {
    await enterStore(store);
    navigation.navigate('Home', { screen: 'StoreHome' });
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={ifood.colors.bg} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={ifood.colors.primary} />
          </TouchableOpacity>
          <View style={styles.searchFlex}>
            <SearchBar
              placeholder="Buscar loja, restaurante ou mercado"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoFocus
            />
          </View>
        </View>
        <CategoryRow activeId={category} onSelect={setCategory} />
        <FilterChips
          activeIds={activeFilters}
          sortId={sortId}
          onToggle={toggleFilter}
          onSortChange={(id) => setSortId(id)}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
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
        ListHeaderComponent={
          <>
            {error ? (
              <View style={styles.errorWrap}>
                <ErrorBox message={error} />
                <Button label="Tentar novamente" onPress={loadStores} />
              </View>
            ) : null}
            <Text style={styles.sectionTitle}>
              {search.trim() ? `Resultados (${filtered.length})` : 'Lojas'}
            </Text>
          </>
        }
        ListEmptyComponent={
          !error ? <Text style={styles.empty}>Nenhuma loja encontrada</Text> : null
        }
        renderItem={({ item }) => (
          <TenantCard tenant={item} onPress={() => openStore(item)} variant="list" />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ifood.colors.bg },
  header: {
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  searchFlex: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ifood.colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  empty: { color: ifood.colors.textSecondary, textAlign: 'center', paddingVertical: 32 },
  errorWrap: { marginBottom: 12 },
});
