import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import GlassCard from '../../src/GlassCard';
import Icon from '../../src/Icon';
import { theme } from '../../src/theme';
import { api } from '../../src/api';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [token, setToken] = useState(typeof params.token === 'string' ? params.token : '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      await api.resetPassword({ token, password });
      setDone(true);
    } catch (e) { setErr(e.message || 'Reset failed'); }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="x" color="#fff" size={20} />
        </TouchableOpacity>

        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.sub}>{done ? 'All done — sign in with your new password' : 'Enter your reset code and new password'}</Text>

        <GlassCard>
          {done ? (
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <View style={styles.successBadge}>
                <Icon name="check" color={theme.income} size={26} strokeWidth={2.4} />
              </View>
              <Text style={styles.successTitle}>Password updated</Text>
              <TouchableOpacity testID="reset-go-login" onPress={() => router.replace('/(auth)/login')} activeOpacity={0.85} style={[styles.cta, { marginTop: 18, width: '100%' }]}>
                <LinearGradient colors={[theme.primary, theme.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={styles.ctaText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Reset code</Text>
              <TextInput
                testID="reset-token-input"
                value={token}
                onChangeText={setToken}
                placeholder="Paste your reset code"
                placeholderTextColor={theme.textTertiary}
                style={styles.input}
                autoCapitalize="none"
              />
              <Text style={[styles.label, { marginTop: 14 }]}>New password</Text>
              <TextInput
                testID="reset-password-input"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="At least 6 characters"
                placeholderTextColor={theme.textTertiary}
                style={styles.input}
              />
              {err ? <Text style={styles.err}>{err}</Text> : null}
              <TouchableOpacity testID="reset-submit-button" onPress={submit} disabled={busy} activeOpacity={0.85} style={styles.cta}>
                <LinearGradient colors={[theme.primary, theme.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Update password</Text>}
              </TouchableOpacity>
            </>
          )}
        </GlassCard>

        {!done ? (
          <View style={styles.footer}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity><Text style={styles.link}>Back to sign in</Text></TouchableOpacity>
            </Link>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  backBtn: { position: 'absolute', top: 60, left: 24, width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  sub: { color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 22, marginTop: 6 },
  label: { color: theme.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  input: { height: 52, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, color: '#fff', fontSize: 16 },
  err: { color: theme.expense, marginTop: 10, fontSize: 13 },
  cta: { height: 54, borderRadius: 18, marginTop: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  footer: { alignItems: 'center', marginTop: 22 },
  link: { color: theme.highlight, fontWeight: '700' },
  successBadge: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(52,199,89,0.15)', borderWidth: 1, borderColor: 'rgba(52,199,89,0.4)', marginBottom: 14 },
  successTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
