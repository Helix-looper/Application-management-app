import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/theme';

interface InputProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
  containerStyle?: ViewStyle;
  hint?: string;
}

export function Input({
  label,
  required,
  error,
  containerStyle,
  hint,
  style,
  ...props
}: InputProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelRow}>
        <Text style={[Typography.secondaryMedium, { color: colors.textPrimary }]}>
          {label}
        </Text>
        {required && (
          <Text style={[Typography.secondary, { color: colors.error, marginLeft: 3 }]}>
            *
          </Text>
        )}
      </View>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            color: colors.textPrimary,
          },
          Typography.body,
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />

      {error ? (
        <Text style={[Typography.small, { color: colors.error, marginTop: 4 }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[Typography.small, { color: colors.textSecondary, marginTop: 4 }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
});
