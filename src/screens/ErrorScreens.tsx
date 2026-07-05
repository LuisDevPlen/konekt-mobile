import React from 'react';
import { StyleSheet, Text } from 'react-native';
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

  const retry = async () => {
    setRetrying(true);
    resetApiConnection();
    const url = await ensureApiConnection();
    setApiUrl(url);
    setRetrying(false);
    navigation.goBack();
  };

  return (
    <Screen>
      <Title>Sem conexão</Title>
      <Subtitle>
        Não foi possível conectar ao servidor. Confira se a API está rodando no PC e se você iniciou o app com o
        script correto.
      </Subtitle>
      <Text style={styles.steps}>
        1. No PC: cd konekt-back{'\n'}   npm run dev{'\n'}
        2. Celular USB: cd konekt-mobile{'\n'}   npm run phone:usb{'\n'}
        3. Celular Wi-Fi: npm run phone
      </Text>
      {__DEV__ ? <Text style={styles.apiUrl}>API: {apiUrl}</Text> : null}
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
  apiUrl: {
    marginBottom: 12,
    fontSize: 12,
    color: colors.textMuted,
  },
});
