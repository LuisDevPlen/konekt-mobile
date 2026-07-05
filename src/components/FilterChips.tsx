import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ifood } from '../theme/ifood';

export interface FilterChip {
  id: string;
  label: string;
  dropdown?: boolean;
}

export const DEFAULT_FILTERS: FilterChip[] = [
  { id: 'sort', label: 'Ordenar', dropdown: true },
  { id: 'free', label: 'Entrega grátis' },
  { id: 'open', label: 'Abertos agora' },
  { id: 'promo', label: 'Promoção' },
  { id: 'near', label: 'Perto de você' },
];

const SORT_CYCLE: Array<{ id: string; label: string }> = [
  { id: 'sort_name', label: 'A–Z' },
  { id: 'sort_rating', label: 'Melhor avaliação' },
  { id: 'sort_free', label: 'Entrega grátis' },
];

interface Props {
  filters?: FilterChip[];
  activeIds?: Set<string>;
  onToggle?: (id: string) => void;
  onSortChange?: (sortId: string, label: string) => void;
  sortId?: string;
}

export function FilterChips({
  filters = DEFAULT_FILTERS,
  activeIds,
  onToggle,
  onSortChange,
  sortId = 'sort_name',
}: Props) {
  const sortLabel = SORT_CYCLE.find((s) => s.id === sortId)?.label ?? 'Ordenar';

  const handlePress = (id: string) => {
    if (id === 'sort') {
      const idx = SORT_CYCLE.findIndex((s) => s.id === sortId);
      const next = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
      onSortChange?.(next.id, next.label);
      return;
    }
    onToggle?.(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {filters.map((f) => {
        const isSort = f.id === 'sort';
        const active = isSort
          ? sortId !== 'sort_name'
          : Boolean(activeIds?.has(f.id));
        const label = isSort ? `Ordenar: ${sortLabel}` : f.label;
        return (
          <TouchableOpacity
            key={f.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => handlePress(f.id)}
            activeOpacity={0.85}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            {f.dropdown ? (
              <Ionicons
                name="chevron-down"
                size={14}
                color={active ? ifood.colors.text : ifood.colors.textSecondary}
                style={styles.chipIcon}
              />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: ifood.radius.pill,
    borderWidth: 1,
    borderColor: ifood.colors.border,
    backgroundColor: ifood.colors.white,
    marginRight: 8,
  },
  chipActive: {
    borderColor: ifood.colors.primary,
    backgroundColor: ifood.colors.chipBg,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: ifood.colors.textSecondary },
  chipTextActive: { color: ifood.colors.primary },
  chipIcon: { marginLeft: 4 },
});
