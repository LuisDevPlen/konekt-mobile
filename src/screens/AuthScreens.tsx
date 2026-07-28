import React from 'react';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, ProfileStackParamList } from '../types';
import { Input, PasswordInput, Button, ErrorBox } from '../components/ui';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { TermsLegalRow, TermsReaderModal } from '../components/TermsReaderModal';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { getFriendlyErrorMessage } from '../utils/errors';
import { validateEmail, validatePassword } from '../validators/forms';
import { colors, radius, spacing, shadow } from '../theme/ifood';
import { DEFAULT_AUTH_COVER } from '../utils/coverImage';

type LoginProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'Login'>,
  BottomTabScreenProps<MainTabParamList, 'Profile'>
>;

type EmailLoginProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'EmailLogin'>,
  BottomTabScreenProps<MainTabParamList, 'Profile'>
>;

type RegisterProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'Register'>,
  BottomTabScreenProps<MainTabParamList, 'Profile'>
>;

type VerifyEmailProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'VerifyEmail'>,
  BottomTabScreenProps<MainTabParamList, 'Profile'>
>;

function AuthBackdrop({
  coverUrl,
  children,
}: {
  coverUrl?: string | null;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const uri = coverUrl || DEFAULT_AUTH_COVER;

  return (
    <View style={styles.backdropRoot}>
      <ImageBackground source={{ uri }} style={styles.backdropImage} resizeMode="cover">
        <View style={styles.backdropTint} />
      </ImageBackground>
      <View style={[styles.backdropContent, { paddingTop: insets.top }]}>
        {children}
      </View>
    </View>
  );
}

/** Tela inicial estilo iFood: capa + painel inferior */
export function LoginScreen({ navigation, route }: LoginProps) {
  const insets = useSafeAreaInsets();
  const coverUrl = route.params?.coverUrl;
  const finish = () => navigation.goBack();
  const { platformName, logoUri } = useBranding();
  const [googleError, setGoogleError] = React.useState('');

  return (
    <AuthBackdrop coverUrl={coverUrl}>
      <Pressable
        style={[styles.backBtn, { top: insets.top + spacing.sm }]}
        onPress={() => navigation.goBack()}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </Pressable>

      <View style={styles.loginHero}>
        <View style={styles.brandRow}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.brandLogo} resizeMode="contain" />
          ) : (
            <View style={styles.brandFallback}>
              <Text style={styles.brandFallbackText}>{platformName.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.brandTextWrap}>
            <Text style={styles.welcomeEyebrow}>Bem-vindo</Text>
            <Text style={styles.welcomeTitle}>{platformName}</Text>
          </View>
        </View>
        <Text style={styles.welcomeSub}>
          Peça das melhores lojas com entrega rápida, pagamento seguro e acompanhamento em tempo real.
        </Text>
        <View style={styles.heroPills}>
          <View style={styles.heroPill}>
            <Ionicons name="bicycle-outline" size={16} color="#fff" />
            <Text style={styles.heroPillText}>Entrega</Text>
          </View>
          <View style={styles.heroPill}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#fff" />
            <Text style={styles.heroPillText}>Seguro</Text>
          </View>
          <View style={styles.heroPill}>
            <Ionicons name="star-outline" size={16} color="#fff" />
            <Text style={styles.heroPillText}>Avaliações</Text>
          </View>
        </View>
      </View>

      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Acesse sua conta</Text>
        <Text style={styles.sheetSubtitle}>Entre ou crie seu cadastro para pedir e acompanhar compras</Text>

        <Button label="Já tenho uma conta" onPress={() => navigation.navigate('EmailLogin')} style={styles.sheetButton} />
        <Button
          label="Criar nova conta"
          variant="outlinePrimary"
          onPress={() => navigation.navigate('Register', { coverUrl })}
          style={styles.sheetButton}
        />

        <View style={styles.socialDivider}>
          <View style={styles.socialDividerLine} />
          <Text style={styles.socialLabel}>ou continue com</Text>
          <View style={styles.socialDividerLine} />
        </View>
        {googleError ? <ErrorBox message={googleError} /> : null}
        <View style={styles.socialRow}>
          <GoogleSignInButton
            onSuccess={finish}
            onError={(message) => setGoogleError(message)}
            compact
          />
        </View>
      </View>
    </AuthBackdrop>
  );
}

