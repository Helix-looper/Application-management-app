import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  Sun,
  Moon,
  Smartphone,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { useTheme, ThemeMode } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { resetDatabase } from '@/database/database';
import {
  exportBackupData,
  shareBackupFile,
  validateBackupContent,
  restoreBackupData,
} from '@/database/repositories/backupRepository';
import { Typography, Spacing, BorderRadius } from '@/theme';

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const {
    triggerDashboardRefresh,
    triggerApplicationsRefresh,
    triggerCalendarRefresh,
    triggerCompaniesRefresh,
    triggerRemindersRefresh,
  } = useAppStore();

  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshAllScreens = () => {
    triggerDashboardRefresh();
    triggerApplicationsRefresh();
    triggerCalendarRefresh();
    triggerCompaniesRefresh();
    triggerRemindersRefresh();
  };

  const themeOptions: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'System', icon: Smartphone },
  ];

  const handleExportBackup = async () => {
    setExportLoading(true);
    setStatusMessage(null);
    try {
      const result = await exportBackupData();
      if (result.success && result.filePath) {
        setStatusMessage('Backup created successfully. Opening share dialog...');
        await shareBackupFile(result.filePath);
      } else {
        Alert.alert('Export Failed', result.error || 'Could not export backup data.');
      }
    } catch (err: any) {
      Alert.alert('Export Error', err.message || 'An unexpected error occurred.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportBackup = async () => {
    setImportLoading(true);
    setStatusMessage(null);
    try {
      const doc = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (doc.canceled || !doc.assets || doc.assets.length === 0) {
        setImportLoading(false);
        return;
      }

      const fileUri = doc.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const validation = validateBackupContent(fileContent);
      if (!validation.valid || !validation.data) {
        Alert.alert('Invalid Backup File', validation.error || 'The file is corrupt or not a JobPilot backup.');
        setImportLoading(false);
        return;
      }

      // Confirmation before replacing
      Alert.alert(
        'Confirm Restore',
        `This will restore ${validation.data.applications?.length || 0} applications and ${validation.data.companies?.length || 0} companies from backup. Existing local records will be overwritten. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              const res = await restoreBackupData(validation.data!);
              if (res.success) {
                refreshAllScreens();
                setStatusMessage('Data restored successfully!');
                Alert.alert('Success', 'Backup restored successfully!');
              } else {
                Alert.alert('Restore Failed', res.error || 'Could not restore backup.');
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Import Error', err.message || 'Could not read file.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmClear = async () => {
    try {
      await resetDatabase();
      refreshAllScreens();
      setClearModalVisible(false);
      Alert.alert('Data Cleared', 'All applications, companies, and interviews have been deleted.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to clear data.');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[Typography.screenHeading, { color: colors.textPrimary, marginBottom: Spacing.lg }]}>
          Settings
        </Text>

        {statusMessage && (
          <Card style={[styles.statusCard, { backgroundColor: colors.statusInterviewBg, borderColor: colors.statusInterview }]}>
            <CheckCircle2 size={18} color={colors.statusInterview} />
            <Text style={[Typography.bodyMedium, { color: colors.statusInterview, flex: 1 }]}>
              {statusMessage}
            </Text>
          </Card>
        )}

        {/* Section 1: Appearance */}
        <View style={styles.section}>
          <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
            Appearance
          </Text>
          <Card style={{ padding: Spacing.md }}>
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
                    activeOpacity={0.7}
                  >
                    <Icon
                      size={20}
                      color={isSelected ? colors.accent : colors.textSecondary}
                    />
                    <Text
                      style={[
                        Typography.secondaryMedium,
                        {
                          color: isSelected ? colors.accent : colors.textPrimary,
                          marginTop: 6,
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
        </View>

        {/* Section 2: Desktop Companion */}
        <View style={styles.section}>
          <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
            Desktop Companion
          </Text>
          <Card style={{ padding: Spacing.base }}>
            <View style={styles.dataActionRow}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                  Wi-Fi Direct Sync
                </Text>
                <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2 }]}>
                  Exchange applications and status updates with the JobPilot Desktop Web Companion over local Wi-Fi.
                </Text>
              </View>
              <Button
                label="Sync"
                variant="primary"
                size="sm"
                onPress={() => router.push('/sync')}
              />
            </View>
          </Card>
        </View>

        {/* Section 3: Data Management */}
        <View style={styles.section}>
          <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
            Data & Privacy
          </Text>
          <Card style={{ padding: Spacing.base, gap: Spacing.md }}>
            <View style={styles.dataActionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                  Resume Library
                </Text>
                <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2 }]}>
                  Manage tailored PDF and Word resumes stored in your local library.
                </Text>
              </View>
              <Button
                label="Manage"
                variant="secondary"
                size="sm"
                onPress={() => router.push('/resumes')}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.dataActionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                  Export Backup
                </Text>
                <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2 }]}>
                  Save all applications, interviews, and notes as a portable JSON file.
                </Text>
              </View>
              <Button
                label="Export"
                variant="secondary"
                size="sm"
                loading={exportLoading}
                onPress={handleExportBackup}
                leftIcon={<Download size={14} color={colors.textPrimary} />}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.dataActionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                  Restore Backup
                </Text>
                <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2 }]}>
                  Restore your records from a previously exported backup file.
                </Text>
              </View>
              <Button
                label="Restore"
                variant="outline"
                size="sm"
                loading={importLoading}
                onPress={handleImportBackup}
                leftIcon={<Upload size={14} color={colors.accent} />}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.dataActionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyMedium, { color: colors.error, fontWeight: '600' }]}>
                  Clear All Data
                </Text>
                <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2 }]}>
                  Permanently erase all applications and companies from this device.
                </Text>
              </View>
              <Button
                label="Clear"
                variant="danger"
                size="sm"
                onPress={() => setClearModalVisible(true)}
                leftIcon={<Trash2 size={14} color="#FFFFFF" />}
              />
            </View>
          </Card>
        </View>

        {/* Section 3: About JobPilot */}
        <View style={styles.section}>
          <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
            About JobPilot
          </Text>
          <Card style={{ padding: Spacing.base }}>
            <View style={styles.aboutRow}>
              <ShieldCheck size={20} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                  100% Offline & Private
                </Text>
                <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
                  JobPilot has no backend and makes no cloud network calls. All your job applications, notes, recruiter details, and resumes remain exclusively on your device.
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: Spacing.md }]} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[Typography.secondary, { color: colors.textSecondary }]}>Version</Text>
              <Text style={[Typography.secondaryMedium, { color: colors.textPrimary }]}>1.0.0</Text>
            </View>
          </Card>
        </View>

        {/* Confirm Clear Modal */}
        <ConfirmModal
          visible={clearModalVisible}
          title="Clear all data?"
          message="This action will delete all saved applications, companies, interviews, notes, and reminders. This cannot be undone."
          confirmLabel="Erase Data"
          cancelLabel="Cancel"
          isDestructive
          onConfirm={handleConfirmClear}
          onCancel={() => setClearModalVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.xxl + 20,
  },
  section: {
    marginBottom: Spacing.xl,
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
  dataActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  aboutRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
});
