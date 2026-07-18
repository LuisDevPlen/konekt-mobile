import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../theme/ifood';

export const theme = { colors };

export function Screen({
  children,
  style,
  edges = 'none',
}: {
  children: React.ReactNode;
  style?: object;
  edges?: 'none' | 'top' | 'horizontal';
}) {
  const insets = useSafeAreaInsets();
  const edgeStyle =
    edges === 'top'
      ? { paddingTop: insets.top }
      : edges === 'horizontal'
        ? { paddingLeft: insets.left, paddingRight: insets.right }
        : null;

  return <View style={[styles.screen, edgeStyle, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      style={[styles.input, props.style]}
      placeholderTextColor={colors.textMuted}
    />
  );
}

export function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Senha',
  ...rest
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
} & Omit<React.ComponentProps<typeof TextInput>, 'value' | 'onChangeText' | 'secureTextEntry'>) {
  const [visible, setVisible] = React.useState(false);

  return (
    <View style={styles.passwordWrap}>
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!visible}
        style={styles.passwordInput}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={styles.passwordToggle}
        onPress={() => setVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

export function SearchBar(props: React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.searchWrap}>
      <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIconIon} />
      <TextInput
        {...props}
        style={styles.searchInput}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  compact,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'outlinePrimary';
  disabled?: boolean;
  compact?: boolean;
  style?: object;
}) {
  const textStyle =
    variant === 'outlinePrimary'
      ? styles.buttonTextPrimary
      : variant === 'secondary' || variant === 'outline'
        ? styles.buttonTextDark
        : styles.buttonText;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant === 'outlinePrimary' ? 'outlinePrimary' : variant],
        compact && styles.buttonCompact,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function PriceTag({ value }: { value: string }) {
  return <Text style={styles.price}>{value}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sectionAction: { fontSize: 14, fontWeight: '600', color: colors.primary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...shadow.card,
  },
  input: {
    backgroundColor: colors.searchBg,
    borderWidth: 0,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    marginBottom: 12,
    fontSize: 15,
  },
  passwordWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  passwordInput: {
    backgroundColor: colors.searchBg,
    borderWidth: 0,
    borderRadius: radius.pill,
    paddingLeft: 16,
    paddingRight: 48,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
  },
  passwordToggle: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.searchBg,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchIconIon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: spacing.sm,
    minHeight: 48,
  },
  buttonCompact: { paddingVertical: 10, marginTop: 4 },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.bgSecondary },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlinePrimary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  buttonTextDark: { color: colors.text, fontWeight: '600', fontSize: 15 },
  buttonTextPrimary: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: colors.primary, fontSize: 14 },
  price: { color: colors.text, fontWeight: '700', fontSize: 16 },
});
