import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../src/GlassCard';
import Icon from '../src/Icon';
import { theme, fmtMoney, CATEGORY_COLORS } from '../src/theme';
import { api } from '../src/api';

const ICON_FOR = { Food: 'utensils', Travel: 'plane', Bills: 'receipt', Shopping: 'shopping-bag', Entertainment: 'film', Others: 'more-horizontal', Salary: 'briefcase', Gift: 'gift' };

const fmtDate = (d) => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
const parseDate = (s) => {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return isNaN(d.getTime()) ? null : d;
};

function presetRange(key) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (key === 'today') return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
  if (key === '7d') {
    const s = new Date(today); s.setDate(today.getDate() - 6);
    const e = new Date(today.getTime() + 86400000 - 1);
    return { start: s, end: e };
  }
  if (key === '30d') {
    const s = new Date(today); s.setDate(today.getDate() - 29);
    const e = new Date(today.getTime() + 86400000 - 1);
    return { start: s, end: e };
  }
  if (key === 'month') {
    const s = new Date(today.getFullYear(), today.getMonth(), 1);
    const e = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    return { start: s, end: e };
  }
  return { start: null, end: null }; // 'all'
}

const RANGE_OPTIONS = [
  { k: 'all', l: 'All' },
  { k: 'today', l: 'Today' },
  { k: '7d', l: '7 days' },
  { k: '30d', l: '30 days' },
  { k: 'month', l: 'Month' },
  { k: 'custom', l: 'Custom' },
];

