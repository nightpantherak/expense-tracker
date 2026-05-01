import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../../src/GlassCard';
import Icon from '../../src/Icon';
import { theme } from '../../src/theme';
import { useAuth } from '../../src/auth';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container} testID="profile-screen">
      <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20 }}>
        <Text style={styles.h1}>Profile</Text>

        <GlassCard style={{ marginTop: 16, alignItems: 'center', paddingVertical: 28 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name?.[0] || 'U').toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </GlassCard>

        <GlassCard style={{ marginTop: 14, padding: 0 }}>
          <Row icon="wallet" label="Transactions" onPress={() => router.push('/transactions')} testID="profile-transactions" />
          <Divider />
          <Row icon="chart" label="Analytics" onPress={() => router.push('/(tabs)/analytics')} testID="profile-analytics" />
          <Divider />
          <Row icon="piggy-bank" label="Budget" onPress={() => router.push('/(tabs)/budget')} testID="profile-budget" />
        </GlassCard>

        <TouchableOpacity testID="logout-button" style={styles.logout} onPress={onLogout} activeOpacity={0.8}>
          <Icon name="log-out" color={theme.expense} size={18} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.brand}>NSIAP Enterprises · v1.0</Text>
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, onPress, testID }) {
  return (
    <TouchableOpacity testID={testID} activeOpacity={0.7} onPress={onPress} style={rowStyles.row}>
      <View style={rowStyles.iconWrap}><Icon name={icon} color={theme.highlight} size={18} /></View>
      <Text style={rowStyles.label}>{label}</Text>
      <Icon name="chevron-right" color={theme.textSecondary} size={18} />
    </TouchableOpacity>
  );
}
function Divider() { return <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16 }} />; }

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(34,211,238,0.12)', borderWidth: 1, borderColor: 'rgba(34,211,238,0.25)', marginRight: 12 },
  label: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  h1: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  avatar: { width: 84, height: 84, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59,130,246,0.2)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.4)' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  name: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12 },
  email: { color: theme.textSecondary, marginTop: 4 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,59,48,0.35)', backgroundColor: 'rgba(255,59,48,0.08)' },
  logoutText: { color: theme.expense, fontWeight: '700', fontSize: 15 },
  brand: { color: theme.textTertiary, textAlign: 'center', marginTop: 24, fontSize: 12, letterSpacing: 1.5 },
});
