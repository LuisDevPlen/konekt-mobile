import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tenant } from '../types';
import { ifood, storeAccent } from '../theme/ifood';
import { resolveImageUrl } from '../utils/imageUrl';
import { formatStoreDelivery, formatStoreRating } from '../utils/storeFilters';

interface TenantCardProps {
  tenant: Tenant;
  onPress: () => void;
  variant?: 'list' | 'featured';
}

export function TenantCard({ tenant, onPress, variant = 'list' }: TenantCardProps) {
  const accent = storeAccent(tenant.slug);
  const logoUri = resolveImageUrl(tenant.logo_url);
  const rating = formatStoreRating(tenant);
  const delivery = formatStoreDelivery(tenant);

  if (variant === 'featured') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.featuredWrap}>
        <View style={styles.featuredCard}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.featuredLogoImage} />
          ) : (
            <View style={[styles.featuredLogo, { backgroundColor: accent }]}>
              <Text style={styles.featuredLogoText}>{tenant.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.featuredBody}>
            <Text style={styles.featuredName} numberOfLines={2}>{tenant.name}</Text>
            {rating ? (
              <View style={styles.featuredRating}>
                <Ionicons name="star" size={11} color="#F5A623" />
                <Text style={styles.featuredMeta}>{rating.split(' ')[0]}</Text>
              </View>
            ) : null}
            <Text style={styles.featuredMeta} numberOfLines={1}>{delivery}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.listWrap}>
      {logoUri ? (
        <Image source={{ uri: logoUri }} style={styles.listLogoImage} />
      ) : (
        <View style={[styles.listLogo, { backgroundColor: accent }]}>
          <Text style={styles.listLogoText}>{tenant.name.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.listBody}>
        <Text style={styles.listName} numberOfLines={1}>{tenant.name}</Text>
        <View style={styles.metaRow}>
          {rating ? (
            <>
              <Ionicons name="star" size={12} color="#F5A623" />
              <Text style={styles.meta}> {rating}</Text>
              <Text style={styles.metaDot}> · </Text>
            </>
          ) : null}
          <Text style={[styles.meta, tenant.free_delivery && styles.metaFree]}>{delivery}</Text>
        </View>
        {tenant.description ? (
          <Text style={styles.listDesc} numberOfLines={1}>{tenant.description}</Text>
        ) : null}
        {tenant.has_promo ? (
          <View style={styles.promoRow}>
            <View style={styles.promoTag}>
              <Text style={styles.promoTagText}>Promoção</Text>
            </View>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={ifood.colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  featuredWrap: {
    width: 168,
    marginRight: 12,
  },
  featuredCard: {
    borderWidth: 1,
    borderColor: ifood.colors.border,
    borderRadius: 12,
    backgroundColor: ifood.colors.white,
    overflow: 'hidden',
  },
  featuredLogo: {
    width: '100%',
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredLogoImage: {
    width: '100%',
    height: 88,
  },
  featuredLogoText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  featuredBody: { padding: 10 },
  featuredName: {
    fontSize: 13,
    fontWeight: '700',
    color: ifood.colors.text,
    lineHeight: 18,
  },
  featuredRating: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 2 },
  featuredMeta: { fontSize: 11, color: ifood.colors.textSecondary, marginTop: 2 },
  listWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
  },
  listLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listLogoImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
  },
  listLogoText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  listBody: { flex: 1, paddingRight: 8 },
  listName: { fontSize: 16, fontWeight: '700', color: ifood.colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  meta: { fontSize: 12, color: ifood.colors.textSecondary },
  metaDot: { fontSize: 12, color: ifood.colors.textMuted },
  metaFree: { color: ifood.colors.successBright, fontWeight: '600' },
  listDesc: { fontSize: 12, color: ifood.colors.textMuted, marginTop: 4 },
  promoRow: { flexDirection: 'row', marginTop: 8 },
  promoTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  promoTagText: { fontSize: 11, fontWeight: '700', color: '#4338CA' },
});
