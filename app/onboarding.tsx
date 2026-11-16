import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Briefcase,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  Smartphone,
  ArrowRight,
  Check,
} from 'lucide-react-native';
import { useTheme, ThemeMode } from '@/theme/ThemeContext';
import { setSetting } from '@/database/repositories/settingsRepository';
import { requestNotificationPermission } from '@/services/notificationService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Typography, Spacing, BorderRadius } from '@/theme';

export default function OnboardingScreen() {
  const { colors, mode, setMode } = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [notifGranted, setNotifGranted] = useState(false);

  const themeOptions: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'System', icon: Smartphone },
  ];

  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
  };

  const handleFinish = async () => {
    await setSetting('onboarding_completed', '1');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {step === 1 ? (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.heroSection}>
              <View style={[styles.logoBadge, { backgroundColor: colors.surface2 }]}>
                <Briefcase size={36} color={colors.accent} />
              </View>
              <Text style={[Typography.screenHeading, { color: colors.textPrimary, textAlign: 'center', fontSize: 28 }]}>
                Welcome to JobPilot
              </Text>
              <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 }]}>
                Every opportunity, every application, every interview — organized in one place.
              </Text>
            </View>

            {/* Pillar 1: Offline & Private */}
            <Card style={styles.featureCard}>
              <View style={styles.featureRow}>
                <ShieldCheck size={24} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                    100% Offline & Private
                  </Text>
                  <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
                    No account required, no remote servers, and no data tracking. Your job search data stays strictly on this device.
                  </Text>
                </View>
              </View>
            </Card>

            {/* Pillar 2: Fast Organization */}
            <Card style={styles.featureCard}>
              <View style={styles.featureRow}>
                <Briefcase size={24} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                    Streamlined Management
                  </Text>
                  <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
                    Track multi-round interviews, follow-ups with recruiters, tailored resumes, and pipeline progress with zero spreadsheet clutter.
                  </Text>
                </View>
              </View>
            </Card>

            <Button
              label="Continue"
              size="lg"
              onPress={() => setStep(2)}
              fullWidth
              style={{ marginTop: Spacing.xl }}
              leftIcon={<ArrowRight size={18} color="#FFF" />}
            />
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.heroSection}>
              <Text style={[Typography.screenHeading, { color: colors.textPrimary, textAlign: 'center', fontSize: 24 }]}>
                Personalize Your Setup
              </Text>
              <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
                Select your preferred theme and notification preferences.
              </Text>
            </View>

            {/* Theme Selection */}
            <Card style={styles.featureCard}>
              <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.md }]}>
                Appearance
              </Text>
              <View style={styles.themeRow}>
                {themeOptions.map(({ key, label, icon: Icon }) => {
                  const isSelected = mode === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.themeBtn,
                        {
                          borderColor: isSelected ? colors.accent : colors.border,
                          backgroundColor: isSelected ? colors.surface2 : 'transparent',
                        },
                      ]}
                      onPress={() => setMode(key)}
                    >
                      <Icon size={20} color={isSelected ? colors.accent : colors.textSecondary} />
                      <Text
                        style={[
                          Typography.secondaryMedium,
                          {
                            color: isSelected ? colors.accent : colors.textPrimary,
                            marginTop: 4,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            {/* Notifications */}
            <Card style={styles.featureCard}>
              <View style={styles.featureRow}>
                <Bell size={24} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                    Interview & Follow-up Reminders
                  </Text>
                  <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
                    Enable notifications to receive gentle alerts 30 minutes before interviews and on deadline mornings.
                  </Text>
                </View>
              </View>

              <Button
                label={notifGranted ? 'Notifications Allowed' : 'Enable Notifications'}
                variant={notifGranted ? 'secondary' : 'outline'}
                size="sm"
                onPress={handleRequestNotif}
                style={{ marginTop: Spacing.md }}
                leftIcon={notifGranted ? <Check size={16} color={colors.accent} /> : undefined}
              />
            </Card>

            <Button
              label="Open JobPilot"
              size="lg"
              onPress={handleFinish}
              fullWidth
              style={{ marginTop: Spacing.xl }}
            />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  scroll: {
    padding: Spacing.screenPadding * 1.2,
    paddingBottom: Spacing.xxl + 20,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  featureCard: {
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
});
