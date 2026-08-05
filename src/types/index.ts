export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  cover_position?: string | null;
  cover_scale?: number | null;
  theme_color?: string | null;
  address?: string | null;
  payment_methods?: string[];
  payment_methods_by_fulfillment?: {
    delivery: string[];
    pickup: string[];
  } | null;
  payment_method_labels?: Record<string, string> | null;
  mercado_pago_configured?: boolean;
  delivery_enabled?: boolean;
  delivery_fee_tiers?: { upToKm: number; fee: number }[];
  active: boolean;
  rating_count?: number;
  rating_average?: number | null;
  has_promo?: boolean;
  free_delivery?: boolean;
}

export interface CustomerSavedAddress {
  id: string;
  label?: string | null;
  formattedAddress: string;
  isSelected: boolean;
  createdAt?: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  savedAddresses?: CustomerSavedAddress[];
  selectedAddressId?: string | null;
  termsAccepted?: boolean;
  termsVersion?: string | null;
  emailVerified?: boolean;
}

export interface SupportCategory {
  id: string;
  slug: string;
  name: string;
}

export interface SupportAttachment {
  id?: string;
  fileUrl: string;
  fileType?: string | null;
  fileName?: string | null;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderType: 'customer' | 'store' | 'support';
  senderName: string;
  message: string;
  attachments?: SupportAttachment[];
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  protocol: string;
  tenantId?: string | null;
  tenantName?: string | null;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  userType: 'customer' | 'store';
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessage[];
  attachments?: SupportAttachment[];
  statusHistory?: { oldStatus?: string | null; newStatus: string; changedByName?: string | null; createdAt: string }[];
  rating?: { rating: number; comment?: string | null; createdAt: string } | null;
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
  promo_active?: boolean;
  promo_price?: number | string | null;
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

export type ProductKind = 'PIZZA' | 'PREPARED' | 'INDUSTRIALIZED' | 'COMBO';
export type ComboPriceType = 'FIXED' | 'SUM_ITEMS';
export type DietaryRestriction = 'VEGETARIAN' | 'VEGAN' | 'ORGANIC' | 'LACTOSE_FREE' | 'GLUTEN_FREE' | 'SUGAR_FREE';
export type BeverageCharacteristic = 'COLD' | 'ALCOHOLIC' | 'NATURAL';

export interface ComboSelection { groupId: string; itemId: string; }
export interface ComboGroupItem {
  id: string; product_id: string; name: string; description?: string | null; image_url?: string | null;
  price: number | string; promo_active?: boolean; promo_price?: number | string | null;
  current_price?: number | string; additional_price?: number | string; active?: boolean; stock?: number | null;
  track_stock?: boolean; dietary_restrictions?: DietaryRestriction[]; beverage_characteristics?: BeverageCharacteristic[];
  serves_up_to?: number | null;
}
export interface ComboGroup {
  id: string; combo_product_id?: string; name: string; description?: string | null; required: boolean;
  min_selections: number; max_selections: number; sort_order?: number; active: boolean; items: ComboGroupItem[];
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price: number;
  promo_active?: boolean;
  promo_price?: number | string | null;
  stock: number;
  track_stock?: boolean;
  version: number;
  category_id?: string | null;
  category_name?: string | null;
  additions?: ProductAddition[];
  addition_categories?: AdditionCategoryGroup[];
  uncategorized_additions_min_selections?: number;
  uncategorized_additions_max_selections?: number;
  uncategorized_additions_required?: boolean;
  product_kind?: ProductKind;
  product_type?: 'NORMAL' | 'COMPOSTO';
  combo_price_type?: ComboPriceType;
  combo_groups?: ComboGroup[];
  dietary_restrictions?: DietaryRestriction[];
  beverage_characteristics?: BeverageCharacteristic[];
  serves_up_to?: number | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedAdditions: SelectedAddition[];
  /** Observação do cliente para o item (ex.: remover cebola). */
  notes?: string | null;
  comboSelections?: ComboSelection[];
  combo_selections?: ComboSelection[];
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
  routingProvider?: 'google';
  cached?: boolean;
  customerAddressId?: string | null;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  product_version: number;
  additions?: ProductAddition[];
  notes?: string | null;
  combo_selections?: ComboSelection[];
}

export interface Order {
  id: string;
  status: string;
  payment_status: string;
  pay_on_delivery?: boolean;
  subtotal_amount?: number | null;
  discount_amount?: number | null;
  delivery_fee?: number | null;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address?: string;
  fulfillment_type?: FulfillmentType;
  payment_method?: PaymentMethod;
  cash_change_for?: number | null;
  version: number;
  cancel_reason?: string | null;
  cancel_notes?: string | null;
  cancel_requested_at?: string | null;
  // Agendamento — a API envia estes campos e o acompanhamento do pedido depende deles.
  order_type?: OrderType;
  scheduled_for?: string | null;
  scheduled_delivery_end?: string | null;
  prep_start_at?: string | null;
  estimated_prep_minutes?: number | null;
  estimated_delivery_at?: string | null;
  items?: OrderItem[];
  created_at: string;
  updated_at?: string;
  tenant_name?: string;
  tenant_slug?: string;
}

export type OrderType = 'immediate' | 'scheduled';
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
  Login: { coverUrl?: string | null } | undefined;
  EmailLogin: undefined;
  Register: { coverUrl?: string | null } | undefined;
  VerifyEmail: { email: string; devCode?: string };
  Addresses: { returnToCheckout?: boolean } | undefined;
};

export type SupportStackParamList = {
  SupportHome: undefined;
  SupportTickets: undefined;
  SupportCreate: undefined;
  SupportDetail: { ticketId: string };
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
  Support: NavigatorScreenParams<SupportStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

/** Tabs are the app root — kept for composite navigation typing. */
export type RootStackParamList = MainTabParamList;
