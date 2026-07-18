import React from 'react';
import { StyleSheet, Text } from 'react-native';
import axios from 'axios';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, MainTabParamList, SearchStackParamList } from '../types';
import { Screen, Title, Subtitle, Button } from '../components/ui';
import { getApiUrl } from '../utils/config';
import { ensureApiConnection, resetApiConnection } from '../services/httpClient';
import { goToHome } from '../navigation/routes';
import { colors } from '../theme/ifood';

type TenantNotFoundProps = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'TenantNotFound'>,
  BottomTabScreenProps<MainTabParamList, 'Home'>
>;

type ConnectionErrorProps =
  | CompositeScreenProps<
      NativeStackScreenProps<HomeStackParamList, 'ConnectionError'>,
      BottomTabScreenProps<MainTabParamList, 'Home'>
    >
  | CompositeScreenProps<
      NativeStackScreenProps<SearchStackParamList, 'ConnectionError'>,
      BottomTabScreenProps<MainTabParamList, 'Search'>
    >;

export function TenantNotFoundScreen({ route, navigation }: TenantNotFoundProps) {
  return (
    <Screen>
      <Title>Empresa não encontrada</Title>
      <Subtitle>
        {route.params?.slug
          ? `Não encontramos a empresa "${route.params.slug}".`
          : 'A empresa solicitada não existe ou está inativa.'}
      </Subtitle>
      <Button label="Voltar ao início" onPress={() => goToHome(navigation)} />
    </Screen>
  );
}

export function ConnectionErrorScreen({ navigation }: ConnectionErrorProps) {
  const [retrying, setRetrying] = React.useState(false);
  const [apiUrl, setApiUrl] = React.useState(getApiUrl());
  const [retryError, setRetryError] = React.useState('');

  const retry = async () => {
    setRetrying(true);
    setRetryError('');
    resetApiConnection();
    try {
      const url = await ensureApiConnection();
      setApiUrl(url);
      const healthUrl = url.replace(/\/api\/?$/, '/health');
      await axios.get(healthUrl, { timeout: 5000 });
      navigation.goBack();
    } catch {
      setRetryError(
        __DEV__
          ? 'Ainda sem resposta. No PC (USB): adb reverse tcp:3000 tcp:3000'
          : 'Ainda sem conexão. Tente novamente em instantes.'
      );
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Screen>
      <Title>Sem conexão</Title>
      <Subtitle>
        Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.
      </Subtitle>
      {__DEV__ ? (
        <Text style={styles.steps}>
          Dev:{'\n'}
          1. No PC: cd konekt-back → npm run dev{'\n'}
          2. Celular USB: cd konekt-mobile → npm run phone:usb{'\n'}
          3. Se cair a conexão USB: npm run adb:api{'\n'}
          API: {apiUrl}
        </Text>
      ) : null}
      {retryError ? <Text style={styles.retryError}>{retryError}</Text> : null}
      <Button label={retrying ? 'Conectando...' : 'Tentar novamente'} onPress={retry} disabled={retrying} />
      <Button label="Voltar ao início" variant="secondary" onPress={() => goToHome(navigation)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  retryError: {
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
});
