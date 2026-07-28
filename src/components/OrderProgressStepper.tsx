import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ifood } from '../theme/ifood';
import { getOrderFlowSteps, getOrderStepIndex } from '../utils/orderStatus';

interface Props {
  status: string;
  /** Pedido agendado usa a régua de agendamento (igual ao painel web). */
  order?: { order_type?: string | null; scheduled_for?: string | null } | null;
}

export function OrderProgressStepper({ status, order }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const steps = getOrderFlowSteps(order);
  const currentIndex = getOrderStepIndex(status, order);
  const progress = steps.length > 1 ? currentIndex / (steps.length - 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.trackRow}>
        <View style={styles.trackBg}>
          <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.stepsRow}>
          {steps.map((step, index) => {
            const done = index < currentIndex;
            const active = index === currentIndex;
            const upcoming = index > currentIndex;
            const showLabel = !compact || active;

            return (
              <View key={step.key} style={styles.step}>
                <View
                  style={[
                    styles.dot,
                    compact && styles.dotCompact,
                    done && styles.dotDone,
                    active && styles.dotActive,
                    upcoming && styles.dotUpcoming,
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={compact ? 10 : 12} color={ifood.colors.white} />
                  ) : (
                    <Ionicons
                      name={step.icon}
                      size={active ? (compact ? 12 : 14) : compact ? 10 : 12}
                      color={active ? ifood.colors.white : ifood.colors.textMuted}
                    />
                  )}
                </View>
                {showLabel ? (
                  <Text
                    style={[
                      styles.stepLabel,
                      compact && styles.stepLabelCompact,
                      (done || active) && styles.stepLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {step.shortLabel}
                  </Text>
                ) : (
                  <View style={styles.stepLabelSpacer} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
  trackRow: { position: 'relative', paddingTop: 4 },
  trackBg: {
    position: 'absolute',
    top: 18,
    left: '10%',
    right: '10%',
    height: 4,
    backgroundColor: ifood.colors.bgSection,
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: ifood.colors.primary,
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ifood.colors.white,
    borderWidth: 2,
    borderColor: ifood.colors.border,
    zIndex: 1,
  },
  dotCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dotDone: {
    backgroundColor: ifood.colors.primary,
    borderColor: ifood.colors.primary,
  },
  dotActive: {
    backgroundColor: ifood.colors.primary,
    borderColor: ifood.colors.primary,
    transform: [{ scale: 1.08 }],
  },
  dotUpcoming: {
    backgroundColor: ifood.colors.white,
    borderColor: ifood.colors.border,
  },
  stepLabel: {
    fontSize: 10,
    color: ifood.colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelCompact: {
    fontSize: 9,
    marginTop: 4,
  },
  stepLabelSpacer: {
    height: 14,
    marginTop: 4,
  },
  stepLabelActive: {
    color: ifood.colors.text,
    fontWeight: '700',
  },
});
