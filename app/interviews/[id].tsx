import React, { useEffect, useState } from 'react';
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
  Calendar,
  Clock,
  Video,
  User,
  Trash2,
  CheckCircle,
} from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import {
  getInterviewById,
  updateInterview,
  deleteInterview,
  InterviewWithDetails,
} from '@/database/repositories/interviewRepository';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { InterviewOutcome } from '@/types';
import { INTERVIEW_TYPE_LABELS, INTERVIEW_OUTCOME_LABELS } from '@/utils/statusHelpers';
import { formatDateTime } from '@/utils/helpers';

export default function InterviewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const {
    triggerDashboardRefresh,
    triggerApplicationsRefresh,
    triggerCalendarRefresh,
  } = useAppStore();

  const [interview, setInterview] = useState<InterviewWithDetails | null>(null);
  const [feedback, setFeedback] = useState('');
  const [outcome, setOutcome] = useState<InterviewOutcome>('pending');
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    getInterviewById(id).then((data) => {
      if (data) {
        setInterview(data);
        setFeedback(data.feedback || '');
        setOutcome(data.outcome);
      }
    });
  }, [id]);

  const handleSaveFeedback = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateInterview(id, {
        outcome,
        feedback: feedback.trim() || undefined,
      });
      triggerDashboardRefresh();
      triggerCalendarRefresh();
      Alert.alert('Saved', 'Interview details updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update interview');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteInterview(id);
      triggerDashboardRefresh();
      triggerCalendarRefresh();
      setShowDeleteModal(false);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete interview');
    }
  };

  if (!interview) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[Typography.body, { color: colors.textSecondary }]}>Loading interview...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const outcomes: InterviewOutcome[] = ['pending', 'passed', 'failed', 'rescheduled', 'cancelled'];

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
          Interview Details
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
          <Text style={[Typography.screenHeading, { color: colors.textPrimary, fontSize: 20 }]}>
            {interview.round_name}
          </Text>
          <Text style={[Typography.bodyMedium, { color: colors.accent, marginTop: 2 }]}>
            {interview.job_title} · {interview.company_name}
          </Text>

          <View style={[styles.metaRow, { marginTop: Spacing.md }]}>
            <Calendar size={14} color={colors.textSecondary} />
            <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>
              {formatDateTime(interview.scheduled_at)}
            </Text>
          </View>

          {interview.interviewer_name && (
            <View style={styles.metaRow}>
              <User size={14} color={colors.textSecondary} />
              <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>
                {interview.interviewer_name}
              </Text>
            </View>
          )}

          {interview.meeting_url && (
            <TouchableOpacity
              style={[styles.meetingBtn, { backgroundColor: colors.surface2 }]}
              onPress={() => Linking.openURL(interview.meeting_url!)}
            >
              <Video size={16} color={colors.accent} />
              <Text style={[Typography.bodyMedium, { color: colors.accent, fontWeight: '600' }]}>
                Join Video Meeting
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Outcome Selector */}
        <Card style={styles.card}>
          <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
            Round Outcome
          </Text>
          <View style={styles.outcomeRow}>
            {outcomes.map((out) => (
              <TouchableOpacity
                key={out}
                style={[
                  styles.outcomeChip,
                  {
                    borderColor: outcome === out ? colors.accent : colors.border,
                    backgroundColor: outcome === out ? colors.surface2 : 'transparent',
                  },
                ]}
                onPress={() => setOutcome(out)}
              >
                <Text
                  style={[
                    Typography.secondaryMedium,
                    { color: outcome === out ? colors.accent : colors.textPrimary },
                  ]}
                >
                  {INTERVIEW_OUTCOME_LABELS[out]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Prep Notes */}
        {interview.preparation_notes && (
          <Card style={styles.card}>
            <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
              Preparation Notes
            </Text>
            <Text style={[Typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
              {interview.preparation_notes}
            </Text>
          </Card>
        )}

        {/* Post-Interview Feedback */}
        <Card style={styles.card}>
          <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
            Post-Interview Retrospective
          </Text>
          <Input
            label="Feedback & Lessons Learned"
            placeholder="Questions asked, coding problems encountered, what went well..."
            multiline
            numberOfLines={4}
            style={{ height: 90, textAlignVertical: 'top', paddingTop: 8 }}
            value={feedback}
            onChangeText={setFeedback}
          />
          <Button
            label="Save Updates"
            onPress={handleSaveFeedback}
            loading={saving}
            fullWidth
          />
        </Card>
      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Interview?"
        message="Are you sure you want to delete this scheduled interview round?"
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
  scroll: {
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.xxl + 20,
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.base,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs + 2,
  },
  meetingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  outcomeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  outcomeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});
