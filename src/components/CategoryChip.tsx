import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ifood } from '../theme/ifood';
import { StoreCategoryFilter } from '../utils/storeFilters';

const CATEGORIES: Array<{ id: StoreCategoryFilter; label: string; emoji: string; bg: string }> = [
  { id: 'all', label: 'Todos', emoji: '✨', bg: '#F3F4F6' },
  { id: 'restaurant', label: 'Restaurantes', emoji: '🍔', bg: '#FFE8E8' },
  { id: 'shop', label: 'Lojas', emoji: '🛍️', bg: '#E8F4FF' },
  { id: 'market', label: 'Mercados', emoji: '🛒', bg: '#E8FFF0' },
  { id: 'promo', label: 'Promoções', emoji: '🏷️', bg: '#FFF8E8' },
];

interface Props {
  activeId?: StoreCategoryFilter;
  onSelect?: (id: StoreCategoryFilter) => void;
}

export function CategoryRow({ activeId = 'all', onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {CATEGORIES.map((c) => {
        const active = activeId === c.id;
        return (
          <TouchableOpacity
            key={c.id}
            style={styles.chip}
            onPress={() => onSelect?.(c.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: c.bg }, active && styles.iconBoxActive]}>
              <Text style={styles.emoji}>{c.emoji}</Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{c.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 8, paddingHorizontal: 16, paddingRight: 16, gap: 16 },
  chip: { alignItems: 'center', width: 76 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: ifood.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconBoxActive: {
    borderColor: ifood.colors.primary,
  },
  emoji: { fontSize: 28 },
  label: { fontSize: 11, fontWeight: '600', color: ifood.colors.text, textAlign: 'center' },
  labelActive: { color: ifood.colors.primary, fontWeight: '700' },
});
