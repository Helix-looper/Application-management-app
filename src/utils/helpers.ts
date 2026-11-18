import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';

dayjs.extend(relativeTime);
dayjs.extend(calendar);

// RFC4122 v4 UUID generator (pure JS, safe on React Native Android without crypto polyfill)
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function formatDate(date: string | Date | null | undefined, format = 'MMM D, YYYY'): string {
  if (!date) return '—';
  return dayjs(date).format(format);
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('h:mm A');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('MMM D, YYYY · h:mm A');
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).fromNow();
}

export function formatSalary(
  min?: number | null,
  max?: number | null,
  currency = 'INR'
): string | null {
  if (!min && !max) return null;
  const sym = getCurrencySymbol(currency);
  const fmt = (n: number) => {
    if (currency === 'INR' && n >= 100000) {
      const l = n / 100000;
      return `${l % 1 === 0 ? l : l.toFixed(1)}L`;
    }
    return n.toLocaleString();
  };
  if (min && max) {
    if (min === max) return `${sym}${fmt(min)}`;
    return `${sym}${fmt(min)} - ${sym}${fmt(max)}`;
  }
  if (min) return `From ${sym}${fmt(min)}`;
  if (max) return `Up to ${sym}${fmt(max)}`;
  return null;
}

export function getCurrencySymbol(currency = 'INR'): string {
  switch (currency.toUpperCase()) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'INR':
      return '₹';
    case 'CAD':
      return 'CA$';
    case 'AUD':
      return 'AU$';
    default:
      return `${currency} `;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getInitials(name: string): string {
  if (!name) return '??';
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
