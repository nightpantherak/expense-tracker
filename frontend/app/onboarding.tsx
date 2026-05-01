import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '../src/Icon';
import { theme } from '../src/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  { icon: 'wallet', color: theme.primary, title: 'Track every rupee', desc: 'Log income and expenses in seconds with a beautiful, glass-smooth interface.' },
  { icon: 'chart', color: theme.highlight, title: 'Know where it goes', desc: 'Visualize spending with live pie and bar charts. Spot trends at a glance.' },
  { icon: 'piggy-bank', color: theme.secondary, title: 'Stay on budget', desc: 'Set monthly budgets and get gentle alerts before you overspend.' },
  { icon: 'sparkles', color: '#F59E0B', title: 'Smart insights', desc: 'Personalized tips to save more — no noise, just clarity.' },
];

export default function Onboarding() {
  const [idx, setIdx] = useState(0);
  const listRef = useRef(null);
  const router = useRouter();

  const finish = async () => {
    await AsyncStorage.setItem('onboarding_seen', '1');
    router.replace('/(auth)/login');
  };

  const next = () => {
    if (idx < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: idx + 1, animated: true });
      setIdx(idx + 1);
    } else {
      finish();
    }
  };

  return (
    <View style={styles.container} testID="onboarding-screen">
      <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
      <TouchableOpacity testID="onboarding-skip" onPress={finish} style={styles.skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconBadge, { borderColor: item.color + '80' }]}>
              <LinearGradient colors={[item.color + '30', 'transparent']} style={StyleSheet.absoluteFill} />
              <Icon name={item.icon} color={item.color} size={56} strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity testID="onboarding-next" style={styles.cta} onPress={next} activeOpacity={0.85}>
          <LinearGradient colors={[theme.primary, theme.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaBg} />
          <Text style={styles.ctaText}>{idx === SLIDES.length - 1 ? 'Get Started' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  skip: { position: 'absolute', top: 60, right: 24, zIndex: 10, padding: 8 },
  skipText: { color: theme.textSecondary, fontSize: 14, fontWeight: '600' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconBadge: {
    width: 140, height: 140, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, marginBottom: 40, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)',
  },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, marginBottom: 14 },
  desc: { color: theme.textSecondary, fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 320 },
  footer: { position: 'absolute', bottom: 48, left: 24, right: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24, gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 22, backgroundColor: theme.highlight },
  cta: { height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ctaBg: { ...StyleSheet.absoluteFillObject },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
