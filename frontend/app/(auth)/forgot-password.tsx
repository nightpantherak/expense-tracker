import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import GlassCard from '../../src/GlassCard';
import Icon from '../../src/Icon';
import { theme } from '../../src/theme';
import { api } from '../../src/api';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(null); // { token } when demo flow

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      const res = await api.forgotPassword(email.trim());
      // Demo flow: app receives the token and routes user to reset screen
      if (res?.reset_token) {
        setSent({ token: res.reset_token });
      } else {
        setSent({ token: null });
      }
    } catch (e) { setErr(e.message || 'Could not send reset'); }
    finally { setBusy(false); }
  };

  const goReset = () => {
    router.push({ pathname: '/(auth)/reset-password', params: sent?.token ? { token: sent.token } : {} });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowA} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity testID="back-login" onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="x" color="#fff" size={20} />
        </TouchableOpacity>

        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.sub}>Enter your email to receive a reset link</Text>

        <GlassCard>
          {!sent ? (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                testID="forgot-email-input"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={theme.textTertiary}
                style={styles.input}
              />
              {err ? <Text style={styles.err}>{err}</Text> : null}
              <TouchableOpacity testID="forgot-submit-button" onPress={submit} disabled={busy} activeOpacity={0.85} style={styles.cta}>
                <LinearGradient colors={[theme.primary, theme.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Send reset link</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <View style={styles.successBadge}>
                <Icon name="check" color={theme.income} size={26} strokeWidth={2.4} />
              </View>
              <Text style={styles.successTitle}>Reset link ready</Text>
              <Text style={styles.successDesc}>
                If an account exists for that email, a secure reset link is on the way. Tap continue to set a new password.
              </Text>
              <TouchableOpacity testID="continue-reset" onPress={goReset} activeOpacity={0.85} style={[styles.cta, { marginTop: 18, width: '100%' }]}>
                <LinearGradient colors={[theme.primary, theme.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={styles.ctaText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>

        <View style={styles.footer}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity><Text style={styles.link}>Back to sign in</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  glowA: { position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(34,211,238,0.14)' },
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
  successDesc: { color: theme.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
