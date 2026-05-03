# Expense Tracker — PRD (by NSIAP Enterprises)

**Stack:** Expo (React Native) + expo-router · FastAPI · MongoDB · JWT (Bearer)
**Currency:** INR ₹ · **Theme:** Premium dark glassmorphism (electric blue #3B82F6, soft purple #8B5CF6, neon cyan #22D3EE)

## Feature Matrix

### Authentication
- JWT email/password signup, login, logout, Bearer tokens persisted via AsyncStorage
- Forgot / Reset / Change password (clean UX, tokens routed in-app, never visible to user)

### Onboarding & Branding
- Animated splash: "Expense Tracker" + "by NSIAP Enterprises"
- 4-slide minimal onboarding carousel

### Dashboard (main screen)
- **Total Balance** hero glass card (glows red when discipline-mode + over-budget)
- **Today / Week / Month** period toggle refetches analytics
- **Remaining budget** + **Top spending category** mini cards
- **Savings Goal** inline widget (modal setter, animated progress, on-track/behind/achieved)
- **Streaks (NEW)** — logging streak + budget streak mini cards
- **Smart warnings** — "Close to your budget limit" / "You exceeded your X budget" banner (red if discipline mode ON, amber otherwise)
- Recent transactions, Smart tips, gradient FAB

### Transactions
- Add/Edit/Delete (income or expense), category picker, note
- Search + type filter + **date-range chips (All / Today / 7d / 30d / Month / Custom)**

### Categories
- 8 defaults auto-seeded per user; API supports custom create/delete

### Analytics
- Custom SVG pie (expense distribution) + 7-day bar chart + rule-based insights

### Budget
- **Monthly + Weekly budgets (NEW)** — tabbed setter, animated gradient progress
- Color states: safe / near / exceeded
- Smart warnings surface on Dashboard

### Streaks (NEW)
- **Logging streak** — consecutive days with at least one transaction (today optional, grace to yesterday)
- **Budget streak** — consecutive days back where the ISO-week expense ≤ weekly budget AND month-to-date expense ≤ monthly budget (whichever is set). Capped at days since first transaction so new accounts show 0.
- Resets only when weekly OR monthly budget is exceeded (daily target is a soft guideline, never the basis of reset)

### Discipline Mode (NEW, optional)
- Toggle in Profile. When ON and user is over budget:
  - Hero card borders turn red
  - Warning title reads "Budget exceeded. Streak lost."
  - Detail reads "Tomorrow is a fresh start."
- Non-aggressive, behavior-focused wording

### Profile
- Name, email, avatar
- Discipline mode toggle
- Change password · Transactions · Analytics · Budget shortcuts
- Sign out

## Smart Insights (rule-based)
- "You spent most on X · ₹Y in this period"
- "You can save ~₹X by reducing Y"
- "Close to your budget limit · N% used" / "You exceeded your monthly budget"
- "High spend-to-income ratio" / "Great saving pace"
- Savings: "On track", "Behind target — save ~₹X/day", "Goal achieved!"

## Production Hardening (suggested)
- Email delivery for reset (SendGrid / Resend)
- IP rate-limit on `/auth/*`
- TTL index on `password_reset_tokens.expires_at`
- Root error boundary to protect against single-screen crashes
- Per-endpoint failure isolation in dashboard fetches
