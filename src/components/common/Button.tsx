import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Typography, BorderRadius, Spacing } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  style,
  textStyle,
  leftIcon,
}: ButtonProps) {
  const { colors } = useTheme();

  const getBackground = () => {
    switch (variant) {
      case 'primary':
        return colors.accent;
      case 'secondary':
        return colors.surface2;
      case 'danger':
        return colors.error;
      default:
        return 'transparent';
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'secondary':
        return colors.border;
      case 'outline':
        return colors.accent;
      default:
        return 'transparent';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return colors.textPrimary;
      case 'outline':
      case 'ghost':
        return colors.accent;
      default:
        return colors.accent;
    }
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: { paddingVertical: 8, paddingHorizontal: 14 },
    md: { paddingVertical: 12, paddingHorizontal: 18 },
    lg: { paddingVertical: 15, paddingHorizontal: 24 },
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: getBackground(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
        },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              Typography.bodyMedium,
              { color: getTextColor(), fontWeight: '600' },
              leftIcon ? { marginLeft: Spacing.xs + 2 } : {},
              textStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
