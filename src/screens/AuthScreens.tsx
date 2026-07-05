import React from 'react';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, ProfileStackParamList } from '../types';
import { Screen, Title, Subtitle, Input, PasswordInput, Button, ErrorBox } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { getFriendlyErrorMessage } from '../utils/errors';
import { validateEmail, validatePassword } from '../validators/forms';
import { colors, spacing } from '../theme/ifood';
type LoginProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'Login'>,
  BottomTabScreenProps<MainTabParamList, 'Profile'>
>;

type RegisterProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'Register'>,
  BottomTabScreenProps<MainTabParamList, 'Profile'>
>;

export function LoginScreen({ navigation }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  return (
    <Screen>
      <Title>Entrar</Title>
      <Subtitle>Uma conta para pedir em qualquer loja</Subtitle>
      {error ? <ErrorBox message={error} /> : null}
      <Input
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <PasswordInput value={password} onChangeText={setPassword} />
      <Button
        label={loading ? 'Entrando...' : 'Entrar'}
        onPress={async () => {
          const validationError = validateEmail(email) || validatePassword(password);
          if (validationError) {
            setError(validationError);
            return;
          }
          setLoading(true);
          setError('');
          try {
            await login(email.trim(), password);
            navigation.goBack();
          } catch (err) {
            setError(getFriendlyErrorMessage(err));
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
      />
      <Button label="Criar conta" variant="secondary" onPress={() => navigation.navigate('Register')} />
    </Screen>
  );
}

export function RegisterScreen({ navigation }: RegisterProps) {
  const { register } = useAuth();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  return (
    <Screen>
      <Title>Criar conta</Title>
      <Subtitle>Cadastre-se para pedir em qualquer loja parceira</Subtitle>
      {error ? <ErrorBox message={error} /> : null}
      <Input placeholder="Nome" value={name} onChangeText={setName} />
      <Input
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <PasswordInput value={password} onChangeText={setPassword} />
      <Input placeholder="Telefone (opcional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Pressable style={styles.termsRow} onPress={() => setTermsAccepted((v) => !v)}>
        <Ionicons
          name={termsAccepted ? 'checkbox' : 'square-outline'}
          size={22}
          color={termsAccepted ? colors.primary : colors.textMuted}
        />
        <Text style={styles.termsLabel}>
          Li e estou de acordo com os Termos de Uso e Política de Privacidade
        </Text>
      </Pressable>
      <Button
        label={loading ? 'Criando...' : 'Criar conta'}
        onPress={async () => {
          const validationError =
            validateEmail(email) ||
            validatePassword(password) ||
            (!name.trim() ? 'Informe seu nome' : null) ||
            (!termsAccepted ? 'Aceite os Termos de Uso e Política de Privacidade' : null);
          if (validationError) {
            setError(validationError);
            return;
          }
          setLoading(true);
          setError('');
          try {
            await register({
              email: email.trim(),
              password,
              name: name.trim(),
              phone: phone.trim() || undefined,
              termsAccepted: true,
            });
            navigation.goBack();
          } catch (err) {
            setError(getFriendlyErrorMessage(err));
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading || !termsAccepted}
      />
      <Button label="Já tenho conta" variant="secondary" onPress={() => navigation.navigate('Login')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  termsLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});
