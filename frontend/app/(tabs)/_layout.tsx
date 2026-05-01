import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../src/Icon';
import { theme } from '../../src/theme';

function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const items = [
    { name: 'index', label: 'Home', icon: 'home' },
    { name: 'analytics', label: 'Analytics', icon: 'chart' },
    { name: 'budget', label: 'Budget', icon: 'piggy-bank' },
    { name: 'profile', label: 'Profile', icon: 'user' },
  ];
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>
        {items.map((it, i) => {
          const focused = state.index === i;
          return (
            <TouchableOpacity
              key={it.name}
              testID={`tab-${it.name}`}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(it.name)}
            >
              {focused && <View style={styles.activeGlow} />}
              <Icon name={it.icon} color={focused ? theme.highlight : theme.textSecondary} size={22} strokeWidth={focused ? 2.2 : 1.7} />
              <Text style={[styles.label, { color: focused ? theme.highlight : theme.textSecondary }]}>{it.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(7,7,10,0.6)' },
  inner: { flexDirection: 'row', paddingTop: 10 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 4 },
  label: { fontSize: 11, fontWeight: '600' },
  activeGlow: { position: 'absolute', top: 0, width: 36, height: 3, borderRadius: 3, backgroundColor: theme.highlight, shadowColor: theme.highlight, shadowOpacity: 0.8, shadowRadius: 8 },
});
