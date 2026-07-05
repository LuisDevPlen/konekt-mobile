import { createNavigationContainerRef } from '@react-navigation/native';
import { MainTabParamList } from '../types';

export const navigationRef = createNavigationContainerRef<MainTabParamList>();

export function navigateToOrderChat(params: {
  orderId: string;
  tenantSlug: string;
  storeName?: string;
}) {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Orders', {
    screen: 'OrderChat',
    params,
  });
}

export function navigateToOrderStatus(params: {
  orderId: string;
  tenantSlug: string;
}) {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Orders', {
    screen: 'OrderStatus',
    params,
  });
}
