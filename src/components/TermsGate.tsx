import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Button, ErrorBox } from './ui';
import { colors, radius, spacing } from '../theme/ifood';
import { getFriendlyErrorMessage } from '../utils/errors';

const TERMS_QUOTE =
  'Li e concordo com os Termos de Uso e Política de Privacidade da Connect/Konect+, autorizando o tratamento dos meus dados pessoais para utilização da plataforma, conforme a LGPD.';

export function TermsGate() {
  const { customer, loading, needsTermsAcceptance, acceptTerms } = useAuth();
  const [checked, setChecked] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const visible = !loading && !!customer && needsTermsAcceptance();

  React.useEffect(() => {
    if (visible) {
      setChecked(false);
      setError('');
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => {}}>
      <View style={styles.container}>
        <Text style={styles.title}>Termos de Uso e Privacidade</Text>
        <Text style={styles.subtitle}>
          Para continuar usando o app e fazer pedidos, aceite os termos abaixo.
        </Text>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.body}>{TERMS_QUOTE}</Text>
        </ScrollView>

        {error ? <ErrorBox message={error} /> : null}

        <Pressable style={styles.checkboxRow} onPress={() => setChecked((v) => !v)}>
          <Ionicons
            name={checked ? 'checkbox' : 'square-outline'}
            size={24}
            color={checked ? colors.primary : colors.textMuted}
          />
          <Text style={styles.checkboxLabel}>Li e estou de acordo com os termos de uso</Text>
        </Pressable>

        <Button
          label={submitting ? 'Registrando...' : 'Continuar'}
          disabled={!checked || submitting}
          onPress={async () => {
            setSubmitting(true);
            setError('');
            try {
              await acceptTerms();
            } catch (err) {
              setError(getFriendlyErrorMessage(err));
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
    marginBottom: spacing.md,
  },
  scrollContent: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
