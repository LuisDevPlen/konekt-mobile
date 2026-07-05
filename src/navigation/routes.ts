import { NavigationProp } from '@react-navigation/native';
import { MainTabParamList } from '../types';

type TabNavigation = NavigationProp<MainTabParamList>;

export function goToHome(navigation: TabNavigation) {
  navigation.navigate('Home', { screen: 'StoresHome' });
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

export function goToLogin(navigation: TabNavigation) {
  navigation.navigate('Profile', { screen: 'Login' });
}

export function goToRegister(navigation: TabNavigation) {
  navigation.navigate('Profile', { screen: 'Register' });
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

export function goToNotifications(navigation: TabNavigation) {
  navigation.navigate('Profile', { screen: 'Notifications' });
}
