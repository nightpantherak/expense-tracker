export const theme = {
  bg: '#07070A',
  bgMid: '#0C0C14',
  bgDeep: '#050508',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.10)',
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  highlight: '#22D3EE',
  income: '#34C759',
  expense: '#FF3B30',
  warning: '#FF9500',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
};

export const CURRENCY = '₹';

export const fmtMoney = (n) => {
  const v = Number(n || 0);
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  return `${sign}${CURRENCY}${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const CATEGORY_COLORS = {
  Food: '#FF6B6B',
  Travel: '#3B82F6',
  Bills: '#8B5CF6',
  Shopping: '#EC4899',
  Entertainment: '#22D3EE',
  Others: '#A1A1AA',
  Salary: '#34C759',
  Gift: '#F59E0B',
};
