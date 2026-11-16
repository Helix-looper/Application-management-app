import React, { useState, useEffect } from 'react';
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
import { router } from 'expo-router';
import { X, ChevronDown, ChevronUp, Plus, Building2 } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import { createApplication } from '@/database/repositories/applicationRepository';
import { getOrCreateCompany, getAllCompanies } from '@/database/repositories/companyRepository';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { ApplicationStatus, EmploymentType, WorkArrangement, Company } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from '@/utils/statusHelpers';

export default function NewApplicationScreen() {
  const { colors } = useTheme();
  const { triggerDashboardRefresh, triggerApplicationsRefresh, triggerCompaniesRefresh } = useAppStore();

  // Form state
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('applied');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | null>('full-time');
  const [workArrangement, setWorkArrangement] = useState<WorkArrangement | null>('remote');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPhone, setRecruiterPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Expandable sections
  const [showWorkDetails, setShowWorkDetails] = useState(true);
  const [showCompensation, setShowCompensation] = useState(false);
  const [showRecruiter, setShowRecruiter] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);

  // Autocomplete companies
  const [existingCompanies, setExistingCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ jobTitle?: string; companyName?: string }>({});

  useEffect(() => {
    getAllCompanies().then(setExistingCompanies).catch(() => {});
  }, []);

  const handleCompanyNameChange = (text: string) => {
    setCompanyName(text);
    if (text.trim().length > 0) {
      const matches = existingCompanies.filter((c) =>
        c.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCompanies(matches);
      setShowCompanySuggestions(matches.length > 0);
    } else {
      setShowCompanySuggestions(false);
    }
  };

  const selectSuggestedCompany = (comp: Company) => {
    setCompanyName(comp.name);
    if (comp.location && !location) {
      setLocation(comp.location);
    }
    setShowCompanySuggestions(false);
  };

  const handleSave = async () => {
    const errs: { jobTitle?: string; companyName?: string } = {};
    if (!jobTitle.trim()) {
      errs.jobTitle = 'Job title is required';
    }
    if (!companyName.trim()) {
      errs.companyName = 'Company name is required';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      // 1. Get or create company record
      const company = await getOrCreateCompany(companyName.trim());

      // 2. Parse numbers
      const parsedMin = salaryMin.trim() ? parseFloat(salaryMin) : undefined;
      const parsedMax = salaryMax.trim() ? parseFloat(salaryMax) : undefined;

      // 3. Create application
      const newApp = await createApplication({
        company_id: company.id,
        job_title: jobTitle.trim(),
        status,
        location: location.trim() || undefined,
        employment_type: employmentType || undefined,
        work_arrangement: workArrangement || undefined,
        salary_min: parsedMin,
        salary_max: parsedMax,
        currency,
        job_url: jobUrl.trim() || undefined,
        job_description: jobDescription.trim() || undefined,
        recruiter_name: recruiterName.trim() || undefined,
        recruiter_email: recruiterEmail.trim() || undefined,
        recruiter_phone: recruiterPhone.trim() || undefined,
      });

      triggerDashboardRefresh();
      triggerApplicationsRefresh();
      triggerCompaniesRefresh();

      router.replace(`/applications/${newApp.id}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save application');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <X size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.sectionHeading, { color: colors.textPrimary }]}>
          New Application
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Core Required Info */}
          <Card style={styles.card}>
            <Text style={[Typography.sectionHeading, { color: colors.textPrimary, marginBottom: Spacing.md }]}>
              Opportunity Details
            </Text>

            <Input
              label="Job Title"
              required
              placeholder="e.g. Senior Mobile Engineer"
              value={jobTitle}
              onChangeText={(t) => {
                setJobTitle(t);
                if (errors.jobTitle) setErrors((e) => ({ ...e, jobTitle: undefined }));
              }}
              error={errors.jobTitle}
            />

            <View style={{ position: 'relative' }}>
              <Input
                label="Company Name"
                required
                placeholder="e.g. Acme Corp"
                value={companyName}
                onChangeText={(t) => {
                  handleCompanyNameChange(t);
                  if (errors.companyName) setErrors((e) => ({ ...e, companyName: undefined }));
                }}
                error={errors.companyName}
              />
              {/* Autocomplete Dropdown */}
              {showCompanySuggestions && (
                <View style={[styles.suggestionsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {filteredCompanies.slice(0, 4).map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                      onPress={() => selectSuggestedCompany(c)}
                    >
                      <Building2 size={16} color={colors.accent} />
                      <Text style={[Typography.bodyMedium, { color: colors.textPrimary }]}>
                        {c.name}
                      </Text>
                      {c.location && (
                        <Text style={[Typography.small, { color: colors.textSecondary }]}>
                          ({c.location})
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Status Selector */}
            <View style={{ marginTop: Spacing.xs }}>
              <Text style={[Typography.secondaryMedium, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>
                Initial Status *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xs }}>
                {ALL_STATUSES.map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusSelectChip,
                      {
                        borderColor: status === st ? colors.accent : colors.border,
                        backgroundColor: status === st ? colors.surface2 : 'transparent',
                      },
                    ]}
                    onPress={() => setStatus(st)}
                  >
                    <Text
                      style={[
                        Typography.secondaryMedium,
                        { color: status === st ? colors.accent : colors.textPrimary },
                      ]}
                    >
                      {STATUS_LABELS[st]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Card>

          {/* Section: Work Arrangement & Location */}
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.expandHeader}
              onPress={() => setShowWorkDetails(!showWorkDetails)}
              activeOpacity={0.7}
            >
              <Text style={[Typography.cardTitle, { color: colors.textPrimary }]}>
                Work & Location
              </Text>
              {showWorkDetails ? (
                <ChevronUp size={20} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {showWorkDetails && (
              <View style={{ marginTop: Spacing.md }}>
                <Input
                  label="Location"
                  placeholder="e.g. San Francisco, CA or Remote"
                  value={location}
                  onChangeText={setLocation}
                />

                <Text style={[Typography.secondaryMedium, { color: colors.textPrimary, marginBottom: Spacing.xs }]}>
                  Work Arrangement
                </Text>
                <View style={styles.choiceRow}>
                  {(['remote', 'hybrid', 'on-site'] as WorkArrangement[]).map((arr) => (
                    <TouchableOpacity
                      key={arr}
                      style={[
                        styles.choiceBtn,
                        {
                          borderColor: workArrangement === arr ? colors.accent : colors.border,
                          backgroundColor: workArrangement === arr ? colors.surface2 : 'transparent',
                        },
                      ]}
                      onPress={() => setWorkArrangement(workArrangement === arr ? null : arr)}
                    >
                      <Text
                        style={[
                          Typography.secondaryMedium,
                          { color: workArrangement === arr ? colors.accent : colors.textPrimary },
                        ]}
                      >
                        {arr === 'on-site' ? 'On-site' : arr.charAt(0).toUpperCase() + arr.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text
                  style={[
                    Typography.secondaryMedium,
                    { color: colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.xs },
                  ]}
                >
                  Employment Type
                </Text>
                <View style={styles.choiceRow}>
                  {(['full-time', 'contract', 'part-time', 'internship'] as EmploymentType[]).map((emp) => (
                    <TouchableOpacity
                      key={emp}
                      style={[
                        styles.choiceBtn,
                        {
                          borderColor: employmentType === emp ? colors.accent : colors.border,
                          backgroundColor: employmentType === emp ? colors.surface2 : 'transparent',
                        },
                      ]}
                      onPress={() => setEmploymentType(employmentType === emp ? null : emp)}
                    >
                      <Text
                        style={[
                          Typography.secondaryMedium,
                          { color: employmentType === emp ? colors.accent : colors.textPrimary },
                        ]}
                      >
                        {emp === 'full-time'
                          ? 'Full-time'
                          : emp.charAt(0).toUpperCase() + emp.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Card>

          {/* Section: Compensation */}
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.expandHeader}
              onPress={() => setShowCompensation(!showCompensation)}
              activeOpacity={0.7}
            >
              <Text style={[Typography.cardTitle, { color: colors.textPrimary }]}>
                Compensation
              </Text>
              {showCompensation ? (
                <ChevronUp size={20} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {showCompensation && (
              <View style={{ marginTop: Spacing.md }}>
                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                  <Input
                    label="Salary Min"
                    placeholder="100000"
                    keyboardType="numeric"
                    value={salaryMin}
                    onChangeText={setSalaryMin}
                    containerStyle={{ flex: 1 }}
                  />
                  <Input
                    label="Salary Max"
                    placeholder="140000"
                    keyboardType="numeric"
                    value={salaryMax}
                    onChangeText={setSalaryMax}
                    containerStyle={{ flex: 1 }}
                  />
                </View>
                <Input
                  label="Currency"
                  placeholder="USD"
                  value={currency}
                  onChangeText={setCurrency}
                />
              </View>
            )}
          </Card>

          {/* Section: Recruiter / Contact Details */}
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.expandHeader}
              onPress={() => setShowRecruiter(!showRecruiter)}
              activeOpacity={0.7}
            >
              <Text style={[Typography.cardTitle, { color: colors.textPrimary }]}>
                Recruiter & Contacts
              </Text>
              {showRecruiter ? (
                <ChevronUp size={20} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {showRecruiter && (
              <View style={{ marginTop: Spacing.md }}>
                <Input
                  label="Recruiter Name"
                  placeholder="e.g. Sarah Connor"
                  value={recruiterName}
                  onChangeText={setRecruiterName}
                />
                <Input
                  label="Recruiter Email"
                  placeholder="recruiter@company.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={recruiterEmail}
                  onChangeText={setRecruiterEmail}
                />
                <Input
                  label="Recruiter Phone"
                  placeholder="+1 (555) 000-0000"
                  keyboardType="phone-pad"
                  value={recruiterPhone}
                  onChangeText={setRecruiterPhone}
                />
              </View>
            )}
          </Card>

          {/* Section: Posting Details */}
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.expandHeader}
              onPress={() => setShowJobDetails(!showJobDetails)}
              activeOpacity={0.7}
            >
              <Text style={[Typography.cardTitle, { color: colors.textPrimary }]}>
                Job Description & Links
              </Text>
              {showJobDetails ? (
                <ChevronUp size={20} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {showJobDetails && (
              <View style={{ marginTop: Spacing.md }}>
                <Input
                  label="Job URL"
                  placeholder="https://..."
                  keyboardType="url"
                  autoCapitalize="none"
                  value={jobUrl}
                  onChangeText={setJobUrl}
                />
                <Input
                  label="Job Description"
                  placeholder="Paste requirements, notes or responsibilities..."
                  multiline
                  numberOfLines={4}
                  style={{ height: 90, textAlignVertical: 'top', paddingTop: 10 }}
                  value={jobDescription}
                  onChangeText={setJobDescription}
                />
              </View>
            )}
          </Card>

          <Button
            label="Save Application"
            size="lg"
            onPress={handleSave}
            loading={saving}
            fullWidth
            style={{ marginTop: Spacing.md }}
          />
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
    paddingBottom: Spacing.xxl + 30,
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.base,
  },
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  choiceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  suggestionsBox: {
    position: 'absolute',
    top: 75,
    left: 0,
    right: 0,
    zIndex: 99,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
