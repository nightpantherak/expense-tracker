# Expense Tracker — PRD (by NSIAP Enterprises)

**Stack:** Expo (React Native) + expo-router · FastAPI · MongoDB
**Currency:** INR ₹ · **Theme:** Premium dark glassmorphism (electric blue #3B82F6, soft purple #8B5CF6, neon cyan #22D3EE)

## Implemented Features

### Authentication
- JWT email/password signup, login, logout (Bearer + AsyncStorage)
- **Forgot password** (clean demo flow — token routed in-app, never shown to user)
- **Reset password** (token-based, single-use, TZ-correct expiry)
- **Change password** (verifies current; updates new) accessible from Profile

### Onboarding & Branding
- Animated splash: "Expense Tracker" + "by NSIAP Enterprises"
- 4-slide minimal onboarding (Track / Visualize / Budget / Insights)

### Dashboard (smart home)
- Total Balance hero glass card
- **Today / Week / Month period toggle** (re-fetches analytics for that range)
- Mini cards: **Remaining budget** + **Top spending category**
- **Savings Goal Tracker** integrated inline (modal to set goal, animated progress, on-track / behind / achieved messages)
- Recent transactions, Smart tips (rule-based insights)
- Floating action button (gradient + glow)

### Transactions
- Add/Edit/Delete (income or expense), category grid, note
- Search + type filter (All/Expense/Income), tap-to-edit

### Categories
- 8 defaults auto-seeded per user (Food, Travel, Bills, Shopping, Entertainment, Others, Salary, Gift)
- API supports custom create/delete

### Analytics
- Pie chart (expense distribution) · 7-day bar chart · rule-based insights

### Budget
- Monthly budget setter, animated gradient progress, color states (green/amber/red)

### UX & Performance
- Animated entry transitions, smooth FAB feedback
- BlurView glass cards, SafeArea aware, KeyboardAvoiding inputs
- All deprecation warnings silenced via LogBox filter

## Smart Insights (rule-based)
- "You spent most on X · ₹Y in this period"
- "You can save ~₹X by reducing Y"
- "Close to your budget limit · N% used" / "You exceeded your monthly budget"
- "High spend-to-income ratio" / "Great saving pace"
- Savings: "On track", "Behind target — save ~₹X/day", "Goal achieved!"

## Production Hardening (suggested next)
- Email delivery for reset (SendGrid / Resend)
- IP rate-limit on `/auth/login` and `/auth/forgot-password`
- TTL index on `password_reset_tokens.expires_at`
- Premium tier (forecasts, AI coach, recurring bills, exports)
