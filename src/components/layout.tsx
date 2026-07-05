import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ifood } from '../theme/ifood';

export function CircleIconButton({
  icon,
  onPress,
  light,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  light?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.circleBtn, light && styles.circleBtnLight]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={20} color={light ? ifood.colors.white : ifood.colors.text} />
    </TouchableOpacity>
  );
}

export function SacolaHeader({
  title,
  onBack,
  rightLabel,
  onRight,
}: {
  title: string;
  onBack: () => void;
  rightLabel?: string;
  onRight?: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.sacolaHeader, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={onBack} style={styles.sacolaBack} hitSlop={12}>
        <Ionicons name="chevron-back" size={24} color={ifood.colors.primary} />
      </TouchableOpacity>
      <Text style={styles.sacolaTitle}>{title}</Text>
      {rightLabel && onRight ? (
        <TouchableOpacity onPress={onRight} hitSlop={12}>
          <Text style={styles.sacolaAction}>{rightLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.sacolaSpacer} />
      )}
    </View>
  );
}

export function StickyFooter({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 12) }, style]}>
      {children}
    </View>
  );
}

export function OptionSectionHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <View style={styles.optionHeader}>
      <View style={styles.optionHeaderText}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View style={styles.optionBadge}>
          <Text style={styles.optionBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function RadioRow({
  label,
  description,
  price,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  price?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.radioRow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.radioText}>
        <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
        {description ? <Text style={styles.radioDesc}>{description}</Text> : null}
        {price ? <Text style={styles.radioPrice}>{price}</Text> : null}
      </View>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ifood.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...ifood.shadow.card,
  },
  circleBtnLight: {
    backgroundColor: ifood.colors.overlay,
  },
  sacolaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: ifood.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
  },
  sacolaBack: { width: 32 },
  sacolaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ifood.colors.text,
    letterSpacing: 0.5,
  },
  sacolaAction: {
    fontSize: 14,
    fontWeight: '600',
    color: ifood.colors.primary,
    minWidth: 48,
    textAlign: 'right',
  },
  sacolaSpacer: { width: 48 },
  stickyFooter: {
    borderTopWidth: 1,
    borderTopColor: ifood.colors.border,
    backgroundColor: ifood.colors.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
    ...ifood.shadow.footer,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ifood.colors.bgSection,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 8,
    borderTopColor: ifood.colors.bgSecondary,
  },
  optionHeaderText: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: ifood.colors.text },
  optionSubtitle: { fontSize: 13, color: ifood.colors.textSecondary, marginTop: 2 },
  optionBadge: {
    backgroundColor: ifood.colors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  optionBadgeText: {
    color: ifood.colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: ifood.colors.border,
  },
  radioText: { flex: 1, paddingRight: 12 },
  radioLabel: { fontSize: 15, color: ifood.colors.text },
  radioLabelSelected: { fontWeight: '700' },
  radioDesc: { fontSize: 13, color: ifood.colors.textSecondary, marginTop: 4, lineHeight: 18 },
  radioPrice: { fontSize: 13, color: ifood.colors.textSecondary, marginTop: 4 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: ifood.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: ifood.colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ifood.colors.primary,
  },
});
