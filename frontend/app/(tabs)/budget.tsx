import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import GlassCard from '../../src/GlassCard';
import Icon from '../../src/Icon';
import AnimatedProgress from '../../src/AnimatedProgress';
import { theme, fmtMoney } from '../../src/theme';
import { api } from '../../src/api';

export default function Budget() {
  const insets = useSafeAreaInsets();
  const [b, setB] = useState(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const d = await api.getBudget(); setB(d); setAmount(d.amount ? String(d.amount) : ''); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 0) return;
    setBusy(true);
    try { const d = await api.setBudget({ amount: val }); setB(d); } catch {}
    finally { setBusy(false); }
  };

  const percent = Math.min(100, b?.percent || 0);
  const overBudget = b && b.amount > 0 && b.spent > b.amount;
  const near = b && b.amount > 0 && percent >= 80 && !overBudget;

  let statusText = 'Set a monthly budget to track progress';
  let statusColor = theme.textSecondary;
  if (b?.amount > 0) {
    if (overBudget) { statusText = `You’ve exceeded your budget by ${fmtMoney(b.spent - b.amount)}`; statusColor = theme.expense; }
    else if (near) { statusText = `Careful — you’ve used ${percent.toFixed(0)}% of your budget`; statusColor = theme.warning; }
    else { statusText = `${fmtMoney(b.amount - b.spent)} left this month`; statusColor = theme.income; }
  }

  return (
    <View style={styles.container} testID="budget-screen">
      <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20 }}>
        <Text style={styles.h1}>Budget</Text>
        <Text style={styles.sub}>{new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</Text>

        <GlassCard style={{ marginTop: 16 }}>
          <Text style={styles.label}>Monthly budget</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              testID="budget-input"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.textTertiary}
              style={styles.input}
            />
            <TouchableOpacity testID="save-budget-button" onPress={save} disabled={busy} style={styles.saveBtn} activeOpacity={0.85}>
              <LinearGradient colors={[theme.primary, theme.secondary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </GlassCard>

        <GlassCard style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.label}>Spent this month</Text>
            <Text style={styles.amountLg}>{fmtMoney(b?.spent || 0)}</Text>
          </View>
          <View style={{ marginTop: 14 }}>
            <AnimatedProgress
              percent={percent}
              height={12}
              colors={overBudget ? [theme.expense, '#FF6B00'] : near ? [theme.warning, theme.expense] : [theme.highlight, theme.primary]}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={styles.muted}>{percent.toFixed(0)}% used</Text>
            <Text style={styles.muted}>of {fmtMoney(b?.amount || 0)}</Text>
          </View>
          <View style={[styles.alert, { borderColor: statusColor + '66' }]}>
            <Icon name={overBudget ? 'alert-triangle' : near ? 'alert-triangle' : 'check'} color={statusColor} size={16} />
            <Text style={[styles.alertText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  h1: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: theme.textSecondary, marginTop: 2 },
  label: { color: theme.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  currency: { color: theme.textSecondary, fontSize: 22, fontWeight: '700' },
  input: { flex: 1, height: 54, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 14, color: '#fff', fontSize: 20, fontWeight: '700' },
  saveBtn: { height: 54, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  saveText: { color: '#fff', fontWeight: '800' },
  amountLg: { color: '#fff', fontSize: 22, fontWeight: '800' },
  barBg: { height: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, marginTop: 14, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10 },
  muted: { color: theme.textSecondary, fontSize: 12 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 12, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)' },
  alertText: { fontSize: 13, fontWeight: '600', flex: 1 },
});
