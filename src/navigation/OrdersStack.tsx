import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrdersStackParamList } from '../types';
import { colors } from '../theme/ifood';
import { OrdersScreen } from '../screens/OrdersScreen';
import { OrderStatusScreen, PaymentScreen } from '../screens/OrderScreens';
import { OrderChatScreen } from '../screens/OrderChatScreen';

const Stack = createNativeStackNavigator<OrdersStackParamList>();

export function OrdersStack() {
  return (
    <Stack.Navigator
      initialRouteName="OrdersHome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="OrdersHome" component={OrdersScreen} />
      <Stack.Screen name="OrderStatus" component={OrderStatusScreen} />
      <Stack.Screen name="OrderChat" component={OrderChatScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
    </Stack.Navigator>
  );
}
