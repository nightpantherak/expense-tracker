import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import GlassCard from '../../src/GlassCard';
import { theme } from '../../src/theme';
import { useAuth } from '../../src/auth';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const onSubmit = async () => {
    setErr(''); setBusy(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (e) {
      setErr(e.message || 'Signup failed');
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowA} />
      <View style={styles.glowB} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.sub}>Start tracking in seconds</Text>

        <GlassCard>
          <Text style={styles.label}>Name</Text>
          <TextInput testID="signup-name-input" value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={theme.textTertiary} style={styles.input} />

          <Text style={[styles.label, { marginTop: 16 }]}>Email</Text>
          <TextInput testID="signup-email-input" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={theme.textTertiary} style={styles.input} />

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <TextInput testID="signup-password-input" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" placeholderTextColor={theme.textTertiary} style={styles.input} />

          {err ? <Text testID="signup-error" style={styles.err}>{err}</Text> : null}

          <TouchableOpacity testID="signup-submit-button" onPress={onSubmit} disabled={busy} activeOpacity={0.85} style={styles.cta}>
            <LinearGradient colors={[theme.primary, theme.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Create Account</Text>}
          </TouchableOpacity>
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have one? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity testID="go-login"><Text style={styles.link}>Sign in</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  glowA: { position: 'absolute', top: -80, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(139,92,246,0.18)' },
  glowB: { position: 'absolute', bottom: -80, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(34,211,238,0.12)' },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  sub: { color: theme.textSecondary, fontSize: 15, textAlign: 'center', marginBottom: 24, marginTop: 6 },
  label: { color: theme.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  input: { height: 52, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, color: '#fff', fontSize: 16 },
  err: { color: theme.expense, marginTop: 12, fontSize: 13 },
  cta: { height: 54, borderRadius: 18, marginTop: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: theme.textSecondary },
  link: { color: theme.highlight, fontWeight: '700' },
});
