import React from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { BrandingProvider } from './src/contexts/BrandingContext';
import { StoreProvider } from './src/contexts/StoreContext';
import { CartProvider } from './src/contexts/CartContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/ref';
import { TermsGate } from './src/components/TermsGate';
import { SplashOverlay } from './src/components/SplashOverlay';
import { NotificationPermissionModal } from './src/components/NotificationPermissionModal';
import { colors } from './src/theme/ifood';
import { initSentry, Sentry } from './src/utils/sentry';

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync().catch(() => {});
initSentry();

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

function App() {
  const [splashVisible, setSplashVisible] = React.useState(true);

  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <BrandingProvider>
        <AuthProvider>
          <StoreProvider>
            <CartProvider>
              <NotificationProvider>
                <NavigationContainer ref={navigationRef} theme={navTheme}>
                  <StatusBar style="dark" />
                  <RootNavigator />
                  <TermsGate />
                  <NotificationPermissionModal />
                </NavigationContainer>
                {splashVisible ? (
                  <SplashOverlay onFinish={() => setSplashVisible(false)} />
                ) : null}
              </NotificationProvider>
            </CartProvider>
          </StoreProvider>
        </AuthProvider>
      </BrandingProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);
