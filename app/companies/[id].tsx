import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Globe,
  MapPin,
  ExternalLink,
  Plus,
  Trash2,
  Briefcase,
} from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import {
  getCompanyById,
  deleteCompany,
} from '@/database/repositories/companyRepository';
import {
  getApplicationsByCompanyId,
  ApplicationListItem,
} from '@/database/repositories/applicationRepository';
import { CompanyAvatar } from '@/components/common/CompanyAvatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { Company } from '@/types';
import { formatDate } from '@/utils/helpers';

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const {
    triggerCompaniesRefresh,
    triggerApplicationsRefresh,
    triggerDashboardRefresh,
  } = useAppStore();

  const [company, setCompany] = useState<Company | null>(null);
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [comp, apps] = await Promise.all([
        getCompanyById(id),
        getApplicationsByCompanyId(id),
      ]);
      setCompany(comp);
      setApplications(apps);
    } catch (e) {
      console.warn('Failed to load company details:', e);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!company) return;
    try {
      const res = await deleteCompany(company.id);
      if (res.success) {
        triggerCompaniesRefresh();
        setShowDeleteModal(false);
        router.back();
      } else {
        Alert.alert('Cannot Delete', res.reason || 'Could not delete company.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete');
    }
  };

  if (!company) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[Typography.body, { color: colors.textSecondary }]}>Loading company...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          Company Profile
        </Text>
        <TouchableOpacity
          onPress={() => setShowDeleteModal(true)}
          style={{ padding: 4 }}
        >
          <Trash2 size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <View style={styles.profileHeader}>
            <CompanyAvatar name={company.name} size={54} />
            <View style={{ flex: 1 }}>
              <Text style={[Typography.screenHeading, { color: colors.textPrimary, fontSize: 22 }]}>
                {company.name}
              </Text>
              {company.industry && (
                <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2 }]}>
                  {company.industry}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.metaRow}>
            {company.location && (
              <View style={styles.inlineItem}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>
                  {company.location}
                </Text>
              </View>
            )}
            {company.website && (
              <TouchableOpacity
                style={styles.inlineItem}
                onPress={() => Linking.openURL(company.website!)}
              >
                <Globe size={14} color={colors.accent} />
                <Text style={[Typography.bodyMedium, { color: colors.accent }]}>
                  Website
                </Text>
                <ExternalLink size={12} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>

          {company.notes && (
            <View style={{ marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={[Typography.secondaryMedium, { color: colors.textPrimary, marginBottom: 4 }]}>
                Research & Notes
              </Text>
              <Text style={[Typography.body, { color: colors.textSecondary, lineHeight: 20 }]}>
                {company.notes}
              </Text>
            </View>
          )}
        </Card>

        {/* Linked Applications */}
        <View style={styles.sectionHeader}>
          <Text style={[Typography.sectionHeading, { color: colors.textPrimary }]}>
            Applications ({applications.length})
          </Text>
          <TouchableOpacity
            style={styles.addAppBtn}
            onPress={() => router.push('/applications/new')}
          >
            <Plus size={16} color={colors.accent} />
            <Text style={[Typography.secondaryMedium, { color: colors.accent }]}>
              Add Application
            </Text>
          </TouchableOpacity>
        </View>

        {applications.length === 0 ? (
          <Card style={{ padding: Spacing.xl, alignItems: 'center' }}>
            <Briefcase size={32} color={colors.textSecondary} style={{ marginBottom: Spacing.sm }} />
            <Text style={[Typography.body, { color: colors.textSecondary }]}>
              No opportunities linked to this company yet.
            </Text>
          </Card>
        ) : (
          applications.map((app) => (
            <Card key={app.id} style={{ marginBottom: Spacing.sm, padding: Spacing.md }}>
              <TouchableOpacity
                onPress={() => router.push(`/applications/${app.id}`)}
                style={styles.appRow}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                    {app.job_title}
                  </Text>
                  <Text style={[Typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                    Added {formatDate(app.created_at)}
                  </Text>
                </View>
                <StatusBadge status={app.status} size="sm" />
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Company?"
        message={`Delete "${company.name}"? Only companies without linked applications can be removed.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
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
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.base,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  inlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
