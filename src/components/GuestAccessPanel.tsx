import React from 'react';
import {
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './ui';
import { colors, radius, shadow, spacing } from '../theme/ifood';

export type GuestAccessVariant = 'profile' | 'support' | 'orders';

type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

const ORDERS_HERO_IMAGE = require('../../assets/guest-orders-hero.png');

type VariantConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  image?: string;
  localImage?: ImageSourcePropType;
  imageLabel: string;
  features: Feature[];
  primaryLabel: string;
  secondaryLabel: string;
};

const VARIANTS: Record<GuestAccessVariant, VariantConfig> = {
  profile: {
    eyebrow: 'Minha conta',
    title: 'Peça com praticidade',
    subtitle: 'Entre para acompanhar pedidos, salvar endereços e personalizar sua experiência na loja.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
    imageLabel: 'Seus pedidos favoritos',
    features: [
      {
        icon: 'receipt-outline',
        title: 'Histórico de pedidos',
        subtitle: 'Veja status, detalhes e avaliações em um só lugar.',
      },
      {
        icon: 'location-outline',
        title: 'Endereços salvos',
        subtitle: 'Finalize compras mais rápido com entrega configurada.',
      },
      {
        icon: 'notifications-outline',
        title: 'Alertas em tempo real',
        subtitle: 'Saiba quando seu pedido sair para entrega.',
      },
    ],
    primaryLabel: 'Entrar na minha conta',
    secondaryLabel: 'Criar conta grátis',
  },
  support: {
    eyebrow: 'Suporte',
    title: 'Estamos aqui para ajudar',
    subtitle: 'Entre na sua conta para relatar bugs e problemas de uso da plataforma.',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
    imageLabel: 'Atendimento Dino Eats',
    features: [
      {
        icon: 'chatbubbles-outline',
        title: 'Chamados com protocolo',
        subtitle: 'Registre problemas e acompanhe cada etapa do atendimento.',
      },
      {
        icon: 'time-outline',
        title: 'Resposta ágil',
        subtitle: 'Nossa equipe responde em até 24 horas úteis.',
      },
      {
        icon: 'shield-checkmark-outline',
        title: 'Suporte dedicado',
        subtitle: 'Ajuda com pedidos, pagamentos e uso do app.',
      },
    ],
    primaryLabel: 'Entrar para falar com suporte',
    secondaryLabel: 'Criar conta',
  },
  orders: {
    eyebrow: 'Pedidos',
    title: 'Acompanhe em tempo real',
    subtitle: 'Entre para ver status, histórico e detalhes dos seus pedidos em todas as lojas parceiras.',
    localImage: ORDERS_HERO_IMAGE,
    imageLabel: 'Seu pedido a caminho',
    features: [
      {
        icon: 'bicycle-outline',
        title: 'Status ao vivo',
        subtitle: 'Saiba quando o pedido está em preparo, pronto ou a caminho.',
      },
      {
        icon: 'receipt-outline',
        title: 'Histórico completo',
        subtitle: 'Revise itens, valores e comprovantes das compras anteriores.',
      },
      {
        icon: 'chatbubble-ellipses-outline',
        title: 'Chat com a loja',
        subtitle: 'Tire dúvidas direto com o restaurante pelo app.',
      },
    ],
    primaryLabel: 'Entrar para ver pedidos',
    secondaryLabel: 'Criar conta grátis',
  },
};

const BADGE_ICONS: Record<GuestAccessVariant, keyof typeof Ionicons.glyphMap> = {
  profile: 'restaurant',
  support: 'headset',
  orders: 'receipt',
};

export function GuestAccessPanel({
  variant,
  onPrimaryPress,
  onSecondaryPress,
}: {
  variant: GuestAccessVariant;
  onPrimaryPress: () => void;
  onSecondaryPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  const content = VARIANTS[variant];
  const heroSource = content.localImage ?? { uri: content.image! };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.md, paddingBottom: spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>{content.eyebrow}</Text>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>

        <View style={styles.heroCard}>
          <Image source={heroSource} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBadge}>
            <Ionicons
              name={BADGE_ICONS[variant]}
              size={16}
              color={colors.primary}
            />
            <Text style={styles.heroBadgeText}>{content.imageLabel}</Text>
          </View>
        </View>

        <View style={styles.features}>
          {content.features.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={feature.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSub}>{feature.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button label={content.primaryLabel} onPress={onPrimaryPress} style={styles.footerButton} />
        <Button
          label={content.secondaryLabel}
          variant="outlinePrimary"
          onPress={onSecondaryPress}
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  heroCard: {
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    minHeight: 200,
    backgroundColor: colors.bgSecondary,
    ...shadow.card,
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },
  heroBadge: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  features: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  footerButton: {
    marginTop: 0,
    width: '100%',
  },
});
