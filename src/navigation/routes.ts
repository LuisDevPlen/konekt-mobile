import { NavigationProp } from '@react-navigation/native';
import { MainTabParamList } from '../types';

type TabNavigation = NavigationProp<MainTabParamList>;

export function goToHome(navigation: TabNavigation) {
  navigation.navigate('Home', { screen: 'StoresHome' });
}

/** Cardápio da loja aberta — para onde o cliente volta depois do Checkout Pro. */
export function goToStoreMenu(navigation: TabNavigation) {
  navigation.navigate('Home', { screen: 'StoreHome' });
}

export function goToOrderStatus(
  navigation: TabNavigation,
  params: { orderId: string; tenantSlug: string }
) {
  navigation.navigate('Orders', { screen: 'OrderStatus', params });
}

export function goToOrderChat(
  navigation: TabNavigation,
  params: { orderId: string; tenantSlug: string; storeName?: string }
) {
  navigation.navigate('Orders', { screen: 'OrderChat', params });
}

export function goToPayment(
  navigation: TabNavigation,
  params: {
    orderId: string;
    orderVersion: number;
    total: number;
    tenantSlug: string;
    paymentMethod: string;
  }
) {
  navigation.navigate('Orders', { screen: 'Payment', params });
}

export function goToLogin(navigation: TabNavigation, params?: { coverUrl?: string | null }) {
  navigation.navigate('Profile', { screen: 'Login', params });
}

export function goToRegister(navigation: TabNavigation, params?: { coverUrl?: string | null }) {
  navigation.navigate('Profile', { screen: 'Register', params });
}

export function goToVerifyEmail(navigation: TabNavigation, email: string) {
  navigation.navigate('Profile', { screen: 'VerifyEmail', params: { email } });
}

export function goToConnectionError(navigation: TabNavigation) {
  navigation.navigate('Home', { screen: 'ConnectionError' });
}

export function goToAddresses(
  navigation: TabNavigation,
  params?: { returnToCheckout?: boolean }
) {
  navigation.navigate('Profile', { screen: 'Addresses', params });
}

export function goToSupport(navigation: TabNavigation) {
  navigation.navigate('Support', { screen: 'SupportHome' });
}

export function goToNotifications(navigation: TabNavigation) {
  navigation.navigate('Profile', { screen: 'Notifications' });
}
