"""Iteration 2: savings goal, password reset flows, analytics period toggle."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://smooth-spend.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

EMAIL = f"test_i2_{uuid.uuid4().hex[:8]}@nsiap.com"
PASSWORD = "test1234"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth(session):
    r = session.post(f"{API}/auth/register", json={"email": EMAIL, "password": PASSWORD, "name": "I2 User"})
    assert r.status_code == 200, r.text
    tok = r.json()["access_token"]
    return {"headers": {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}, "email": EMAIL}


# ---------------- Savings Goal ----------------
class TestSavings:
    def test_get_savings_default_zero(self, session, auth):
        r = session.get(f"{API}/savings", headers=auth["headers"])
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["month", "goal", "saved", "remaining", "percent", "days_left", "message", "status"]:
            assert k in d, f"missing key {k}"
        assert d["goal"] == 0.0
        assert d["status"] == "neutral"

    def test_set_savings_goal(self, session, auth):
        r = session.post(f"{API}/savings", headers=auth["headers"], json={"amount": 10000})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["goal"] == 10000
        # recomputed fields present
        assert "percent" in d and "remaining" in d and "status" in d

    def test_savings_reflects_after_income_expense(self, session, auth):
        # Add income + small expense -> saved should be income-expense
        session.post(f"{API}/transactions", headers=auth["headers"],
                     json={"type": "income", "amount": 5000, "category": "Salary"})
        session.post(f"{API}/transactions", headers=auth["headers"],
                     json={"type": "expense", "amount": 1000, "category": "Food"})
        r = session.get(f"{API}/savings", headers=auth["headers"])
        assert r.status_code == 200
        d = r.json()
        assert d["saved"] >= 4000  # 5000-1000
        assert d["goal"] == 10000
        assert d["status"] in ("on_track", "behind", "achieved")


# ---------------- Password flows ----------------
class TestPasswordFlows:
    reset_token = None

    def test_forgot_password_returns_token(self, session, auth):
        r = session.post(f"{API}/auth/forgot-password", json={"email": auth["email"]})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True
        assert "reset_token" in d and d["reset_token"]
        TestPasswordFlows.reset_token = d["reset_token"]

    def test_forgot_password_unknown_email_ok(self, session):
        # Should NOT leak enumeration; returns ok without token
        r = session.post(f"{API}/auth/forgot-password", json={"email": f"unknown_{uuid.uuid4().hex[:8]}@example.com"})
        assert r.status_code == 200
        assert r.json().get("ok") is True
        assert "reset_token" not in r.json()

    def test_reset_password_with_invalid_token(self, session):
        r = session.post(f"{API}/auth/reset-password", json={"token": "invalid-token", "password": "newpass1"})
        assert r.status_code == 400

    def test_reset_password_success_and_login(self, session, auth):
        tok = TestPasswordFlows.reset_token
        assert tok, "prior test must run"
        new_pw = "newpass123"
        r = session.post(f"{API}/auth/reset-password", json={"token": tok, "password": new_pw})
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True
        # Old password no longer works
        r1 = session.post(f"{API}/auth/login", json={"email": auth["email"], "password": PASSWORD})
        assert r1.status_code == 401
        # New password works
        r2 = session.post(f"{API}/auth/login", json={"email": auth["email"], "password": new_pw})
        assert r2.status_code == 200
        # Update auth token for subsequent tests
        auth["headers"]["Authorization"] = f"Bearer {r2.json()['access_token']}"
        auth["current_pw"] = new_pw

    def test_reset_password_token_single_use(self, session):
        # Same token cannot be reused
        tok = TestPasswordFlows.reset_token
        r = session.post(f"{API}/auth/reset-password", json={"token": tok, "password": "another123"})
        assert r.status_code == 400

    def test_change_password_wrong_current(self, session, auth):
        r = session.post(f"{API}/auth/change-password", headers=auth["headers"],
                         json={"current_password": "WRONG", "new_password": "abcdef1"})
        assert r.status_code == 400

    def test_change_password_success(self, session, auth):
        cur = auth.get("current_pw", "newpass123")
        new = "final_pw_7"
        r = session.post(f"{API}/auth/change-password", headers=auth["headers"],
                         json={"current_password": cur, "new_password": new})
        assert r.status_code == 200, r.text
        # Verify login works with new pw
        r2 = session.post(f"{API}/auth/login", json={"email": auth["email"], "password": new})
        assert r2.status_code == 200


# ---------------- Analytics period toggle ----------------
class TestAnalyticsPeriod:
    @pytest.mark.parametrize("period", ["today", "week", "month"])
    def test_period_response_shape(self, session, auth, period):
        r = session.get(f"{API}/analytics/summary?period={period}", headers=auth["headers"])
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("period") == period
        # Expected keys from iteration 2
        for k in ["totals", "month_totals", "pie", "bar", "insights", "budget"]:
            assert k in d, f"missing {k}"
        # top_category may be None or dict
        assert "top_category" in d
        # budget object shape
        assert set(["amount", "spent", "remaining"]).issubset(d["budget"].keys())
        # 7-day bar chart always present
        assert len(d["bar"]) == 7

    def test_top_category_populated_after_expense(self, session, auth):
        # add another expense so there's data this month
        session.post(f"{API}/transactions", headers=auth["headers"],
                     json={"type": "expense", "amount": 2500, "category": "Food"})
        r = session.get(f"{API}/analytics/summary?period=month", headers=auth["headers"])
        assert r.status_code == 200
        d = r.json()
        assert d["top_category"] is not None
        assert d["top_category"]["name"] and d["top_category"]["amount"] > 0


# ---------------- Regression (light) ----------------
class TestRegression:
    def test_categories_still_seeded(self, session, auth):
        r = session.get(f"{API}/categories", headers=auth["headers"])
        assert r.status_code == 200
        assert len(r.json()) >= 8

    def test_budget_still_works(self, session, auth):
        r = session.post(f"{API}/budget", headers=auth["headers"], json={"amount": 15000})
        assert r.status_code == 200 and r.json()["amount"] == 15000
        r2 = session.get(f"{API}/budget", headers=auth["headers"])
        assert r2.status_code == 200 and r2.json()["amount"] == 15000

    def test_list_transactions(self, session, auth):
        r = session.get(f"{API}/transactions", headers=auth["headers"])
        assert r.status_code == 200
