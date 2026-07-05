import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer, Tenant } from '../types';

const KEYS = {
  accessToken: 'konekt_customer_access',
  refreshToken: 'konekt_customer_refresh',
  customer: 'konekt_customer_profile',
  tenant: 'konekt_tenant',
  cartPrefix: 'konekt_cart_',
};

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.accessToken, access);
  await SecureStore.setItemAsync(KEYS.refreshToken, refresh);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.accessToken);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.refreshToken);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.accessToken);
  await SecureStore.deleteItemAsync(KEYS.refreshToken);
}

export async function saveCustomer(customer: Customer): Promise<void> {
  await SecureStore.setItemAsync(KEYS.customer, JSON.stringify(customer));
}

export async function getCustomer(): Promise<Customer | null> {
  const raw = await SecureStore.getItemAsync(KEYS.customer);
  return raw ? JSON.parse(raw) : null;
}

export async function clearCustomer(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.customer);
}

export async function saveTenant(tenant: Tenant): Promise<void> {
  await AsyncStorage.setItem(KEYS.tenant, JSON.stringify(tenant));
}

export async function getTenant(): Promise<Tenant | null> {
  const raw = await AsyncStorage.getItem(KEYS.tenant);
  return raw ? JSON.parse(raw) : null;
}

export async function clearTenant(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.tenant);
}

export async function getCartKey(tenantSlug: string): Promise<string> {
  return `${KEYS.cartPrefix}${tenantSlug}`;
}

export async function clearAllSession(): Promise<void> {
  await clearTokens();
  await clearCustomer();
}
