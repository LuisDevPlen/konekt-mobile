import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Category, HomeStackParamList } from '../types';
import { Loading, ErrorBox } from '../components/ui';
import { SacolaHeader } from '../components/layout';
import { storeApi } from '../services/storeApi';
import { useStore } from '../contexts/StoreContext';
import { getFriendlyErrorMessage } from '../utils/errors';
import { ifood } from '../theme/ifood';
import { resolveImageUrl } from '../utils/imageUrl';

type Props = NativeStackScreenProps<HomeStackParamList, 'Categories'>;

export function CategoriesScreen({ navigation }: Props) {
  const { store } = useStore();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!store) return;
    storeApi.getCategories(store.slug)
      .then(setCategories)
      .catch((e) => setError(getFriendlyErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [store?.slug]);

  if (!store) return null;

  return (
    <View style={styles.container}>
      <SacolaHeader title="Categorias" onBack={() => navigation.goBack()} />

      {loading ? (
        <Loading />
      ) : (
        <>
          {error ? (
            <View style={styles.errorWrap}>
              <ErrorBox message={error} />
            </View>
          ) : null}
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>Nenhuma categoria</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => navigation.navigate('Products', { categoryId: item.id, categoryName: item.name })}
                activeOpacity={0.85}
              >
                <View style={styles.icon}>
                  {item.image_url ? (
                    <Image source={{ uri: resolveImageUrl(item.image_url) ?? undefined }} style={styles.iconImage} />
                  ) : (
                    <Text style={styles.iconEmoji}>📂</Text>
                  )}
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  <Text style={styles.count}>{item.product_count} produtos</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ifood.colors.bg },
  errorWrap: { padding: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { color: ifood.colors.textSecondary, textAlign: 'center', marginTop: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ifood.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  iconImage: { width: 48, height: 48 },
  iconEmoji: { fontSize: 22 },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', color: ifood.colors.text, letterSpacing: -0.2 },
  desc: { fontSize: 13, color: ifood.colors.textSecondary, marginTop: 2, lineHeight: 18 },
  count: {
    fontSize: 12,
    fontWeight: '700',
    color: ifood.colors.primary,
    marginTop: 6,
  },
  arrow: { fontSize: 22, color: ifood.colors.textMuted },
});
