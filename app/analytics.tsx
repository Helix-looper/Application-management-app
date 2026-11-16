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
import { ArrowLeft, TrendingUp, BarChart2, CheckCircle2, XCircle, Award } from 'lucide-react-native';
import dayjs from 'dayjs';
import { useTheme } from '@/theme/ThemeContext';
import { getDetailedAnalytics, AnalyticsData, AnalyticsFilter } from '@/database/repositories/analyticsRepository';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { ApplicationStatus } from '@/types';
import { STATUS_LABELS } from '@/utils/statusHelpers';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const [timeframe, setTimeframe] = useState<AnalyticsFilter['timeframe']>('all');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await getDetailedAnalytics({ timeframe });
      setData(res);
    } catch (e) {
      console.warn('Failed to load analytics:', e);
    }
  }, [timeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const timeframes: { key: AnalyticsFilter['timeframe']; label: string }[] = [
    { key: '7d', label: '7D' },
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
    { key: '1y', label: '1Y' },
    { key: 'all', label: 'All' },
  ];

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
          Search Analytics
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Timeframe Selector */}
        <View style={styles.timeframeBar}>
          {timeframes.map(({ key, label }) => {
            const isSelected = timeframe === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.timeframeBtn,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setTimeframe(key)}
              >
                <Text
                  style={[
                    Typography.smallMedium,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!data || data.total === 0 ? (
          <Card style={{ padding: Spacing.xl, alignItems: 'center', marginTop: Spacing.xl }}>
            <BarChart2 size={36} color={colors.textSecondary} style={{ marginBottom: Spacing.sm }} />
            <Text style={[Typography.sectionHeading, { color: colors.textPrimary, textAlign: 'center' }]}>
              No Data Yet
            </Text>
            <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }]}>
              Add job applications to view conversion rates, interview trends, and source insights.
            </Text>
          </Card>
        ) : (
          <>
            {/* Conversion Rates Card */}
            <Card style={styles.card}>
              <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.md }]}>
                Conversion Funnel
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.rateBox}>
                  <Text style={[Typography.screenHeading, { color: colors.statusInterview, fontSize: 26 }]}>
                    {data.interviewRate}%
                  </Text>
                  <Text style={[Typography.smallMedium, { color: colors.textSecondary, marginTop: 2 }]}>
                    Interview Rate
                  </Text>
                </View>

                <View style={styles.rateBox}>
                  <Text style={[Typography.screenHeading, { color: colors.statusOffer, fontSize: 26 }]}>
                    {data.offerRate}%
                  </Text>
                  <Text style={[Typography.smallMedium, { color: colors.textSecondary, marginTop: 2 }]}>
                    Offer Rate
                  </Text>
                </View>

                <View style={styles.rateBox}>
                  <Text style={[Typography.screenHeading, { color: colors.statusRejected, fontSize: 26 }]}>
                    {data.rejectionRate}%
                  </Text>
                  <Text style={[Typography.smallMedium, { color: colors.textSecondary, marginTop: 2 }]}>
                    Rejection Rate
                  </Text>
                </View>
              </View>
            </Card>

            {/* Status Breakdown with Bars */}
            <Card style={styles.card}>
              <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.md }]}>
                Status Distribution
              </Text>
              <View style={{ gap: Spacing.md }}>
                {data.byStatus.map((item) => (
                  <View key={item.status}>
                    <View style={styles.statusRowLabel}>
                      <StatusBadge status={item.status as ApplicationStatus} size="sm" />
                      <Text style={[Typography.secondaryMedium, { color: colors.textPrimary }]}>
                        {item.count} ({item.percentage}%)
                      </Text>
                    </View>
                    <View style={[styles.barBackground, { backgroundColor: colors.surface2 }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.max(item.percentage, 4)}%`,
                            backgroundColor: colors.accent,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {/* Monthly Application Volume */}
            {data.monthlyTrend.length > 0 && (
              <Card style={styles.card}>
                <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.md }]}>
                  Monthly Activity
                </Text>
                <View style={styles.monthlyContainer}>
                  {data.monthlyTrend.map((m) => (
                    <View key={m.month} style={styles.monthCol}>
                      <Text style={[Typography.smallMedium, { color: colors.textPrimary, marginBottom: 4 }]}>
                        {m.count}
                      </Text>
                      <View
                        style={[
                          styles.monthBar,
                          {
                            height: Math.min(Math.max(m.count * 15, 12), 90),
                            backgroundColor: colors.accent,
                          },
                        ]}
                      />
                      <Text style={[Typography.small, { color: colors.textSecondary, marginTop: 6 }]}>
                        {dayjs(m.month).format('MMM')}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Application Sources */}
            {data.bySource.length > 0 && (
              <Card style={styles.card}>
                <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.md }]}>
                  Application Sources
                </Text>
                <View style={{ gap: Spacing.sm }}>
                  {data.bySource.map((s) => (
                    <View key={s.source} style={styles.sourceRow}>
                      <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>
                        {s.source}
                      </Text>
                      <Text style={[Typography.secondaryMedium, { color: colors.textSecondary }]}>
                        {s.count} {s.count === 1 ? 'application' : 'applications'}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}
          </>
        )}
      </ScrollView>
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
  timeframeBar: {
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  timeframeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  card: {
    padding: Spacing.base,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateBox: {
    flex: 1,
    alignItems: 'center',
  },
  statusRowLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  monthlyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    paddingTop: 10,
  },
  monthCol: {
    alignItems: 'center',
  },
  monthBar: {
    width: 24,
    borderRadius: 4,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
});
