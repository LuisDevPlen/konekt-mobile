import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { goToLogin, goToOrderStatus, goToOrderChat, goToNotifications, goToAddresses } from '../navigation/routes';
import { Input, Button, ErrorBox } from '../components/ui';
import { SacolaHeader, StickyFooter, RadioRow } from '../components/layout';
import { OrderProgressStepper } from '../components/OrderProgressStepper';
import { useCart, formatCurrency } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { useNotifications } from '../contexts/NotificationContext';
import { storeApi } from '../services/storeApi';
import { getFriendlyErrorMessage, AppApiError } from '../utils/errors';
import {
  getOrderStatusHeadline,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
  isOrderActive,
} from '../utils/orderStatus';
import { ifood } from '../theme/ifood';
import { validateEmail, validatePhone, validateRequired } from '../validators/forms';
import {
  FULFILLMENT_LABELS,
  PAYMENT_LABELS,
  parseCurrencyInput,
  requiresOnlineCheckout,
} from '../utils/checkout';
import * as WebBrowser from 'expo-web-browser';
import { FulfillmentType, HomeStackParamList, OrdersStackParamList, ProfileStackParamList, PaymentMethod, OrderMessage, OrderReview, AppNotification, StoreCartCoupon, DeliveryQuote, Tenant } from '../types';

type CheckoutProps = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Checkout'>,
  BottomTabScreenProps<MainTabParamList, 'Home'>
>;
type AddressesProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'Addresses'>,
  BottomTabScreenProps<MainTabParamList, 'Profile'>
>;
type PaymentProps = NativeStackScreenProps<OrdersStackParamList, 'Payment'>;
type OrderStatusProps = NativeStackScreenProps<OrdersStackParamList, 'OrderStatus'>;
type NotificationsProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'Notifications'>,
  BottomTabScreenProps<MainTabParamList, 'Profile'>
>;
type ProfileProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>,
  BottomTabScreenProps<MainTabParamList, 'Profile'>
>;

