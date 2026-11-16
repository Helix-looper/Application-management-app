import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ApplicationStatus } from '@/types';
import { STATUS_LABELS, getStatusColor, getStatusBgColor } from '@/utils/statusHelpers';
import { Typography, BorderRadius } from '@/theme';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { isDark } = useTheme();
  const theme = isDark ? 'dark' : 'light';
  const color = getStatusColor(status, theme);
  const bg = getStatusBgColor(status, theme);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bg },
        size === 'sm' && styles.containerSm,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: color },
          size === 'sm' && styles.dotSm,
        ]}
      />
      <Text
        style={[
          size === 'sm' ? Typography.smallMedium : Typography.secondaryMedium,
          { color },
        ]}
      >
        {STATUS_LABELS[status] || status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  containerSm: {
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    gap: 4.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSm: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
