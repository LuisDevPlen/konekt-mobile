import React from 'react';
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Category, HomeStackParamList, MainTabParamList, Product, Tenant } from '../types';
import { CircleIconButton } from '../components/layout';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart, formatCurrency } from '../contexts/CartContext';
import { storeApi } from '../services/storeApi';
import { ifood, storeAccent } from '../theme/ifood';
import { resolveImageUrl } from '../utils/imageUrl';
import { goToLogin } from '../navigation/routes';
import { formatCurrency as fmt } from '../utils/errors';
import { getTabBarHeight } from '../utils/safeArea';
import { formatStoreDelivery, formatStoreRating } from '../utils/storeFilters';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'StoreHome'>,
  BottomTabScreenProps<MainTabParamList, 'Home'>
>;

const { width } = Dimensions.get('window');

type CategorySection = {
  id: string;
  name: string;
  products: Product[];
};

export function StoreHomeScreen({ navigation }: Props) {
  const { store, leaveStore } = useStore();
  const { isAuthenticated } = useAuth();
  const { itemCount, total } = useCart();
  const insets = useSafeAreaInsets();
  const scrollRef = React.useRef<ScrollView>(null);
  const categoryBarRef = React.useRef<ScrollView>(null);
  const sectionOffsets = React.useRef<Record<string, number>>({});
  const [tenant, setTenant] = React.useState<Tenant | null>(store);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [sections, setSections] = React.useState<CategorySection[]>([]);
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!store) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [tenantData, cats, productsRes] = await Promise.all([
          storeApi.getTenant(store.slug).catch(() => store),
          storeApi.getCategories(store.slug).catch(() => [] as Category[]),
          storeApi.getProducts(store.slug, { page: 1, limit: 200 }).catch(() => ({ data: [] as Product[] })),
        ]);
        if (cancelled) return;

        const products = productsRes.data;

        const byCategory = new Map<string, Product[]>();
        const uncategorized: Product[] = [];
        for (const product of products) {
          if (product.category_id) {
            const list = byCategory.get(product.category_id) ?? [];
            list.push(product);
            byCategory.set(product.category_id, list);
          } else {
            uncategorized.push(product);
          }
        }

        const built: CategorySection[] = cats
          .map((cat) => ({
            id: cat.id,
            name: cat.name,
            products: byCategory.get(cat.id) ?? [],
          }))
          .filter((section) => section.products.length > 0);

        if (uncategorized.length > 0) {
          built.push({ id: 'other', name: 'Outros', products: uncategorized });
        }

        // Se não há categorias cadastradas, agrupa tudo em Destaques.
        if (built.length === 0 && products.length > 0) {
          built.push({ id: 'highlights', name: 'Cardápio', products });
        }

        setTenant(tenantData);
        setCategories(cats);
        setSections(built);
        setActiveCategoryId(built[0]?.id ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [store?.slug]);

  const filteredSections = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sections;
    return sections
      .map((section) => ({
        ...section,
        products: section.products.filter((p) =>
          p.name.toLowerCase().includes(term)
          || (p.description ?? '').toLowerCase().includes(term)
        ),
      }))
      .filter((section) => section.products.length > 0);
  }, [sections, search]);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setMenuOpen(false);
    const y = sectionOffsets.current[categoryId];
    if (y == null || !scrollRef.current) return;
    scrollRef.current.scrollTo({ y: Math.max(0, y - 56), animated: true });
  };

  const onSectionLayout = (categoryId: string, event: LayoutChangeEvent) => {
    sectionOffsets.current[categoryId] = event.nativeEvent.layout.y;
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y + 80;
    let current = filteredSections[0]?.id ?? null;
    for (const section of filteredSections) {
      const top = sectionOffsets.current[section.id] ?? 0;
      if (top <= y) current = section.id;
    }
    if (current && current !== activeCategoryId) {
      setActiveCategoryId(current);
    }
  };

  if (!store) {
    navigation.replace('StoresHome');
    return null;
  }

  const accent = storeAccent(store.slug);
  const rating = tenant ? formatStoreRating(tenant) : null;
  const delivery = tenant ? formatStoreDelivery(tenant) : '';
  const highlights = filteredSections[0]?.products.slice(0, 6) ?? [];

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <CircleIconButton
          icon="chevron-back"
          onPress={() => {
            leaveStore();
            navigation.goBack();
          }}
        />
        {showSearch ? (
          <TextInput
            style={styles.topSearch}
            placeholder={`Buscar em ${store.name}`}
            placeholderTextColor={ifood.colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        ) : (
          <Text style={styles.topTitle} numberOfLines={1}>{store.name}</Text>
        )}
        <CircleIconButton
          icon={showSearch ? 'close' : 'search-outline'}
          onPress={() => {
            setShowSearch((v) => !v);
            if (showSearch) setSearch('');
          }}
        />
      </View>

      <View style={styles.categoryBar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuOpen((v) => !v)}
          activeOpacity={0.85}
        >
          <Ionicons name="menu" size={20} color={ifood.colors.text} />
        </TouchableOpacity>
        <ScrollView
          ref={categoryBarRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChips}
        >
          {filteredSections.map((section) => {
            const active = activeCategoryId === section.id;
            return (
              <TouchableOpacity
                key={section.id}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => scrollToCategory(section.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {section.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {menuOpen ? (
        <View style={styles.menuDropdown}>
          {filteredSections.map((section) => (
            <TouchableOpacity
              key={`menu-${section.id}`}
              style={styles.menuItem}
              onPress={() => scrollToCategory(section.id)}
            >
              <Text style={styles.menuItemText}>{section.name}</Text>
              <Text style={styles.menuItemCount}>{section.products.length}</Text>
            </TouchableOpacity>
          ))}
          {categories.length === 0 && filteredSections.length === 0 ? (
            <Text style={styles.menuEmpty}>Nenhuma categoria disponível</Text>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        bounces={false}
        style={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={[styles.heroBg, { backgroundColor: accent }]}>
            {highlights[0]?.image_url ? (
              <Image
                source={{ uri: resolveImageUrl(highlights[0].image_url) ?? undefined }}
                style={styles.heroImage}
              />
            ) : null}
            <View style={styles.heroOverlay} />
          </View>
          <View style={styles.logoWrap}>
            <View style={[styles.logo, { borderColor: accent }]}>
              {tenant?.logo_url ? (
                <Image
                  source={{ uri: resolveImageUrl(tenant.logo_url) ?? undefined }}
                  style={styles.logoImage}
                />
              ) : (
                <Text style={[styles.logoText, { color: accent }]}>{store.name.charAt(0)}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.storeTitle}>{store.name}</Text>
          {tenant?.address ? (
            <Text style={styles.storeSub} numberOfLines={2}>{tenant.address}</Text>
          ) : null}
          {rating ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F5A623" />
              <Text style={styles.ratingText}> {rating}</Text>
            </View>
          ) : null}
          {delivery ? <Text style={styles.deliveryRow}>{delivery}</Text> : null}
        </View>

        {highlights.length > 0 && !search.trim() ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Destaques</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsRow}>
              {highlights.map((p) => (
                <TouchableOpacity
                  key={`h-${p.id}`}
                  style={styles.highlightCard}
                  onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                  activeOpacity={0.85}
                >
                  <View style={styles.highlightImageWrap}>
                    {p.image_url ? (
                      <Image source={{ uri: resolveImageUrl(p.image_url) ?? undefined }} style={styles.highlightImage} />
                    ) : (
                      <Text style={styles.highlightEmoji}>🍽</Text>
                    )}
                  </View>
                  <Text style={styles.highlightPrice}>{fmt(Number(p.price))}</Text>
                  <Text style={styles.highlightName} numberOfLines={2}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : null}

        {loading ? (
          <Text style={styles.loadingText}>Carregando cardápio...</Text>
        ) : filteredSections.length === 0 ? (
          <Text style={styles.loadingText}>Nenhum produto encontrado</Text>
        ) : (
          filteredSections.map((section) => (
            <View
              key={section.id}
              onLayout={(event) => onSectionLayout(section.id, event)}
              style={styles.categorySection}
            >
              <View style={styles.categorySectionHeader}>
                <View style={styles.categoryAccent} />
                <Text style={styles.categorySectionTitle}>{section.name}</Text>
                <Text style={styles.categorySectionCount}>
                  {section.products.length} {section.products.length === 1 ? 'item' : 'itens'}
                </Text>
              </View>
              {section.products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productRow}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  activeOpacity={0.85}
                >
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    {product.description ? (
                      <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
                    ) : null}
                    <Text style={styles.productPrice}>{fmt(Number(product.price))}</Text>
                  </View>
                  <View style={styles.productThumb}>
                    {product.image_url ? (
                      <Image
                        source={{ uri: resolveImageUrl(product.image_url) ?? undefined }}
                        style={styles.productImage}
                      />
                    ) : (
                      <Text style={styles.thumbEmoji}>🍽</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {isAuthenticated && itemCount > 0 ? (
        <TouchableOpacity
          style={[styles.cartBar, { marginBottom: getTabBarHeight(insets) }]}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartBarLeft}>
            <Text style={styles.cartBarLabel}>Ver sacola</Text>
            <Text style={styles.cartBarTotal}>
              {itemCount} {itemCount === 1 ? 'item' : 'itens'} · {formatCurrency(total)}
            </Text>
          </View>
          <Ionicons name="bag-handle" size={22} color={ifood.colors.white} />
        </TouchableOpacity>
      ) : !isAuthenticated ? (
        <TouchableOpacity
          style={[styles.authBar, { marginBottom: getTabBarHeight(insets) }]}
          onPress={() => goToLogin(navigation)}
        >
          <Text style={styles.authBarText}>Entre para montar seu pedido</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ifood.colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: ifood.colors.bg,
  },
  topTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: ifood.colors.text },
  topSearch: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: ifood.colors.text,
    backgroundColor: ifood.colors.white,
  },
  categoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
    backgroundColor: ifood.colors.white,
    paddingLeft: 8,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChips: { paddingVertical: 8, paddingRight: 12, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    marginRight: 4,
    backgroundColor: ifood.colors.bgSecondary,
  },
  categoryChipActive: { backgroundColor: ifood.colors.primary },
  categoryChipText: { fontSize: 14, fontWeight: '700', color: ifood.colors.textSecondary },
  categoryChipTextActive: { color: ifood.colors.white, fontWeight: '800' },
  menuDropdown: {
    backgroundColor: ifood.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
    paddingVertical: 4,
    maxHeight: 240,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: { fontSize: 14, fontWeight: '600', color: ifood.colors.text },
  menuItemCount: { fontSize: 12, color: ifood.colors.textMuted },
  menuEmpty: { padding: 16, color: ifood.colors.textSecondary },
  scroll: { flex: 1 },
  hero: { height: 180, position: 'relative' },
  heroBg: { flex: 1, overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFillObject, width, height: 180, opacity: 0.85 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  logoWrap: { position: 'absolute', bottom: -28, left: 0, right: 0, alignItems: 'center' },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ifood.colors.white,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...ifood.shadow.card,
  },
  logoImage: { width: 56, height: 56 },
  logoText: { fontSize: 22, fontWeight: '800' },
  infoCard: {
    marginTop: 36,
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  storeTitle: { fontSize: 18, fontWeight: '800', color: ifood.colors.text, textAlign: 'center' },
  storeSub: { fontSize: 13, color: ifood.colors.textSecondary, marginTop: 4, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingText: { fontSize: 13, color: ifood.colors.textSecondary },
  deliveryRow: { fontSize: 13, color: ifood.colors.textSecondary, marginTop: 6 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ifood.colors.text,
    letterSpacing: -0.3,
  },
  highlightsRow: { paddingHorizontal: 16, paddingVertical: 12 },
  highlightCard: { width: 140, marginRight: 12 },
  highlightImageWrap: {
    width: 140,
    height: 100,
    borderRadius: ifood.radius.md,
    backgroundColor: ifood.colors.bgSecondary,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightImage: { width: 140, height: 100 },
  highlightEmoji: { fontSize: 36 },
  highlightPrice: { fontSize: 16, fontWeight: '800', color: ifood.colors.text, marginTop: 8 },
  highlightName: { fontSize: 13, color: ifood.colors.textSecondary, marginTop: 4, lineHeight: 17 },
  categorySection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    marginTop: 4,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: ifood.colors.primary,
  },
  categoryAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: ifood.colors.primary,
  },
  categorySectionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: ifood.colors.text,
    letterSpacing: -0.2,
  },
  categorySectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: ifood.colors.primary,
    backgroundColor: ifood.colors.chipBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  productRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
  },
  productInfo: { flex: 1, paddingRight: 12 },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: ifood.colors.text,
    letterSpacing: -0.1,
  },
  productDesc: {
    fontSize: 13,
    color: ifood.colors.textSecondary,
    marginTop: 4,
    lineHeight: 19,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: ifood.colors.primary,
    marginTop: 8,
  },
  productThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: ifood.colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: { width: 72, height: 72 },
  thumbEmoji: { fontSize: 28 },
  loadingText: {
    textAlign: 'center',
    color: ifood.colors.textSecondary,
    paddingVertical: 24,
  },
  cartBar: {
    marginHorizontal: 16,
    backgroundColor: ifood.colors.primary,
    borderRadius: ifood.radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    ...ifood.shadow.footer,
  },
  cartBarLeft: { flex: 1 },
  cartBarLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  cartBarTotal: { color: ifood.colors.white, fontSize: 16, fontWeight: '800', marginTop: 2 },
  authBar: {
    marginHorizontal: 16,
    backgroundColor: ifood.colors.primary,
    borderRadius: ifood.radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  authBarText: { color: ifood.colors.white, fontSize: 14, fontWeight: '700' },
});
