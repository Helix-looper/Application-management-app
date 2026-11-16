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
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import { createCompany } from '@/database/repositories/companyRepository';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Typography, Spacing } from '@/theme';

export default function NewCompanyScreen() {
  const { colors } = useTheme();
  const { triggerCompaniesRefresh } = useAppStore();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('Company name is required');
      return;
    }

    setSaving(true);
    try {
      await createCompany({
        name: name.trim(),
        industry: industry.trim() || undefined,
        location: location.trim() || undefined,
        website: website.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      triggerCompaniesRefresh();
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create company');
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
          New Company
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
              label="Company Name"
              required
              placeholder="e.g. Google, Stripe, Notion"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (nameError) setNameError(undefined);
              }}
              error={nameError}
            />

            <Input
              label="Industry / Domain"
              placeholder="e.g. Fintech, AI, Healthcare"
              value={industry}
              onChangeText={setIndustry}
            />

            <Input
              label="Headquarters / Location"
              placeholder="e.g. San Francisco, Remote"
              value={location}
              onChangeText={setLocation}
            />

            <Input
              label="Website"
              placeholder="https://company.com"
              keyboardType="url"
              autoCapitalize="none"
              value={website}
              onChangeText={setWebsite}
            />

            <Input
              label="LinkedIn URL"
              placeholder="https://linkedin.com/company/..."
              keyboardType="url"
              autoCapitalize="none"
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
            />

            <Input
              label="Company Research & Notes"
              placeholder="Culture, tech stack, funding, target salaries..."
              multiline
              numberOfLines={4}
              style={{ height: 80, textAlignVertical: 'top', paddingTop: 8 }}
              value={notes}
              onChangeText={setNotes}
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
