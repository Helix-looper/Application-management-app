import React, { useEffect, useState } from 'react';
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
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import {
  getApplicationById,
  updateApplication,
} from '@/database/repositories/applicationRepository';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Typography, Spacing } from '@/theme';
import { EmploymentType, WorkArrangement } from '@/types';

export default function EditApplicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { triggerDashboardRefresh, triggerApplicationsRefresh } = useAppStore();

  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPhone, setRecruiterPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getApplicationById(id).then((app) => {
      if (app) {
        setJobTitle(app.job_title);
        setLocation(app.location || '');
        setSalaryMin(app.salary_min ? String(app.salary_min) : '');
        setSalaryMax(app.salary_max ? String(app.salary_max) : '');
        setCurrency(app.currency || 'USD');
        setJobUrl(app.job_url || '');
        setJobDescription(app.job_description || '');
        setRecruiterName(app.recruiter_name || '');
        setRecruiterEmail(app.recruiter_email || '');
        setRecruiterPhone(app.recruiter_phone || '');
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!jobTitle.trim() || !id) return;
    setSaving(true);
    try {
      const minVal = salaryMin.trim() ? parseFloat(salaryMin) : undefined;
      const maxVal = salaryMax.trim() ? parseFloat(salaryMax) : undefined;

      await updateApplication(id, {
        job_title: jobTitle.trim(),
        location: location.trim() || undefined,
        salary_min: minVal,
        salary_max: maxVal,
        currency,
        job_url: jobUrl.trim() || undefined,
        job_description: jobDescription.trim() || undefined,
        recruiter_name: recruiterName.trim() || undefined,
        recruiter_email: recruiterEmail.trim() || undefined,
        recruiter_phone: recruiterPhone.trim() || undefined,
      });

      triggerDashboardRefresh();
      triggerApplicationsRefresh();
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update');
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
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.sectionHeading, { color: colors.textPrimary }]}>
          Edit Application
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
              label="Job Title"
              required
              value={jobTitle}
              onChangeText={setJobTitle}
            />

            <Input
              label="Location"
              value={location}
              onChangeText={setLocation}
            />

            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <Input
                label="Salary Min"
                keyboardType="numeric"
                value={salaryMin}
                onChangeText={setSalaryMin}
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="Salary Max"
                keyboardType="numeric"
                value={salaryMax}
                onChangeText={setSalaryMax}
                containerStyle={{ flex: 1 }}
              />
            </View>

            <Input
              label="Job Posting URL"
              keyboardType="url"
              autoCapitalize="none"
              value={jobUrl}
              onChangeText={setJobUrl}
            />

            <Input
              label="Job Description"
              multiline
              numberOfLines={4}
              style={{ height: 80, textAlignVertical: 'top', paddingTop: 8 }}
              value={jobDescription}
              onChangeText={setJobDescription}
            />

            <Input
              label="Recruiter Name"
              value={recruiterName}
              onChangeText={setRecruiterName}
            />

            <Input
              label="Recruiter Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={recruiterEmail}
              onChangeText={setRecruiterEmail}
            />

            <Input
              label="Recruiter Phone"
              keyboardType="phone-pad"
              value={recruiterPhone}
              onChangeText={setRecruiterPhone}
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
});
