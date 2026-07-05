import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { colors } from '../theme/ifood';
import { StoresHomeScreen } from '../screens/StoresHomeScreen';
import { StoreHomeScreen } from '../screens/StoreHomeScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/OrderScreens';
import { ConnectionErrorScreen, TenantNotFoundScreen } from '../screens/ErrorScreens';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="StoresHome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="StoresHome" component={StoresHomeScreen} />
      <Stack.Screen name="StoreHome" component={StoreHomeScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="ConnectionError" component={ConnectionErrorScreen} />
      <Stack.Screen name="TenantNotFound" component={TenantNotFoundScreen} />
    </Stack.Navigator>
  );
}
