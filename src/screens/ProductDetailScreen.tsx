import React from 'react';
import {
  Image,
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
import { ComboSelection, HomeStackParamList, MainTabParamList, Product, ProductAddition } from '../types';
import { Loading, ErrorBox } from '../components/ui';
import { SacolaHeader, StickyFooter } from '../components/layout';
import { QuantityStepper } from '../components/QuantityStepper';
import { storeApi } from '../services/storeApi';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { formatCurrency, getFriendlyErrorMessage } from '../utils/errors';
import { AppApiError } from '../utils/errors';
import { resolveImageUrl } from '../utils/imageUrl';
import { isProductAvailable, maxProductQuantity, stockLabel } from '../utils/productStock';
import { calcProductUnitTotal } from '../utils/cart';
import { comboStartingPrice, comboUnitPrice, validateComboSelections } from '../utils/combo';
import {
  additionQty,
  canIncreaseAddition,
  categoryHint,
  changeAdditionQty,
  normalizeProductAdditions,
  productAdditionGroups,
  selectedAdditionsPayload,
  validateAdditionSelections,
} from '../utils/additions';
import { goToLogin } from '../navigation/routes';
import { getTenantCoverUri } from '../utils/coverImage';
import { colors, radius } from '../theme/ifood';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'ProductDetail'>,
  BottomTabScreenProps<MainTabParamList, 'Home'>
>;

export function ProductDetailScreen({ navigation, route }: Props) {
  const { store } = useStore();
  const coverUrl = getTenantCoverUri(store);
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [productQty, setProductQty] = React.useState(1);
  const [selectedAdditionQty, setSelectedAdditionQty] = React.useState<Map<string, number>>(new Map());
  const [comboSelections, setComboSelections] = React.useState<ComboSelection[]>([]);
  const [itemNotes, setItemNotes] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const [error, setError] = React.useState('');
  const [additionError, setAdditionError] = React.useState('');

  const load = React.useCallback(async () => {
    if (!store) return;
    setLoading(true);
    setAdditionError('');
    setProductQty(1);
    setSelectedAdditionQty(new Map());
    setComboSelections([]);
    setItemNotes('');
    try {
      const p = normalizeProductAdditions(await storeApi.getProduct(store.slug, route.params.productId));
      setProduct(p);
    } catch (e) {
      if (e instanceof AppApiError && e.status === 404) {
        setError('Produto não encontrado ou foi removido.');
      } else {
        setError(getFriendlyErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  }, [store?.slug, route.params.productId]);

  React.useEffect(() => { void load(); }, [load]);

  const handleChangeAddition = (add: ProductAddition, delta: number) => {
    if (!product) return;
    const group = productAdditionGroups(product).find((entry) =>
      entry.additions.some((item) => item.id === add.id)
    );
    if (!group) return;
    setSelectedAdditionQty((prev) => changeAdditionQty(add, group, prev, delta));
    setAdditionError('');
  };

  const handleAdd = async () => {
    if (!product || !isProductAvailable(product)) return;

    const validationError = validateAdditionSelections(product, selectedAdditionQty);
    if (validationError) {
      setAdditionError(validationError);
      return;
    }
    const comboError = validateComboSelections(product, comboSelections);
    if (comboError) { setAdditionError(comboError); return; }

    if (!isAuthenticated) {
      goToLogin(navigation, { coverUrl });
      return;
    }

    const qty = Math.min(Math.max(1, productQty), maxProductQuantity(product));
    setAdding(true);
    setAdditionError('');
    const result = await addItem(
      product,
      qty,
      selectedAdditionsPayload(selectedAdditionQty),
      itemNotes.trim() || null,
      comboSelections,
    );
    setAdding(false);

    if (!result.ok) {
      if (result.reason === 'auth_required') {
        goToLogin(navigation, { coverUrl });
        return;
      }
      if (result.reason === 'terms_required') {
        setAdditionError(result.message || 'Aceite os termos para continuar.');
        return;
      }
      setAdditionError(result.message || 'Não foi possível adicionar ao carrinho.');
      return;
    }

    navigation.navigate('Cart');
  };

  if (!store) return null;

  if (loading) {
    return (
      <View style={styles.container}>
        <SacolaHeader title="Produto" onBack={() => navigation.goBack()} />
        <Loading />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <SacolaHeader title="Produto" onBack={() => navigation.goBack()} />
        <View style={styles.errorWrap}>
          <ErrorBox message={error || 'Produto indisponível'} />
        </View>
      </View>
    );
  }

  const groups = productAdditionGroups(product);
  const isCombo = product.product_kind === 'COMBO';
  const unitTotal = isCombo ? comboUnitPrice(product, comboSelections) : calcProductUnitTotal(product, selectedAdditionsPayload(selectedAdditionQty));
  const maxQty = maxProductQuantity(product);
  const safeQty = Math.min(Math.max(1, productQty), Math.max(1, maxQty));
  const lineTotal = unitTotal * safeQty;
  const available = isProductAvailable(product);
  const additionValidationError = validateAdditionSelections(product, selectedAdditionQty);
  const comboValidationError = validateComboSelections(product, comboSelections);
  const validationMessage = additionValidationError || comboValidationError;
  const canAddToCart = available && (!isAuthenticated || !validationMessage);
  const footerValidationMessage = isAuthenticated ? (additionError || validationMessage) : null;

  return (
    <View style={styles.container}>
      <SacolaHeader
        title={product.name}
        onBack={() => navigation.goBack()}
        rightLabel="Sacola"
        onRight={() => navigation.navigate('Cart')}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {product.image_url ? (
          <Image
            source={{ uri: resolveImageUrl(product.image_url) ?? undefined }}
            style={styles.heroImage}
          />
        ) : null}

        <View style={styles.body}>
          {product.category_name ? (
            <Text style={styles.category}>{product.category_name}</Text>
          ) : null}
          <Text style={styles.title}>{product.name}</Text>
          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}
          <Text style={styles.price}>{isCombo && product.combo_price_type === 'SUM_ITEMS' ? `A partir de ${formatCurrency(comboStartingPrice(product))}` : formatCurrency(Number(product.price))}</Text>
          <Text style={[styles.stock, !available && styles.stockOut]}>
            {stockLabel(product)}
          </Text>
        </View>

        {(product.dietary_restrictions?.length || product.beverage_characteristics?.length || product.serves_up_to) ? (
          <View style={styles.highlightCard}>
            {[...(product.dietary_restrictions ?? []), ...(product.beverage_characteristics ?? [])].map((tag) => <View key={tag} style={styles.highlight}><Text style={styles.highlightText}>{tag.replaceAll('_', ' ')}</Text></View>)}
            {product.serves_up_to ? <View style={styles.highlight}><Text style={styles.highlightText}>Serve at\u00e9 {product.serves_up_to} pessoa(s)</Text></View> : null}
          </View>
        ) : null}

        {isCombo ? (product.combo_groups ?? []).filter((group) => group.active).map((group) => {
          const chosen = comboSelections.filter((selection) => selection.groupId === group.id);
          return <View key={group.id} style={styles.comboCard}>
            <Text style={styles.groupTitle}>{group.name}</Text>
            <Text style={styles.groupHint}>{group.required ? 'Obrigat\u00f3rio' : 'Opcional'} \u00b7 escolha de {Math.max(group.required ? 1 : 0, group.min_selections)} a {group.max_selections}</Text>
            {group.items.filter((item) => item.active !== false && (!item.track_stock || Number(item.stock ?? 0) > 0)).map((item) => {
              const selected = chosen.some((selection) => selection.itemId === item.id);
              return <TouchableOpacity key={item.id} style={[styles.comboItem, selected && styles.comboItemSelected]} onPress={() => setComboSelections((current) => {
                if (selected) return current.filter((selection) => !(selection.groupId === group.id && selection.itemId === item.id));
                if (chosen.length >= group.max_selections) return current;
                return [...current, { groupId: group.id, itemId: item.id }];
              })}>
                <View style={styles.additionInfo}><Text style={styles.additionName}>{item.name}</Text>{item.description ? <Text style={styles.additionDesc}>{item.description}</Text> : null}<Text style={styles.additionPrice}>{item.additional_price ? `+ ${formatCurrency(Number(item.additional_price))}` : product.combo_price_type === 'SUM_ITEMS' ? formatCurrency(Number(item.current_price ?? item.price)) : 'Incluso'}</Text></View>
                <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.primary : colors.textMuted} />
              </TouchableOpacity>;
            })}
          </View>;
        }) : null}

        {groups.length > 0 ? (
          <View style={styles.additionsWrap}>
            {groups.map((group) => (
              <View key={group.id ?? group.name} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{group.name}</Text>
                  <Text style={styles.groupHint}>{categoryHint(group)}</Text>
                </View>

                {group.additions.map((add) => {
                  const qty = additionQty(selectedAdditionQty, add.id);
                  const canIncrease = canIncreaseAddition(add, group, selectedAdditionQty);
                  const showLimits = (add.min_quantity ?? 0) > 0 || (add.max_quantity ?? 99) < 99;

                  return (
                    <View key={add.id} style={styles.additionRow}>
                      {add.image_url ? (
                        <Image
                          source={{ uri: resolveImageUrl(add.image_url) ?? undefined }}
                          style={styles.additionImage}
                        />
                      ) : (
                        <View style={styles.additionImagePlaceholder}>
                          <Ionicons name="image-outline" size={20} color={colors.textMuted} />
                        </View>
                      )}

                      <View style={styles.additionInfo}>
                        <Text style={styles.additionName}>{add.name}</Text>
                        {add.description?.trim() ? (
                          <Text style={styles.additionDesc}>{add.description.trim()}</Text>
                        ) : null}
                        <Text style={styles.additionPrice}>
                          {Number(add.price) > 0
                            ? formatCurrency(Number(add.price))
                            : 'Grátis'}
                          {qty > 0 && Number(add.price) > 0 ? (
                            ` · ${formatCurrency(Number(add.price) * qty)}`
                          ) : null}
                        </Text>
                        {showLimits ? (
                          <Text style={styles.additionLimits}>
                            Mín. {add.min_quantity ?? 0} · Máx. {add.max_quantity ?? 99}
                          </Text>
                        ) : null}
                      </View>

                      {qty > 0 ? (
                        <QuantityStepper
                          value={qty}
                          min={0}
                          compact
                          disableIncrease={!canIncrease}
                          onDecrease={() => handleChangeAddition(add, -1)}
                          onIncrease={() => handleChangeAddition(add, 1)}
                        />
                      ) : (
                        <TouchableOpacity
                          style={[styles.addBtn, !canIncrease && styles.addBtnDisabled]}
                          onPress={() => handleChangeAddition(add, 1)}
                          disabled={!canIncrease}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name="add"
                            size={22}
                            color={canIncrease ? colors.primary : colors.textMuted}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ) : null}

        {available ? (
          <View style={styles.qtyCard}>
            <Text style={styles.qtyLabel}>Quantidade</Text>
            <QuantityStepper
              value={safeQty}
              min={1}
              disableIncrease={safeQty >= maxQty}
              onDecrease={() => setProductQty((q) => Math.max(1, q - 1))}
              onIncrease={() => setProductQty((q) => Math.min(maxQty, q + 1))}
            />
          </View>
        ) : null}

        {available ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Observação</Text>
            <Text style={styles.notesHint}>Opcional — aparece na comanda da loja</Text>
            <TextInput
              style={styles.notesInput}
              value={itemNotes}
              onChangeText={(text) => setItemNotes(text.slice(0, 200))}
              placeholder="Ex.: remover cebola"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
          </View>
        ) : null}

        {additionError ? (
          <View style={styles.errorWrap}>
            <ErrorBox message={additionError} />
          </View>
        ) : null}
        {error ? (
          <View style={styles.errorWrap}>
            <ErrorBox message={error} />
          </View>
        ) : null}
      </ScrollView>

      <StickyFooter style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerLabel}>
            {safeQty > 1 ? `Total (${safeQty}×)` : 'Total do item'}
          </Text>
          <Text style={styles.footerPrice}>{formatCurrency(lineTotal)}</Text>
        </View>
        {(footerValidationMessage) ? (
          <Text style={styles.footerHint}>{footerValidationMessage}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.cta, (!canAddToCart || adding) && styles.ctaDisabled]}
          onPress={() => void handleAdd()}
          disabled={!canAddToCart || adding}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>
            {adding
              ? 'Adicionando...'
              : !available
                ? 'Indisponível'
                : !isAuthenticated
                  ? 'Entrar para adicionar'
                  : 'Adicionar à sacola'}
          </Text>
        </TouchableOpacity>
      </StickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  heroImage: { width: '100%', height: 220, backgroundColor: colors.bgSection },
  body: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  category: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  description: { fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginTop: 8 },
  price: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 12 },
  stock: { fontSize: 13, color: colors.success, marginTop: 6 },
  stockOut: { color: colors.danger },
  qtyCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  additionsWrap: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  highlightCard: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  highlight: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.bgSecondary },
  highlightText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'capitalize' },
  comboCard: { marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: radius.lg, backgroundColor: colors.bgSecondary },
  comboItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.border },
  comboItemSelected: { backgroundColor: colors.bgSection, marginHorizontal: -6, paddingHorizontal: 6, borderRadius: radius.md },
  groupCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
  },
  groupHeader: { marginBottom: 12 },
  groupTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  groupHint: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  additionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  additionImage: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.bgSection },
  additionImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSection,
    alignItems: 'center',
    justifyContent: 'center',
  },
  additionInfo: { flex: 1, paddingHorizontal: 12, paddingTop: 2 },
  additionName: { fontSize: 15, fontWeight: '600', color: colors.text },
  additionDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  additionPrice: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  additionLimits: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addBtnDisabled: { borderColor: colors.border },
  notesCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSecondary,
  },
  notesLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  notesHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2, marginBottom: 10 },
  notesInput: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  errorWrap: { paddingHorizontal: 16, paddingTop: 8 },
  footer: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  footerTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { fontSize: 14, color: colors.textSecondary },
  footerPrice: { fontSize: 18, fontWeight: '800', color: colors.text },
  footerHint: { fontSize: 13, color: colors.danger, lineHeight: 18 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: colors.textMuted },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
