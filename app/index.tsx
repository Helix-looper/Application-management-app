import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { getSetting } from '@/database/repositories/settingsRepository';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';

export default function Index() {
  const { colors } = useTheme();
  const isDbReady = useAppStore((s) => s.isDbReady);
  const [targetRoute, setTargetRoute] = useState<string | null>(null);

  useEffect(() => {
    if (!isDbReady) return;
    getSetting('onboarding_completed').then((val) => {
      if (val === '1') {
        setTargetRoute('/(tabs)');
      } else {
        setTargetRoute('/onboarding');
      }
    });
  }, [isDbReady]);

  if (!targetRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  return <Redirect href={targetRoute as any} />;
}
