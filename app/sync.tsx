import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Wifi,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { pairWithDesktop, syncWithDesktop } from '@/services/desktopSyncService';

export default function DesktopSyncScreen() {
  const { colors } = useTheme();
  const {
    triggerDashboardRefresh,
    triggerApplicationsRefresh,
    triggerCompaniesRefresh,
    triggerCalendarRefresh,
    triggerRemindersRefresh,
  } = useAppStore();

  const [desktopAddress, setDesktopAddress] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSync = async () => {
    if (!desktopAddress.trim()) {
      Alert.alert('Address Required', 'Please enter your Desktop IP address (e.g. 192.168.1.15:3001).');
      return;
    }
    if (!pin.trim() || pin.trim().length !== 4) {
      Alert.alert('PIN Required', 'Please enter the 4-digit pairing PIN shown on your desktop screen.');
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Authenticate / Pair
      const pairResult = await pairWithDesktop(desktopAddress.trim(), pin.trim());
      if (!pairResult.success || !pairResult.token) {
        setStatusMessage({
          text: pairResult.error || 'Pairing failed. Ensure your desktop is running and the PIN matches.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      // 2. Bidirectional Sync
      const syncResult = await syncWithDesktop(desktopAddress.trim(), pairResult.token);
      if (syncResult.success) {
        triggerDashboardRefresh();
        triggerApplicationsRefresh();
        triggerCompaniesRefresh();
        triggerCalendarRefresh();
        triggerRemindersRefresh();

        setStatusMessage({
          text: syncResult.message,
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: syncResult.message || 'Sync encountered an issue.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: 'Error connecting to desktop: ' + (err.message || 'Check your Wi-Fi.'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Desktop Wi-Fi Sync</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {statusMessage && (
            <View
              style={[
                styles.feedbackBox,
                {
                  backgroundColor:
                    statusMessage.type === 'success' ? colors.statusInterviewBg : colors.statusRejectedBg,
                  borderColor:
                    statusMessage.type === 'success' ? colors.success : colors.error,
                },
              ]}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={18} color={colors.success} style={{ marginRight: 8 }} />
              ) : (
                <AlertCircle size={18} color={colors.error} style={{ marginRight: 8 }} />
              )}
              <Text
                style={[
                  styles.feedbackText,
                  {
                    color: statusMessage.type === 'success' ? colors.success : colors.error,
                  },
                ]}
              >
                {statusMessage.text}
              </Text>
            </View>
          )}

          {/* Guide Card */}
          <Card style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: colors.statusInterviewBg },
                ]}
              >
                <Wifi size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[Typography.cardTitle, { color: colors.textPrimary }]}>
                  Connect to JobPilot Web
                </Text>
                <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2 }]}>
                  Sync opportunities instantly over your local Wi-Fi network.
                </Text>
              </View>
            </View>

            <View style={[styles.stepsBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Text style={[Typography.secondary, { color: colors.textSecondary, marginBottom: 4 }]}>
                1. Open <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Wi-Fi Sync</Text> on Desktop Companion.
              </Text>
              <Text style={[Typography.secondary, { color: colors.textSecondary, marginBottom: 4 }]}>
                2. Enter the Desktop IP Address and 4-Digit PIN shown on the computer screen.
              </Text>
              <Text style={[Typography.secondary, { color: colors.textSecondary }]}>
                3. Tap <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Sync Now</Text> to exchange opportunities.
              </Text>
            </View>
          </Card>

          {/* Inputs Card */}
          <Card style={styles.card}>
            <Input
              label="Desktop Network Address"
              placeholder="e.g. 192.168.1.15:3001"
              value={desktopAddress}
              onChangeText={setDesktopAddress}
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={{ marginBottom: Spacing.md }}
            />

            <Input
              label="4-Digit Pairing PIN"
              placeholder="e.g. 4821"
              keyboardType="numeric"
              maxLength={4}
              value={pin}
              onChangeText={setPin}
              containerStyle={{ marginBottom: Spacing.lg }}
            />

            <Button
              label={loading ? 'Synchronizing...' : 'Sync Now'}
              onPress={handleSync}
              loading={loading}
              disabled={loading}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  title: {
    ...Typography.sectionHeading,
  },
  content: {
    padding: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsBox: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  feedbackText: {
    ...Typography.bodyMedium,
    flex: 1,
  },
});
