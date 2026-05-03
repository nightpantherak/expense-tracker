"""Backend tests for Iteration 7: analytics insights (week-over-week, top category, weekly delta)."""
import os
import time
from datetime import datetime, timezone, timedelta

import pytest
import requests

BASE_URL = os.environ['EXPO_PUBLIC_BACKEND_URL'].rstrip('/')


# ---- helpers ----
@pytest.fixture(scope="module")
def auth():
    email = f"iter7_{int(time.time())}@nsiap.com"
    pwd = "test1234"
    r = requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": pwd, "name": "Iter7"})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')


def _add_tx(auth, amount, category, when_dt, ttype="expense", note="TEST_iter7"):
    r = requests.post(f"{BASE_URL}/api/transactions", headers=auth, json={
        "amount": float(amount),
        "category": category,
        "type": ttype,
        "note": note,
        "date": _iso(when_dt),
    })
    assert r.status_code == 200, r.text
    return r.json()


# ---- Iteration 7: Analytics insights ----
class TestAnalyticsInsights:
    """Tests for /api/analytics/summary insight phrases introduced in iter7."""

    def test_analytics_endpoint_still_200(self, auth):
        r = requests.get(f"{BASE_URL}/api/analytics/summary", headers=auth)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "insights" in data
        assert isinstance(data["insights"], list)

    def test_top_category_this_week_insight(self, auth):
        # Add an expense this week; ensure date <= now (backend filters week using $lt: now+1s)
        now = datetime.now(timezone.utc)
        tx_dt = now - timedelta(minutes=5)
        _add_tx(auth, 500, "Food", tx_dt)

        r = requests.get(f"{BASE_URL}/api/analytics/summary", headers=auth)
        assert r.status_code == 200
        insights = r.json()["insights"]
        titles = [i.get("title", "") for i in insights]
        matching = [t for t in titles if t.startswith("You spent ₹") and "this week" in t and "Food" in t]
        assert matching, f"expected 'You spent ₹... on Food this week' insight, got: {titles}"

    def test_week_over_week_delta_phrasing(self, auth):
        # Same user, add a 'last-week' expense in the same category
        now = datetime.now(timezone.utc)
        # last week = 8 days ago (ensure inside last ISO week window before this_week_start)
        last_week_dt = (now - timedelta(days=8)).replace(hour=12, minute=0, second=0, microsecond=0)
        _add_tx(auth, 200, "Food", last_week_dt)

        # Ensure this week total (>= test above 500) differs from last week (200)
        r = requests.get(f"{BASE_URL}/api/analytics/summary", headers=auth)
        assert r.status_code == 200
        insights = r.json()["insights"]
        # find the 'You spent ₹... on Food this week' insight
        food_insight = next(
            (i for i in insights if "this week" in i.get("title", "") and "Food" in i.get("title", "")),
            None,
        )
        assert food_insight is not None, f"missing Food weekly insight: {insights}"
        detail = food_insight.get("detail", "")
        assert ("higher than last week" in detail) or ("lower than last week" in detail), \
            f"expected week-over-week phrasing, got detail='{detail}'"

    def test_weekly_aggregate_delta_when_large(self, auth):
        # After previous tests: this_week_total=500, last_week_total=200 -> +150% diff >=15%
        r = requests.get(f"{BASE_URL}/api/analytics/summary", headers=auth)
        assert r.status_code == 200
        insights = r.json()["insights"]
        aggregate = [
            i for i in insights
            if i.get("title", "").startswith("Weekly spending up")
            or i.get("title", "").startswith("Weekly spending down")
        ]
        assert aggregate, f"expected aggregate 'Weekly spending up/down X%' insight, got: {[i.get('title') for i in insights]}"
        # sanity: ends with a % sign
        assert "%" in aggregate[0]["title"]


# ---- Iteration 7 regression: auth + transactions + budgets + analytics all still 200 ----
class TestRegression:
    def test_login_existing_seed_user(self):
        # test@nsiap.com / test1234 (per /app/memory/test_credentials.md)
        # Register if not present; login should return 200 either way after seed.
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test@nsiap.com", "password": "test1234", "name": "Test User"
        })
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@nsiap.com", "password": "test1234"
        })
        assert r.status_code == 200, r.text
        assert "access_token" in r.json()

    def test_budgets_endpoint(self, auth):
        r = requests.get(f"{BASE_URL}/api/budgets", headers=auth)
        assert r.status_code == 200
        assert "month" in r.json() and "week" in r.json()

    def test_transactions_list(self, auth):
        r = requests.get(f"{BASE_URL}/api/transactions", headers=auth)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_transactions_date_range(self, auth):
        now = datetime.now(timezone.utc)
        start = (now - timedelta(days=14)).isoformat()
        end = (now + timedelta(days=1)).isoformat()
        r = requests.get(
            f"{BASE_URL}/api/transactions",
            headers=auth,
            params={"start": start, "end": end},
        )
        assert r.status_code == 200

    def test_streaks_endpoint(self, auth):
        r = requests.get(f"{BASE_URL}/api/streaks", headers=auth)
        # streak endpoint should be reachable; expect 200
        assert r.status_code == 200, r.text
