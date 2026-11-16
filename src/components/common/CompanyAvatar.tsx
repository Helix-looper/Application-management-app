import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getInitials } from '@/utils/helpers';
import { BorderRadius } from '@/theme';

interface CompanyAvatarProps {
  name: string;
  size?: number;
}

const AVATAR_PALETTES: [string, string][] = [
  ['#DDE7DF', '#3C5C45'],
  ['#D9E4EF', '#33587E'],
  ['#EFE5D9', '#78562A'],
  ['#EADEEF', '#5F3978'],
  ['#E8EBE9', '#4E5F54'],
  ['#EFE7E5', '#7D473C'],
];

function getPalette(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

export function CompanyAvatar({ name, size = 40 }: CompanyAvatarProps) {
  const [bg, fg] = getPalette(name || 'Company');
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.38);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          backgroundColor: bg,
        },
      ]}
    >
      <Text style={{ color: fg, fontSize, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
