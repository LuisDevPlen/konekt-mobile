import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList, Product } from '../types';
import { Loading, ErrorBox } from '../components/ui';
import { SacolaHeader } from '../components/layout';
import { storeApi } from '../services/storeApi';
import { useStore } from '../contexts/StoreContext';
import { formatCurrency, getFriendlyErrorMessage } from '../utils/errors';
import { resolveImageUrl } from '../utils/imageUrl';
import { isProductAvailable } from '../utils/productStock';
import { colors, radius } from '../theme/ifood';

type Props = NativeStackScreenProps<HomeStackParamList, 'Products'>;

export function ProductsScreen({ navigation, route }: Props) {
  const { store } = useStore();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const categoryName = route.params?.categoryName;

  const load = React.useCallback(async () => {
    if (!store) return;
    setLoading(true);
    setError('');
    try {
      const result = await storeApi.getProducts(store.slug, {
        categoryId: route.params?.categoryId,
      });
      setProducts(result.data);
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [store?.slug, route.params?.categoryId]);

  React.useEffect(() => { void load(); }, [load]);

  if (!store) return null;

  return (
    <View style={styles.container}>
      <SacolaHeader
        title={categoryName || 'Cardápio'}
        onBack={() => navigation.goBack()}
        rightLabel="Sacola"
        onRight={() => navigation.navigate('Cart')}
      />

      {error ? (
        <View style={styles.errorWrap}>
          <ErrorBox message={error} />
        </View>
      ) : null}

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum produto encontrado</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productRow}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              activeOpacity={0.8}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <Text style={styles.productPrice}>{formatCurrency(Number(item.price))}</Text>
                {item.track_stock !== false && item.stock <= 0 ? (
                  <Text style={styles.stockOut}>Indisponível</Text>
                ) : null}
              </View>
              <View style={styles.productThumb}>
                {item.image_url ? (
                  <Image source={{ uri: resolveImageUrl(item.image_url) ?? undefined }} style={styles.productImage} />
                ) : (
                  <Text style={styles.thumbEmoji}>🍽</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  errorWrap: { padding: 16 },
  list: { paddingHorizontal: 16 },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: 32 },
  productRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productInfo: { flex: 1, paddingRight: 12 },
  productName: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.1 },
  productDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 19 },
  productPrice: { fontSize: 15, fontWeight: '800', color: colors.primary, marginTop: 8 },
  stockOut: { fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '600' },
  productThumb: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: { width: 88, height: 88 },
  thumbEmoji: { fontSize: 32 },
});
