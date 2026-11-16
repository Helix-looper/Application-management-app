import { create } from 'zustand';
import { ApplicationStatus, EmploymentType, WorkArrangement } from '@/types';

interface AppState {
  isDbReady: boolean;
  setDbReady: (ready: boolean) => void;

  // Refresh trigger keys
  dashboardRefreshKey: number;
  triggerDashboardRefresh: () => void;
  applicationsRefreshKey: number;
  triggerApplicationsRefresh: () => void;
  calendarRefreshKey: number;
  triggerCalendarRefresh: () => void;
  companiesRefreshKey: number;
  triggerCompaniesRefresh: () => void;
  remindersRefreshKey: number;
  triggerRemindersRefresh: () => void;

  // Application list filters & view
  applicationFilter: ApplicationStatus | null;
  applicationSearch: string;
  applicationSort: 'newest' | 'oldest' | 'company' | 'title' | 'upcoming_interview';
  applicationView: 'list' | 'kanban';
  employmentTypeFilter: EmploymentType | null;
  workArrangementFilter: WorkArrangement | null;

  setApplicationFilter: (filter: ApplicationStatus | null) => void;
  setApplicationSearch: (search: string) => void;
  setApplicationSort: (sort: 'newest' | 'oldest' | 'company' | 'title' | 'upcoming_interview') => void;
  setApplicationView: (view: 'list' | 'kanban') => void;
  setEmploymentTypeFilter: (type: EmploymentType | null) => void;
  setWorkArrangementFilter: (arrangement: WorkArrangement | null) => void;
  resetFilters: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isDbReady: false,
  setDbReady: (ready) => set({ isDbReady: ready }),

  dashboardRefreshKey: 0,
  triggerDashboardRefresh: () =>
    set((s) => ({ dashboardRefreshKey: s.dashboardRefreshKey + 1 })),

  applicationsRefreshKey: 0,
  triggerApplicationsRefresh: () =>
    set((s) => ({ applicationsRefreshKey: s.applicationsRefreshKey + 1 })),

  calendarRefreshKey: 0,
  triggerCalendarRefresh: () =>
    set((s) => ({ calendarRefreshKey: s.calendarRefreshKey + 1 })),

  companiesRefreshKey: 0,
  triggerCompaniesRefresh: () =>
    set((s) => ({ companiesRefreshKey: s.companiesRefreshKey + 1 })),

  remindersRefreshKey: 0,
  triggerRemindersRefresh: () =>
    set((s) => ({ remindersRefreshKey: s.remindersRefreshKey + 1 })),

  applicationFilter: null,
  applicationSearch: '',
  applicationSort: 'newest',
  applicationView: 'list',
  employmentTypeFilter: null,
  workArrangementFilter: null,

  setApplicationFilter: (filter) => set({ applicationFilter: filter }),
  setApplicationSearch: (search) => set({ applicationSearch: search }),
  setApplicationSort: (sort) => set({ applicationSort: sort }),
  setApplicationView: (view) => set({ applicationView: view }),
  setEmploymentTypeFilter: (type) => set({ employmentTypeFilter: type }),
  setWorkArrangementFilter: (arrangement) => set({ workArrangementFilter: arrangement }),
  resetFilters: () =>
    set({
      applicationFilter: null,
      applicationSearch: '',
      applicationSort: 'newest',
      employmentTypeFilter: null,
      workArrangementFilter: null,
    }),
}));
