import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/auth';
import { theme } from '../src/theme';

export default function Splash() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const subFade = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.timing(subFade, { toValue: 1, duration: 700, delay: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [fade, scale, subFade, glow]);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(async () => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        const seen = await AsyncStorage.getItem('onboarding_seen');
        router.replace(seen ? '/(auth)/login' : '/onboarding');
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [loading, user, router]);

  return (
    <View style={styles.container} testID="splash-screen">
      <LinearGradient
        colors={['#07070A', '#0C0C14', '#050508']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.glow, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] }) }]}>
        <LinearGradient
          colors={['rgba(59,130,246,0.45)', 'rgba(139,92,246,0.25)', 'transparent']}
          style={styles.glowInner}
        />
      </Animated.View>

      <Animated.View style={{ opacity: fade, transform: [{ scale }], alignItems: 'center' }}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoN}>N</Text>
        </View>
        <Text style={styles.title}>Expense Tracker</Text>
      </Animated.View>
      <Animated.Text style={[styles.subtitle, { opacity: subFade }]}>by NSIAP Enterprises</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg },
  glow: { position: 'absolute', width: 500, height: 500, alignItems: 'center', justifyContent: 'center' },
  glowInner: { width: '100%', height: '100%', borderRadius: 250 },
  logoBadge: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.4)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    shadowColor: theme.primary, shadowOpacity: 0.6, shadowRadius: 30, shadowOffset: { width: 0, height: 0 },
  },
  logoN: { color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: -2 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: theme.textSecondary, fontSize: 14, marginTop: 12, letterSpacing: 2, textTransform: 'uppercase' },
});
