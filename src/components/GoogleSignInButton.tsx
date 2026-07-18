import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { mapGoogleSignInError, useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { getFriendlyErrorMessage } from '../utils/errors';
import { isExpoGo, isGoogleSignInConfigured } from '../utils/googleAuth';
import { colors, radius, spacing } from '../theme/ifood';

function GoogleSignInButtonInner({
  onSuccess,
  onError,
  disabled,
  compact,
}: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const { loginWithGoogle } = useAuth();
  const { signIn, ready, requiresDevBuild } = useGoogleSignIn();
  const [loading, setLoading] = React.useState(false);

  if (!ready) return null;

  return (
    <Pressable
      style={[styles.button, compact && styles.buttonCompact, (disabled || loading) && styles.disabled]}
      disabled={disabled || loading}
      onPress={async () => {
        setLoading(true);
        try {
          if (requiresDevBuild) {
            throw new Error(
              'Google bloqueia login no Expo Go (redirect exp://). Rode: npx expo run:android'
            );
          }
          const idToken = await signIn();
          await loginWithGoogle(idToken);
          onSuccess?.();
        } catch (err) {
          onError?.(mapGoogleSignInError(err) || getFriendlyErrorMessage(err));
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : compact ? (
        <Text style={styles.icon}>G</Text>
      ) : (
        <View style={styles.content}>
          <Text style={styles.icon}>G</Text>
          <Text style={styles.label}>
            {requiresDevBuild ? 'Google (precisa build nativo)' : 'Continuar com Google'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function GoogleSignInButton(props: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  if (!isGoogleSignInConfigured()) return null;
  return <GoogleSignInButtonInner {...props} />;
}

export function AuthDivider({ label = 'ou use e-mail e senha' }: { label?: string }) {
  if (!isGoogleSignInConfigured()) return null;

  return (
    <View style={styles.dividerWrap}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>
        {isExpoGo() ? 'no Expo Go use e-mail e senha' : label}
      </Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonCompact: {
    width: 52,
    minHeight: 52,
    borderRadius: 26,
    marginBottom: 0,
  },
  disabled: { opacity: 0.55 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '700',
    fontSize: 14,
    color: '#4285F4',
    backgroundColor: '#F7F7F7',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
