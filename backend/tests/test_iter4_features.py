"""Backend tests for Iteration 4: budgets (weekly+monthly), streaks, settings."""
import os
import time
from datetime import datetime, timezone, timedelta
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://smooth-spend.preview.emergentagent.com').rstrip('/')


@pytest.fixture(scope="module")
def auth():
    email = f"iter4_{int(time.time())}@nsiap.com"
    pwd = "test1234"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": pwd, "name": "Iter4"})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---- Budgets (weekly + monthly) ----
class TestBudgets:
    def test_get_budgets_empty(self, auth):
        r = requests.get(f"{BASE_URL}/api/budgets", headers=auth)
        assert r.status_code == 200
        data = r.json()
        assert "month" in data and "week" in data
        for k in ("amount", "spent", "percent"):
            assert k in data["month"], f"month missing {k}"
            assert k in data["week"], f"week missing {k}"
        assert data["month"]["amount"] == 0.0
        assert data["week"]["amount"] == 0.0

    def test_post_monthly_budget(self, auth):
        r = requests.post(f"{BASE_URL}/api/budget", json={"amount": 5000, "period": "month"}, headers=auth)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["amount"] == 5000
        assert d.get("period") == "month"
        # Verify persistence
        r2 = requests.get(f"{BASE_URL}/api/budget?period=month", headers=auth)
        assert r2.status_code == 200 and r2.json()["amount"] == 5000

    def test_post_weekly_budget(self, auth):
        r = requests.post(f"{BASE_URL}/api/budget", json={"amount": 1000, "period": "week"}, headers=auth)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["amount"] == 1000
        assert d.get("period") == "week"
        # Verify GET by period=week
        r2 = requests.get(f"{BASE_URL}/api/budget?period=week", headers=auth)
        assert r2.status_code == 200 and r2.json()["amount"] == 1000
        # Monthly unchanged
        r3 = requests.get(f"{BASE_URL}/api/budget?period=month", headers=auth)
        assert r3.json()["amount"] == 5000

    def test_budgets_combined(self, auth):
        r = requests.get(f"{BASE_URL}/api/budgets", headers=auth)
        d = r.json()
        assert d["month"]["amount"] == 5000
        assert d["week"]["amount"] == 1000


# ---- Settings (discipline_mode) ----
class TestSettings:
    def test_default_settings(self, auth):
        r = requests.get(f"{BASE_URL}/api/settings", headers=auth)
        assert r.status_code == 200
        assert r.json()["discipline_mode"] is False

    def test_patch_discipline_true(self, auth):
        r = requests.patch(f"{BASE_URL}/api/settings", json={"discipline_mode": True}, headers=auth)
        assert r.status_code == 200
        assert r.json()["discipline_mode"] is True
        # verify persisted
        r2 = requests.get(f"{BASE_URL}/api/settings", headers=auth)
        assert r2.json()["discipline_mode"] is True

    def test_patch_discipline_false(self, auth):
        r = requests.patch(f"{BASE_URL}/api/settings", json={"discipline_mode": False}, headers=auth)
        assert r.status_code == 200
        assert r.json()["discipline_mode"] is False


# ---- Streaks ----
class TestStreaks:
    def test_streak_shape(self, auth):
        r = requests.get(f"{BASE_URL}/api/streaks", headers=auth)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("log_streak", "budget_streak", "budget_streak_possible", "week_budget", "month_budget"):
            assert k in d, f"missing {k}"
        # Budgets are set from earlier tests; so possible should be True
        assert d["budget_streak_possible"] is True
        assert d["week_budget"] == 1000
        assert d["month_budget"] == 5000

    def test_log_streak_increments_with_today_txn(self, auth):
        # Add a transaction today
        r = requests.post(f"{BASE_URL}/api/transactions", json={
            "type": "expense", "amount": 50, "category": "Food", "note": "TEST today"
        }, headers=auth)
        assert r.status_code == 200
        r = requests.get(f"{BASE_URL}/api/streaks", headers=auth)
        d = r.json()
        assert d["log_streak"] >= 1

    def test_budget_streak_breaks_on_weekly_overage(self):
        """Fresh user: set small weekly budget, log overage → budget_streak should be 0."""
        email = f"iter4_break_{int(time.time())}@nsiap.com"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "test1234", "name": "Break"})
        assert r.status_code == 200
        hdr = {"Authorization": f"Bearer {r.json()['access_token']}"}
        # Set small weekly budget
        r = requests.post(f"{BASE_URL}/api/budget", json={"amount": 100, "period": "week"}, headers=hdr)
        assert r.status_code == 200
        # Create an expense today exceeding it
        r = requests.post(f"{BASE_URL}/api/transactions", json={
            "type": "expense", "amount": 500, "category": "Food", "note": "TEST overage"
        }, headers=hdr)
        assert r.status_code == 200
        r = requests.get(f"{BASE_URL}/api/streaks", headers=hdr)
        d = r.json()
        assert d["budget_streak_possible"] is True
        assert d["budget_streak"] == 0, f"Expected budget_streak reset, got {d}"

    def test_budget_streak_not_possible_without_budget(self):
        email = f"iter4_nobud_{int(time.time())}@nsiap.com"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "test1234", "name": "Nobud"})
        hdr = {"Authorization": f"Bearer {r.json()['access_token']}"}
        r = requests.get(f"{BASE_URL}/api/streaks", headers=hdr)
        d = r.json()
        assert d["budget_streak_possible"] is False
        assert d["week_budget"] == 0 and d["month_budget"] == 0


# ---- Regression ----
class TestRegression:
    def test_auth_me(self, auth):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth)
        assert r.status_code == 200
        assert "email" in r.json()

    def test_transactions_crud(self, auth):
        r = requests.post(f"{BASE_URL}/api/transactions", json={
            "type": "expense", "amount": 77, "category": "Food", "note": "TEST crud"
        }, headers=auth)
        assert r.status_code == 200
        tid = r.json()["id"]
        r = requests.patch(f"{BASE_URL}/api/transactions/{tid}", json={"amount": 88}, headers=auth)
        assert r.status_code == 200 and r.json()["amount"] == 88
        r = requests.delete(f"{BASE_URL}/api/transactions/{tid}", headers=auth)
        assert r.status_code == 200

    def test_date_range_filter(self, auth):
        start = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        end = datetime.now(timezone.utc).isoformat()
        r = requests.get(f"{BASE_URL}/api/transactions?start={start}&end={end}", headers=auth)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_savings(self, auth):
        r = requests.post(f"{BASE_URL}/api/savings", json={"amount": 2000}, headers=auth)
        assert r.status_code == 200
        assert r.json()["goal"] == 2000

    def test_analytics(self, auth):
        r = requests.get(f"{BASE_URL}/api/analytics/summary", headers=auth)
        assert r.status_code == 200
        d = r.json()
        for k in ("totals", "month_totals", "pie", "bar", "insights", "budget"):
            assert k in d

    def test_change_password(self):
        email = f"iter4_cp_{int(time.time())}@nsiap.com"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "test1234", "name": "CP"})
        hdr = {"Authorization": f"Bearer {r.json()['access_token']}"}
        r = requests.post(f"{BASE_URL}/api/auth/change-password", json={
            "current_password": "test1234", "new_password": "test5678"
        }, headers=hdr)
        assert r.status_code == 200
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "test5678"})
        assert r.status_code == 200
