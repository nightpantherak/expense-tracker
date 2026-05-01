import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../src/Icon';
import { theme, fmtMoney, CATEGORY_COLORS } from '../src/theme';
import { api } from '../src/api';

const ICON_FOR = { Food: 'utensils', Travel: 'plane', Bills: 'receipt', Shopping: 'shopping-bag', Entertainment: 'film', Others: 'more-horizontal', Salary: 'briefcase', Gift: 'gift' };

export default function AddTransaction() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState(null);
  const [cats, setCats] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    (async () => {
      try {
        const c = await api.listCategories();
        setCats(c);
        if (id) {
          const txns = await api.listTransactions({ limit: 1000 });
          const t = txns.find(x => x.id === id);
          if (t) {
            setType(t.type); setAmount(String(t.amount)); setNote(t.note || ''); setCategory(t.category);
          }
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  const filteredCats = cats.filter(c => c.type === type || c.type === 'both');

  const submit = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) { Alert.alert('Enter amount'); return; }
    if (!category) { Alert.alert('Select category'); return; }
    setBusy(true);
    try {
      if (id) await api.updateTransaction(id, { type, amount: val, category, note });
      else await api.createTransaction({ type, amount: val, category, note });
      router.back();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!id) return;
    setBusy(true);
    try { await api.deleteTransaction(id); router.back(); } catch (e) { Alert.alert('Error', e.message); }
    finally { setBusy(false); }
  };

  if (loading) return <View style={styles.container}><ActivityIndicator color="#fff" style={{ marginTop: 100 }} /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={styles.container} testID="add-transaction-screen">
        <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity testID="close-add-transaction" onPress={() => router.back()} style={styles.iconBtn}>
            <Icon name="x" color="#fff" size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>{id ? 'Edit' : 'New'} transaction</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 180 }} keyboardShouldPersistTaps="handled">
          <View style={styles.seg}>
            {['expense', 'income'].map(t => (
              <TouchableOpacity key={t} testID={`type-${t}`} style={[styles.segItem, type === t && styles.segItemActive]} onPress={() => { setType(t); setCategory(null); }}>
                <Text style={[styles.segText, type === t && { color: '#fff' }]}>{t === 'expense' ? 'Expense' : 'Income'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountCurrency}>₹</Text>
            <TextInput
              testID="transaction-amount-input"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.textTertiary}
              style={styles.amountInput}
            />
          </View>

          <Text style={styles.label}>Category</Text>
          <View style={styles.catGrid}>
            {filteredCats.map(c => {
              const active = category === c.name;
              return (
                <TouchableOpacity key={c.id} testID={`cat-${c.name}`} onPress={() => setCategory(c.name)} style={[styles.cat, active && { borderColor: CATEGORY_COLORS[c.name] || c.color }]}>
                  <View style={[styles.catIcon, { backgroundColor: (CATEGORY_COLORS[c.name] || c.color) + '25' }]}>
                    <Icon name={ICON_FOR[c.name] || c.icon} color={CATEGORY_COLORS[c.name] || c.color} size={18} />
                  </View>
                  <Text style={[styles.catText, active && { color: '#fff' }]}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            testID="transaction-note-input"
            value={note}
            onChangeText={setNote}
            placeholder="Add a note"
            placeholderTextColor={theme.textTertiary}
            style={styles.input}
            multiline
          />

          <TouchableOpacity testID="save-transaction-button" onPress={submit} disabled={busy} activeOpacity={0.85} style={styles.cta}>
            <LinearGradient colors={[theme.primary, theme.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{id ? 'Update' : 'Save'} {type === 'income' ? 'Income' : 'Expense'}</Text>}
          </TouchableOpacity>

          {id ? (
            <TouchableOpacity testID="delete-transaction-button" onPress={remove} disabled={busy} style={styles.deleteBtn} activeOpacity={0.8}>
              <Icon name="trash" color={theme.expense} size={18} />
              <Text style={styles.deleteText}>Delete transaction</Text>
            </TouchableOpacity>
          ) : null}
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
  seg: { flexDirection: 'row', padding: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  segItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  segItemActive: { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.4, shadowRadius: 16 },
  segText: { color: theme.textSecondary, fontWeight: '700' },
  amountBox: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 26, marginBottom: 10 },
  amountCurrency: { color: theme.textSecondary, fontSize: 32, fontWeight: '700', marginRight: 4 },
  amountInput: { color: '#fff', fontSize: 64, fontWeight: '900', letterSpacing: -2, minWidth: 80, textAlign: 'center' },
  label: { color: theme.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cat: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingRight: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 8 },
  catIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catText: { color: theme.textSecondary, fontWeight: '600' },
  input: { backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, color: '#fff', fontSize: 15, minHeight: 60 },
  cta: { height: 56, borderRadius: 18, marginTop: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,59,48,0.35)' },
  deleteText: { color: theme.expense, fontWeight: '700' },
});
