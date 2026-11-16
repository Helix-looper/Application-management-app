import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Plus,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Circle,
  Video,
  Clock,
  Briefcase,
} from 'lucide-react-native';
import dayjs from 'dayjs';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import {
  getApplicationStats,
  getAllApplications,
  ApplicationListItem,
} from '@/database/repositories/applicationRepository';
import {
  getUpcomingInterviews,
  InterviewWithDetails,
} from '@/database/repositories/interviewRepository';
import {
  getPendingReminders,
  toggleReminderComplete,
} from '@/database/repositories/reminderRepository';
import { CompanyAvatar } from '@/components/common/CompanyAvatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Card } from '@/components/common/Card';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { ApplicationStatus, Reminder } from '@/types';
import { formatDateTime, formatDate, formatTime } from '@/utils/helpers';
import { INTERVIEW_TYPE_LABELS } from '@/utils/statusHelpers';

function getGreeting(): string {
  const hour = dayjs().hour();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { isDbReady, dashboardRefreshKey, triggerApplicationsRefresh } = useAppStore();

  const [stats, setStats] = useState<{
    total: number;
    saved: number;
    applied: number;
    assessment: number;
    interview: number;
    offer: number;
    rejected: number;
    withdrawn: number;
  } | null>(null);

  const [recentApps, setRecentApps] = useState<ApplicationListItem[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewWithDetails[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!isDbReady) return;
    try {
      const [s, apps, interviews, rems] = await Promise.all([
        getApplicationStats(),
        getAllApplications({ sort: 'newest' }),
        getUpcomingInterviews(3),
        getPendingReminders(3),
      ]);
      setStats(s);
      setRecentApps(apps.slice(0, 5));
      setUpcomingInterviews(interviews);
      setReminders(rems);
    } catch (err) {
      console.warn('Dashboard load error:', err);
    }
  }, [isDbReady]);

  useEffect(() => {
    loadData();
  }, [loadData, dashboardRefreshKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleToggleReminder = async (id: string) => {
    await toggleReminderComplete(id, true);
    await loadData();
  };

  const activeCount = stats
    ? stats.applied + stats.assessment + stats.interview
    : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[Typography.screenHeading, { color: colors.textPrimary }]}>
              {getGreeting()}
            </Text>
            <Text
              style={[
                Typography.secondary,
                { color: colors.textSecondary, marginTop: 2 },
              ]}
            >
              Here's your job search overview.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/applications/new')}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {!isDbReady ? (
          <View style={styles.centerContainer}>
            <Text style={[Typography.body, { color: colors.textSecondary }]}>
              Initializing JobPilot...
            </Text>
          </View>
        ) : stats && stats.total === 0 ? (
          <EmptyState
            icon={<Briefcase size={44} color={colors.accent} />}
            title="Start your job search"
            description="Add your first opportunity to organize notes, track interviews, and stay on top of follow-ups. Everything remains private on your device."
            actionLabel="Add Your First Application"
            onAction={() => router.push('/applications/new')}
          />
        ) : (
          <>
            {/* Overview Stats */}
            {stats && (
              <Card style={styles.statsCard}>
                <View style={styles.statCol}>
                  <Text style={[Typography.screenHeading, { color: colors.textPrimary, fontSize: 22 }]}>
                    {stats.total}
                  </Text>
                  <Text style={[Typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                    Total
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statCol}>
                  <Text style={[Typography.screenHeading, { color: colors.statusApplied, fontSize: 22 }]}>
                    {activeCount}
                  </Text>
                  <Text style={[Typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                    Active
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statCol}>
                  <Text style={[Typography.screenHeading, { color: colors.statusInterview, fontSize: 22 }]}>
                    {stats.interview}
                  </Text>
                  <Text style={[Typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                    Interviews
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statCol}>
                  <Text style={[Typography.screenHeading, { color: colors.statusOffer, fontSize: 22 }]}>
                    {stats.offer}
                  </Text>
                  <Text style={[Typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                    Offers
                  </Text>
                </View>
              </Card>
            )}

            {/* Pipeline Distribution Bar */}
            {stats && stats.total > 0 && (
              <View style={styles.section}>
                <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
                  Pipeline
                </Text>
                <Card style={{ padding: Spacing.base }}>
                  <PipelineBar stats={stats} colors={colors} />
                  <View style={styles.legendRow}>
                    {(['saved', 'applied', 'assessment', 'interview', 'offer', 'rejected'] as ApplicationStatus[]).map(
                      (st) => {
                        const count = (stats as any)[st] || 0;
                        if (count === 0) return null;
                        return (
                          <TouchableOpacity
                            key={st}
                            style={styles.legendItem}
                            onPress={() => {
                              useAppStore.getState().setApplicationFilter(st);
                              router.push('/(tabs)/applications');
                            }}
                          >
                            <StatusBadge status={st} size="sm" />
                            <Text style={[Typography.small, { color: colors.textSecondary }]}>
                              {count}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </View>
                </Card>
              </View>
            )}

            {/* Upcoming Interviews */}
            {upcomingInterviews.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[Typography.sectionHeading, { color: colors.textPrimary }]}>
                    Upcoming Interviews
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/calendar')}
                    style={styles.seeAll}
                  >
                    <Text style={[Typography.secondaryMedium, { color: colors.accent }]}>
                      Calendar
                    </Text>
                    <ArrowRight size={14} color={colors.accent} />
                  </TouchableOpacity>
                </View>

                <Card noPadding>
                  {upcomingInterviews.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <TouchableOpacity
                        style={styles.interviewRow}
                        onPress={() => router.push(`/interviews/${item.id}`)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.dateBadge, { backgroundColor: colors.surface2 }]}>
                          <Text style={[Typography.label, { color: colors.accent }]}>
                            {dayjs(item.scheduled_at).format('MMM').toUpperCase()}
                          </Text>
                          <Text style={[Typography.cardTitle, { color: colors.textPrimary }]}>
                            {dayjs(item.scheduled_at).format('D')}
                          </Text>
                        </View>
                        <View style={styles.interviewInfo}>
                          <Text
                            style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}
                            numberOfLines={1}
                          >
                            {item.job_title}
                          </Text>
                          <Text style={[Typography.secondary, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.company_name} · {INTERVIEW_TYPE_LABELS[item.interview_type] || item.round_name}
                          </Text>
                          <View style={styles.timeRow}>
                            <Clock size={12} color={colors.textSecondary} />
                            <Text style={[Typography.small, { color: colors.textSecondary }]}>
                              {formatTime(item.scheduled_at)}
                            </Text>
                            {item.meeting_url && (
                              <View style={styles.inlineTag}>
                                <Video size={11} color={colors.accent} />
                                <Text style={[Typography.small, { color: colors.accent }]}>Link</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                      {index < upcomingInterviews.length - 1 && (
                        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                      )}
                    </React.Fragment>
                  ))}
                </Card>
              </View>
            )}

            {/* Follow-up Reminders */}
            {reminders.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[Typography.sectionHeading, { color: colors.textPrimary }]}>
                    Tasks & Reminders
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/reminders')}
                    style={styles.seeAll}
                  >
                    <Text style={[Typography.secondaryMedium, { color: colors.accent }]}>
                      All tasks
                    </Text>
                    <ArrowRight size={14} color={colors.accent} />
                  </TouchableOpacity>
                </View>

                <Card noPadding>
                  {reminders.map((rem, idx) => (
                    <React.Fragment key={rem.id}>
                      <View style={styles.reminderRow}>
                        <TouchableOpacity
                          onPress={() => handleToggleReminder(rem.id)}
                          style={styles.checkBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Circle size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <View style={styles.reminderInfo}>
                          <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>
                            {rem.title}
                          </Text>
                          <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2 }]}>
                            {rem.company_name ? `${rem.company_name} · ` : ''}Due {formatDate(rem.remind_at)}
                          </Text>
                        </View>
                      </View>
                      {idx < reminders.length - 1 && (
                        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                      )}
                    </React.Fragment>
                  ))}
                </Card>
              </View>
            )}

            {/* Recent Applications */}
            {recentApps.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[Typography.sectionHeading, { color: colors.textPrimary }]}>
                    Recent Applications
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/applications')}
                    style={styles.seeAll}
                  >
                    <Text style={[Typography.secondaryMedium, { color: colors.accent }]}>
                      See all
                    </Text>
                    <ArrowRight size={14} color={colors.accent} />
                  </TouchableOpacity>
                </View>

                <Card noPadding>
                  {recentApps.map((app, index) => (
                    <React.Fragment key={app.id}>
                      <TouchableOpacity
                        style={styles.appRow}
                        onPress={() => router.push(`/applications/${app.id}`)}
                        activeOpacity={0.7}
                      >
                        <CompanyAvatar name={app.company_name} size={38} />
                        <View style={styles.appInfo}>
                          <Text
                            style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}
                            numberOfLines={1}
                          >
                            {app.job_title}
                          </Text>
                          <Text style={[Typography.secondary, { color: colors.textSecondary }]} numberOfLines={1}>
                            {app.company_name}
                            {app.location ? ` · ${app.location}` : ''}
                          </Text>
                        </View>
                        <StatusBadge status={app.status} size="sm" />
                      </TouchableOpacity>
                      {index < recentApps.length - 1 && (
                        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                      )}
                    </React.Fragment>
                  ))}
                </Card>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PipelineBar({ stats, colors }: { stats: any; colors: any }) {
  const total = stats.total;
  if (!total) return null;

  const segments = [
    { status: 'saved', count: stats.saved, color: colors.statusSaved },
    { status: 'applied', count: stats.applied, color: colors.statusApplied },
    { status: 'assessment', count: stats.assessment, color: colors.statusAssessment },
    { status: 'interview', count: stats.interview, color: colors.statusInterview },
    { status: 'offer', count: stats.offer, color: colors.statusOffer },
    { status: 'rejected', count: stats.rejected, color: colors.statusRejected },
  ].filter((s) => s.count > 0);

  return (
    <View style={styles.pipelineBar}>
      {segments.map((seg, i) => (
        <View
          key={seg.status}
          style={{
            flex: seg.count / total,
            backgroundColor: seg.color,
            height: '100%',
            borderTopLeftRadius: i === 0 ? 4 : 0,
            borderBottomLeftRadius: i === 0 ? 4 : 0,
            borderTopRightRadius: i === segments.length - 1 ? 4 : 0,
            borderBottomRightRadius: i === segments.length - 1 ? 4 : 0,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.xxl + 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    paddingTop: 80,
    alignItems: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
    marginBottom: Spacing.lg,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pipelineBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#E5E8E2',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  interviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  dateBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interviewInfo: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  inlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 8,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  checkBtn: {
    padding: 2,
  },
  reminderInfo: {
    flex: 1,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  appInfo: {
    flex: 1,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.base + 40,
  },
});
