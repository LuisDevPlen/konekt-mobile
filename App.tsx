import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { StoreProvider } from './src/contexts/StoreContext';
import { CartProvider } from './src/contexts/CartContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/ref';
import { TermsGate } from './src/components/TermsGate';
import { colors } from './src/theme/ifood';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
  },
};

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <NotificationProvider>
              <NavigationContainer ref={navigationRef} theme={navTheme}>
                <StatusBar style="dark" />
                <RootNavigator />
                <TermsGate />
              </NavigationContainer>
            </NotificationProvider>
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
