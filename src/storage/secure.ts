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

function requireSecureString(value: unknown, field: string): string {
  if (typeof value === 'string' && value.length > 0) return value;
  throw new Error(`Sessão inválida: ${field} ausente. Faça login novamente.`);
}

async function setSecureItem(key: string, value: unknown): Promise<void> {
  if (typeof value !== 'string') {
    throw new Error('Sessão inválida: valor não textual para SecureStore.');
  }
  await SecureStore.setItemAsync(key, value);
}

export async function saveTokens(access: unknown, refresh?: unknown): Promise<void> {
  const accessToken = requireSecureString(access, 'accessToken');
  await setSecureItem(KEYS.accessToken, accessToken);

  if (typeof refresh === 'string' && refresh.length > 0) {
    await setSecureItem(KEYS.refreshToken, refresh);
    return;
  }

  // API web omite refreshToken no JSON; não pode passar undefined ao SecureStore.
  await SecureStore.deleteItemAsync(KEYS.refreshToken).catch(() => undefined);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.accessToken);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.refreshToken);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.accessToken).catch(() => undefined);
  await SecureStore.deleteItemAsync(KEYS.refreshToken).catch(() => undefined);
}

export async function saveCustomer(customer: Customer): Promise<void> {
  if (!customer || typeof customer !== 'object') {
    throw new Error('Sessão inválida: perfil ausente. Faça login novamente.');
  }
  const raw = JSON.stringify(customer);
  // JSON.stringify(undefined) === undefined (não é string) — causa o erro do SecureStore.
  await setSecureItem(KEYS.customer, raw);
}

export async function getCustomer(): Promise<Customer | null> {
  const raw = await SecureStore.getItemAsync(KEYS.customer);
  return raw ? JSON.parse(raw) : null;
}

export async function clearCustomer(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.customer).catch(() => undefined);
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
