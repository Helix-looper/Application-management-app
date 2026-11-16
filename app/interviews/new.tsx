import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { X } from 'lucide-react-native';
import dayjs from 'dayjs';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import { createInterview } from '@/database/repositories/interviewRepository';
import { scheduleLocalNotification } from '@/services/notificationService';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { InterviewType } from '@/types';
import { INTERVIEW_TYPE_LABELS } from '@/utils/statusHelpers';

export default function NewInterviewScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { colors } = useTheme();
  const {
    triggerDashboardRefresh,
    triggerApplicationsRefresh,
    triggerCalendarRefresh,
  } = useAppStore();

  const [roundName, setRoundName] = useState('Technical Round');
  const [interviewType, setInterviewType] = useState<InterviewType>('technical');
  const [scheduledDate, setScheduledDate] = useState(
    dayjs().add(2, 'day').format('YYYY-MM-DD')
  );
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [interviewerName, setInterviewerName] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [preparationNotes, setPreparationNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!roundName.trim() || !applicationId) {
      Alert.alert('Validation Error', 'Please specify the interview round name.');
      return;
    }

    setSaving(true);
    try {
      const scheduledDateTime = dayjs(`${scheduledDate}T${scheduledTime}:00`).toISOString();

      await createInterview({
        application_id: applicationId,
        round_name: roundName.trim(),
        interview_type: interviewType,
        scheduled_at: scheduledDateTime,
        duration_minutes: parseInt(durationMinutes, 10) || 45,
        interviewer_name: interviewerName.trim() || undefined,
        meeting_url: meetingUrl.trim() || undefined,
        preparation_notes: preparationNotes.trim() || undefined,
        outcome: 'pending',
      });

      // Schedule local notification 30 minutes before
      const reminderTime = dayjs(scheduledDateTime).subtract(30, 'minute').toDate();
      scheduleLocalNotification(
        `Interview coming up: ${roundName}`,
        `Your interview starts in 30 minutes.`,
        reminderTime
      ).catch(() => {});

      triggerDashboardRefresh();
      triggerApplicationsRefresh();
      triggerCalendarRefresh();

      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to schedule interview');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.sectionHeading, { color: colors.textPrimary }]}>
          Schedule Interview
        </Text>
        <Button
          label="Save"
          size="sm"
          onPress={handleSave}
          loading={saving}
          style={{ minWidth: 68 }}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <Input
              label="Round Name"
              required
              placeholder="e.g. System Design, Final Loop"
              value={roundName}
              onChangeText={setRoundName}
            />

            {/* Interview Type Selector */}
            <Text style={[Typography.secondaryMedium, { color: colors.textPrimary, marginBottom: Spacing.xs }]}>
              Interview Type
            </Text>
            <View style={styles.chipRow}>
              {(Object.keys(INTERVIEW_TYPE_LABELS) as InterviewType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    {
                      borderColor: interviewType === type ? colors.accent : colors.border,
                      backgroundColor: interviewType === type ? colors.surface2 : 'transparent',
                    },
                  ]}
                  onPress={() => setInterviewType(type)}
                >
                  <Text
                    style={[
                      Typography.secondaryMedium,
                      { color: interviewType === type ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    {INTERVIEW_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date & Time */}
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
              <Input
                label="Date (YYYY-MM-DD)"
                value={scheduledDate}
                onChangeText={setScheduledDate}
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="Time (HH:MM)"
                value={scheduledTime}
                onChangeText={setScheduledTime}
                containerStyle={{ flex: 1 }}
              />
            </View>

            <Input
              label="Meeting URL"
              placeholder="Google Meet, Zoom, Teams link..."
              keyboardType="url"
              autoCapitalize="none"
              value={meetingUrl}
              onChangeText={setMeetingUrl}
            />

            <Input
              label="Interviewer Name / Title"
              placeholder="e.g. John Doe (Engineering Manager)"
              value={interviewerName}
              onChangeText={setInterviewerName}
            />

            <Input
              label="Preparation Notes / Questions to ask"
              placeholder="Topics to prepare, STAR stories, salary expectations..."
              multiline
              numberOfLines={4}
              style={{ height: 80, textAlignVertical: 'top', paddingTop: 8 }}
              value={preparationNotes}
              onChangeText={setPreparationNotes}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  card: {
    padding: Spacing.base,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});
