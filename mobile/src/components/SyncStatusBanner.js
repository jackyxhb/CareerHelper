import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useDataStoreSyncStatus from '../hooks/useDataStoreSyncStatus';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fbbf24',
  },
  info: {
    backgroundColor: '#bfdbfe',
  },
  text: {
    color: '#1f2937',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default function SyncStatusBanner() {
  const { banner } = useDataStoreSyncStatus();

  if (!banner) {
    return null;
  }

  const containerStyles = [
    styles.container,
    banner.type === 'info' ? styles.info : null,
  ];

  return (
    <View style={containerStyles}>
      <Text style={styles.text}>{banner.message}</Text>
    </View>
  );
}
