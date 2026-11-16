import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Building2, MapPin, Globe, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAppStore } from '@/store/appStore';
import { getAllCompanies, searchCompanies } from '@/database/repositories/companyRepository';
import { CompanyAvatar } from '@/components/common/CompanyAvatar';
import { SearchBar } from '@/components/common/SearchBar';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Typography, Spacing } from '@/theme';
import { Company } from '@/types';

export default function CompaniesScreen() {
  const { colors } = useTheme();
  const { isDbReady, companiesRefreshKey } = useAppStore();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadCompanies = useCallback(async () => {
    if (!isDbReady) return;
    try {
      if (search.trim()) {
        const res = await searchCompanies(search.trim());
        setCompanies(res);
      } else {
        const res = await getAllCompanies();
        setCompanies(res);
      }
    } catch (e) {
      console.warn('Failed to load companies:', e);
    }
  }, [isDbReady, search]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies, companiesRefreshKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCompanies();
    setRefreshing(false);
  }, [loadCompanies]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[Typography.screenHeading, { color: colors.textPrimary }]}>
            Companies
          </Text>
          <Text style={[Typography.secondary, { color: colors.textSecondary }]}>
            {companies.length} tracked companies
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/companies/new')}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search companies by name..."
        />
      </View>

      <FlatList
        data={companies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Building2 size={40} color={colors.accent} />}
            title={search ? 'No matching companies' : 'No companies added yet'}
            description={
              search
                ? `No company matching "${search}".`
                : 'Companies you apply to will appear here, or you can add one proactively.'
            }
            actionLabel={search ? undefined : 'Add Company'}
            onAction={search ? undefined : () => router.push('/companies/new')}
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.companyCard}>
            <TouchableOpacity
              style={styles.companyRow}
              onPress={() => router.push(`/companies/${item.id}`)}
              activeOpacity={0.7}
            >
              <CompanyAvatar name={item.name} size={44} />
              <View style={styles.companyInfo}>
                <Text
                  style={[Typography.bodyMedium, { color: colors.textPrimary, fontWeight: '600' }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <View style={styles.metaRow}>
                  {item.industry ? (
                    <Text style={[Typography.secondary, { color: colors.textSecondary }]}>
                      {item.industry}
                    </Text>
                  ) : null}
                  {item.location ? (
                    <View style={styles.inlineMeta}>
                      <MapPin size={11} color={colors.textSecondary} />
                      <Text style={[Typography.small, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.location}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <ChevronRight size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </Card>
        )}
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
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
  },
  listContainer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xxl + 20,
    gap: Spacing.sm,
  },
  companyCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  companyInfo: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  inlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
