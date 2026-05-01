"""NSIAP Expense Tracker backend API tests (pytest)."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://smooth-spend.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# Unique user per test run so we don't collide
UNIQUE_EMAIL = f"test_{uuid.uuid4().hex[:8]}@nsiap.com"
STATIC_EMAIL = "test@nsiap.com"
STATIC_PASSWORD = "test1234"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth(session):
    # Try register unique user; fallback to login of static user if provided
    r = session.post(f"{API}/auth/register", json={
        "email": UNIQUE_EMAIL, "password": "test1234", "name": "Test User"
    })
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data and "user" in data
    token = data["access_token"]
    user = data["user"]
    return {"token": token, "user": user, "headers": {"Authorization": f"Bearer {token}"}}


# ---------------- Auth ----------------
class TestAuth:
    def test_register_returns_jwt_and_user(self, auth):
        assert auth["token"]
        assert auth["user"]["email"] == UNIQUE_EMAIL

    def test_register_duplicate_returns_400(self, session):
        r = session.post(f"{API}/auth/register", json={
            "email": UNIQUE_EMAIL, "password": "test1234", "name": "Dup"
        })
        assert r.status_code == 400

    def test_login_success(self, session):
        r = session.post(f"{API}/auth/login", json={"email": UNIQUE_EMAIL, "password": "test1234"})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login", json={"email": UNIQUE_EMAIL, "password": "WRONG"})
        assert r.status_code == 401

    def test_me_with_bearer(self, session, auth):
        r = session.get(f"{API}/auth/me", headers=auth["headers"])
        assert r.status_code == 200
        assert r.json()["email"] == UNIQUE_EMAIL

    def test_me_without_token(self, session):
        r = session.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------------- Categories ----------------
class TestCategories:
    def test_default_categories_seeded(self, session, auth):
        r = session.get(f"{API}/categories", headers=auth["headers"])
        assert r.status_code == 200
        cats = r.json()
        names = {c["name"] for c in cats}
        for want in ["Food", "Travel", "Bills", "Shopping", "Entertainment", "Others", "Salary", "Gift"]:
            assert want in names, f"missing default category {want}"
        assert len(cats) >= 8


# ---------------- Transactions ----------------
class TestTransactions:
    created_id = None

    def test_create_transaction(self, session, auth):
        r = session.post(f"{API}/transactions", headers=auth["headers"], json={
            "type": "expense", "amount": 250.5, "category": "Food", "note": "Lunch"
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["amount"] == 250.5 and d["category"] == "Food" and d["type"] == "expense"
        TestTransactions.created_id = d["id"]

    def test_create_income(self, session, auth):
        r = session.post(f"{API}/transactions", headers=auth["headers"], json={
            "type": "income", "amount": 50000, "category": "Salary", "note": "Jan salary"
        })
        assert r.status_code == 200

    def test_list_transactions_has_items(self, session, auth):
        r = session.get(f"{API}/transactions", headers=auth["headers"])
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 2

    def test_filter_by_type_expense(self, session, auth):
        r = session.get(f"{API}/transactions?type=expense", headers=auth["headers"])
        assert r.status_code == 200
        assert all(t["type"] == "expense" for t in r.json())

    def test_filter_by_category(self, session, auth):
        r = session.get(f"{API}/transactions?category=Food", headers=auth["headers"])
        assert r.status_code == 200
        assert all(t["category"] == "Food" for t in r.json())

    def test_search(self, session, auth):
        r = session.get(f"{API}/transactions?search=Lunch", headers=auth["headers"])
        assert r.status_code == 200
        assert any("Lunch" in t.get("note", "") for t in r.json())

    def test_patch_transaction(self, session, auth):
        tid = TestTransactions.created_id
        assert tid, "no created txn"
        r = session.patch(f"{API}/transactions/{tid}", headers=auth["headers"],
                          json={"amount": 300.0, "note": "Updated"})
        assert r.status_code == 200
        assert r.json()["amount"] == 300.0
        # Verify via GET
        r2 = session.get(f"{API}/transactions", headers=auth["headers"])
        updated = next((t for t in r2.json() if t["id"] == tid), None)
        assert updated and updated["amount"] == 300.0

    def test_delete_transaction(self, session, auth):
        tid = TestTransactions.created_id
        r = session.delete(f"{API}/transactions/{tid}", headers=auth["headers"])
        assert r.status_code == 200
        r2 = session.get(f"{API}/transactions", headers=auth["headers"])
        assert not any(t["id"] == tid for t in r2.json())


# ---------------- Budget ----------------
class TestBudget:
    def test_set_and_get_budget(self, session, auth):
        r = session.post(f"{API}/budget", headers=auth["headers"], json={"amount": 20000})
        assert r.status_code == 200
        d = r.json()
        assert d["amount"] == 20000
        assert "spent" in d and "percent" in d and "month" in d
        # Upsert idempotency
        r2 = session.post(f"{API}/budget", headers=auth["headers"], json={"amount": 25000})
        assert r2.status_code == 200 and r2.json()["amount"] == 25000

    def test_get_budget(self, session, auth):
        r = session.get(f"{API}/budget", headers=auth["headers"])
        assert r.status_code == 200
        d = r.json()
        assert d["amount"] == 25000
        assert isinstance(d["spent"], (int, float))


# ---------------- Analytics ----------------
class TestAnalytics:
    def test_analytics_summary(self, session, auth):
        # ensure there's at least one expense + income this month
        session.post(f"{API}/transactions", headers=auth["headers"], json={
            "type": "expense", "amount": 500, "category": "Travel"})
        session.post(f"{API}/transactions", headers=auth["headers"], json={
            "type": "income", "amount": 1000, "category": "Gift"})
        r = session.get(f"{API}/analytics/summary", headers=auth["headers"])
        assert r.status_code == 200
        d = r.json()
        for key in ["totals", "month_totals", "pie", "bar", "insights", "month"]:
            assert key in d
        assert len(d["bar"]) == 7
        assert isinstance(d["insights"], list) and len(d["insights"]) >= 1
        assert "income" in d["totals"] and "expense" in d["totals"] and "balance" in d["totals"]
