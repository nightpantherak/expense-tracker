import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../../src/GlassCard';
import Icon from '../../src/Icon';
import AnimatedProgress from '../../src/AnimatedProgress';
import { theme, fmtMoney, CATEGORY_COLORS } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { api } from '../../src/api';

const ICON_FOR = { Food: 'utensils', Travel: 'plane', Bills: 'receipt', Shopping: 'shopping-bag', Entertainment: 'film', Others: 'more-horizontal', Salary: 'briefcase', Gift: 'gift' };

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [savings, setSavings] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // today/week/month
  const [goalModal, setGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const load = useCallback(async () => {
    try {
      const [summary, t, sav] = await Promise.all([
        api.analytics({ period }),
        api.listTransactions({ limit: 5 }),
        api.getSavings(),
      ]);
      setData(summary); setTxns(t); setSavings(sav);
    } catch {} finally { setLoading(false); }
  }, [period]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const balance = data?.totals?.balance || 0;
  const pIncome = data?.month_totals?.income || 0;
  const pExpense = data?.month_totals?.expense || 0;
  const top = data?.top_category;
  const budget = data?.budget;

  const openGoal = () => { setGoalInput(savings?.goal ? String(savings.goal) : ''); setGoalModal(true); };
  const saveGoal = async () => {
    const v = parseFloat(goalInput);
    if (isNaN(v) || v < 0) return;
    setSavingGoal(true);
    try { const s = await api.setSavings({ amount: v }); setSavings(s); setGoalModal(false); }
    catch {} finally { setSavingGoal(false); }
  };

  return (
    <View style={styles.container} testID="dashboard-screen">
      <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowA} />
      <View style={styles.glowB} />

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 140, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={loading && !data} onRefresh={load} tintColor="#fff" />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Good to see you</Text>
            <Text style={styles.name}>{user?.name || 'Friend'}</Text>
          </View>
          <TouchableOpacity testID="header-profile" onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name?.[0] || 'U').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.seg}>
          {['today', 'week', 'month'].map(p => (
            <TouchableOpacity key={p} testID={`period-${p}`} onPress={() => setPeriod(p)} style={[styles.segItem, period === p && styles.segItemActive]}>
              <Text style={[styles.segText, period === p && { color: '#fff' }]}>{p[0].toUpperCase() + p.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <GlassCard style={[styles.hero, disciplineOn && anyOver && styles.heroDanger]}>
          <Text style={styles.heroLabel}>Total Balance</Text>
          <Text testID="dashboard-balance" style={styles.balance}>{fmtMoney(balance)}</Text>
          <View style={styles.row}>
            <View style={[styles.pill, { borderColor: 'rgba(52,199,89,0.35)' }]}>
              <Icon name="trending-up" color={theme.income} size={14} />
              <Text style={[styles.pillLabel, { color: theme.income }]}>Income</Text>
              <Text style={styles.pillValue}>{fmtMoney(pIncome)}</Text>
            </View>
            <View style={[styles.pill, { borderColor: 'rgba(255,59,48,0.35)' }]}>
              <Icon name="trending-down" color={theme.expense} size={14} />
              <Text style={[styles.pillLabel, { color: theme.expense }]}>Spent</Text>
              <Text style={styles.pillValue}>{fmtMoney(pExpense)}</Text>
            </View>
          </View>
        </GlassCard>

        {warning ? (
          <View testID={`warning-${warning.tone}`} style={[styles.warnBanner, warning.tone === 'danger' ? styles.warnDanger : styles.warnAmber]}>
            <Icon name="alert-triangle" color={warning.tone === 'danger' ? theme.expense : theme.warning} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warnTitle}>{warning.title}</Text>
              <Text style={styles.warnDetail}>{warning.detail}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.miniRow}>
          <GlassCard style={styles.miniCard}>
            <View style={styles.miniHeader}>
              <Text style={styles.flame}>🔥</Text>
              <Text style={styles.miniLabel}>Logging streak</Text>
            </View>
            <Text style={styles.miniValue} testID="streak-log">{streaks?.log_streak ?? 0}</Text>
            <Text style={styles.miniSub}>days in a row</Text>
          </GlassCard>
          <GlassCard style={styles.miniCard}>
            <View style={styles.miniHeader}>
              <Text style={styles.flame}>🎯</Text>
              <Text style={styles.miniLabel}>Budget streak</Text>
            </View>
            <Text style={styles.miniValue} testID="streak-budget">{streaks?.budget_streak_possible ? (streaks?.budget_streak ?? 0) : '—'}</Text>
            <Text style={styles.miniSub}>{streaks?.budget_streak_possible ? 'days within budget' : 'set a budget to start'}</Text>
          </GlassCard>
        </View>

        <View style={styles.miniRow}>
          <GlassCard style={styles.miniCard}>
            <View style={styles.miniHeader}>
              <Icon name="wallet" color={theme.highlight} size={16} />
              <Text style={styles.miniLabel}>Remaining</Text>
            </View>
            <Text style={styles.miniValue} testID="dashboard-remaining">{fmtMoney(budget?.remaining || 0)}</Text>
            <Text style={styles.miniSub}>of {fmtMoney(budget?.amount || 0)}</Text>
          </GlassCard>
          <GlassCard style={styles.miniCard}>
            <View style={styles.miniHeader}>
              <Icon name="trending-up" color={theme.secondary} size={16} />
              <Text style={styles.miniLabel}>Top spending</Text>
            </View>
            {top ? (
              <>
                <Text style={[styles.miniValue, { color: CATEGORY_COLORS[top.name] || '#fff' }]} testID="dashboard-top-cat">{top.name}</Text>
                <Text style={styles.miniSub}>{fmtMoney(top.amount)}</Text>
              </>
            ) : (
              <Text style={styles.miniSub}>No expenses yet</Text>
            )}
          </GlassCard>
        </View>

        <GlassCard style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.savingsIcon}><Icon name="piggy-bank" color={theme.highlight} size={18} /></View>
              <View>
                <Text style={styles.cardTitle}>Savings goal</Text>
                <Text style={styles.muted}>{new Date().toLocaleString('en-IN', { month: 'long' })}</Text>
              </View>
            </View>
            <TouchableOpacity testID="set-savings-goal" onPress={openGoal} style={styles.editBtn}>
              <Icon name="pencil" color="#fff" size={14} />
            </TouchableOpacity>
          </View>

          {savings?.goal > 0 ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, alignItems: 'baseline' }}>
                <Text style={styles.savedAmount} testID="savings-saved">{fmtMoney(savings.saved)}</Text>
                <Text style={styles.muted}>of {fmtMoney(savings.goal)}</Text>
              </View>
              <View style={{ marginTop: 10 }}>
                <AnimatedProgress percent={savings.percent} colors={savings.status === 'achieved' ? [theme.income, '#0EA5E9'] : savings.status === 'behind' ? [theme.warning, theme.expense] : [theme.highlight, theme.primary]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={styles.muted}>{savings.percent.toFixed(0)}% complete</Text>
                <Text style={[styles.muted, { color: savings.status === 'behind' ? theme.warning : savings.status === 'achieved' ? theme.income : theme.textSecondary }]}>
                  {savings.message}
                </Text>
              </View>
            </>
          ) : (
            <TouchableOpacity testID="add-savings-goal-cta" onPress={openGoal} style={styles.goalCta} activeOpacity={0.85}>
              <Icon name="plus" color={theme.highlight} size={16} />
              <Text style={{ color: theme.highlight, fontWeight: '700' }}>Set a savings goal</Text>
            </TouchableOpacity>
          )}
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
                <Icon name={ICON_FOR[t.category] || 'tag'} color={CATEGORY_COLORS[t.category] || theme.primary} size={18} />
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
                  <View style={styles.tipIcon}><Icon name={ins.icon} color={theme.highlight} size={18} /></View>
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

      <Modal visible={goalModal} transparent animationType="fade" onRequestClose={() => setGoalModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setGoalModal(false)} />
          <GlassCard style={styles.modalCard}>
            <Text style={styles.modalTitle}>Savings goal</Text>
            <Text style={styles.muted}>How much do you want to save this month?</Text>
            <View style={styles.goalInputRow}>
              <Text style={styles.curr}>₹</Text>
              <TextInput
                testID="goal-amount-input"
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.textTertiary}
                style={styles.goalInput}
                autoFocus
              />
            </View>
            <TouchableOpacity testID="save-goal-button" onPress={saveGoal} disabled={savingGoal} style={styles.saveBtn} activeOpacity={0.85}>
              <LinearGradient colors={[theme.primary, theme.secondary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              {savingGoal ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Goal</Text>}
            </TouchableOpacity>
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  glowA: { position: 'absolute', top: -120, right: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(59,130,246,0.18)' },
  glowB: { position: 'absolute', top: 180, left: -100, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(139,92,246,0.10)' },
  header: { marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { color: theme.textSecondary, fontSize: 13, letterSpacing: 0.5 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59,130,246,0.18)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.4)' },
  avatarText: { color: '#fff', fontWeight: '800' },
  seg: { flexDirection: 'row', padding: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 14 },
  segItem: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  segItemActive: { backgroundColor: theme.primary },
  segText: { color: theme.textSecondary, fontWeight: '700', fontSize: 13 },
  hero: { marginBottom: 12, borderColor: 'rgba(34,211,238,0.18)' },
  heroDanger: { borderColor: 'rgba(255,59,48,0.5)', backgroundColor: 'rgba(255,59,48,0.05)' },
  warnBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, marginBottom: 12, borderWidth: 1 },
  warnDanger: { backgroundColor: 'rgba(255,59,48,0.08)', borderColor: 'rgba(255,59,48,0.35)' },
  warnAmber: { backgroundColor: 'rgba(255,149,0,0.08)', borderColor: 'rgba(255,149,0,0.35)' },
  warnTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  warnDetail: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  flame: { fontSize: 14 },
  heroLabel: { color: theme.textSecondary, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  balance: { color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: -1, marginTop: 8 },
  row: { flexDirection: 'row', marginTop: 18, gap: 10 },
  pill: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  pillLabel: { fontSize: 11, fontWeight: '700', marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  pillValue: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 2 },
  miniRow: { flexDirection: 'row', gap: 10 },
  miniCard: { flex: 1, padding: 14 },
  miniHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniLabel: { color: theme.textSecondary, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '700' },
  miniValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 8 },
  miniSub: { color: theme.textSecondary, fontSize: 11, marginTop: 2 },
  savingsIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(34,211,238,0.15)', borderWidth: 1, borderColor: 'rgba(34,211,238,0.3)' },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  muted: { color: theme.textSecondary, fontSize: 12 },
  editBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  savedAmount: { color: '#fff', fontSize: 22, fontWeight: '800' },
  goalCta: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(34,211,238,0.35)', backgroundColor: 'rgba(34,211,238,0.06)' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 18 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  link: { color: theme.highlight, fontWeight: '600' },
  txn: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 10 },
  txnIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txnCat: { color: '#fff', fontSize: 15, fontWeight: '700' },
  txnNote: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  txnAmount: { fontSize: 16, fontWeight: '800' },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 10 },
  emptyDesc: { color: theme.textSecondary, fontSize: 13, marginTop: 4 },
  fab: { position: 'absolute', right: 22, width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', elevation: 10 },
  tipIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(34,211,238,0.15)', borderWidth: 1, borderColor: 'rgba(34,211,238,0.3)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tipTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tipDesc: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  modalWrap: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  curr: { color: theme.textSecondary, fontSize: 22, fontWeight: '700' },
  goalInput: { flex: 1, height: 54, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, color: '#fff', fontSize: 18, fontWeight: '700' },
  saveBtn: { height: 52, marginTop: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
