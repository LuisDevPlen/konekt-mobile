import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ifood } from '../theme/ifood';

interface Props {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  compact?: boolean;
  disableIncrease?: boolean;
}

export function QuantityStepper({ value, onDecrease, onIncrease, min = 1, compact, disableIncrease }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <TouchableOpacity
        style={styles.btn}
        onPress={onDecrease}
        disabled={value <= min}
        activeOpacity={0.8}
      >
        <Ionicons
          name={value <= min && min > 0 ? 'trash-outline' : 'remove'}
          size={18}
          color={value <= min ? ifood.colors.textMuted : ifood.colors.primary}
        />
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={onIncrease}
        disabled={disableIncrease}
        activeOpacity={0.8}
      >
        <Ionicons
          name="add"
          size={18}
          color={disableIncrease ? ifood.colors.textMuted : ifood.colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ifood.colors.bgSecondary,
    borderRadius: ifood.radius.md,
    paddingHorizontal: 4,
  },
  wrapCompact: { backgroundColor: ifood.colors.bgSection },
  btn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: ifood.colors.text,
  },
});
