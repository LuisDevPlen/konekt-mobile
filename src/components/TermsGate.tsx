import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Button, ErrorBox } from './ui';
import { TermsLegalRow, TermsReaderModal } from './TermsReaderModal';
import { colors, spacing } from '../theme/ifood';
import { getFriendlyErrorMessage } from '../utils/errors';

export function TermsGate() {
  const { customer, loading, needsTermsAcceptance, acceptTerms } = useAuth();
  const [checked, setChecked] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [readerOpen, setReaderOpen] = React.useState(false);

  const visible = !loading && !!customer && needsTermsAcceptance();

  React.useEffect(() => {
    if (visible) {
      setChecked(false);
      setError('');
      setReaderOpen(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => {}}>
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text-outline" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Termos de Uso e Privacidade</Text>
          <Text style={styles.subtitle}>
            Para continuar usando o app e fazer pedidos, aceite os termos. Você pode ler o documento completo
            clicando no ícone ao lado.
          </Text>

          <TermsLegalRow onPress={() => setReaderOpen(true)} />

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

      <TermsReaderModal visible={readerOpen} onClose={() => setReaderOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
