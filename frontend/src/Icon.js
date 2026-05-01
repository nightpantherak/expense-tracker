import React from 'react';
import { View } from 'react-native';
import {
  Utensils, Plane, Receipt, ShoppingBag, Film, MoreHorizontal,
  Briefcase, Gift, Tag, TrendingUp, TrendingDown, Plus, Home,
  BarChart3, PiggyBank, User, Search, LogOut, X, Check,
  Lightbulb, AlertTriangle, Smile, Info, ChevronRight, Trash2,
  Pencil, Calendar, Wallet, Sparkles,
} from 'lucide-react-native';

const map = {
  utensils: Utensils,
  plane: Plane,
  receipt: Receipt,
  'shopping-bag': ShoppingBag,
  film: Film,
  'more-horizontal': MoreHorizontal,
  briefcase: Briefcase,
  gift: Gift,
  tag: Tag,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  plus: Plus,
  home: Home,
  chart: BarChart3,
  'piggy-bank': PiggyBank,
  user: User,
  search: Search,
  'log-out': LogOut,
  x: X,
  check: Check,
  lightbulb: Lightbulb,
  'alert-triangle': AlertTriangle,
  smile: Smile,
  info: Info,
  'chevron-right': ChevronRight,
  trash: Trash2,
  pencil: Pencil,
  calendar: Calendar,
  wallet: Wallet,
  sparkles: Sparkles,
};

export default function Icon({ name, size = 20, color = '#fff', strokeWidth = 1.8 }) {
  const Cmp = map[name] || Tag;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} />;
}
