import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from './theme';

export default function GlassCard({ children, style, intensity = 40 }) {
  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.glassBorder,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.03)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  inner: { padding: 20 },
});
