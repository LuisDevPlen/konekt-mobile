export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  address?: string | null;
  payment_methods?: string[];
  mercado_pago_configured?: boolean;
  delivery_enabled?: boolean;
  delivery_fee_tiers?: { upToKm: number; fee: number }[];
  active: boolean;
  rating_count?: number;
  rating_average?: number | null;
  has_promo?: boolean;
  free_delivery?: boolean;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  termsAccepted?: boolean;
  termsVersion?: string | null;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  product_count: number;
}

export interface ProductAddition {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  min_quantity?: number;
  max_quantity?: number;
  category_id?: string | null;
  category_name?: string | null;
  category_min_selections?: number;
  category_max_selections?: number;
  category_required?: boolean;
  quantity?: number;
}

export interface AdditionCategoryGroup {
  id: string | null;
  name: string;
  min_selections: number;
  max_selections: number;
  required: boolean;
  sort_order?: number;
  additions: ProductAddition[];
}

export interface SelectedAddition {
  id: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price: number;
  stock: number;
  track_stock?: boolean;
  version: number;
  category_id?: string | null;
  category_name?: string | null;
  additions?: ProductAddition[];
  addition_categories?: AdditionCategoryGroup[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedAdditions: SelectedAddition[];
}

export interface StoreCartCoupon {
  code: string;
  discountAmount: number;
  freeShipping: boolean;
}

export interface DeliveryQuote {
  distanceKm: number;
  deliveryFee: number;
  withinRange: boolean;
  maxDistanceKm: number;
  autoCalculated: boolean;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  product_version: number;
  additions?: ProductAddition[];
}

export interface Order {
  id: string;
  status: string;
  payment_status: string;
  pay_on_delivery?: boolean;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address?: string;
  fulfillment_type?: FulfillmentType;
  payment_method?: PaymentMethod;
  cash_change_for?: number | null;
  version: number;
  items?: OrderItem[];
  created_at: string;
  updated_at?: string;
  tenant_name?: string;
  tenant_slug?: string;
}

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash';
export type FulfillmentType = 'pickup' | 'delivery';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { total: number; page: number; limit: number; unreadCount?: number };
}

export interface OrderMessage {
  id: string;
  order_id: string;
  sender_type: 'store' | 'customer';
  body: string;
  sender_user_name?: string | null;
  sender_customer_name?: string | null;
  created_at: string;
}

export type ReviewVisibility = 'pending' | 'published' | 'hidden';

export interface OrderReview {
  id: string;
  order_id: string;
  rating: number;
  comment?: string | null;
  visibility: ReviewVisibility;
  store_reply?: string | null;
  replied_at?: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  order_id?: string | null;
  tenant_slug?: string | null;
  tenant_name?: string | null;
  type: string;
  title: string;
  body?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}

import { NavigatorScreenParams } from '@react-navigation/native';

export type SearchStackParamList = {
  SearchHome: undefined;
  ConnectionError: undefined;
};

export type OrdersStackParamList = {
  OrdersHome: undefined;
  OrderStatus: { orderId: string; tenantSlug: string };
  OrderChat: {
    orderId: string;
    tenantSlug: string;
    storeName?: string;
  };
  Payment: {
    orderId: string;
    orderVersion: number;
    total: number;
    tenantSlug: string;
    paymentMethod?: PaymentMethod;
  };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Notifications: undefined;
  Login: undefined;
  Register: undefined;
  Addresses: { returnToCheckout?: boolean } | undefined;
};

export type HomeStackParamList = {
  StoresHome: undefined;
  StoreHome: undefined;
  Categories: undefined;
  Products: { categoryId?: string; categoryName?: string };
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  ConnectionError: undefined;
  TenantNotFound: { slug?: string };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Search: NavigatorScreenParams<SearchStackParamList> | undefined;
  Orders: NavigatorScreenParams<OrdersStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

/** Tabs are the app root — kept for composite navigation typing. */
export type RootStackParamList = MainTabParamList;
