import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CUSTOMER_TERMS } from '../content/termsContent';
import { Button } from './ui';
import { colors, radius, spacing } from '../theme/ifood';

export function TermsReaderModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const doc = CUSTOMER_TERMS;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Termos de Uso</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn} accessibilityLabel="Fechar">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <Text style={styles.version}>
          {doc.version} · {doc.publishedAt}
        </Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
        >
          <Text style={styles.intro}>{doc.intro}</Text>
          {doc.sections.map((section) => (
            <View key={section.title || section.quote} style={styles.section}>
              {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
              {(section.paragraphs ?? []).map((p) => (
                <Text key={p} style={styles.paragraph}>
                  {p}
                </Text>
              ))}
              {(section.bullets ?? []).map((item) => (
                <Text key={item} style={styles.bullet}>
                  • {item}
                </Text>
              ))}
              {(section.afterBullets ?? []).map((p) => (
                <Text key={p} style={styles.paragraph}>
                  {p}
                </Text>
              ))}
              {section.quote ? <Text style={styles.quote}>“{section.quote}”</Text> : null}
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Button label="Fechar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

export function TermsLegalRow({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.legalRow}>
      <Text style={styles.legalText}>
        Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.
      </Text>
      <Pressable
        onPress={onPress}
        style={styles.legalIconBtn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Ler termos de uso"
      >
        <Ionicons name="document-text-outline" size={22} color={colors.primary} />
        <Text style={styles.legalLink}>Ler</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: {
    paddingHorizontal: spacing.lg,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  intro: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
    marginLeft: spacing.sm,
    marginBottom: 4,
  },
  quote: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    color: colors.textSecondary,
    backgroundColor: colors.bgSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  legalText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  legalIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: '#FFF1F2',
    minWidth: 52,
  },
  legalLink: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
