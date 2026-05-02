"""Iteration 3: /api/transactions start/end date-range filtering."""
import os
import uuid
from datetime import datetime, timezone, timedelta

import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://smooth-spend.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

EMAIL = f"test_i3_{uuid.uuid4().hex[:8]}@nsiap.com"
PASSWORD = "test1234"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth(session):
    r = session.post(f"{API}/auth/register", json={"email": EMAIL, "password": PASSWORD, "name": "I3 User"})
    assert r.status_code == 200, r.text
    tok = r.json()["access_token"]
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def seeded(session, auth):
    """Seed 4 transactions across distinct dates for range testing."""
    now = datetime.now(timezone.utc)
    items = [
        # today -> Food expense 'food lunch'
        {"type": "expense", "amount": 150, "category": "Food",     "note": "TEST_food lunch",   "date": now.isoformat()},
        # 5 days ago -> Travel expense
        {"type": "expense", "amount": 800, "category": "Travel",   "note": "TEST_taxi",         "date": (now - timedelta(days=5)).isoformat()},
        # 20 days ago -> Food expense 'food dinner'
        {"type": "expense", "amount": 220, "category": "Food",     "note": "TEST_food dinner",  "date": (now - timedelta(days=20)).isoformat()},
        # 60 days ago -> Salary income
        {"type": "income",  "amount": 5000,"category": "Salary",   "note": "TEST_old salary",   "date": (now - timedelta(days=60)).isoformat()},
    ]
    ids = []
    for it in items:
        r = session.post(f"{API}/transactions", json=it, headers=auth)
        assert r.status_code == 200, r.text
        ids.append(r.json()["id"])
    yield {"ids": ids, "now": now}
    for tid in ids:
        session.delete(f"{API}/transactions/{tid}", headers=auth)


class TestRangeFilter:
    def test_no_range_returns_all(self, session, auth, seeded):
        r = session.get(f"{API}/transactions", headers=auth)
        assert r.status_code == 200
        notes = [t["note"] for t in r.json()]
        for expected in ["TEST_food lunch", "TEST_taxi", "TEST_food dinner", "TEST_old salary"]:
            assert expected in notes

    def test_last_7_days(self, session, auth, seeded):
        now = seeded["now"]
        start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59)
        r = session.get(f"{API}/transactions", headers=auth, params={"start": start.isoformat(), "end": end.isoformat()})
        assert r.status_code == 200, r.text
        notes = [t["note"] for t in r.json()]
        assert "TEST_food lunch" in notes
        assert "TEST_taxi" in notes
        assert "TEST_food dinner" not in notes
        assert "TEST_old salary" not in notes

    def test_last_30_days(self, session, auth, seeded):
        now = seeded["now"]
        start = (now - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59)
        r = session.get(f"{API}/transactions", headers=auth, params={"start": start.isoformat(), "end": end.isoformat()})
        assert r.status_code == 200
        notes = [t["note"] for t in r.json()]
        assert "TEST_food lunch" in notes
        assert "TEST_taxi" in notes
        assert "TEST_food dinner" in notes
        assert "TEST_old salary" not in notes

    def test_today_only(self, session, auth, seeded):
        now = seeded["now"]
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59)
        r = session.get(f"{API}/transactions", headers=auth, params={"start": start.isoformat(), "end": end.isoformat()})
        assert r.status_code == 200
        notes = [t["note"] for t in r.json()]
        assert "TEST_food lunch" in notes
        assert "TEST_taxi" not in notes

    def test_custom_narrow_window_excludes_outside(self, session, auth, seeded):
        now = seeded["now"]
        # window = exactly 5 days ago (the taxi only)
        start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
        end = (now - timedelta(days=4)).replace(hour=23, minute=59, second=59)
        r = session.get(f"{API}/transactions", headers=auth, params={"start": start.isoformat(), "end": end.isoformat()})
        assert r.status_code == 200
        notes = [t["note"] for t in r.json()]
        assert "TEST_taxi" in notes
        assert "TEST_food lunch" not in notes
        assert "TEST_food dinner" not in notes

    def test_only_start_no_end(self, session, auth, seeded):
        now = seeded["now"]
        # open-ended start (last 10 days) -> includes taxi + lunch only
        start = (now - timedelta(days=10)).replace(hour=0, minute=0, second=0, microsecond=0)
        r = session.get(f"{API}/transactions", headers=auth, params={"start": start.isoformat()})
        assert r.status_code == 200
        notes = [t["note"] for t in r.json()]
        assert "TEST_food lunch" in notes
        assert "TEST_taxi" in notes
        assert "TEST_food dinner" not in notes
        assert "TEST_old salary" not in notes

    def test_only_end_no_start(self, session, auth, seeded):
        now = seeded["now"]
        # everything up to 10 days ago (food dinner + salary)
        end = (now - timedelta(days=10)).replace(hour=23, minute=59, second=59)
        r = session.get(f"{API}/transactions", headers=auth, params={"end": end.isoformat()})
        assert r.status_code == 200
        notes = [t["note"] for t in r.json()]
        assert "TEST_food dinner" in notes
        assert "TEST_old salary" in notes
        assert "TEST_food lunch" not in notes
        assert "TEST_taxi" not in notes

    def test_combined_search_type_range(self, session, auth, seeded):
        """search 'food' + type=expense + last 30 days -> only the two food expenses."""
        now = seeded["now"]
        start = (now - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59)
        r = session.get(
            f"{API}/transactions",
            headers=auth,
            params={"search": "food", "type": "expense", "start": start.isoformat(), "end": end.isoformat()},
        )
        assert r.status_code == 200, r.text
        items = r.json()
        notes = [t["note"] for t in items]
        assert "TEST_food lunch" in notes
        assert "TEST_food dinner" in notes
        assert "TEST_taxi" not in notes  # filtered out by search
        assert "TEST_old salary" not in notes  # filtered out by range + type
        for t in items:
            assert t["type"] == "expense"

    def test_unauthenticated_blocked(self, session):
        r = session.get(f"{API}/transactions")
        assert r.status_code == 401
