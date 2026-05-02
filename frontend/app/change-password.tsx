import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../src/GlassCard';
import Icon from '../src/Icon';
import { theme } from '../src/theme';
import { api } from '../src/api';

export default function ChangePassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      await api.changePassword({ current_password: current, new_password: next });
      setDone(true);
      setTimeout(() => router.back(), 1200);
    } catch (e) { setErr(e.message || 'Update failed'); }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.container}>
        <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
            <Icon name="x" color="#fff" size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>Change password</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          <GlassCard>
            {done ? (
              <View style={{ alignItems: 'center', paddingVertical: 14 }}>
                <View style={styles.successBadge}>
                  <Icon name="check" color={theme.income} size={26} strokeWidth={2.4} />
                </View>
                <Text style={styles.successTitle}>Password updated</Text>
              </View>
            ) : (
              <>
                <Text style={styles.label}>Current password</Text>
                <TextInput testID="current-password-input" value={current} onChangeText={setCurrent} secureTextEntry placeholder="••••••••" placeholderTextColor={theme.textTertiary} style={styles.input} />
                <Text style={[styles.label, { marginTop: 16 }]}>New password</Text>
                <TextInput testID="new-password-input" value={next} onChangeText={setNext} secureTextEntry placeholder="At least 6 characters" placeholderTextColor={theme.textTertiary} style={styles.input} />
                {err ? <Text style={styles.err}>{err}</Text> : null}
                <TouchableOpacity testID="change-password-submit" onPress={submit} disabled={busy} activeOpacity={0.85} style={styles.cta}>
                  <LinearGradient colors={[theme.primary, theme.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Update password</Text>}
                </TouchableOpacity>
              </>
            )}
          </GlassCard>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  label: { color: theme.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  input: { height: 52, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, color: '#fff', fontSize: 16 },
  err: { color: theme.expense, marginTop: 10, fontSize: 13 },
  cta: { height: 54, borderRadius: 18, marginTop: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successBadge: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(52,199,89,0.15)', borderWidth: 1, borderColor: 'rgba(52,199,89,0.4)', marginBottom: 14 },
  successTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
