import React from 'react';
import { getInitials } from '@/lib/helpers';

interface CompanyAvatarProps {
  name: string;
  size?: number;
}

const PALETTE = [
  '#54745D', '#4F84B8', '#B57C36', '#B84F4F', '#7D5FA0',
  '#388E8E', '#B07D55', '#6B7CA4', '#5D8A77', '#A05070',
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function CompanyAvatar({ name, size = 36 }: CompanyAvatarProps) {
  const bg = colorForName(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: size * 0.36,
        fontWeight: 700,
        letterSpacing: '0.5px',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {getInitials(name)}
    </div>
  );
}
