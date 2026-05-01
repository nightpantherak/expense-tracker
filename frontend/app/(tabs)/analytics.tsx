import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { G, Path, Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import GlassCard from '../../src/GlassCard';
import Icon from '../../src/Icon';
import { theme, fmtMoney, CATEGORY_COLORS } from '../../src/theme';
import { api } from '../../src/api';

const { width } = Dimensions.get('window');

function PieChart({ data = [] }) {
  const size = width - 80;
  const r = size / 2 - 10;
  const cx = size / 2, cy = size / 2;
  const total = data.reduce((s, d) => s + d.total, 0);
  if (total <= 0) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={18} fill="none" />
      </Svg>
    );
  }
  let startAngle = -Math.PI / 2;
  const arcs = data.map((d, i) => {
    const angle = (d.total / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    startAngle = endAngle;
    return { d: pathD, color: CATEGORY_COLORS[d.category] || theme.primary, key: i };
  });
  return (
    <Svg width={size} height={size}>
      <G>{arcs.map(a => <Path key={a.key} d={a.d} fill={a.color} />)}</G>
      <Circle cx={cx} cy={cy} r={r * 0.55} fill="#0A0A12" />
    </Svg>
  );
}

function BarChart({ data = [] }) {
  const w = width - 80;
  const h = 160;
  const pad = 24;
  const max = Math.max(1, ...data.map(d => d.total));
  const bw = (w - pad * 2) / Math.max(1, data.length);
  return (
    <Svg width={w} height={h}>
      {data.map((d, i) => {
        const bh = (d.total / max) * (h - 40);
        const x = pad + i * bw + bw * 0.2;
        const y = h - 20 - bh;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={bw * 0.6} height={bh} rx={6} fill={theme.primary} opacity={0.85} />
            <Rect x={x} y={y} width={bw * 0.6} height={4} rx={2} fill={theme.highlight} />
          </G>
        );
      })}
    </Svg>
  );
}

export default function Analytics() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try { const d = await api.analytics(); setData(d); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pie = data?.pie || [];
  const bar = data?.bar || [];

  return (
    <View style={styles.container} testID="analytics-screen">
      <LinearGradient colors={['#07070A', '#0C0C14', '#050508']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20 }}>
        <Text style={styles.h1}>Analytics</Text>
        <Text style={styles.sub}>This month</Text>

        <GlassCard style={{ marginTop: 16 }}>
          <Text style={styles.cardTitle}>Expense distribution</Text>
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <PieChart data={pie} />
          </View>
          <View style={styles.legend}>
            {pie.length === 0 ? <Text style={styles.muted}>No expenses yet</Text> : pie.map((p, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: CATEGORY_COLORS[p.category] || theme.primary }]} />
                <Text style={styles.legendText}>{p.category}</Text>
                <Text style={styles.legendValue}>{fmtMoney(p.total)}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={{ marginTop: 14 }}>
          <Text style={styles.cardTitle}>Last 7 days</Text>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <BarChart data={bar} />
            <View style={styles.labels}>
              {bar.map((d, i) => <Text key={i} style={styles.dayLabel}>{d.label}</Text>)}
            </View>
          </View>
        </GlassCard>

        {data?.insights?.length ? (
          <>
            <Text style={[styles.h2, { marginTop: 20 }]}>Insights</Text>
            {data.insights.map((ins, i) => (
              <GlassCard key={i} style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.insightIcon}><Icon name={ins.icon} color={theme.highlight} size={18} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightTitle}>{ins.title}</Text>
                    <Text style={styles.muted}>{ins.detail}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  h1: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  h2: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sub: { color: theme.textSecondary, marginTop: 2 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  legend: { marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legendText: { color: '#fff', fontWeight: '600', flex: 1 },
  legendValue: { color: theme.textSecondary },
  muted: { color: theme.textSecondary },
  labels: { flexDirection: 'row', width: width - 80, paddingHorizontal: 24, justifyContent: 'space-between', marginTop: 4 },
  dayLabel: { color: theme.textSecondary, fontSize: 11, width: 32, textAlign: 'center' },
  insightIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(34,211,238,0.15)', borderWidth: 1, borderColor: 'rgba(34,211,238,0.3)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  insightTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