export function CheckoutScreen({ navigation }: CheckoutProps) {
  const { store } = useStore();
  const { customer, isAuthenticated, refreshProfile } = useAuth();
  const { items, total, clearCart, refreshCart } = useCart();
  const [step, setStep] = React.useState<'delivery' | 'payment'>('delivery');
  const [name, setName] = React.useState(customer?.name || '');
  const [email, setEmail] = React.useState(customer?.email || '');
  const [phone, setPhone] = React.useState(customer?.phone || '');
  const [address, setAddress] = React.useState(customer?.address || '');
  const [fulfillmentType, setFulfillmentType] = React.useState<FulfillmentType>('delivery');
  const [timingMode, setTimingMode] = React.useState<'now' | 'later'>('now');
  const [scheduleDate, setScheduleDate] = React.useState('');
  const [scheduleTime, setScheduleTime] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('pix');
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>(['pix', 'credit_card', 'debit_card', 'cash']);
  const [tenant, setTenant] = React.useState<Tenant | null>(null);
  const [mpConfigured, setMpConfigured] = React.useState(false);
  const [coupon, setCoupon] = React.useState<StoreCartCoupon | null>(null);
  const [couponInput, setCouponInput] = React.useState('');
  const [couponLoading, setCouponLoading] = React.useState(false);
  const [deliveryQuote, setDeliveryQuote] = React.useState<DeliveryQuote | null>(null);
  const [deliveryQuoteLoading, setDeliveryQuoteLoading] = React.useState(false);
  const [deliveryQuoteError, setDeliveryQuoteError] = React.useState('');
  const [needsChange, setNeedsChange] = React.useState(false);
  const [changeFor, setChangeFor] = React.useState('');
  const [paymentOptionsOpen, setPaymentOptionsOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      goToLogin(navigation);
    }
  }, [isAuthenticated, navigation]);

  React.useEffect(() => {
    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
    }
  }, [customer]);

  useFocusEffect(
    React.useCallback(() => {
      if (!isAuthenticated) return;
      void refreshProfile();
      if (store?.slug) {
        void storeApi.getCart(store.slug).then((cart) => {
          setCoupon(cart.coupon ?? null);
        }).catch(() => {});
      }
    }, [isAuthenticated, refreshProfile, store?.slug])
  );

  React.useEffect(() => {
    if (!store?.slug) return;
    storeApi.getTenant(store.slug)
      .then((t) => {
        setTenant(t);
        const methods = (t.payment_methods?.length
          ? t.payment_methods
          : ['pix', 'credit_card', 'debit_card', 'cash']) as PaymentMethod[];
        setPaymentMethods(methods);
        setMpConfigured(!!t.mercado_pago_configured);
        setPaymentMethod(methods.includes('pix') ? 'pix' : methods[0]);
      })
      .catch(() => {
        setPaymentMethods(['pix', 'credit_card', 'debit_card', 'cash']);
      });
  }, [store?.slug]);

  const deliveryFeesEnabled = React.useMemo(() => {
    if (!tenant?.delivery_enabled) return false;
    const tiers = tenant.delivery_fee_tiers;
    return Array.isArray(tiers) && tiers.length > 0;
  }, [tenant]);

  const refreshDeliveryQuote = React.useCallback(async (shippingAddress: string) => {
    if (!store?.slug || fulfillmentType !== 'delivery' || !deliveryFeesEnabled) return;
    const trimmed = shippingAddress.trim();
    if (trimmed.length < 8) {
      setDeliveryQuote(null);
      setDeliveryQuoteError('');
      return;
    }
    setDeliveryQuoteLoading(true);
    setDeliveryQuoteError('');
    try {
      const quote = await storeApi.getDeliveryQuote(store.slug, trimmed);
      if (address.trim() !== trimmed) return;
      setDeliveryQuote(quote);
      if (!quote.withinRange) {
        setDeliveryQuoteError(`Entrega disponível apenas até ${quote.maxDistanceKm} km`);
      }
    } catch (e) {
      if (address.trim() !== trimmed) return;
      setDeliveryQuote(null);
      setDeliveryQuoteError(getFriendlyErrorMessage(e));
    } finally {
      if (address.trim() === trimmed) {
        setDeliveryQuoteLoading(false);
      }
    }
  }, [store?.slug, fulfillmentType, address, deliveryFeesEnabled]);

  React.useEffect(() => {
    if (fulfillmentType !== 'delivery' || !deliveryFeesEnabled) {
      setDeliveryQuote(null);
      setDeliveryQuoteError('');
      return;
    }
    const timer = setTimeout(() => {
      void refreshDeliveryQuote(address);
    }, 400);
    return () => clearTimeout(timer);
  }, [fulfillmentType, address, refreshDeliveryQuote, deliveryFeesEnabled]);

  const deliveryFee = React.useMemo(() => {
    if (fulfillmentType !== 'delivery' || !deliveryFeesEnabled) return 0;
    if (coupon?.freeShipping) return 0;
    return deliveryQuote?.deliveryFee ?? 0;
  }, [fulfillmentType, coupon, deliveryQuote, deliveryFeesEnabled]);

  const checkoutTotal = Math.round((total + deliveryFee) * 100) / 100;

  const paymentOnDeliveryLabel =
    fulfillmentType === 'pickup' ? 'Pagamento na retirada' : 'Pagamento na entrega';

  const checkoutBlockedByDelivery = fulfillmentType === 'delivery' && (
    address.trim().length < 8
    || (deliveryFeesEnabled && (
      deliveryQuoteLoading
      || !!deliveryQuoteError
      || deliveryQuote == null
      || !deliveryQuote.withinRange
    ))
  );

  const goChangeAddress = () => {
    goToAddresses(navigation, { returnToCheckout: true });
  };

  const applyCoupon = async () => {
    if (!store?.slug || !couponInput.trim()) return;
    setCouponLoading(true);
    setError('');
    try {
      const cart = await storeApi.applyCartCoupon(store.slug, couponInput.trim());
      setCoupon(cart.coupon ?? null);
      setCouponInput('');
      await refreshCart();
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = async () => {
    if (!store?.slug) return;
    setCouponLoading(true);
    setError('');
    try {
      const cart = await storeApi.removeCartCoupon(store.slug);
      setCoupon(cart.coupon ?? null);
      await refreshCart();
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setCouponLoading(false);
    }
  };

  const goToPaymentStep = () => {
    if (fulfillmentType === 'delivery' && address.trim().length < 8) {
      setError('Cadastre um endereço de entrega para continuar');
      return;
    }
    if (checkoutBlockedByDelivery) {
      setError(deliveryQuoteError || 'Aguarde o cálculo da taxa de entrega');
      return;
    }
    setError('');
    setPaymentOptionsOpen(true);
    setStep('payment');
  };

  const confirmOrder = async () => {
    const err =
      validateRequired(name, 'Nome') ||
      validateEmail(email) ||
      validatePhone(phone) ||
      (fulfillmentType === 'delivery' ? validateRequired(address, 'Endereço') : null);
    if (err) { setError(err); return; }
    if (!store || items.length === 0) return;
    if (!paymentOptionsOpen) {
      setError(`Toque em "${paymentOnDeliveryLabel}" e escolha a forma de pagamento`);
      return;
    }
    if (checkoutBlockedByDelivery) {
      setError(deliveryQuoteError || 'Endereço fora da área de entrega');
      return;
    }
    if (!paymentMethods.includes(paymentMethod)) {
      setError('Selecione uma forma de pagamento disponível');
      return;
    }

    let cashChangeFor: number | null = null;
    if (paymentMethod === 'cash' && needsChange) {
      cashChangeFor = parseCurrencyInput(changeFor);
      if (!cashChangeFor) {
        setError('Informe o valor para troco');
        return;
      }
      if (cashChangeFor < checkoutTotal) {
        setError('O valor para troco deve ser maior ou igual ao total');
        return;
      }
    }

    setLoading(true);
    setError('');
    try {
      const order = await storeApi.createOrder(store.slug, {
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          productVersion: i.product.version,
          additions: (i.selectedAdditions ?? [])
            .filter((a) => a?.id && Number(a.quantity) > 0)
            .map((a) => ({ id: String(a.id), quantity: Number(a.quantity) })),
        })),
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        fulfillmentType,
        shippingAddress: fulfillmentType === 'delivery' ? address.trim() : undefined,
        deliveryDistanceKm: fulfillmentType === 'delivery' ? deliveryQuote?.distanceKm : undefined,
        paymentMethod,
        // Checkout mobile é sempre "pagamento na entrega/retirada" (não online).
        payOnDelivery: !requiresOnlineCheckout(paymentMethod, mpConfigured),
        cashChangeFor,
      });
      await clearCart();
      if (requiresOnlineCheckout(paymentMethod, mpConfigured)) {
        const checkout = await storeApi.createMercadoPagoCheckout(store.slug, order.id);
        await WebBrowser.openBrowserAsync(checkout.checkoutUrl);
        goToOrderStatus(navigation, { orderId: order.id, tenantSlug: store.slug });
      } else {
        goToOrderStatus(navigation, { orderId: order.id, tenantSlug: store.slug });
      }
    } catch (e) {
      if (e instanceof AppApiError && e.status === 409) {
        setError('Alguns produtos foram atualizados. Revise o carrinho e tente novamente.');
      } else {
        setError(getFriendlyErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'payment') {
      setStep('delivery');
      return;
    }
    navigation.goBack();
  };

  return (
    <View style={styles.checkoutContainer}>
      <SacolaHeader
        title={step === 'delivery' ? 'FINALIZAR PEDIDO' : 'PAGAMENTO'}
        onBack={handleBack}
      />

      <ScrollView contentContainerStyle={styles.checkoutScroll}>
        {step === 'delivery' ? (
          <>
            <Text style={styles.checkoutSectionHeading}>Entrega desejada</Text>

            <RadioRow
              label="Delivery"
              selected={fulfillmentType === 'delivery'}
              onPress={() => setFulfillmentType('delivery')}
            />

            {fulfillmentType === 'delivery' ? (
              <View style={styles.checkoutAddressBlock}>
                <Text style={styles.checkoutAddressLabel}>Endereço</Text>
                {address.trim() ? (
                  <Text style={styles.checkoutAddressValue}>{address}</Text>
                ) : (
                  <Text style={styles.checkoutAddressWarning}>
                    Cadastre seu endereço para receber em casa.
                  </Text>
                )}
                <TouchableOpacity onPress={goChangeAddress} activeOpacity={0.8}>
                  <Text style={styles.checkoutChangeLink}>Alterar endereço</Text>
                </TouchableOpacity>

                {tenant ? (
                  <View style={styles.checkoutStoreInfo}>
                    <Text style={styles.checkoutStoreName}>{tenant.name.toUpperCase()}</Text>
                    {tenant.address ? (
                      <Text style={styles.checkoutStoreMeta}>{tenant.address}</Text>
                    ) : null}
                    {deliveryFeesEnabled && deliveryQuoteLoading ? (
                      <Text style={styles.checkoutStoreMeta}>Calculando distância...</Text>
                    ) : deliveryFeesEnabled && deliveryQuote ? (
                      <Text style={styles.checkoutStoreMeta}>
                        {deliveryQuote.distanceKm.toFixed(1)} km
                        {deliveryFee > 0 ? ` · Taxa ${formatCurrency(deliveryFee)}` : ' · Entrega grátis'}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {deliveryQuoteError ? (
                  <Text style={styles.checkoutWarningText}>{deliveryQuoteError}</Text>
                ) : null}
              </View>
            ) : null}

            <RadioRow
              label="Buscar na loja"
              description={tenant?.address || 'Retire no balcão da loja'}
              selected={fulfillmentType === 'pickup'}
              onPress={() => setFulfillmentType('pickup')}
            />

            {fulfillmentType === 'pickup' && tenant ? (
              <View style={styles.checkoutAddressBlock}>
                <Text style={styles.checkoutStoreName}>{tenant.name.toUpperCase()}</Text>
                {tenant.address ? (
                  <Text style={styles.checkoutStoreMeta}>{tenant.address}</Text>
                ) : null}
              </View>
            ) : null}

            <Text style={[styles.checkoutSectionHeading, styles.checkoutSectionHeadingSpaced]}>
              Horário da entrega
            </Text>

            <RadioRow
              label="Pedir agora"
              selected={timingMode === 'now'}
              onPress={() => setTimingMode('now')}
            />
            <RadioRow
              label="Mais tarde"
              selected={timingMode === 'later'}
              onPress={() => setTimingMode('later')}
            />

            {timingMode === 'later' ? (
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleField}>
                  <Ionicons name="calendar-outline" size={18} color={ifood.colors.textSecondary} />
                  <TextInput
                    style={styles.scheduleInput}
                    placeholder="DD/MM/AAAA"
                    value={scheduleDate}
                    onChangeText={setScheduleDate}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <View style={styles.scheduleField}>
                  <Ionicons name="time-outline" size={18} color={ifood.colors.textSecondary} />
                  <TextInput
                    style={styles.scheduleInput}
                    placeholder="HH:MM"
                    value={scheduleTime}
                    onChangeText={setScheduleTime}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>
            ) : null}

            <Text style={[styles.checkoutSectionHeading, styles.checkoutSectionHeadingSpaced]}>
              Cupom de desconto
            </Text>

            {coupon ? (
              <View style={styles.couponApplied}>
                <Text style={styles.couponAppliedText}>
                  Cupom <Text style={styles.couponCode}>{coupon.code}</Text> aplicado
                  {' · '}{formatCurrency(coupon.discountAmount)} de desconto
                  {coupon.freeShipping ? ' · Frete grátis' : ''}
                </Text>
                <TouchableOpacity onPress={() => void removeCoupon()} disabled={couponLoading}>
                  <Text style={styles.checkoutChangeLink}>Remover</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Digite o código"
                  value={couponInput}
                  onChangeText={setCouponInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.couponApplyBtn, couponLoading && styles.confirmBtnDisabled]}
                  onPress={() => void applyCoupon()}
                  disabled={couponLoading || !couponInput.trim()}
                >
                  <Text style={styles.couponApplyText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Pagamento</Text>

            <View style={styles.paymentDeliveryCard}>
              <TouchableOpacity
                style={styles.paymentDeliveryHeader}
                onPress={() => setPaymentOptionsOpen((open) => !open)}
                activeOpacity={0.85}
              >
                <View style={styles.paymentDeliveryIcon}>
                  <Ionicons name="wallet-outline" size={22} color={ifood.colors.primary} />
                </View>
                <View style={styles.optionCardBody}>
                  <Text style={styles.paymentDeliveryTitle}>{paymentOnDeliveryLabel}</Text>
                  <Text style={styles.paymentAccordionHint}>
                    {paymentOptionsOpen
                      ? `Selecionado: ${PAYMENT_LABELS[paymentMethod]}`
                      : 'Toque para escolher como pagar'}
                  </Text>
                </View>
                <Ionicons
                  name={paymentOptionsOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={ifood.colors.textMuted}
                />
              </TouchableOpacity>

              {paymentOptionsOpen ? (
                <View style={styles.paymentMethodsPanel}>
                  <Text style={styles.paymentMethodsHeading}>Como deseja pagar?</Text>
                  <View style={styles.paymentMethodsList}>
                    {paymentMethods.map((method) => {
                      const selected = paymentMethod === method;
                      return (
                        <TouchableOpacity
                          key={method}
                          style={[styles.paymentMethodRow, selected && styles.paymentMethodRowSelected]}
                          onPress={() => {
                            setPaymentMethod(method);
                            if (method !== 'cash') {
                              setNeedsChange(false);
                              setChangeFor('');
                            }
                          }}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name={
                              method === 'pix' ? 'qr-code-outline'
                                : method === 'cash' ? 'cash-outline'
                                  : 'card-outline'
                            }
                            size={20}
                            color={selected ? ifood.colors.primary : ifood.colors.textSecondary}
                          />
                          <Text style={[styles.paymentMethodLabel, selected && styles.optionCardTitleSelected]}>
                            {PAYMENT_LABELS[method]}
                          </Text>
                          <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                            {selected ? <View style={styles.radioInner} /> : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {paymentMethod === 'cash' ? (
                    <View style={styles.changeBoxNested}>
                      <TouchableOpacity
                        style={styles.changeToggle}
                        onPress={() => {
                          setNeedsChange((v) => !v);
                          if (needsChange) setChangeFor('');
                        }}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name={needsChange ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={ifood.colors.primary}
                        />
                        <Text style={styles.changeToggleText}>Precisa de troco?</Text>
                      </TouchableOpacity>
                      {needsChange ? (
                        <Input
                          placeholder="Troco para quanto? Ex: 100,00"
                          value={changeFor}
                          onChangeText={setChangeFor}
                          keyboardType="decimal-pad"
                        />
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Resumo</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
              </View>
              {fulfillmentType === 'delivery' && deliveryFee > 0 ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Taxa de entrega</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(deliveryFee)}</Text>
                </View>
              ) : null}
              {coupon ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Cupom {coupon.code}</Text>
                  <Text style={[styles.summaryValue, styles.summaryDiscount]}>
                    -{formatCurrency(coupon.discountAmount)}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>{formatCurrency(checkoutTotal)}</Text>
              </View>
            </View>
          </>
        )}

        {error ? <ErrorBox message={error} /> : null}
      </ScrollView>

      <StickyFooter style={styles.checkoutFooter}>
        <View style={styles.footerRow}>
          <View style={styles.totalBlock}>
            <Text style={styles.totalHint}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(checkoutTotal)}</Text>
          </View>
          {step === 'delivery' ? (
            <TouchableOpacity
              style={[styles.continueBtn, checkoutBlockedByDelivery && styles.confirmBtnDisabled]}
              onPress={goToPaymentStep}
              disabled={checkoutBlockedByDelivery}
              activeOpacity={0.9}
            >
              <Text style={styles.continueText}>Ir para pagamento</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.continueBtn, loading && styles.confirmBtnDisabled]}
              onPress={() => void confirmOrder()}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.continueText}>
                {loading ? 'Enviando...' : 'Confirmar pedido'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </StickyFooter>
    </View>
  );
}

export function AddressesScreen({ navigation, route }: AddressesProps) {
  const { customer, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [address, setAddress] = React.useState(customer?.address || '');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const returnToCheckout = route.params?.returnToCheckout;

  React.useEffect(() => {
    if (customer) setAddress(customer.address || '');
  }, [customer]);

  const save = async () => {
    const err = validateRequired(address, 'Endereço');
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await storeApi.updateProfile({ address: address.trim() });
      await refreshProfile();
      if (returnToCheckout) {
        navigation.getParent()?.navigate('Home', { screen: 'Checkout' });
      } else {
        navigation.goBack();
      }
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.checkoutContainer}>
      <View style={[styles.addressesHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={ifood.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.sacolaTitleInline}>Endereço de entrega</Text>
        <View style={styles.sacolaSpacerInline} />
      </View>

      <ScrollView contentContainerStyle={styles.checkoutScroll}>
        <Text style={styles.sectionTitle}>Seu endereço</Text>
        <Text style={styles.addressesHint}>
          Informe rua, número, bairro, cidade e CEP para calcular a entrega no checkout.
        </Text>
        <Input
          placeholder="Ex: Rua Exemplo 123, Centro, Cidade - UF, CEP 00000-000"
          value={address}
          onChangeText={setAddress}
          multiline
          style={{ marginHorizontal: 16 }}
        />
        {error ? <ErrorBox message={error} /> : null}
      </ScrollView>

      <StickyFooter>
        <TouchableOpacity
          style={[styles.confirmBtn, saving && styles.confirmBtnDisabled]}
          onPress={() => void save()}
          disabled={saving}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmBtnText}>
            {saving ? 'Salvando...' : returnToCheckout ? 'Salvar e voltar ao pedido' : 'Salvar endereço'}
          </Text>
        </TouchableOpacity>
      </StickyFooter>
    </View>
  );
}

export function PaymentScreen({ navigation, route }: PaymentProps) {
  const initialMethod = route.params.paymentMethod ?? 'pix';
  const [method, setMethod] = React.useState<'pix' | 'credit_card' | 'debit_card' | 'cash'>(initialMethod);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [paymentMethods, setPaymentMethods] = React.useState<string[]>(['pix', 'credit_card', 'debit_card']);
  const { orderId, orderVersion, total, tenantSlug } = route.params;

  React.useEffect(() => {
    storeApi.getTenant(tenantSlug)
      .then((tenant) => {
        const methods = tenant.payment_methods?.length
          ? tenant.payment_methods
          : ['pix', 'credit_card', 'debit_card'];
        setPaymentMethods(methods);
        if (route.params.paymentMethod && methods.includes(route.params.paymentMethod)) {
          setMethod(route.params.paymentMethod);
        } else if (methods.includes('pix')) {
          setMethod('pix');
        } else {
          setMethod(methods[0] as 'pix' | 'credit_card' | 'debit_card' | 'cash');
        }
      })
      .catch(() => {
        setPaymentMethods(['pix', 'credit_card', 'debit_card']);
      });
  }, [tenantSlug, route.params.paymentMethod]);

  const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    credit_card: 'Cartão de crédito',
    debit_card: 'Cartão de débito',
    cash: 'Dinheiro',
  };

  const pay = async () => {
    setLoading(true);
    setError('');
    try {
      await storeApi.payOrder(tenantSlug, orderId, { paymentMethod: method, orderVersion });
      navigation.replace('OrderStatus', { orderId, tenantSlug });
    } catch (e) {
      if (e instanceof AppApiError && e.status === 409) {
        setError('Pagamento já processado ou pedido alterado. Consulte o status do pedido.');
      } else {
        setError(getFriendlyErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screenPad}>
      <Text style={styles.pageTitle}>Pagamento</Text>
      <View style={styles.payTotal}>
        <Text style={styles.payTotalLabel}>Total do pedido</Text>
        <Text style={styles.payTotalValue}>{formatCurrency(total)}</Text>
      </View>

      {!route.params.paymentMethod ? paymentMethods.map((payMethod) => (
        <Button
          key={payMethod}
          label={paymentLabels[payMethod] || payMethod}
          variant={method === payMethod ? 'primary' : 'secondary'}
          onPress={() => setMethod(payMethod as 'pix' | 'credit_card' | 'debit_card' | 'cash')}
        />
      )) : null}

      {error ? <ErrorBox message={error} /> : null}
      <Button
        label={loading ? 'Processando...' : 'Confirmar pagamento'}
        onPress={pay}
        disabled={loading}
      />
      <Button label="Ver pedido" variant="secondary" onPress={() => navigation.replace('OrderStatus', { orderId, tenantSlug })} />
    </View>
  );
}

export function OrderStatusScreen({ route, navigation }: OrderStatusProps) {
  const [order, setOrder] = React.useState<import('../types').Order | null>(null);
  const [messages, setMessages] = React.useState<OrderMessage[]>([]);
  const [orderReview, setOrderReview] = React.useState<OrderReview | null>(null);
  const [reviewRating, setReviewRating] = React.useState(0);
  const [reviewComment, setReviewComment] = React.useState('');
  const [submittingReview, setSubmittingReview] = React.useState(false);
  const [reviewError, setReviewError] = React.useState('');
  const [error, setError] = React.useState('');
  const { orderId, tenantSlug } = route.params;
  const starRange = [1, 2, 3, 4, 5];

  const loadOrder = React.useCallback(() => {
    return storeApi.getOrder(tenantSlug, orderId)
      .then(setOrder)
      .catch((e) => setError(getFriendlyErrorMessage(e)));
  }, [tenantSlug, orderId]);

  const loadMessages = React.useCallback(() => {
    return storeApi.getOrderMessages(tenantSlug, orderId)
      .then(setMessages)
      .catch(() => {});
  }, [tenantSlug, orderId]);

  const loadReview = React.useCallback(() => {
    return storeApi.getOrderReview(tenantSlug, orderId)
      .then(setOrderReview)
      .catch(() => setOrderReview(null));
  }, [tenantSlug, orderId]);

  React.useEffect(() => {
    loadOrder();
    loadMessages();
    loadReview();
  }, [loadOrder, loadMessages, loadReview]);

  React.useEffect(() => {
    if (!order || !isOrderActive(order.status)) return;

    const interval = setInterval(() => {
      loadOrder();
      loadMessages();
      if (order.status === 'delivered') loadReview();
    }, 30000);
    return () => clearInterval(interval);
  }, [order?.status, loadOrder, loadMessages, loadReview]);

  const submitReview = async () => {
    if (reviewRating < 1 || submittingReview) return;
    setSubmittingReview(true);
    setReviewError('');
    try {
      const review = await storeApi.submitOrderReview(tenantSlug, orderId, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setOrderReview(review);
    } catch (e) {
      setReviewError(getFriendlyErrorMessage(e));
    } finally {
      setSubmittingReview(false);
    }
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  if (error) {
    return (
      <View style={styles.screenPad}>
        <ErrorBox message={error} />
      </View>
    );
  }
  if (!order) {
    return (
      <View style={styles.screenPad}>
        <Text style={styles.pageTitle}>Carregando...</Text>
      </View>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const isPaid = order.payment_status === 'paid';

  return (
    <View style={styles.statusScreen}>
      <SacolaHeader title="Acompanhar pedido" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.statusScroll} contentContainerStyle={styles.statusScrollContent}>
      <View style={styles.statusHero}>
        <View
          style={[
            styles.statusIconWrap,
            isCancelled && styles.statusIconWrapCancelled,
            isDelivered && styles.statusIconWrapDelivered,
          ]}
        >
          <Ionicons
            name={isCancelled ? 'close-circle' : isDelivered ? 'checkmark-circle' : 'time-outline'}
            size={32}
            color={isCancelled ? ifood.colors.danger : isDelivered ? ifood.colors.successBright : ifood.colors.primary}
          />
        </View>
        <Text style={styles.statusHeadline}>{getOrderStatusHeadline(order.status)}</Text>
        <Text style={styles.statusSub}>
          Pedido #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleString('pt-BR')}
        </Text>
      </View>

      {!isCancelled ? (
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Acompanhe a entrega</Text>
          <OrderProgressStepper status={order.status} />
          <Text style={styles.progressCurrent}>
            Etapa atual: <Text style={styles.progressCurrentBold}>{getOrderStatusLabel(order.status)}</Text>
          </Text>
        </View>
      ) : (
        <View style={styles.cancelledBanner}>
          <Ionicons name="alert-circle-outline" size={22} color={ifood.colors.danger} />
          <Text style={styles.cancelledText}>Este pedido foi cancelado pela loja.</Text>
        </View>
      )}

      <View style={styles.statusCard}>
        {order.fulfillment_type ? (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.statusRowLabel}>Recebimento</Text>
              <Text style={styles.statusRowValue}>
                {FULFILLMENT_LABELS[order.fulfillment_type]}
              </Text>
            </View>
            <View style={styles.statusDivider} />
          </>
        ) : null}
        {order.payment_method || order.pay_on_delivery ? (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.statusRowLabel}>Forma de pagamento</Text>
              <Text style={styles.statusRowValue}>
                {getPaymentMethodLabel(
                  order.payment_method,
                  PAYMENT_LABELS,
                  order
                )}
              </Text>
            </View>
            <View style={styles.statusDivider} />
          </>
        ) : null}
        <View style={styles.statusRow}>
          <Text style={styles.statusRowLabel}>Status pagamento</Text>
          <View style={[styles.statusBadge, isPaid ? styles.statusBadgePaid : styles.statusBadgePending]}>
            <Text style={[styles.statusBadgeText, isPaid ? styles.statusBadgeTextPaid : styles.statusBadgeTextPending]}>
              {getPaymentStatusLabel(order.payment_status, order)}
            </Text>
          </View>
        </View>
        {order.payment_method === 'cash' && order.cash_change_for ? (
          <>
            <View style={styles.statusDivider} />
            <View style={styles.statusRow}>
              <Text style={styles.statusRowLabel}>Troco para</Text>
              <Text style={styles.statusRowValue}>{formatCurrency(Number(order.cash_change_for))}</Text>
            </View>
          </>
        ) : null}
        <View style={styles.statusDivider} />
        <View style={styles.statusRow}>
          <Text style={styles.statusRowLabel}>Total</Text>
          <Text style={styles.statusTotal}>{formatCurrency(Number(order.total_amount))}</Text>
        </View>
        {order.shipping_address ? (
          <>
            <View style={styles.statusDivider} />
            <View style={styles.addressBlock}>
              <Ionicons name="location-outline" size={18} color={ifood.colors.textSecondary} />
              <Text style={styles.addressText}>{order.shipping_address}</Text>
            </View>
          </>
        ) : null}
      </View>

      {order.items && order.items.length > 0 ? (
        <View style={styles.itemsCard}>
          <Text style={styles.itemsTitle}>Itens do pedido</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <View style={styles.itemNameCol}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
                {(item.additions || []).map((add) => (
                  <Text key={add.id} style={styles.itemAddition} numberOfLines={1}>
                    + {(add.quantity ?? 1) > 1 ? `${add.quantity}× ` : ''}{add.name}
                  </Text>
                ))}
              </View>
              <Text style={styles.itemPrice}>{formatCurrency(Number(item.unit_price) * item.quantity)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {isDelivered ? (
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Avalie seu pedido</Text>
          {orderReview ? (
            <View>
              <View style={styles.reviewStars}>
                {starRange.map((star) => (
                  <Text
                    key={star}
                    style={[styles.reviewStar, star <= orderReview.rating && styles.reviewStarOn]}
                  >
                    ★
                  </Text>
                ))}
              </View>
              {orderReview.comment ? (
                <Text style={styles.reviewCommentText}>"{orderReview.comment}"</Text>
              ) : null}
              {orderReview.store_reply ? (
                <View style={styles.reviewReplyBox}>
                  <Text style={styles.reviewReplyLabel}>Resposta da loja</Text>
                  <Text style={styles.reviewReplyText}>{orderReview.store_reply}</Text>
                </View>
              ) : null}
              {orderReview.visibility === 'pending' ? (
                <Text style={styles.reviewHint}>Sua avaliação foi enviada e aguarda publicação pela loja.</Text>
              ) : orderReview.visibility === 'published' ? (
                <Text style={[styles.reviewHint, styles.reviewHintOk]}>Sua avaliação está publicada. Obrigado!</Text>
              ) : null}
            </View>
          ) : (
            <View>
              <Text style={styles.reviewIntro}>Como foi sua experiência? Sua opinião ajuda a loja a melhorar.</Text>
              <View style={styles.reviewStarsPick}>
                {starRange.map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                    activeOpacity={0.7}
                    accessibilityLabel={`${star} estrelas`}
                  >
                    <Text style={[styles.reviewStarBtn, star <= reviewRating && styles.reviewStarOn]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reviewInput}
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Conte como foi o pedido (opcional)"
                multiline
                maxLength={2000}
              />
              {reviewError ? <Text style={styles.reviewError}>{reviewError}</Text> : null}
              <TouchableOpacity
                style={[styles.reviewSubmitBtn, (reviewRating < 1 || submittingReview) && styles.reviewSubmitBtnDisabled]}
                onPress={submitReview}
                disabled={reviewRating < 1 || submittingReview}
                activeOpacity={0.85}
              >
                <Text style={styles.reviewSubmitText}>
                  {submittingReview ? 'Enviando...' : 'Enviar avaliação'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.chatEntryCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('OrderChat', {
          orderId,
          tenantSlug,
          storeName: order.tenant_name,
        })}
      >
        <View style={styles.chatEntryIcon}>
          <Ionicons name="chatbubbles" size={22} color={ifood.colors.primary} />
        </View>
        <View style={styles.chatEntryBody}>
          <Text style={styles.chatEntryTitle}>Conversar com a loja</Text>
          <Text style={styles.chatEntryPreview} numberOfLines={1}>
            {lastMessage
              ? lastMessage.body
              : isOrderActive(order.status)
                ? 'Tire dúvidas sobre o pedido'
                : 'Ver histórico de mensagens'}
          </Text>
        </View>
        {messages.length > 0 ? (
          <View style={styles.chatEntryBadge}>
            <Text style={styles.chatEntryBadgeText}>{messages.length}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={ifood.colors.textMuted} />
      </TouchableOpacity>

      {isOrderActive(order.status) ? (
        <Text style={styles.autoRefreshHint}>Atualização automática a cada 30 segundos</Text>
      ) : null}
      </ScrollView>
    </View>
  );
}

function ProfileMenuItem({
  icon,
  label,
  subtitle,
  onPress,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={22} color={ifood.colors.text} style={styles.menuIcon} />
      <View style={styles.menuText}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={ifood.colors.textMuted} />
    </TouchableOpacity>
  );
}

export function NotificationsScreen({ navigation }: NotificationsProps) {
  const { refreshNotifications } = useNotifications();
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(() => {
    setLoading(true);
    setError('');
    return storeApi.listNotifications()
      .then(async (res) => {
        setItems(res.data);
        if (res.unreadCount > 0) {
          await storeApi.markAllNotificationsRead();
          setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
          await refreshNotifications();
        }
      })
      .catch((e) => setError(getFriendlyErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [refreshNotifications]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView style={styles.screenPad} contentContainerStyle={{ paddingBottom: 24 }}>
      {loading ? <Text style={styles.pageTitle}>Carregando...</Text> : null}
      {error ? <ErrorBox message={error} /> : null}
      {!loading && items.length === 0 ? (
        <Text style={styles.notifEmpty}>Nenhuma notificação</Text>
      ) : null}
      {items.map((n) => (
        <TouchableOpacity
          key={n.id}
          style={[styles.notifCard, !n.read_at && styles.notifCardUnread]}
          onPress={() => {
            if (!n.order_id || !n.tenant_slug) return;
            if (n.type === 'order_message') {
              goToOrderChat(navigation, {
                orderId: n.order_id,
                tenantSlug: n.tenant_slug,
                storeName: n.tenant_name ?? undefined,
              });
              return;
            }
            goToOrderStatus(navigation, {
              orderId: n.order_id,
              tenantSlug: n.tenant_slug,
            });
          }}
          activeOpacity={n.order_id && n.tenant_slug ? 0.8 : 1}
          disabled={!n.order_id || !n.tenant_slug}
        >
          <Text style={styles.notifTitle}>{n.title}</Text>
          {n.body ? <Text style={styles.notifBody}>{n.body}</Text> : null}
          {n.tenant_name ? <Text style={styles.notifStore}>{n.tenant_name}</Text> : null}
          <Text style={styles.notifTime}>
            {new Date(n.created_at).toLocaleString('pt-BR')}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export function ProfileScreen({ navigation }: ProfileProps) {
  const { customer, logout, refreshProfile, isAuthenticated } = useAuth();
  const { unreadCount, refreshNotifications } = useNotifications();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      if (!isAuthenticated) return;
      void refreshProfile();
      void refreshNotifications();
    }, [isAuthenticated, refreshProfile, refreshNotifications])
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.profileContainer, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.profileTitle}>Perfil</Text>
        <Text style={styles.profileSub}>Entre para gerenciar sua conta e pedidos</Text>
        <Button label="Entrar" onPress={() => goToLogin(navigation)} />
        <Button label="Criar conta" variant="secondary" onPress={() => navigation.navigate('Register')} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.profileContainer} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={[styles.profileHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{customer?.name?.charAt(0) || '?'}</Text>
        </View>
        <Text style={styles.profileName}>{customer?.name}</Text>
        <Text style={styles.profileEmail}>{customer?.email}</Text>
      </View>

      <View style={styles.profileInfoCard}>
        <Text style={styles.profileInfoTitle}>Dados cadastrais</Text>
        <View style={styles.profileInfoRow}>
          <Text style={styles.profileInfoLabel}>Nome</Text>
          <Text style={styles.profileInfoValue}>{customer?.name || '—'}</Text>
        </View>
        <View style={styles.profileInfoRow}>
          <Text style={styles.profileInfoLabel}>E-mail</Text>
          <Text style={styles.profileInfoValue}>{customer?.email || '—'}</Text>
        </View>
        <View style={styles.profileInfoRow}>
          <Text style={styles.profileInfoLabel}>Telefone</Text>
          <Text style={styles.profileInfoValue}>{customer?.phone?.trim() || 'Não informado'}</Text>
        </View>
        <View style={[styles.profileInfoRow, styles.profileInfoRowLast]}>
          <Text style={styles.profileInfoLabel}>Endereço</Text>
          <Text style={styles.profileInfoValue}>
            {customer?.address?.trim() || 'Não cadastrado'}
          </Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <ProfileMenuItem
          icon="receipt-outline"
          label="Pedidos"
          subtitle="Acompanhe seus pedidos"
          onPress={() => navigation.navigate('Orders')}
        />
        <ProfileMenuItem
          icon="notifications-outline"
          label="Notificações"
          subtitle="Atualizações dos seus pedidos"
          badge={unreadCount > 0 ? unreadCount : undefined}
          onPress={() => goToNotifications(navigation)}
        />
        <ProfileMenuItem
          icon="location-outline"
          label="Endereços"
          subtitle="Alterar endereço de entrega"
          onPress={() => navigation.navigate('Addresses')}
        />
        <ProfileMenuItem
          icon="refresh-outline"
          label="Atualizar dados"
          onPress={() => refreshProfile()}
        />
        <ProfileMenuItem
          icon="log-out-outline"
          label="Sair"
          onPress={() => logout()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  checkoutContainer: { flex: 1, backgroundColor: ifood.colors.bg },
  checkoutScroll: { paddingBottom: 120 },
  checkoutSectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: ifood.colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  checkoutSectionHeadingSpaced: { marginTop: 8 },
  checkoutAddressBlock: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
  },
  checkoutAddressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ifood.colors.primary,
    marginBottom: 4,
  },
  checkoutAddressValue: {
    fontSize: 14,
    color: ifood.colors.text,
    lineHeight: 20,
  },
  checkoutAddressWarning: {
    fontSize: 14,
    color: ifood.colors.primary,
    lineHeight: 20,
  },
  checkoutChangeLink: {
    fontSize: 14,
    fontWeight: '700',
    color: ifood.colors.primary,
    marginTop: 8,
  },
  checkoutStoreInfo: { marginTop: 12 },
  checkoutStoreName: {
    fontSize: 13,
    fontWeight: '800',
    color: ifood.colors.primary,
    letterSpacing: 0.3,
  },
  checkoutStoreMeta: {
    fontSize: 13,
    color: ifood.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  checkoutWarningText: {
    fontSize: 13,
    color: ifood.colors.primary,
    marginTop: 8,
    lineHeight: 18,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
  },
  scheduleField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    borderRadius: ifood.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: ifood.colors.white,
  },
  scheduleInput: {
    flex: 1,
    fontSize: 14,
    color: ifood.colors.text,
    padding: 0,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    borderRadius: ifood.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: ifood.colors.text,
    backgroundColor: ifood.colors.white,
  },
  couponApplyBtn: {
    backgroundColor: ifood.colors.primary,
    borderRadius: ifood.radius.sm,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  couponApplyText: {
    color: ifood.colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  couponApplied: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 6,
  },
  couponAppliedText: {
    fontSize: 14,
    color: ifood.colors.text,
    lineHeight: 20,
  },
  couponCode: { fontWeight: '800', color: ifood.colors.primary },
  checkoutFooter: { paddingHorizontal: 16 },
  summaryDiscount: { color: ifood.colors.successBright },
  addressesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
    backgroundColor: ifood.colors.bg,
  },
  sacolaTitleInline: {
    fontSize: 16,
    fontWeight: '800',
    color: ifood.colors.text,
    letterSpacing: 0.5,
  },
  sacolaSpacerInline: { width: 32 },
  addressesHint: {
    fontSize: 13,
    color: ifood.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: ifood.colors.text, marginBottom: 12, marginTop: 8, paddingHorizontal: 16 },
  addressCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  addressBody: { flex: 1 },
  optionGroup: { gap: 10, marginBottom: 16, paddingHorizontal: 16 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    borderRadius: ifood.radius.md,
    padding: 14,
    backgroundColor: ifood.colors.white,
  },
  optionCardSelected: {
    borderColor: ifood.colors.primary,
    backgroundColor: ifood.colors.chipBg,
  },
  optionCardBody: { flex: 1 },
  optionCardTitle: { fontSize: 15, fontWeight: '700', color: ifood.colors.text },
  optionCardTitleSelected: { color: ifood.colors.primary },
  paymentDeliveryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    borderRadius: ifood.radius.md,
    backgroundColor: ifood.colors.white,
    overflow: 'hidden',
  },
  paymentDeliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  paymentDeliveryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ifood.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentDeliveryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ifood.colors.text,
  },
  paymentAccordionHint: {
    fontSize: 13,
    color: ifood.colors.textSecondary,
    marginTop: 2,
  },
  paymentMethodsPanel: {
    borderTopWidth: 1,
    borderTopColor: ifood.colors.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: ifood.colors.bgSecondary,
  },
  paymentMethodsHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: ifood.colors.textSecondary,
    marginBottom: 10,
  },
  paymentMethodsList: { gap: 8 },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    borderRadius: ifood.radius.md,
    backgroundColor: ifood.colors.white,
  },
  paymentMethodRowSelected: {
    borderColor: ifood.colors.primary,
    backgroundColor: ifood.colors.chipBg,
  },
  paymentMethodLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: ifood.colors.text,
  },
  changeBoxNested: {
    marginTop: 12,
    padding: 12,
    borderRadius: ifood.radius.md,
    backgroundColor: ifood.colors.white,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    gap: 12,
  },
  optionCardHint: { fontSize: 12, color: ifood.colors.textSecondary, marginTop: 2 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ifood.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: ifood.colors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ifood.colors.primary,
  },
  changeBox: {
    backgroundColor: ifood.colors.white,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    borderRadius: ifood.radius.md,
    padding: 14,
    marginBottom: 16,
    marginHorizontal: 16,
    gap: 12,
  },
  changeToggle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  changeToggleText: { fontSize: 15, fontWeight: '600', color: ifood.colors.text },
  summaryBox: {
    backgroundColor: ifood.colors.bgSecondary,
    borderRadius: ifood.radius.md,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    gap: 8,
  },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: ifood.colors.text, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: ifood.colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: ifood.colors.text },
  summaryTotalRow: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: ifood.colors.border },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: ifood.colors.text },
  summaryTotalValue: { fontSize: 18, fontWeight: '800', color: ifood.colors.primary },
  confirmBtn: {
    backgroundColor: ifood.colors.primary,
    borderRadius: ifood.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.7 },
  confirmBtnText: { color: ifood.colors.white, fontWeight: '800', fontSize: 16 },
  deliveryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ifood.colors.text,
    borderRadius: ifood.radius.md,
    padding: 16,
    marginBottom: 16,
  },
  deliveryName: { fontSize: 15, fontWeight: '700', color: ifood.colors.text },
  deliveryTime: { fontSize: 13, color: ifood.colors.textSecondary, marginTop: 4 },
  deliveryRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deliveryFree: { fontSize: 14, fontWeight: '700', color: ifood.colors.successBright },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 6,
    borderColor: ifood.colors.primary,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  totalBlock: { flex: 1 },
  totalHint: { fontSize: 12, color: ifood.colors.textSecondary },
  totalValue: { fontSize: 16, fontWeight: '800', color: ifood.colors.text, marginTop: 2 },
  continueBtn: {
    backgroundColor: ifood.colors.primary,
    borderRadius: ifood.radius.md,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  continueText: { color: ifood.colors.white, fontWeight: '800', fontSize: 15 },
  screenPad: { flex: 1, backgroundColor: ifood.colors.bg, padding: 16 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: ifood.colors.text, marginBottom: 16 },
  payTotal: { marginBottom: 16 },
  payTotalLabel: { fontSize: 13, color: ifood.colors.textSecondary },
  payTotalValue: { fontSize: 24, fontWeight: '800', color: ifood.colors.text, marginTop: 4 },
  statusCard: {
    backgroundColor: ifood.colors.white,
    borderRadius: ifood.radius.lg,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    padding: 16,
    marginBottom: 12,
    ...ifood.shadow.card,
  },
  statusScreen: { flex: 1, backgroundColor: ifood.colors.bg },
  statusScroll: { flex: 1, backgroundColor: ifood.colors.bg },
  statusScrollContent: { padding: 16, paddingBottom: 32 },
  statusHero: { alignItems: 'center', marginBottom: 20, paddingTop: 4 },
  statusIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ifood.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusIconWrapDelivered: { backgroundColor: '#E8F8EF' },
  statusIconWrapCancelled: { backgroundColor: '#FFF0F0' },
  statusHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: ifood.colors.text,
    textAlign: 'center',
  },
  statusSub: {
    fontSize: 13,
    color: ifood.colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: ifood.colors.white,
    borderRadius: ifood.radius.lg,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    padding: 16,
    paddingBottom: 20,
    marginBottom: 12,
    ...ifood.shadow.card,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ifood.colors.text,
    marginBottom: 16,
  },
  progressCurrent: {
    fontSize: 13,
    color: ifood.colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  progressCurrentBold: {
    color: ifood.colors.text,
    fontWeight: '700',
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF0F0',
    borderRadius: ifood.radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  cancelledText: {
    flex: 1,
    fontSize: 14,
    color: ifood.colors.danger,
    fontWeight: '600',
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRowLabel: { fontSize: 14, color: ifood.colors.textSecondary },
  statusRowValue: { fontSize: 14, fontWeight: '600', color: ifood.colors.text, textAlign: 'right', flex: 1, marginLeft: 12 },
  statusBadge: {
    borderRadius: ifood.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgePaid: { backgroundColor: '#E8F8EF' },
  statusBadgePending: { backgroundColor: '#FFF8E6' },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  statusBadgeTextPaid: { color: ifood.colors.successBright },
  statusBadgeTextPending: { color: '#B8860B' },
  statusDivider: {
    height: 1,
    backgroundColor: ifood.colors.border,
    marginVertical: 12,
  },
  addressBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: ifood.colors.text,
    lineHeight: 20,
  },
  itemsCard: {
    backgroundColor: ifood.colors.white,
    borderRadius: ifood.radius.lg,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    padding: 16,
    marginBottom: 12,
    ...ifood.shadow.card,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ifood.colors.text,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: ifood.colors.primary,
    minWidth: 28,
  },
  itemNameCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: ifood.colors.text,
  },
  itemAddition: {
    fontSize: 12,
    color: ifood.colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: ifood.colors.text,
  },
  autoRefreshHint: {
    fontSize: 12,
    color: ifood.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  chatEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ifood.colors.white,
    borderRadius: ifood.radius.lg,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    padding: 14,
    marginBottom: 12,
    ...ifood.shadow.card,
  },
  chatEntryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ifood.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatEntryBody: { flex: 1 },
  chatEntryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ifood.colors.text,
  },
  chatEntryPreview: {
    fontSize: 13,
    color: ifood.colors.textSecondary,
    marginTop: 2,
  },
  chatEntryBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ifood.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  chatEntryBadgeText: {
    color: ifood.colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  reviewCard: {
    backgroundColor: ifood.colors.white,
    borderRadius: ifood.radius.lg,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    padding: 16,
    marginBottom: 12,
    ...ifood.shadow.card,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ifood.colors.text,
    marginBottom: 12,
  },
  reviewIntro: {
    fontSize: 13,
    color: ifood.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  reviewStarsPick: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  reviewStar: {
    fontSize: 22,
    color: '#ddd',
  },
  reviewStarBtn: {
    fontSize: 36,
    color: '#ddd',
  },
  reviewStarOn: {
    color: '#FFB800',
  },
  reviewCommentText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: ifood.colors.text,
    marginTop: 4,
  },
  reviewReplyBox: {
    backgroundColor: ifood.colors.bgSecondary,
    borderRadius: ifood.radius.md,
    padding: 12,
    marginTop: 12,
  },
  reviewReplyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ifood.colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reviewReplyText: {
    fontSize: 14,
    color: ifood.colors.text,
    lineHeight: 20,
  },
  reviewHint: {
    fontSize: 12,
    color: ifood.colors.textSecondary,
    marginTop: 10,
  },
  reviewHintOk: {
    color: ifood.colors.successBright,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: ifood.colors.border,
    borderRadius: ifood.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: ifood.colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  reviewError: {
    fontSize: 13,
    color: ifood.colors.danger,
    marginBottom: 8,
  },
  reviewSubmitBtn: {
    backgroundColor: ifood.colors.primary,
    borderRadius: ifood.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  reviewSubmitBtnDisabled: {
    opacity: 0.6,
  },
  reviewSubmitText: {
    color: ifood.colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  notifEmpty: {
    fontSize: 14,
    color: ifood.colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  notifCard: {
    backgroundColor: ifood.colors.white,
    borderRadius: ifood.radius.md,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    padding: 14,
    marginBottom: 10,
  },
  notifCardUnread: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFE0B2',
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ifood.colors.text,
  },
  notifBody: {
    fontSize: 14,
    color: ifood.colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  notifStore: {
    fontSize: 12,
    fontWeight: '600',
    color: ifood.colors.primary,
    marginTop: 6,
  },
  notifTime: {
    fontSize: 12,
    color: ifood.colors.textMuted,
    marginTop: 8,
  },
  statusId: { fontSize: 16, fontWeight: '700', color: ifood.colors.text },
  statusMeta: { fontSize: 14, color: ifood.colors.textSecondary, marginTop: 8 },
  statusTotal: { fontSize: 16, fontWeight: '800', color: ifood.colors.text },
  profileContainer: { flex: 1, backgroundColor: ifood.colors.bg },
  profileHeader: { paddingHorizontal: 16, paddingBottom: 20 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFE8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: ifood.colors.primary },
  profileName: { fontSize: 22, fontWeight: '800', color: ifood.colors.text },
  profileEmail: { fontSize: 14, color: ifood.colors.textSecondary, marginTop: 4 },
  profileInfoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: ifood.colors.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ifood.colors.border,
  },
  profileInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ifood.colors.text,
    marginBottom: 12,
  },
  profileInfoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
  },
  profileInfoRowLast: { borderBottomWidth: 0 },
  profileInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ifood.colors.textSecondary,
    marginBottom: 2,
  },
  profileInfoValue: {
    fontSize: 14,
    color: ifood.colors.text,
    lineHeight: 20,
  },
  profileTitle: { fontSize: 24, fontWeight: '800', color: ifood.colors.text, paddingHorizontal: 16 },
  profileSub: { fontSize: 14, color: ifood.colors.textSecondary, marginVertical: 12, paddingHorizontal: 16, lineHeight: 20 },
  menuSection: { borderTopWidth: 8, borderTopColor: ifood.colors.bgSecondary },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
  },
  menuIcon: { marginRight: 14 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: ifood.colors.text },
  menuSub: { fontSize: 13, color: ifood.colors.textSecondary, marginTop: 2 },
  badge: {
    backgroundColor: ifood.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  badgeText: { color: ifood.colors.white, fontSize: 11, fontWeight: '800' },
});
