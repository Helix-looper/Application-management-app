import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Plus,
  List,
  Columns,
  SlidersHorizontal,
  Briefcase,
  MapPin,
  Calendar,
} from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import {
  getAllApplications,
  ApplicationListItem,
} from '@/database/repositories/applicationRepository';
import { CompanyAvatar } from '@/components/common/CompanyAvatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SearchBar } from '@/components/common/SearchBar';
import { FilterChip } from '@/components/common/FilterChip';
import { EmptyState } from '@/components/common/EmptyState';
import { Card } from '@/components/common/Card';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { ApplicationStatus } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from '@/utils/statusHelpers';
import { formatDate } from '@/utils/helpers';

export default function ApplicationsScreen() {
  const { colors } = useTheme();
  const {
    isDbReady,
    applicationFilter,
    setApplicationFilter,
    applicationSearch,
    setApplicationSearch,
    applicationSort,
    setApplicationSort,
    applicationView,
    setApplicationView,
    applicationsRefreshKey,
    resetFilters,
  } = useAppStore();

  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeKanbanStatus, setActiveKanbanStatus] = useState<ApplicationStatus>('applied');

  const loadApplications = useCallback(async () => {
    if (!isDbReady) return;
    try {
      setLoading(true);
      const data = await getAllApplications({
        status: applicationView === 'kanban' ? null : applicationFilter,
        search: applicationSearch,
        sort: applicationSort,
      });
      setApplications(data);
    } catch (e) {
      console.warn('Failed to load applications:', e);
    } finally {
      setLoading(false);
    }
  }, [isDbReady, applicationFilter, applicationSearch, applicationSort, applicationView]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications, applicationsRefreshKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  }, [loadApplications]);

  const countsByStatus = ALL_STATUSES.reduce((acc, st) => {
    acc[st] = applications.filter((a) => a.status === st).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  const kanbanFilteredApps = applications.filter(
    (a) => a.status === activeKanbanStatus
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[Typography.screenHeading, { color: colors.textPrimary }]}>
            Applications
          </Text>
          <Text style={[Typography.secondary, { color: colors.textSecondary }]}>
            {applications.length} total opportunities
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Toggle List / Kanban */}
          <View style={[styles.viewToggle, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.viewToggleBtn,
                applicationView === 'list' && { backgroundColor: colors.surface },
              ]}
              onPress={() => setApplicationView('list')}
              activeOpacity={0.7}
            >
              <List
                size={16}
                color={applicationView === 'list' ? colors.accent : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleBtn,
                applicationView === 'kanban' && { backgroundColor: colors.surface },
              ]}
              onPress={() => setApplicationView('kanban')}
              activeOpacity={0.7}
            >
              <Columns
                size={16}
                color={applicationView === 'kanban' ? colors.accent : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Add Application Button */}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/applications/new')}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={applicationSearch}
          onChangeText={setApplicationSearch}
          placeholder="Search job title, company, location..."
        />
      </View>

      {/* Filter Chips (in List view) */}
      {applicationView === 'list' ? (
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <FilterChip
              label="All"
              selected={applicationFilter === null}
              onPress={() => setApplicationFilter(null)}
              count={applications.length}
            />
            {ALL_STATUSES.map((status) => (
              <FilterChip
                key={status}
                label={STATUS_LABELS[status]}
                selected={applicationFilter === status}
                onPress={() =>
                  setApplicationFilter(applicationFilter === status ? null : status)
                }
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        /* Kanban Stage Selector */
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {ALL_STATUSES.map((status) => {
              const count = countsByStatus[status] || 0;
              return (
                <FilterChip
                  key={status}
                  label={STATUS_LABELS[status]}
                  selected={activeKanbanStatus === status}
                  onPress={() => setActiveKanbanStatus(status)}
                  count={count}
                />
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Content Area */}
      {applicationView === 'list' ? (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Briefcase size={40} color={colors.accent} />}
              title={applicationSearch || applicationFilter ? 'No matching applications' : 'No applications yet'}
              description={
                applicationSearch || applicationFilter
                  ? 'Try clearing your filters or search terms.'
                  : 'Add your first job application to start tracking your search pipeline.'
              }
              actionLabel={applicationSearch || applicationFilter ? 'Clear Filters' : 'Add Application'}
              onAction={
                applicationSearch || applicationFilter
                  ? resetFilters
                  : () => router.push('/applications/new')
              }
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.appCard}>
              <TouchableOpacity
                onPress={() => router.push(`/applications/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <CompanyAvatar name={item.company_name} size={42} />
                  <View style={styles.cardMain}>
                    <Text
                      style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}
                      numberOfLines={1}
                    >
                      {item.job_title}
                    </Text>
                    <Text style={[Typography.secondary, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.company_name}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} size="sm" />
                </View>

                {/* Sub Metadata Row */}
                <View style={styles.cardMetaRow}>
                  {item.location && (
                    <View style={styles.metaItem}>
                      <MapPin size={12} color={colors.textSecondary} />
                      <Text style={[Typography.small, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.location}
                      </Text>
                    </View>
                  )}
                  {item.employment_type && (
                    <View style={[styles.tagBadge, { backgroundColor: colors.surface2 }]}>
                      <Text style={[Typography.small, { color: colors.textSecondary }]}>
                        {item.employment_type}
                      </Text>
                    </View>
                  )}
                  {item.work_arrangement && (
                    <View style={[styles.tagBadge, { backgroundColor: colors.surface2 }]}>
                      <Text style={[Typography.small, { color: colors.textSecondary }]}>
                        {item.work_arrangement}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }} />
                  <Text style={[Typography.small, { color: colors.textSecondary }]}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            </Card>
          )}
        />
      ) : (
        /* Kanban Column Content */
        <FlatList
          data={kanbanFilteredApps}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <EmptyState
              title={`No ${STATUS_LABELS[activeKanbanStatus]} jobs`}
              description={`You don't have any opportunities in the "${STATUS_LABELS[activeKanbanStatus]}" stage.`}
              actionLabel="Add Application"
              onAction={() => router.push('/applications/new')}
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.appCard}>
              <TouchableOpacity
                onPress={() => router.push(`/applications/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <CompanyAvatar name={item.company_name} size={38} />
                  <View style={styles.cardMain}>
                    <Text
                      style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}
                      numberOfLines={1}
                    >
                      {item.job_title}
                    </Text>
                    <Text style={[Typography.secondary, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.company_name}
                    </Text>
                  </View>
                </View>
                {item.location && (
                  <View style={[styles.metaItem, { marginTop: Spacing.sm }]}>
                    <MapPin size={12} color={colors.textSecondary} />
                    <Text style={[Typography.small, { color: colors.textSecondary }]}>
                      {item.location}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Card>
          )}
        />
      )}
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
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 2,
  },
  viewToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.sm,
  },
  filterBar: {
    marginBottom: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.screenPadding,
  },
  listContainer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xxl + 20,
    gap: Spacing.sm,
  },
  appCard: {
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardMain: {
    flex: 1,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E8E2',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
});
