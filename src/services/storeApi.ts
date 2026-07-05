import { http } from './httpClient';

import {
  ApiResponse,
  Category,
  Customer,
  Order,
  OrderReview,
  Product,
  Tenant,
  CartItem,
  OrderMessage,
  AppNotification,
  SelectedAddition,
  StoreCartCoupon,
  DeliveryQuote,
} from '../types';



export interface OrderWithStore extends Order {

  tenant_id?: string;

  tenant_name?: string;

  tenant_slug?: string;

}



export interface CartResponse {
  items: CartItem[];
  subtotal?: number;
  discount?: number;
  total: number;
  itemCount: number;
  coupon?: StoreCartCoupon | null;
}

export interface AvailableCouponsResponse {
  subtotal: number;
  coupons: { code: string; description?: string | null }[];
}

export const storeApi = {

  listTenants: () =>

    http.get<ApiResponse<Tenant[]>>('/store/tenants').then((r) => r.data.data),



  getTenant: (slug: string) =>

    http.get<ApiResponse<Tenant>>(`/store/tenants/${slug}`).then((r) => r.data.data),



  register: (body: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    termsAccepted: true;
  }) =>
    http.post<ApiResponse<{ accessToken: string; refreshToken: string; customer: Customer }>>(
      '/store/auth/register',
      body
    ).then((r) => r.data.data),

  acceptTerms: () =>
    http.post<ApiResponse<Customer>>('/store/auth/terms/accept', { accepted: true }).then((r) => r.data.data),



  login: (body: { email: string; password: string }) =>

    http.post<ApiResponse<{ accessToken: string; refreshToken: string; customer: Customer }>>(

      '/store/auth/login', body

    ).then((r) => r.data.data),



  refresh: (refreshToken: string) =>

    http.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(

      '/store/auth/refresh', { refreshToken }

    ).then((r) => r.data.data),



  me: () =>

    http.get<ApiResponse<Customer>>('/store/auth/me').then((r) => r.data.data),



  updateProfile: (body: Partial<Customer>) =>

    http.put<ApiResponse<Customer>>('/store/auth/profile', body).then((r) => r.data.data),



  listMyOrders: () =>

    http.get<ApiResponse<OrderWithStore[]>>('/store/auth/orders').then((r) => r.data.data),



  getCategories: (slug: string) =>

    http.get<ApiResponse<Category[]>>(`/store/${slug}/categories`).then((r) => r.data.data),



  getProducts: (slug: string, params?: { search?: string; categoryId?: string; page?: number; limit?: number }) =>

    http.get<ApiResponse<Product[]>>(`/store/${slug}/products`, { params }).then((r) => ({

      data: r.data.data,

      meta: r.data.meta,

    })),



  getProduct: (slug: string, id: string) =>

    http.get<ApiResponse<Product>>(`/store/${slug}/products/${id}`).then((r) => r.data.data),



  getCart: (slug: string) =>

    http.get<ApiResponse<CartResponse>>(`/store/${slug}/cart`).then((r) => r.data.data),



  upsertCartItem: (slug: string, body: {
    productId: string;
    quantity: number;
    additions?: SelectedAddition[];
    mode?: 'add' | 'set';
  }) =>
    http.put<ApiResponse<CartResponse>>(`/store/${slug}/cart/items`, body).then((r) => r.data.data),



  removeCartItem: (slug: string, productId: string) =>

    http.delete<ApiResponse<CartResponse>>(`/store/${slug}/cart/items/${productId}`).then((r) => r.data.data),



  clearCart: (slug: string) =>

    http.delete<ApiResponse<CartResponse>>(`/store/${slug}/cart`).then((r) => r.data.data),

  applyCartCoupon: (slug: string, code: string) =>
    http.post<ApiResponse<CartResponse>>(`/store/${slug}/cart/coupon/apply`, { code }).then((r) => r.data.data),

  removeCartCoupon: (slug: string) =>
    http.delete<ApiResponse<CartResponse>>(`/store/${slug}/cart/coupon`).then((r) => r.data.data),

  getAvailableCoupons: (slug: string) =>
    http.get<ApiResponse<AvailableCouponsResponse>>(`/store/${slug}/cart/coupons`).then((r) => r.data.data),

  getDeliveryQuote: (slug: string, shippingAddress: string) =>
    http.post<ApiResponse<DeliveryQuote>>(`/store/${slug}/delivery/quote`, { shippingAddress }).then((r) => r.data.data),

  createOrder: (slug: string, body: {
    items: { productId: string; quantity: number; productVersion: number; additions?: SelectedAddition[] }[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    fulfillmentType: 'pickup' | 'delivery';
    shippingAddress?: string;
    deliveryDistanceKm?: number;
    paymentMethod: string;
    payOnDelivery?: boolean;
    cashChangeFor?: number | null;
  }) =>
    http.post<ApiResponse<Order>>(`/store/${slug}/orders`, body).then((r) => r.data.data),



  getOrder: (slug: string, orderId: string) =>

    http.get<ApiResponse<Order>>(`/store/${slug}/orders/${orderId}`).then((r) => r.data.data),



  payOrder: (slug: string, orderId: string, body: { paymentMethod: string; orderVersion: number }) =>

    http.post<ApiResponse<unknown>>(`/store/${slug}/orders/${orderId}/payment`, body).then((r) => r.data.data),

  createMercadoPagoCheckout: (slug: string, orderId: string) =>
    http.post<ApiResponse<{ paymentId: string; preferenceId: string; checkoutUrl: string }>>(
      `/store/${slug}/orders/${orderId}/payments/mercado-pago/checkout`,
      {}
    ).then((r) => r.data.data),

  listNotifications: () =>
    http.get<ApiResponse<AppNotification[]>>('/store/auth/notifications').then((r) => ({
      data: r.data.data,
      unreadCount: r.data.meta?.unreadCount ?? 0,
    })),

  markAllNotificationsRead: () =>
    http.patch<ApiResponse<{ unreadCount: number }>>('/store/auth/notifications/read-all', {}).then((r) => r.data.data),

  getOrderMessages: (slug: string, orderId: string) =>
    http.get<ApiResponse<OrderMessage[]>>(`/store/${slug}/orders/${orderId}/messages`).then((r) => r.data.data),

  sendOrderMessage: (slug: string, orderId: string, body: string) =>
    http.post<ApiResponse<OrderMessage>>(`/store/${slug}/orders/${orderId}/messages`, { body }).then((r) => r.data.data),

  getOrderReview: (slug: string, orderId: string) =>
    http.get<ApiResponse<OrderReview | null>>(`/store/${slug}/orders/${orderId}/review`).then((r) => r.data.data),

  submitOrderReview: (slug: string, orderId: string, body: { rating: number; comment?: string }) =>
    http.post<ApiResponse<OrderReview>>(`/store/${slug}/orders/${orderId}/review`, body).then((r) => r.data.data),

};


