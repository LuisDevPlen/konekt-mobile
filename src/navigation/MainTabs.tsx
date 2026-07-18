import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { colors } from '../theme/ifood';
import { getTabBarStyle } from '../utils/safeArea';
import { useNotifications } from '../contexts/NotificationContext';
import { HomeStack } from './HomeStack';
import { SearchStack } from './SearchStack';
import { OrdersStack } from './OrdersStack';
import { SupportStack } from './SupportStack';
import { ProfileStack } from './ProfileStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: getTabBarStyle(insets),
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: -2 },
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? 'home' : 'home-outline',
            Search: focused ? 'search' : 'search-outline',
            Orders: focused ? 'receipt' : 'receipt-outline',
            Support: focused ? 'headset' : 'headset-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="Search" component={SearchStack} options={{ tabBarLabel: 'Busca' }} />
      <Tab.Screen name="Orders" component={OrdersStack} options={{ tabBarLabel: 'Pedidos' }} />
      <Tab.Screen name="Support" component={SupportStack} options={{ tabBarLabel: 'Suporte' }} />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Perfil',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
    </Tab.Navigator>
  );
}
