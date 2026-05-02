import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import GlassCard from '../../src/GlassCard';
import { theme } from '../../src/theme';
import { useAuth } from '../../src/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const onSubmit = async () => {
    setErr(''); setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      setErr(e.message || 'Login failed');
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowA} />
      <View style={styles.glowB} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={styles.logoN}>N</Text>
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to NSIAP Expense Tracker</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="login-email-input"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={theme.textTertiary}
            style={styles.input}
          />
          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <TextInput
            testID="login-password-input"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={theme.textTertiary}
            style={styles.input}
          />
          {err ? <Text testID="login-error" style={styles.err}>{err}</Text> : null}

          <TouchableOpacity testID="login-submit-button" onPress={onSubmit} disabled={busy} activeOpacity={0.85} style={styles.cta}>
            <LinearGradient colors={[theme.primary, theme.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Sign In</Text>}
          </TouchableOpacity>
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity testID="go-signup">
              <Text style={styles.link}>Create an account</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <Link href="/(auth)/forgot-password" asChild>
          <TouchableOpacity testID="forgot-password-link" style={{ alignItems: 'center', marginTop: 14 }}>
            <Text style={[styles.link, { fontSize: 13 }]}>Forgot password?</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  glowA: { position: 'absolute', top: -80, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(59,130,246,0.18)' },
  glowB: { position: 'absolute', bottom: -80, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(139,92,246,0.15)' },
  brand: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.4)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  logoN: { color: '#fff', fontSize: 32, fontWeight: '900' },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  sub: { color: theme.textSecondary, fontSize: 15, textAlign: 'center', marginBottom: 24, marginTop: 6 },
  card: { },
  label: { color: theme.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  input: { height: 52, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, color: '#fff', fontSize: 16 },
  err: { color: theme.expense, marginTop: 12, fontSize: 13 },
  cta: { height: 54, borderRadius: 18, marginTop: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: theme.textSecondary },
  link: { color: theme.highlight, fontWeight: '700' },
});
