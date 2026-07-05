import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CartItem, Product, SelectedAddition } from '../types';
import { calcItemTotal } from '../utils/cart';
import { useStore } from './StoreContext';
import { useAuth } from './AuthContext';
import { storeApi } from '../services/storeApi';
import { formatCurrency, isTermsAcceptanceError, AppApiError } from '../utils/errors';

export type AddItemResult =
  | { ok: true }
  | { ok: false; reason: 'auth_required' | 'no_store' | 'terms_required' | 'api_error'; message?: string };

interface CartContextValue {
  items: CartItem[];
  total: number;
  itemCount: number;
  loading: boolean;
  canAddToCart: boolean;
  addItem: (product: Product, quantity?: number, selectedAdditions?: SelectedAddition[]) => Promise<AddItemResult>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getItemTotal: (item: CartItem) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

function applyCartState(
  setItems: React.Dispatch<React.SetStateAction<CartItem[]>>,
  setServerTotal: React.Dispatch<React.SetStateAction<number | null>>,
  data: { items: CartItem[]; total: number }
) {
  setItems(data.items);
  setServerTotal(data.total);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { store } = useStore();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const wasAuthenticated = useRef(isAuthenticated);

  const refreshCart = useCallback(async () => {
    if (!store || !isAuthenticated) {
      setItems([]);
      setServerTotal(null);
      return;
    }

    setLoading(true);
    try {
      const cart = await storeApi.getCart(store.slug);
      applyCartState(setItems, setServerTotal, cart);
    } catch {
      setItems([]);
      setServerTotal(null);
    } finally {
      setLoading(false);
    }
  }, [store, isAuthenticated]);

  const clearCart = useCallback(async () => {
    if (store && isAuthenticated) {
      try {
        const cart = await storeApi.clearCart(store.slug);
        applyCartState(setItems, setServerTotal, cart);
        return;
      } catch {
        // fallback local clear
      }
    }
    setItems([]);
    setServerTotal(null);
  }, [store, isAuthenticated]);

  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) {
      setItems([]);
      setServerTotal(null);
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(async (
    product: Product,
    quantity = 1,
    selectedAdditions: SelectedAddition[] = []
  ): Promise<AddItemResult> => {
    if (!isAuthenticated) {
      return { ok: false, reason: 'auth_required' };
    }
    if (!store) {
      return { ok: false, reason: 'no_store' };
    }

    try {
      const cart = await storeApi.upsertCartItem(store.slug, {
        productId: product.id,
        quantity,
        additions: selectedAdditions,
        mode: 'add',
      });
      applyCartState(setItems, setServerTotal, cart);
      return { ok: true };
    } catch (err) {
      if (isTermsAcceptanceError(err)) {
        return {
          ok: false,
          reason: 'terms_required',
          message: err instanceof AppApiError ? err.message : undefined,
        };
      }
      if (err instanceof AppApiError) {
        return { ok: false, reason: 'api_error', message: err.message };
      }
      return { ok: false, reason: 'api_error' };
    }
  }, [isAuthenticated, store]);

  const removeItem = useCallback(async (productId: string) => {
    if (!isAuthenticated || !store) return;

    try {
      const cart = await storeApi.removeCartItem(store.slug, productId);
      applyCartState(setItems, setServerTotal, cart);
    } catch {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    }
  }, [isAuthenticated, store]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (!isAuthenticated || !store) return;

    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    const item = items.find((i) => i.product.id === productId);
    try {
      const cart = await storeApi.upsertCartItem(store.slug, {
        productId,
        quantity,
        additions: item?.selectedAdditions ?? [],
        mode: 'set',
      });
      applyCartState(setItems, setServerTotal, cart);
    } catch {
      // keep local state unchanged on error
    }
  }, [isAuthenticated, store, items, removeItem]);

  const total = serverTotal ?? items.reduce((sum, i) => sum + calcItemTotal(i), 0);
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      total,
      itemCount,
      loading,
      canAddToCart: isAuthenticated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      refreshCart,
      getItemTotal: calcItemTotal,
    }),
    [items, total, itemCount, loading, isAuthenticated, addItem, removeItem, updateQuantity, clearCart, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export { formatCurrency };
