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
  Calendar as CalendarIcon,
  Clock,
  Video,
  CheckCircle2,
  Circle,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import dayjs from 'dayjs';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import {
  getAllInterviews,
  InterviewWithDetails,
} from '@/database/repositories/interviewRepository';
import {
  getAllReminders,
  toggleReminderComplete,
} from '@/database/repositories/reminderRepository';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { Reminder } from '@/types';
import { formatTime, formatDate } from '@/utils/helpers';
import { INTERVIEW_TYPE_LABELS } from '@/utils/statusHelpers';

export default function CalendarScreen() {
  const { colors } = useTheme();
  const { isDbReady, calendarRefreshKey } = useAppStore();

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!isDbReady) return;
    try {
      const [allInterviews, allReminders] = await Promise.all([
        getAllInterviews(),
        getAllReminders(),
      ]);
      setInterviews(allInterviews);
      setReminders(allReminders);
    } catch (e) {
      console.warn('Failed to load calendar events:', e);
    }
  }, [isDbReady]);

  useEffect(() => {
    loadData();
  }, [loadData, calendarRefreshKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Selected day items
  const dayInterviews = interviews.filter(
    (i) => dayjs(i.scheduled_at).format('YYYY-MM-DD') === selectedDate
  );

  const dayReminders = reminders.filter(
    (r) => dayjs(r.remind_at).format('YYYY-MM-DD') === selectedDate
  );

  const handleToggleReminder = async (id: string, currentVal: boolean) => {
    await toggleReminderComplete(id, !currentVal);
    await loadData();
  };

  // Calendar dates generation (current month)
  const daysInMonth = currentMonth.daysInMonth();
  const startDayOfWeek = currentMonth.startOf('month').day(); // 0 is Sunday
  const calendarDays: (number | null)[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const hasEventOnDay = (day: number) => {
    const dateStr = currentMonth.date(day).format('YYYY-MM-DD');
    const hasInt = interviews.some(
      (i) => dayjs(i.scheduled_at).format('YYYY-MM-DD') === dateStr
    );
    const hasRem = reminders.some(
      (r) => dayjs(r.remind_at).format('YYYY-MM-DD') === dateStr && !r.is_completed
    );
    return { hasInt, hasRem };
  };

  const isSelected = (day: number) => {
    return currentMonth.date(day).format('YYYY-MM-DD') === selectedDate;
  };

  const isToday = (day: number) => {
    return currentMonth.date(day).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <View>
            <Text style={[Typography.screenHeading, { color: colors.textPrimary }]}>
              Calendar
            </Text>
            <Text style={[Typography.secondary, { color: colors.textSecondary }]}>
              Interviews & deadlines
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/reminders')}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Month Selector Bar */}
        <Card style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <Text style={[Typography.sectionHeading, { color: colors.textPrimary }]}>
              {currentMonth.format('MMMM YYYY')}
            </Text>

            <TouchableOpacity
              onPress={() => setCurrentMonth(currentMonth.add(1, 'month'))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronRight size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekdayRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((wd, i) => (
              <Text
                key={i}
                style={[
                  Typography.smallMedium,
                  { color: colors.textSecondary, width: `${100 / 7}%`, textAlign: 'center' },
                ]}
              >
                {wd}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }
              const selected = isSelected(day);
              const today = isToday(day);
              const { hasInt, hasRem } = hasEventOnDay(day);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    selected && { backgroundColor: colors.accent, borderRadius: BorderRadius.full },
                    today && !selected && { borderWidth: 1, borderColor: colors.accent, borderRadius: BorderRadius.full },
                  ]}
                  onPress={() => setSelectedDate(currentMonth.date(day).format('YYYY-MM-DD'))}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      Typography.secondaryMedium,
                      { color: selected ? '#FFFFFF' : today ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    {day}
                  </Text>
                  {/* Indicators */}
                  <View style={styles.dotRow}>
                    {hasInt && (
                      <View
                        style={[
                          styles.eventDot,
                          { backgroundColor: selected ? '#FFFFFF' : colors.statusInterview },
                        ]}
                      />
                    )}
                    {hasRem && (
                      <View
                        style={[
                          styles.eventDot,
                          { backgroundColor: selected ? '#FFFFFF' : colors.warning },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Selected Date Header */}
        <View style={styles.selectedDayHeader}>
          <Text style={[Typography.sectionHeading, { color: colors.textPrimary }]}>
            {dayjs(selectedDate).format('dddd, MMMM D')}
          </Text>
          <Text style={[Typography.secondary, { color: colors.textSecondary }]}>
            {dayInterviews.length + dayReminders.length} event(s)
          </Text>
        </View>

        {/* Agenda Events for Selected Day */}
        {dayInterviews.length === 0 && dayReminders.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon size={36} color={colors.textSecondary} />}
            title="Nothing scheduled"
            description="You have no interviews or tasks scheduled for this date."
          />
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {/* Interviews */}
            {dayInterviews.map((item) => (
              <Card key={item.id} style={styles.agendaCard}>
                <TouchableOpacity
                  onPress={() => router.push(`/interviews/${item.id}`)}
                  activeOpacity={0.7}
                  style={styles.agendaItem}
                >
                  <View style={[styles.agendaBar, { backgroundColor: colors.statusInterview }]} />
                  <View style={styles.agendaContent}>
                    <Text
                      style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}
                    >
                      {item.job_title} · {item.company_name}
                    </Text>
                    <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2 }]}>
                      {INTERVIEW_TYPE_LABELS[item.interview_type]} · {item.round_name}
                    </Text>
                    <View style={styles.timeTag}>
                      <Clock size={12} color={colors.accent} />
                      <Text style={[Typography.small, { color: colors.accent }]}>
                        {formatTime(item.scheduled_at)}
                      </Text>
                      {item.meeting_url && (
                        <View style={styles.inlineTag}>
                          <Video size={12} color={colors.accent} />
                          <Text style={[Typography.small, { color: colors.accent }]}>Link</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Card>
            ))}

            {/* Reminders */}
            {dayReminders.map((rem) => (
              <Card key={rem.id} style={styles.agendaCard}>
                <View style={styles.agendaItem}>
                  <View style={[styles.agendaBar, { backgroundColor: colors.warning }]} />
                  <TouchableOpacity
                    onPress={() => handleToggleReminder(rem.id, rem.is_completed)}
                    style={{ padding: 4 }}
                  >
                    {rem.is_completed ? (
                      <CheckCircle2 size={20} color={colors.success} />
                    ) : (
                      <Circle size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                  <View style={styles.agendaContent}>
                    <Text
                      style={[
                        Typography.bodyMedium,
                        {
                          color: rem.is_completed ? colors.textSecondary : colors.textPrimary,
                          textDecorationLine: rem.is_completed ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {rem.title}
                    </Text>
                    {rem.company_name && (
                      <Text style={[Typography.secondary, { color: colors.textSecondary }]}>
                        {rem.company_name}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCard: {
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 1,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    position: 'absolute',
    bottom: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  agendaCard: {
    padding: Spacing.md,
  },
  agendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  agendaBar: {
    width: 4,
    height: 38,
    borderRadius: 2,
  },
  agendaContent: {
    flex: 1,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  inlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 10,
  },
});
