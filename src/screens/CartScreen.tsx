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
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeStackParamList, MainTabParamList } from '../types';
import { goToLogin, goToRegister } from '../navigation/routes';
import { Button } from '../components/ui';
import { SacolaHeader, StickyFooter } from '../components/layout';
import { QuantityStepper } from '../components/QuantityStepper';
import { useCart, formatCurrency } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { resolveImageUrl } from '../utils/imageUrl';
import { getTenantCoverUri } from '../utils/coverImage';
import { formatAdditionSummary } from '../utils/cart';
import { ifood } from '../theme/ifood';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Cart'>,
  BottomTabScreenProps<MainTabParamList, 'Home'>
>;

export function CartScreen({ navigation }: Props) {
  const { store } = useStore();
  const coverUrl = getTenantCoverUri(store);
  const { isAuthenticated } = useAuth();
  const { items, total, updateQuantity, removeItem, getItemTotal, clearCart, itemCount } = useCart();
  const insets = useSafeAreaInsets();

  const handleClear = async () => {
    await clearCart();
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <SacolaHeader title="SACOLA" onBack={() => navigation.goBack()} />
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Entre para usar a sacola</Text>
          <Text style={styles.emptySub}>Crie uma conta ou faça login para adicionar itens e pedir</Text>
        </View>
        <View style={styles.emptyActions}>
          <Button label="Entrar" onPress={() => goToLogin(navigation, { coverUrl })} />
          <Button label="Criar conta" variant="secondary" onPress={() => goToRegister(navigation, { coverUrl })} />
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <SacolaHeader title="SACOLA" onBack={() => navigation.goBack()} />
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Sacola vazia</Text>
          <Text style={styles.emptySub}>Adicione itens deliciosos do cardápio</Text>
        </View>
        <View style={styles.emptyActions}>
          <Button label="Ver cardápio" onPress={() => navigation.navigate('Products', {})} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SacolaHeader
        title="SACOLA"
        onBack={() => navigation.goBack()}
        rightLabel="Limpar"
        onRight={() => void handleClear()}
      />

      {store ? (
        <View style={styles.storeRow}>
          <View style={styles.storeLogo}>
            <Text style={styles.storeLogoText}>{store.name.charAt(0)}</Text>
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{store.name}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products', {})}>
              <Text style={styles.addMore}>Adicionar mais itens</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Itens adicionados</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemThumbWrap}>
              {item.product.image_url ? (
                <Image
                  source={{ uri: resolveImageUrl(item.product.image_url) ?? undefined }}
                  style={styles.itemThumb}
                />
              ) : (
                <View style={styles.itemThumbPlaceholder}>
                  <Text>🍽</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.editBadge}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.product.id })}
              >
                <Ionicons name="pencil" size={12} color={ifood.colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.itemBody}>
              <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
              <Text style={styles.itemPrice}>{formatCurrency(getItemTotal(item))}</Text>
              {item.selectedAdditions.length > 0 && (
                <Text style={styles.itemAdditions} numberOfLines={2}>
                  {formatAdditionSummary(item)}
                </Text>
              )}
              {item.notes?.trim() ? (
                <Text style={styles.itemNotes} numberOfLines={2}>
                  Obs: {item.notes.trim()}
                </Text>
              ) : null}
            </View>

            <QuantityStepper
              value={item.quantity}
              onDecrease={() =>
                item.quantity <= 1
                  ? removeItem(item.product.id)
                  : updateQuantity(item.product.id, item.quantity - 1)
              }
              onIncrease={() => updateQuantity(item.product.id, item.quantity + 1)}
              min={0}
              compact
            />
          </View>
        )}
      />

      <StickyFooter>
        <View style={styles.footerRow}>
          <View style={styles.totalBlock}>
            <Text style={styles.totalHint}>Total com entrega grátis</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(total)} / {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => navigation.navigate('Checkout')}
            activeOpacity={0.9}
          >
            <Text style={styles.continueText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </StickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ifood.colors.bg },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
  },
  storeLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ifood.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  storeLogoText: { color: ifood.colors.white, fontWeight: '800', fontSize: 16 },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 15, fontWeight: '700', color: ifood.colors.text },
  addMore: { fontSize: 13, fontWeight: '600', color: ifood.colors.primary, marginTop: 2 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: ifood.colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
    gap: 12,
  },
  itemThumbWrap: { position: 'relative' },
  itemThumb: { width: 72, height: 72, borderRadius: ifood.radius.md },
  itemThumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: ifood.radius.md,
    backgroundColor: ifood.colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ifood.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: ifood.colors.text, lineHeight: 20 },
  itemPrice: { fontSize: 15, fontWeight: '800', color: ifood.colors.successBright, marginTop: 6 },
  itemAdditions: { fontSize: 12, color: ifood.colors.textSecondary, marginTop: 4 },
  itemNotes: { fontSize: 12, color: ifood.colors.text, marginTop: 4, fontStyle: 'italic' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: ifood.colors.text },
  emptySub: { color: ifood.colors.textSecondary, marginTop: 4 },
  emptyActions: { padding: 16 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  totalBlock: { flex: 1, minWidth: 0 },
  totalHint: { fontSize: 12, color: ifood.colors.textSecondary },
  totalValue: { fontSize: 18, fontWeight: '800', color: ifood.colors.text, marginTop: 2 },
  continueBtn: {
    backgroundColor: ifood.colors.primary,
    borderRadius: ifood.radius.md,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  continueText: { color: ifood.colors.white, fontWeight: '800', fontSize: 15 },
});
