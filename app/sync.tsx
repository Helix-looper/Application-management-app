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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Wifi,
  CheckCircle2,
  AlertCircle,
  QrCode,
  X,
  Camera,
} from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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

  // Camera QR scanner state
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const executeSync = async (addressToUse: string, pinToUse: string) => {
    if (!addressToUse.trim()) {
      Alert.alert('Address Required', 'Please enter your Desktop IP address.');
      return;
    }
    if (!pinToUse.trim() || pinToUse.trim().length !== 4) {
      Alert.alert('PIN Required', 'Please enter the 4-digit pairing PIN shown on your desktop screen.');
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      // 1. Authenticate / Pair
      const pairResult = await pairWithDesktop(addressToUse.trim(), pinToUse.trim());
      if (!pairResult.success || !pairResult.token) {
        setStatusMessage({
          text: pairResult.error || 'Pairing failed. Ensure your desktop is running and the PIN matches.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      // 2. Bidirectional Sync
      const syncResult = await syncWithDesktop(addressToUse.trim(), pairResult.token);
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

  const handleStartScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          'Camera Permission Needed',
          'Please allow camera access in your device settings to scan desktop sync QR codes.'
        );
        return;
      }
    }
    setScanned(false);
    setIsScanning(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setIsScanning(false);

    try {
      let targetUrl = '';
      let targetPin = '';

      if (data.startsWith('{')) {
        const json = JSON.parse(data);
        targetUrl = json.url || '';
        targetPin = json.pin || '';
      } else if (data.includes('pin=')) {
        const params = new URLSearchParams(data.slice(data.indexOf('?') + 1));
        targetUrl = params.get('url') || '';
        targetPin = params.get('pin') || '';
      } else {
        targetUrl = data;
      }

      if (targetUrl) {
        setDesktopAddress(targetUrl);
        if (targetPin) setPin(targetPin);
        executeSync(targetUrl, targetPin);
      }
    } catch {
      Alert.alert('Scan Error', 'Could not parse the QR code. You can enter the PIN manually.');
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

          {/* Quick QR Scan Action Card */}
          <Card style={[styles.card, { padding: Spacing.base }]}>
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: colors.statusInterviewBg },
                ]}
              >
                <QrCode size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[Typography.cardTitle, { color: colors.textPrimary }]}>
                  One-Tap QR Connect
                </Text>
                <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2 }]}>
                  Instantly pair and sync by pointing your camera at your desktop screen.
                </Text>
              </View>
            </View>

            <Button
              label="Scan Desktop QR Code"
              variant="primary"
              onPress={handleStartScan}
              leftIcon={<Camera size={18} color={colors.white} style={{ marginRight: 6 }} />}
            />
          </Card>

          {/* Manual Entry Fallback Card */}
          <Card style={styles.card}>
            <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
              Manual Connection
            </Text>
            <Text style={[Typography.secondary, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
              Or enter the network address and 4-digit PIN manually:
            </Text>

            <Input
              label="Desktop Network Address"
              placeholder="e.g. 192.168.1.15:5173"
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
              label={loading ? 'Synchronizing...' : 'Sync Manually'}
              variant="secondary"
              onPress={() => executeSync(desktopAddress, pin)}
              loading={loading}
              disabled={loading}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* QR Code Scanner Modal */}
      <Modal
        visible={isScanning}
        animationType="slide"
        onRequestClose={() => setIsScanning(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              onPress={() => setIsScanning(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
              Scan Desktop QR Code
            </Text>
            <View style={{ width: 26 }} />
          </View>

          <View style={{ flex: 1, position: 'relative' }}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={handleBarcodeScanned}
            />

            <View style={styles.scannerOverlay}>
              <View style={styles.viewfinder}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.scannerHint}>
                Align the QR code on your computer within the frame
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
    width: 42,
    height: 42,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
  scannerHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 250,
    height: 250,
    borderRadius: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#64AC7A',
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scannerHint: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
