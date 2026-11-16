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
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Trash2,
  Bell,
} from 'lucide-react-native';
import dayjs from 'dayjs';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import {
  getAllReminders,
  createReminder,
  toggleReminderComplete,
  snoozeReminder,
  deleteReminder,
} from '@/database/repositories/reminderRepository';
import { scheduleLocalNotification } from '@/services/notificationService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { EmptyState } from '@/components/common/EmptyState';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { Reminder, ReminderType } from '@/types';
import { formatDate, formatTime } from '@/utils/helpers';
import { REMINDER_TYPE_LABELS } from '@/utils/statusHelpers';

export default function RemindersScreen() {
  const { colors } = useTheme();
  const {
    triggerDashboardRefresh,
    triggerCalendarRefresh,
    triggerRemindersRefresh,
    remindersRefreshKey,
  } = useAppStore();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [reminderType, setReminderType] = useState<ReminderType>('hr-followup');
  const [saving, setSaving] = useState(false);

  const loadReminders = useCallback(async () => {
    try {
      const data = await getAllReminders();
      setReminders(data);
    } catch (e) {
      console.warn('Failed to load reminders:', e);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders, remindersRefreshKey]);

  const handleToggle = async (id: string, currentVal: boolean) => {
    await toggleReminderComplete(id, !currentVal);
    triggerDashboardRefresh();
    triggerCalendarRefresh();
    await loadReminders();
  };

  const handleSnooze = async (id: string) => {
    await snoozeReminder(id, 24);
    triggerDashboardRefresh();
    triggerCalendarRefresh();
    await loadReminders();
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
    triggerDashboardRefresh();
    triggerCalendarRefresh();
    await loadReminders();
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a reminder title');
      return;
    }
    setSaving(true);
    try {
      const remindDateTime = dayjs(`${dueDate}T09:00:00`).toISOString();

      const created = await createReminder({
        title: title.trim(),
        reminder_type: reminderType,
        remind_at: remindDateTime,
        notification_enabled: true,
        is_completed: false,
      });

      // Schedule system notification
      scheduleLocalNotification(
        `Job search task: ${title.trim()}`,
        `Due today: ${title.trim()}`,
        new Date(remindDateTime)
      ).catch(() => {});

      setTitle('');
      setShowAddForm(false);
      triggerDashboardRefresh();
      triggerCalendarRefresh();
      await loadReminders();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const pending = reminders.filter((r) => !r.is_completed);
  const completed = reminders.filter((r) => r.is_completed);

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
          Tasks & Follow-ups
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Create Task Form */}
        {showAddForm && (
          <Card style={styles.formCard}>
            <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
              New Task / Reminder
            </Text>
            <Input
              label="Task Title"
              required
              placeholder="e.g. Follow up on Technical Screen"
              value={title}
              onChangeText={setTitle}
            />

            <Input
              label="Due Date (YYYY-MM-DD)"
              value={dueDate}
              onChangeText={setDueDate}
            />

            <View style={styles.formActions}>
              <Button
                label="Cancel"
                variant="secondary"
                size="sm"
                onPress={() => setShowAddForm(false)}
                style={{ flex: 1 }}
              />
              <Button
                label="Save Task"
                size="sm"
                onPress={handleCreate}
                loading={saving}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}

        {/* Pending Tasks */}
        <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
          Pending ({pending.length})
        </Text>

        {pending.length === 0 ? (
          <Card style={{ padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg }}>
            <Bell size={32} color={colors.textSecondary} style={{ marginBottom: Spacing.sm }} />
            <Text style={[Typography.body, { color: colors.textSecondary }]}>
              No pending tasks or follow-ups. You're all caught up!
            </Text>
          </Card>
        ) : (
          pending.map((rem) => {
            const isOverdue = dayjs(rem.remind_at).isBefore(dayjs(), 'day');
            return (
              <Card key={rem.id} style={styles.remCard}>
                <View style={styles.remRow}>
                  <TouchableOpacity
                    onPress={() => handleToggle(rem.id, rem.is_completed)}
                    style={{ padding: 4 }}
                  >
                    <Circle size={22} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                      {rem.title}
                    </Text>
                    <View style={styles.metaRow}>
                      <Clock size={12} color={isOverdue ? colors.error : colors.textSecondary} />
                      <Text
                        style={[
                          Typography.small,
                          { color: isOverdue ? colors.error : colors.textSecondary, fontWeight: isOverdue ? '600' : '400' },
                        ]}
                      >
                        {isOverdue ? 'Overdue · ' : 'Due '}
                        {formatDate(rem.remind_at)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleSnooze(rem.id)}
                    style={[styles.snoozeBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[Typography.small, { color: colors.accent }]}>+1d</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDelete(rem.id)}
                    style={{ padding: 4 }}
                  >
                    <Trash2 size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}

        {/* Completed Tasks */}
        {completed.length > 0 && (
          <View style={{ marginTop: Spacing.lg }}>
            <Text style={[Typography.sectionHeading, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>
              Completed ({completed.length})
            </Text>
            {completed.map((rem) => (
              <Card key={rem.id} style={[styles.remCard, { opacity: 0.7 }]}>
                <View style={styles.remRow}>
                  <TouchableOpacity
                    onPress={() => handleToggle(rem.id, rem.is_completed)}
                    style={{ padding: 4 }}
                  >
                    <CheckCircle2 size={22} color={colors.success} />
                  </TouchableOpacity>
                  <Text
                    style={[
                      Typography.bodyMedium,
                      { color: colors.textSecondary, textDecorationLine: 'line-through', flex: 1 },
                    ]}
                  >
                    {rem.title}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(rem.id)} style={{ padding: 4 }}>
                    <Trash2 size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.xxl + 20,
  },
  formCard: {
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  remCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  remRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  snoozeBtn: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
});