export function EmailLoginScreen({ navigation }: EmailLoginProps) {
  const { login } = useAuth();
  const { platformName, logoUri } = useBranding();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const finish = () => navigation.popToTop();

  return (
    <KeyboardAvoidingView
      style={styles.formScreen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.formHeader, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.formTitle}>Entrar com e-mail</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.emailLoginScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emailBrandCard}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.emailBrandLogo} resizeMode="contain" />
          ) : (
            <View style={styles.emailBrandFallback}>
              <Text style={styles.emailBrandFallbackText}>{platformName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.emailBrandName}>{platformName}</Text>
          <Text style={styles.emailBrandSub}>
            Entre com seu e-mail e senha para acessar pedidos, suporte e sua conta.
          </Text>
        </View>

        {error ? <ErrorBox message={error} /> : null}

        <Text style={styles.emailFieldLabel}>E-mail</Text>
        <Input
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Text style={styles.emailFieldLabel}>Senha</Text>
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
              finish();
            } catch (err) {
              const message = getFriendlyErrorMessage(err);
              if (/confirme seu e-mail/i.test(message)) {
                navigation.navigate('VerifyEmail', { email: email.trim() });
                return;
              }
              setError(message);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          style={styles.emailLoginButton}
        />

        <Pressable
          style={styles.emailRegisterLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.emailRegisterText}>
            Não tem conta? <Text style={styles.emailRegisterBold}>Criar conta</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Cadastro estilo iFood — dados da conta */
export function RegisterScreen({ navigation, route }: RegisterProps) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [cpf, setCpf] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [termsOpen, setTermsOpen] = React.useState(false);

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    !loading;

  return (
    <KeyboardAvoidingView
      style={styles.formScreen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.registerHeader, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.formScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Complete as informações da sua conta</Text>
        <Text style={styles.sectionHint}>
          Cadastre seus dados para identificação na loja e maior segurança da conta
        </Text>

        {error ? <ErrorBox message={error} /> : null}

        <Text style={styles.fieldLabel}>Qual o seu nome e sobrenome?</Text>
        <View style={styles.nameRow}>
          <Input
            placeholder="Nome"
            value={firstName}
            onChangeText={setFirstName}
            style={styles.nameInput}
          />
          <Input
            placeholder="Sobrenome"
            value={lastName}
            onChangeText={setLastName}
            style={styles.nameInput}
          />
        </View>

        <Text style={styles.fieldLabel}>Qual seu CPF?</Text>
        <Input
          placeholder="CPF (opcional)"
          value={cpf}
          onChangeText={(v) => setCpf(v.replace(/\D/g, '').slice(0, 11))}
          keyboardType="number-pad"
        />

        <Text style={styles.fieldLabel}>E-mail e senha</Text>
        <Input
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <PasswordInput value={password} onChangeText={setPassword} />
      </ScrollView>

      <View style={[styles.registerFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TermsLegalRow onPress={() => setTermsOpen(true)} />
        <Button
          label={loading ? 'Criando...' : 'Criar conta'}
          disabled={!canSubmit}
          onPress={async () => {
            const validationError =
              validateEmail(email) ||
              validatePassword(password) ||
              (!firstName.trim() ? 'Informe seu nome' : null) ||
              (!lastName.trim() ? 'Informe seu sobrenome' : null);
            if (validationError) {
              setError(validationError);
              return;
            }
            setLoading(true);
            setError('');
            try {
              const result = await register({
                email: email.trim(),
                password,
                name: `${firstName.trim()} ${lastName.trim()}`.trim(),
              });
              if (result.pendingVerification) {
                navigation.replace('VerifyEmail', { email: result.email, devCode: result.devCode });
                return;
              }
              navigation.popToTop();
            } catch (err) {
              setError(getFriendlyErrorMessage(err));
            } finally {
              setLoading(false);
            }
          }}
        />
      </View>
      <TermsReaderModal visible={termsOpen} onClose={() => setTermsOpen(false)} />
    </KeyboardAvoidingView>
  );
}

export function VerifyEmailScreen({ navigation, route }: VerifyEmailProps) {
  const { verifyEmail, resendVerification } = useAuth();
  const insets = useSafeAreaInsets();
  const email = route.params.email;
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [devCode, setDevCode] = React.useState(route.params.devCode ?? '');
  const [loading, setLoading] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(60);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const finish = () => navigation.popToTop();

  return (
    <KeyboardAvoidingView
      style={styles.formScreen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.formHeader, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.formTitle}>Confirme seu e-mail</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionHint}>
          Digite o código de 6 dígitos enviado para {email}
        </Text>

        {error ? <ErrorBox message={error} /> : null}
        {devCode ? (
          <View style={styles.devCodeBox}>
            <Text style={styles.devCodeText}>
              Código de teste: <Text style={styles.devCodeValue}>{devCode}</Text>
            </Text>
          </View>
        ) : null}
        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        <Input
          placeholder="Código de 6 dígitos"
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Button
          label={loading ? 'Confirmando...' : 'Confirmar'}
          onPress={async () => {
            if (code.length !== 6) {
              setError('Informe o código de 6 dígitos.');
              return;
            }
            setLoading(true);
            setError('');
            setSuccess('');
            try {
              await verifyEmail(email, code);
              setSuccess('E-mail confirmado com sucesso!');
              finish();
            } catch (err) {
              setError(getFriendlyErrorMessage(err));
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || code.length !== 6}
        />
        <Button
          label={resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código'}
          variant="secondary"
          onPress={async () => {
            if (resendCooldown > 0) return;
            setLoading(true);
            setError('');
            setSuccess('');
            try {
              const result = await resendVerification(email);
              if (result.devCode) setDevCode(result.devCode);
              setSuccess(result.message || 'Novo código enviado.');
              setResendCooldown(60);
            } catch (err) {
              setError(getFriendlyErrorMessage(err));
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || resendCooldown > 0}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdropRoot: {
    flex: 1,
    backgroundColor: '#111',
  },
  backdropImage: {
    ...StyleSheet.absoluteFill,
  },
  backdropTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backdropContent: {
    flex: 1,
  },
  backBtn: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  loginHero: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: 72,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  brandLogo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  brandFallback: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandFallbackText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  brandTextWrap: {
    flex: 1,
  },
  welcomeEyebrow: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  welcomeSub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
    ...shadow.card,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sheetButton: {
    marginTop: spacing.xs,
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  socialDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  registerHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  socialLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  socialRow: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  formScreen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  formScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  emailLoginScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  emailBrandCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emailBrandLogo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  emailBrandFallback: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emailBrandFallbackText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  emailBrandName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emailBrandSub: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emailFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    marginTop: spacing.xs,
  },
  emailLoginButton: {
    marginTop: spacing.md,
  },
  emailRegisterLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  emailRegisterText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emailRegisterBold: {
    color: colors.primary,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nameInput: {
    flex: 1,
  },
  registerFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  successBox: {
    backgroundColor: '#e8f8ef',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#b7e4c7',
    padding: spacing.md,
  },
  successText: { color: '#1b4332', fontSize: 14 },
  devCodeBox: {
    backgroundColor: '#eef4ff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#c5d9f5',
    padding: spacing.md,
  },
  devCodeText: { color: '#1e3a5f', fontSize: 14, lineHeight: 20 },
  devCodeValue: { fontWeight: '800', letterSpacing: 2 },
});
