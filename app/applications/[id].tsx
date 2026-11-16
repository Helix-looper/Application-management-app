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
  Edit2,
  Trash2,
  ExternalLink,
  MapPin,
  Calendar,
  Clock,
  Mail,
  Phone,
  Plus,
  Video,
  CheckCircle2,
  Circle,
  FileText,
} from 'lucide-react-native';
import dayjs from 'dayjs';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import {
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getStatusHistory,
  ApplicationListItem,
} from '@/database/repositories/applicationRepository';
import {
  getInterviewsByApplicationId,
} from '@/database/repositories/interviewRepository';
import {
  getNotesByApplicationId,
  createNote,
  deleteNote,
} from '@/database/repositories/notesRepository';
import {
  getRemindersByApplicationId,
  createReminder,
  toggleReminderComplete,
} from '@/database/repositories/reminderRepository';
import { CompanyAvatar } from '@/components/common/CompanyAvatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Typography, Spacing, BorderRadius } from '@/theme';
import {
  ApplicationStatus,
  Interview,
  ApplicationNote,
  Reminder,
  StatusHistory,
} from '@/types';
import {
  ALL_STATUSES,
  STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_OUTCOME_LABELS,
} from '@/utils/statusHelpers';
import { formatDate, formatDateTime, formatTime, formatSalary } from '@/utils/helpers';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const {
    triggerDashboardRefresh,
    triggerApplicationsRefresh,
    triggerCalendarRefresh,
    triggerCompaniesRefresh,
  } = useAppStore();

  const [app, setApp] = useState<ApplicationListItem | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [notes, setNotes] = useState<ApplicationNote[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);

  const [activeTab, setActiveTab] = useState<'details' | 'interviews' | 'notes' | 'reminders' | 'history'>('details');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // New Note state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // New Reminder state
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [addingReminder, setAddingReminder] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [appData, intData, notesData, remData, histData] = await Promise.all([
        getApplicationById(id),
        getInterviewsByApplicationId(id),
        getNotesByApplicationId(id),
        getRemindersByApplicationId(id),
        getStatusHistory(id),
      ]);
      setApp(appData);
      setInterviews(intData);
      setNotes(notesData);
      setReminders(remData);
      setHistory(histData as any);
    } catch (e) {
      console.warn('Failed to load application details:', e);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!app || app.status === newStatus) return;
    try {
      await updateApplicationStatus(app.id, newStatus, app.status);
      setShowStatusModal(false);
      triggerDashboardRefresh();
      triggerApplicationsRefresh();
      await loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!app) return;
    try {
      await deleteApplication(app.id);
      triggerDashboardRefresh();
      triggerApplicationsRefresh();
      triggerCompaniesRefresh();
      triggerCalendarRefresh();
      setShowDeleteModal(false);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete application');
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !app) return;
    setAddingNote(true);
    try {
      await createNote({
        application_id: app.id,
        company_id: app.company_id,
        title: 'Note',
        content: newNoteContent.trim(),
      });
      setNewNoteContent('');
      await loadData();
    } catch (e) {
      console.warn('Failed to add note:', e);
    } finally {
      setAddingNote(false);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminderTitle.trim() || !app) return;
    setAddingReminder(true);
    try {
      await createReminder({
        application_id: app.id,
        title: newReminderTitle.trim(),
        reminder_type: 'hr-followup',
        remind_at: dayjs().add(3, 'day').toISOString(),
        notification_enabled: true,
        is_completed: false,
      });
      setNewReminderTitle('');
      await loadData();
    } catch (e) {
      console.warn('Failed to add reminder:', e);
    } finally {
      setAddingReminder(false);
    }
  };

  if (!app) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[Typography.body, { color: colors.textSecondary }]}>Loading opportunity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const salaryDisplay = formatSalary(app.salary_min, app.salary_max, app.currency);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => router.push(`/applications/edit/${app.id}`)}
          >
            <Edit2 size={16} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => setShowDeleteModal(true)}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header Card */}
        <Card style={styles.mainCard}>
          <View style={styles.topRow}>
            <CompanyAvatar name={app.company_name} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={[Typography.screenHeading, { color: colors.textPrimary, fontSize: 20 }]}>
                {app.job_title}
              </Text>
              <TouchableOpacity
                onPress={() => router.push(`/companies/${app.company_id}`)}
                activeOpacity={0.7}
              >
                <Text style={[Typography.bodyMedium, { color: colors.accent, fontWeight: '600', marginTop: 2 }]}>
                  {app.company_name}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Status Bar */}
          <View style={styles.statusBar}>
            <TouchableOpacity
              onPress={() => setShowStatusModal(true)}
              style={styles.statusTrigger}
              activeOpacity={0.7}
            >
              <StatusBadge status={app.status} size="md" />
              <Text style={[Typography.smallMedium, { color: colors.accent, marginLeft: Spacing.xs }]}>
                Change status
              </Text>
            </TouchableOpacity>

            <Text style={[Typography.small, { color: colors.textSecondary }]}>
              Applied {formatDate(app.applied_at || app.created_at)}
            </Text>
          </View>
        </Card>

        {/* Navigation Tabs */}
        <View style={styles.tabsRow}>
          {[
            { key: 'details', label: 'Details' },
            { key: 'interviews', label: `Interviews (${interviews.length})` },
            { key: 'notes', label: `Notes (${notes.length})` },
            { key: 'reminders', label: `Tasks (${reminders.length})` },
            { key: 'history', label: 'History' },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tabBtn,
                activeTab === key && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(key as any)}
            >
              <Text
                style={[
                  Typography.secondaryMedium,
                  { color: activeTab === key ? colors.accent : colors.textSecondary },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <View style={styles.tabContent}>
            <Card style={styles.cardSection}>
              <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.md }]}>
                Overview
              </Text>

              <View style={styles.detailRow}>
                <Text style={[Typography.secondary, { color: colors.textSecondary, width: 110 }]}>Location</Text>
                <Text style={[Typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
                  {app.location || 'Not specified'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[Typography.secondary, { color: colors.textSecondary, width: 110 }]}>Work Style</Text>
                <Text style={[Typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
                  {app.work_arrangement ? app.work_arrangement.toUpperCase() : '—'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[Typography.secondary, { color: colors.textSecondary, width: 110 }]}>Employment</Text>
                <Text style={[Typography.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>
                  {app.employment_type || '—'}
                </Text>
              </View>

              {salaryDisplay && (
                <View style={styles.detailRow}>
                  <Text style={[Typography.secondary, { color: colors.textSecondary, width: 110 }]}>Salary</Text>
                  <Text style={[Typography.bodyMedium, { color: colors.textPrimary, flex: 1, fontWeight: '600' }]}>
                    {salaryDisplay}
                  </Text>
                </View>
              )}

              {app.job_url && (
                <View style={styles.detailRow}>
                  <Text style={[Typography.secondary, { color: colors.textSecondary, width: 110 }]}>Posting</Text>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}
                    onPress={() => Linking.openURL(app.job_url!)}
                  >
                    <Text style={[Typography.bodyMedium, { color: colors.accent }]} numberOfLines={1}>
                      Open Link
                    </Text>
                    <ExternalLink size={14} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              )}
            </Card>

            {/* Recruiter Section */}
            {(app.recruiter_name || app.recruiter_email || app.recruiter_phone) && (
              <Card style={styles.cardSection}>
                <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.md }]}>
                  Recruiter Contact
                </Text>
                {app.recruiter_name && (
                  <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                    {app.recruiter_name}
                  </Text>
                )}
                {app.recruiter_email && (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={() => Linking.openURL(`mailto:${app.recruiter_email}`)}
                  >
                    <Mail size={14} color={colors.accent} />
                    <Text style={[Typography.bodyMedium, { color: colors.accent }]}>
                      {app.recruiter_email}
                    </Text>
                  </TouchableOpacity>
                )}
                {app.recruiter_phone && (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={() => Linking.openURL(`tel:${app.recruiter_phone}`)}
                  >
                    <Phone size={14} color={colors.accent} />
                    <Text style={[Typography.bodyMedium, { color: colors.accent }]}>
                      {app.recruiter_phone}
                    </Text>
                  </TouchableOpacity>
                )}
              </Card>
            )}

            {/* Description */}
            {app.job_description && (
              <Card style={styles.cardSection}>
                <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
                  Job Description
                </Text>
                <Text style={[Typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                  {app.job_description}
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Tab 2: Interviews */}
        {activeTab === 'interviews' && (
          <View style={styles.tabContent}>
            <View style={styles.subHeader}>
              <Text style={[Typography.sectionHeading, { color: colors.textPrimary }]}>
                Interview Timeline
              </Text>
              <Button
                label="Add Interview"
                size="sm"
                onPress={() => router.push({ pathname: '/interviews/new', params: { applicationId: app.id } })}
                leftIcon={<Plus size={14} color="#FFF" />}
              />
            </View>

            {interviews.length === 0 ? (
              <Card style={{ padding: Spacing.xl, alignItems: 'center' }}>
                <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
                  No interview rounds scheduled yet.
                </Text>
              </Card>
            ) : (
              interviews.map((item) => (
                <Card key={item.id} style={styles.interviewCard}>
                  <TouchableOpacity
                    onPress={() => router.push(`/interviews/${item.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.interviewHeader}>
                      <View>
                        <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                          {item.round_name}
                        </Text>
                        <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 2 }]}>
                          {INTERVIEW_TYPE_LABELS[item.interview_type]} · {formatDateTime(item.scheduled_at)}
                        </Text>
                      </View>
                      <View style={[styles.outcomeTag, { backgroundColor: colors.surface2 }]}>
                        <Text style={[Typography.smallMedium, { color: colors.textPrimary }]}>
                          {INTERVIEW_OUTCOME_LABELS[item.outcome]}
                        </Text>
                      </View>
                    </View>

                    {item.meeting_url && (
                      <TouchableOpacity
                        style={styles.meetingBtn}
                        onPress={() => Linking.openURL(item.meeting_url!)}
                      >
                        <Video size={14} color={colors.accent} />
                        <Text style={[Typography.secondaryMedium, { color: colors.accent }]}>
                          Join Meeting
                        </Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </Card>
              ))
            )}
          </View>
        )}

        {/* Tab 3: Notes */}
        {activeTab === 'notes' && (
          <View style={styles.tabContent}>
            <Card style={{ padding: Spacing.base, marginBottom: Spacing.md }}>
              <Input
                label="Add quick note"
                placeholder="Conversation notes, questions to ask, salary thoughts..."
                multiline
                numberOfLines={3}
                style={{ height: 70, textAlignVertical: 'top', paddingTop: 8 }}
                value={newNoteContent}
                onChangeText={setNewNoteContent}
              />
              <Button
                label="Save Note"
                size="sm"
                onPress={handleAddNote}
                loading={addingNote}
                disabled={!newNoteContent.trim()}
              />
            </Card>

            {notes.map((n) => (
              <Card key={n.id} style={{ padding: Spacing.base, marginBottom: Spacing.sm }}>
                <Text style={[Typography.body, { color: colors.textPrimary, lineHeight: 22 }]}>
                  {n.content}
                </Text>
                <Text style={[Typography.small, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
                  {formatDateTime(n.created_at)}
                </Text>
              </Card>
            ))}
          </View>
        )}

        {/* Tab 4: Reminders */}
        {activeTab === 'reminders' && (
          <View style={styles.tabContent}>
            <Card style={{ padding: Spacing.base, marginBottom: Spacing.md }}>
              <Input
                label="New Reminder / Follow-up"
                placeholder="e.g. Email recruiter for update"
                value={newReminderTitle}
                onChangeText={setNewReminderTitle}
              />
              <Button
                label="Add Reminder (Due in 3 days)"
                size="sm"
                onPress={handleAddReminder}
                loading={addingReminder}
                disabled={!newReminderTitle.trim()}
              />
            </Card>

            {reminders.map((rem) => (
              <Card key={rem.id} style={{ padding: Spacing.base, marginBottom: Spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <TouchableOpacity
                    onPress={async () => {
                      await toggleReminderComplete(rem.id, !rem.is_completed);
                      await loadData();
                    }}
                  >
                    {rem.is_completed ? (
                      <CheckCircle2 size={22} color={colors.success} />
                    ) : (
                      <Circle size={22} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
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
                    <Text style={[Typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                      Due {formatDate(rem.remind_at)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Tab 5: Status History */}
        {activeTab === 'history' && (
          <View style={styles.tabContent}>
            {history.map((h, i) => (
              <View key={h.id} style={styles.historyRow}>
                <View style={[styles.timelineDot, { backgroundColor: colors.accent }]} />
                {i < history.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                )}
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}>
                    Changed to {STATUS_LABELS[h.new_status]}
                  </Text>
                  <Text style={[Typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                    {formatDateTime(h.changed_at)}
                  </Text>
                  {h.notes && (
                    <Text style={[Typography.secondary, { color: colors.textSecondary, marginTop: 4 }]}>
                      {h.notes}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Status Picker Modal */}
      <ConfirmModal
        visible={showStatusModal}
        title="Update Status"
        message="Select the current stage of this application:"
        confirmLabel="Done"
        cancelLabel="Cancel"
        onConfirm={() => setShowStatusModal(false)}
        onCancel={() => setShowStatusModal(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Application?"
        message={`Are you sure you want to delete ${app.job_title} at ${app.company_name}? This will remove all associated interviews, notes, and reminders.`}
        confirmLabel="Delete"
        cancelLabel="Keep"
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.xxl + 20,
    gap: Spacing.md,
  },
  mainCard: {
    padding: Spacing.base,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E8E2',
  },
  statusTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8E2',
  },
  tabBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  tabContent: {
    gap: Spacing.md,
  },
  cardSection: {
    padding: Spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interviewCard: {
    padding: Spacing.base,
  },
  interviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  outcomeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  meetingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  historyRow: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: Spacing.lg,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 4.5,
    top: 14,
    bottom: 0,
    width: 1,
  },
});
