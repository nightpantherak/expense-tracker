# NSIAP Expense Tracker — PRD

**Brand:** NSIAP Enterprises
**Stack:** Expo (React Native) + expo-router, FastAPI, MongoDB
**Currency:** INR ₹
**Theme:** Dark glassmorphism with electric blue (#3B82F6), soft purple (#8B5CF6), neon cyan (#22D3EE)

## Features Delivered
- **Authentication (JWT):** Email/password signup & login, AsyncStorage-persisted Bearer tokens
- **Splash Screen:** Animated logo, glow gradient, "NSIAP Expense Tracker" + "by NSIAP Enterprises" subtitle
- **Onboarding:** 4-slide swipeable intro (Track, Visualize, Budget, Insights) with skip & pagination
- **Dashboard:** Total balance hero card, monthly income/expense pills, recent transactions, smart tips, floating action button
- **Add/Edit Transaction:** Income/Expense toggle, large amount input, category grid (icons+colors), note, delete
- **Categories:** 8 defaults auto-seeded per user (Food, Travel, Bills, Shopping, Entertainment, Others, Salary, Gift); custom creation supported via API
- **Analytics:** Pie chart (expense distribution), 7-day bar chart, rule-based insights
- **Budget:** Monthly budget setter, glow progress bar, on-track/warning/over-budget alerts
- **Transactions:** Search + filter (All/Expense/Income), tap-to-edit, delete
- **Profile:** Avatar, quick links, sign out
- **Glassmorphism UI:** BlurView cards, radial glow backgrounds, gradient CTAs, tab bar with active glow

## Architecture
- Backend routes prefixed `/api`, stored under MongoDB `nsiap_expense_tracker`
- Collections: `users`, `transactions`, `categories`, `budgets`
- Frontend uses expo-router file-based routing with `(auth)` and `(tabs)` groups

## Extension Ideas
- Recurring bills & auto-categorization
- Export CSV / receipts attachment
- Multi-currency & shared household tracking
- Premium subscription (budget forecasts, AI coach)
