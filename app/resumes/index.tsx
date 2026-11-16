import React, { useEffect, useState, useCallback } from 'react';
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
import * as Sharing from 'expo-sharing';
import { ArrowLeft, FileText, Plus, Trash2, Share2, Edit2 } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import {
  getAllResumes,
  importResumeFile,
  renameResume,
  deleteResume,
} from '@/database/repositories/resumeRepository';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { Resume } from '@/types';
import { formatDate, formatFileSize } from '@/utils/helpers';

export default function ResumesScreen() {
  const { colors } = useTheme();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [importing, setImporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Resume | null>(null);

  // Rename modal
  const [renameTarget, setRenameTarget] = useState<Resume | null>(null);
  const [renameText, setRenameText] = useState('');

  const loadResumes = useCallback(async () => {
    try {
      const data = await getAllResumes();
      setResumes(data);
    } catch (e) {
      console.warn('Failed to load resumes:', e);
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const handlePickDocument = async () => {
    setImporting(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        setImporting(false);
        return;
      }

      const asset = res.assets[0];
      await importResumeFile(
        asset.uri,
        asset.name,
        asset.name.replace(/\.[^/.]+$/, ''),
        asset.mimeType || 'application/pdf',
        asset.size || 0
      );

      await loadResumes();
    } catch (e: any) {
      Alert.alert('Import Error', e.message || 'Could not import resume');
    } finally {
      setImporting(false);
    }
  };

  const handleShare = async (filePath: string) => {
    const isAvail = await Sharing.isAvailableAsync();
    if (isAvail) {
      await Sharing.shareAsync(filePath);
    } else {
      Alert.alert('Sharing Unavailable', 'File sharing is not supported on this device.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteResume(deleteTarget.id);
      setDeleteTarget(null);
      await loadResumes();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete resume');
    }
  };

  const handleSaveRename = async () => {
    if (!renameTarget || !renameText.trim()) return;
    try {
      await renameResume(renameTarget.id, renameText.trim());
      setRenameTarget(null);
      await loadResumes();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to rename');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.sectionHeading, { color: colors.textPrimary }]}>
          Resume Library
        </Text>
        <Button
          label="Import"
          size="sm"
          onPress={handlePickDocument}
          loading={importing}
          leftIcon={<Plus size={14} color="#FFF" />}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[Typography.secondary, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>
          Manage tailored resumes to attach directly to your applications. All files remain in local app storage.
        </Text>

        {resumes.length === 0 ? (
          <Card style={{ padding: Spacing.xl, alignItems: 'center', marginTop: Spacing.lg }}>
            <FileText size={38} color={colors.textSecondary} style={{ marginBottom: Spacing.sm }} />
            <Text style={[Typography.sectionHeading, { color: colors.textPrimary, textAlign: 'center' }]}>
              No Resumes Imported
            </Text>
            <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
              Import PDF or Word resume versions to link with specific applications.
            </Text>
            <Button
              label="Import Resume"
              variant="primary"
              size="md"
              onPress={handlePickDocument}
              loading={importing}
              style={{ marginTop: Spacing.lg }}
            />
          </Card>
        ) : (
          resumes.map((r) => (
            <Card key={r.id} style={styles.resumeCard}>
              <View style={styles.resumeRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.surface2 }]}>
                  <FileText size={20} color={colors.accent} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                    {r.name}
                  </Text>
                  <Text style={[Typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                    {r.file_name} · {formatFileSize(r.file_size)}
                  </Text>
                  <Text style={[Typography.small, { color: colors.textSecondary, marginTop: 1 }]}>
                    Added {formatDate(r.created_at)}
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => handleShare(r.local_file_path)}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Share2 size={16} color={colors.accent} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setRenameTarget(r);
                      setRenameText(r.name);
                    }}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Edit2 size={16} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setDeleteTarget(r)}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Rename Dialog */}
      {renameTarget && (
        <ConfirmModal
          visible={true}
          title="Rename Resume"
          message={`Enter a new display name for "${renameTarget.file_name}":`}
          confirmLabel="Rename"
          cancelLabel="Cancel"
          onConfirm={handleSaveRename}
          onCancel={() => setRenameTarget(null)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Resume?"
        message={`Delete "${deleteTarget?.name}"? Any linked applications will detach this file.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  scroll: {
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.xxl + 20,
    gap: Spacing.sm,
  },
  resumeCard: {
    padding: Spacing.base,
  },
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    padding: 6,
  },
});
