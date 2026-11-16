import { getDatabase } from '../database';
import dayjs from 'dayjs';

export interface AnalyticsFilter {
  timeframe: '7d' | '30d' | '90d' | '1y' | 'all';
}

export interface AnalyticsData {
  total: number;
  active: number;
  interviewsCount: number;
  offersCount: number;
  rejectionsCount: number;
  interviewRate: number; // percentage
  offerRate: number;      // percentage
  rejectionRate: number;  // percentage
  byStatus: { status: string; count: number; percentage: number }[];
  bySource: { source: string; count: number }[];
  byWorkArrangement: { arrangement: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
}

export async function getDetailedAnalytics(filter: AnalyticsFilter = { timeframe: 'all' }): Promise<AnalyticsData> {
  const db = await getDatabase();
  
  let dateCondition = '';
  const now = dayjs();
  if (filter.timeframe === '7d') {
    dateCondition = `AND datetime(a.created_at) >= datetime('${now.subtract(7, 'day').toISOString()}')`;
  } else if (filter.timeframe === '30d') {
    dateCondition = `AND datetime(a.created_at) >= datetime('${now.subtract(30, 'day').toISOString()}')`;
  } else if (filter.timeframe === '90d') {
    dateCondition = `AND datetime(a.created_at) >= datetime('${now.subtract(90, 'day').toISOString()}')`;
  } else if (filter.timeframe === '1y') {
    dateCondition = `AND datetime(a.created_at) >= datetime('${now.subtract(1, 'year').toISOString()}')`;
  }

  // 1. Total and status counts
  const statusRows = await db.getAllAsync<{ status: string; count: number }>(
    `SELECT a.status, COUNT(*) as count 
     FROM applications a 
     WHERE 1=1 ${dateCondition} 
     GROUP BY a.status;`
  );

  let total = 0;
  let saved = 0;
  let applied = 0;
  let assessment = 0;
  let interview = 0;
  let offer = 0;
  let rejected = 0;
  let withdrawn = 0;

  for (const r of statusRows) {
    total += r.count;
    if (r.status === 'saved') saved = r.count;
    if (r.status === 'applied') applied = r.count;
    if (r.status === 'assessment') assessment = r.count;
    if (r.status === 'interview') interview = r.count;
    if (r.status === 'offer') offer = r.count;
    if (r.status === 'rejected') rejected = r.count;
    if (r.status === 'withdrawn') withdrawn = r.count;
  }

  // Active applications: applied, assessment, interview
  const active = applied + assessment + interview;

  // Real conversion rates (guarded against division by zero)
  // Non-saved submitted applications
  const submittedTotal = applied + assessment + interview + offer + rejected + withdrawn;
  const interviewRate = submittedTotal > 0 
    ? Math.round(((interview + offer) / submittedTotal) * 100) 
    : 0;
  const offerRate = submittedTotal > 0 
    ? Math.round((offer / submittedTotal) * 100) 
    : 0;
  const rejectionRate = submittedTotal > 0 
    ? Math.round((rejected / submittedTotal) * 100) 
    : 0;

  const byStatus = statusRows.map((r) => ({
    status: r.status,
    count: r.count,
    percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
  }));

  // 2. Source distribution
  const sourceRows = await db.getAllAsync<{ source: string; count: number }>(
    `SELECT COALESCE(NULLIF(a.source, ''), 'Direct / Other') as source, COUNT(*) as count 
     FROM applications a 
     WHERE 1=1 ${dateCondition} 
     GROUP BY source 
     ORDER BY count DESC 
     LIMIT 5;`
  );

  // 3. Work arrangement distribution
  const arrangementRows = await db.getAllAsync<{ arrangement: string; count: number }>(
    `SELECT COALESCE(NULLIF(a.work_arrangement, ''), 'Not specified') as arrangement, COUNT(*) as count 
     FROM applications a 
     WHERE 1=1 ${dateCondition} 
     GROUP BY arrangement 
     ORDER BY count DESC;`
  );

  // 4. Monthly trend (past 6 months)
  const monthlyRows = await db.getAllAsync<{ month: string; count: number }>(
    `SELECT strftime('%Y-%m', a.created_at) as month, COUNT(*) as count 
     FROM applications a 
     WHERE datetime(a.created_at) >= datetime('${now.subtract(6, 'month').startOf('month').toISOString()}') 
     GROUP BY month 
     ORDER BY month ASC;`
  );

  return {
    total,
    active,
    interviewsCount: interview,
    offersCount: offer,
    rejectionsCount: rejected,
    interviewRate,
    offerRate,
    rejectionRate,
    byStatus,
    bySource: sourceRows,
    byWorkArrangement: arrangementRows,
    monthlyTrend: monthlyRows,
  };
}
