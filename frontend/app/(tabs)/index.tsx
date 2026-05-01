import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../../src/GlassCard';
import Icon from '../../src/Icon';
import { theme, fmtMoney, CATEGORY_COLORS } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { api } from '../../src/api';

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [summary, t] = await Promise.all([api.analytics(), api.listTransactions({ limit: 5 })]);
      setData(summary); setTxns(t);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const balance = data?.totals?.balance || 0;
  const mIncome = data?.month_totals?.income || 0;
  const mExpense = data?.month_totals?.expense || 0;

  return (
    <View style={styles.container} testID="dashboard-screen">
      <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
      <View style={[styles.glowA]} />
      <View style={[styles.glowB]} />

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 140, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={loading && !data} onRefresh={load} tintColor="#fff" />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Good to see you</Text>
            <Text style={styles.name}>{user?.name || 'Friend'}</Text>
          </View>
        </View>

        <GlassCard style={styles.hero}>
          <Text style={styles.heroLabel}>Total Balance</Text>
          <Text testID="dashboard-balance" style={styles.balance}>{fmtMoney(balance)}</Text>
          <View style={styles.row}>
            <View style={[styles.pill, { borderColor: 'rgba(52,199,89,0.35)' }]}>
              <Icon name="trending-up" color={theme.income} size={14} />
              <Text style={[styles.pillLabel, { color: theme.income }]}>Income</Text>
              <Text style={styles.pillValue}>{fmtMoney(mIncome)}</Text>
            </View>
            <View style={[styles.pill, { borderColor: 'rgba(255,59,48,0.35)' }]}>
              <Icon name="trending-down" color={theme.expense} size={14} />
              <Text style={[styles.pillLabel, { color: theme.expense }]}>Expense</Text>
              <Text style={styles.pillValue}>{fmtMoney(mExpense)}</Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <TouchableOpacity testID="see-all-transactions" onPress={() => router.push('/transactions')}>
            <Text style={styles.link}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading && !txns.length ? (
          <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
        ) : txns.length === 0 ? (
          <GlassCard style={{ alignItems: 'center', paddingVertical: 36 }}>
            <Icon name="wallet" color={theme.textSecondary} size={30} />
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyDesc}>Tap the + button to add your first one</Text>
          </GlassCard>
        ) : (
          txns.map(t => (
            <TouchableOpacity key={t.id} testID={`txn-${t.id}`} activeOpacity={0.7} onPress={() => router.push({ pathname: '/add-transaction', params: { id: t.id } })} style={styles.txn}>
              <View style={[styles.txnIcon, { backgroundColor: (CATEGORY_COLORS[t.category] || theme.primary) + '25' }]}>
                <Icon name={iconFor(t.category)} color={CATEGORY_COLORS[t.category] || theme.primary} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnCat}>{t.category}</Text>
                <Text style={styles.txnNote} numberOfLines={1}>{t.note || new Date(t.date).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.txnAmount, { color: t.type === 'income' ? theme.income : theme.expense }]}>
                {t.type === 'income' ? '+' : '-'}{fmtMoney(t.amount)}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {data?.insights?.length ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 10 }]}>Smart tips</Text>
            {data.insights.map((ins, i) => (
              <GlassCard key={i} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.tipIcon}>
                    <Icon name={ins.icon} color={theme.highlight} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tipTitle}>{ins.title}</Text>
                    <Text style={styles.tipDesc}>{ins.detail}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </>
        ) : null}
      </ScrollView>

      <TouchableOpacity testID="add-transaction-fab" activeOpacity={0.85} style={[styles.fab, { bottom: 100 + insets.bottom }]} onPress={() => router.push('/add-transaction')}>
        <LinearGradient colors={[theme.primary, theme.secondary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <Icon name="plus" color="#fff" size={26} strokeWidth={2.4} />
      </TouchableOpacity>
    </View>
  );
}

function iconFor(cat) {
  const map = { Food: 'utensils', Travel: 'plane', Bills: 'receipt', Shopping: 'shopping-bag', Entertainment: 'film', Others: 'more-horizontal', Salary: 'briefcase', Gift: 'gift' };
  return map[cat] || 'tag';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  glowA: { position: 'absolute', top: -120, right: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(59,130,246,0.18)' },
  glowB: { position: 'absolute', top: 180, left: -100, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(139,92,246,0.10)' },
  header: { marginBottom: 16 },
  hello: { color: theme.textSecondary, fontSize: 13, letterSpacing: 0.5 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
  hero: { marginBottom: 20, borderColor: 'rgba(34,211,238,0.18)' },
  heroLabel: { color: theme.textSecondary, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  balance: { color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: -1, marginTop: 8, textShadowColor: 'rgba(34,211,238,0.4)', textShadowRadius: 18 },
  row: { flexDirection: 'row', marginTop: 18, gap: 10 },
  pill: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  pillLabel: { fontSize: 11, fontWeight: '700', marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  pillValue: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 2 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  link: { color: theme.highlight, fontWeight: '600' },
  txn: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 10 },
  txnIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txnCat: { color: '#fff', fontSize: 15, fontWeight: '700' },
  txnNote: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  txnAmount: { fontSize: 16, fontWeight: '800' },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 10 },
  emptyDesc: { color: theme.textSecondary, fontSize: 13, marginTop: 4 },
  fab: { position: 'absolute', right: 22, width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: theme.primary, shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  tipIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(34,211,238,0.15)', borderWidth: 1, borderColor: 'rgba(34,211,238,0.3)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tipTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tipDesc: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
});
