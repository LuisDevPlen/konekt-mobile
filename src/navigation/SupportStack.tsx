import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SupportStackParamList } from '../types';
import { colors } from '../theme/ifood';
import {
  SupportHomeScreen,
  SupportTicketsScreen,
  SupportCreateScreen,
  SupportDetailScreen,
} from '../screens/SupportScreens';

const Stack = createNativeStackNavigator<SupportStackParamList>();

export function SupportStack() {
  return (
    <Stack.Navigator
      initialRouteName="SupportHome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="SupportHome" component={SupportHomeScreen} />
      <Stack.Screen name="SupportTickets" component={SupportTicketsScreen} />
      <Stack.Screen name="SupportCreate" component={SupportCreateScreen} />
      <Stack.Screen name="SupportDetail" component={SupportDetailScreen} />
    </Stack.Navigator>
  );
}
