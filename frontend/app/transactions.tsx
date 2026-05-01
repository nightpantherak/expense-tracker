import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../src/Icon';
import { theme, fmtMoney, CATEGORY_COLORS } from '../src/theme';
import { api } from '../src/api';

const ICON_FOR = { Food: 'utensils', Travel: 'plane', Bills: 'receipt', Shopping: 'shopping-bag', Entertainment: 'film', Others: 'more-horizontal', Salary: 'briefcase', Gift: 'gift' };

export default function Transactions() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all'); // all/income/expense

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.search = q;
      if (filter !== 'all') params.type = filter;
      const t = await api.listTransactions(params);
      setItems(t);
    } catch {}
    finally { setLoading(false); }
  }, [q, filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
          onSubmitEditing={load}
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
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 10 },
  itIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itCat: { color: '#fff', fontSize: 15, fontWeight: '700' },
  itNote: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  itAmount: { fontSize: 16, fontWeight: '800' },
});