export default function Transactions() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [rangeKey, setRangeKey] = useState('all');
  const [range, setRange] = useState({ start: null, end: null });
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customErr, setCustomErr] = useState('');

  const load = useCallback(async (override = null) => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.search = q;
      if (filter !== 'all') params.type = filter;
      const r = override || range;
      if (r.start) params.start = r.start.toISOString();
      if (r.end) params.end = r.end.toISOString();
      const t = await api.listTransactions(params);
      setItems(t);
    } catch {} finally { setLoading(false); }
  }, [q, filter, range]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pickRange = (k) => {
    if (k === 'custom') {
      setCustomStart(range.start ? fmtDate(range.start) : '');
      setCustomEnd(range.end ? fmtDate(range.end) : '');
      setCustomErr('');
      setCustomOpen(true);
      return;
    }
    setRangeKey(k);
    setRange(presetRange(k));
  };

  const applyCustom = () => {
    const s = parseDate(customStart);
    const e = parseDate(customEnd);
    if (!s && !e) { setCustomErr('Enter at least one date'); return; }
    if (s && e && s > e) { setCustomErr('Start must be before end'); return; }
    if (e) e.setHours(23, 59, 59, 999);
    setRangeKey('custom');
    setRange({ start: s, end: e });
    setCustomOpen(false);
  };

  const clearCustom = () => {
    setRangeKey('all');
    setRange({ start: null, end: null });
    setCustomOpen(false);
  };

  const customLabel = rangeKey === 'custom' && (range.start || range.end)
    ? `${range.start ? fmtDate(range.start).slice(5) : '…'} → ${range.end ? fmtDate(range.end).slice(5) : '…'}`
    : 'Custom';

  return (
    <View style={styles.container} testID="transactions-screen">
      <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
          <Icon name="x" color="#fff" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>All transactions</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchRow}>
        <Icon name="search" color={theme.textSecondary} size={18} />
        <TextInput
          testID="search-input"
          placeholder="Search category or note"
          placeholderTextColor={theme.textTertiary}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => load()}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filters}>
        {[{ k: 'all', l: 'All' }, { k: 'expense', l: 'Expense' }, { k: 'income', l: 'Income' }].map(f => (
          <TouchableOpacity key={f.k} testID={`filter-${f.k}`} onPress={() => setFilter(f.k)} style={[styles.filter, filter === f.k && styles.filterActive]}>
            <Text style={[styles.filterText, filter === f.k && { color: '#fff' }]}>{f.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeRow}>
        {RANGE_OPTIONS.map(r => {
          const active = rangeKey === r.k;
          const label = r.k === 'custom' ? customLabel : r.l;
          return (
            <TouchableOpacity key={r.k} testID={`range-${r.k}`} onPress={() => pickRange(r.k)} style={[styles.range, active && styles.rangeActive]} activeOpacity={0.8}>
              {r.k === 'custom' && <Icon name="calendar" color={active ? '#fff' : theme.textSecondary} size={13} />}
              <Text style={[styles.rangeText, active && { color: '#fff' }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {loading ? <ActivityIndicator color="#fff" style={{ marginTop: 30 }} /> :
          items.length === 0 ? (
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 40 }}>No transactions found</Text>
          ) : items.map(t => (
            <TouchableOpacity key={t.id} testID={`list-txn-${t.id}`} onPress={() => router.push({ pathname: '/add-transaction', params: { id: t.id } })} style={styles.item} activeOpacity={0.75}>
              <View style={[styles.itIcon, { backgroundColor: (CATEGORY_COLORS[t.category] || theme.primary) + '25' }]}>
                <Icon name={ICON_FOR[t.category] || 'tag'} color={CATEGORY_COLORS[t.category] || theme.primary} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itCat}>{t.category}</Text>
                <Text style={styles.itNote} numberOfLines={1}>{t.note || new Date(t.date).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.itAmount, { color: t.type === 'income' ? theme.income : theme.expense }]}>
                {t.type === 'income' ? '+' : '-'}{fmtMoney(t.amount)}
              </Text>
            </TouchableOpacity>
          ))
        }
      </ScrollView>

      <Modal visible={customOpen} transparent animationType="fade" onRequestClose={() => setCustomOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setCustomOpen(false)} />
          <GlassCard style={styles.modalCard}>
            <Text style={styles.modalTitle}>Custom date range</Text>
            <Text style={styles.muted}>Format: YYYY-MM-DD</Text>

            <Text style={[styles.label, { marginTop: 16 }]}>From</Text>
            <TextInput
              testID="range-start-input"
              value={customStart}
              onChangeText={setCustomStart}
              placeholder="2026-01-01"
              placeholderTextColor={theme.textTertiary}
              style={styles.input}
              autoCapitalize="none"
            />
            <Text style={[styles.label, { marginTop: 12 }]}>To</Text>
            <TextInput
              testID="range-end-input"
              value={customEnd}
              onChangeText={setCustomEnd}
              placeholder="2026-12-31"
              placeholderTextColor={theme.textTertiary}
              style={styles.input}
              autoCapitalize="none"
            />
            {customErr ? <Text style={styles.err}>{customErr}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity testID="range-clear" onPress={clearCustom} style={styles.clearBtn} activeOpacity={0.85}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="range-apply" onPress={applyCustom} style={styles.applyBtn} activeOpacity={0.85}>
                <LinearGradient colors={[theme.primary, theme.secondary]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchInput: { flex: 1, height: 46, color: '#fff' },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  filterActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  filterText: { color: theme.textSecondary, fontWeight: '700', fontSize: 13 },
  rangeRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  range: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  rangeActive: { backgroundColor: theme.highlight, borderColor: theme.highlight },
  rangeText: { color: theme.textSecondary, fontWeight: '700', fontSize: 12 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 10 },
  itIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itCat: { color: '#fff', fontSize: 15, fontWeight: '700' },
  itNote: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  itAmount: { fontSize: 16, fontWeight: '800' },
  modalWrap: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: {},
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  muted: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
  label: { color: theme.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  input: { height: 50, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, color: '#fff', fontSize: 15 },
  err: { color: theme.expense, marginTop: 10, fontSize: 13 },
  clearBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  clearText: { color: theme.textSecondary, fontWeight: '700' },
  applyBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  applyText: { color: '#fff', fontWeight: '800' },
});
