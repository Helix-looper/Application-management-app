import React from 'react';
import { ApplicationStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/statusHelpers';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { text, bg } = STATUS_COLORS[status];
  const px = size === 'sm' ? '6px 8px' : '4px 10px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: px,
        borderRadius: 6,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.3px',
        color: text,
        background: bg,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
