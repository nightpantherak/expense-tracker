from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import jwt
import bcrypt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr


# ---------------- Config ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', '10080'))

app = FastAPI(title="NSIAP Expense Tracker API")
api_router = APIRouter(prefix="/api")


# ---------------- Auth Helpers ----------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
    }


# ---------------- Models ----------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=60)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TransactionCreate(BaseModel):
    type: str  # "income" | "expense"
    amount: float
    category: str
    note: Optional[str] = ""
    date: Optional[str] = None  # ISO string

class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    note: Optional[str] = None
    date: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    icon: str = "tag"
    color: str = "#3B82F6"
    type: str = "expense"  # expense | income | both

class BudgetSet(BaseModel):
    amount: float
    month: Optional[str] = None  # YYYY-MM


DEFAULT_CATEGORIES = [
    {"name": "Food",          "icon": "utensils",   "color": "#FF6B6B", "type": "expense", "is_default": True},
    {"name": "Travel",        "icon": "plane",      "color": "#3B82F6", "type": "expense", "is_default": True},
    {"name": "Bills",         "icon": "receipt",    "color": "#8B5CF6", "type": "expense", "is_default": True},
    {"name": "Shopping",      "icon": "shopping-bag","color": "#EC4899","type": "expense", "is_default": True},
    {"name": "Entertainment", "icon": "film",       "color": "#22D3EE", "type": "expense", "is_default": True},
    {"name": "Others",        "icon": "more-horizontal", "color": "#A1A1AA", "type": "expense", "is_default": True},
    {"name": "Salary",        "icon": "briefcase",  "color": "#34C759", "type": "income",  "is_default": True},
    {"name": "Gift",          "icon": "gift",       "color": "#F59E0B", "type": "income",  "is_default": True},
]


# ---------------- Auth Endpoints ----------------
@api_router.post("/auth/register")
async def register(payload: RegisterRequest):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name.strip(),
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    # Seed default categories per user
    await db.categories.insert_many([
        {**c, "user_id": user_id, "created_at": datetime.now(timezone.utc)} for c in DEFAULT_CATEGORIES
    ])
    token = create_access_token(user_id, email)
    return {
        "access_token": token,
        "user": {"id": user_id, "email": email, "name": payload.name},
    }


@api_router.post("/auth/login")
async def login(payload: LoginRequest):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email)
    return {
        "access_token": token,
        "user": {"id": str(user["_id"]), "email": user["email"], "name": user.get("name", "")},
    }


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(user=Depends(get_current_user)):
    return {"ok": True}


# ---------------- Categories ----------------
def cat_to_dict(c):
    return {
        "id": str(c["_id"]),
        "name": c["name"],
        "icon": c.get("icon", "tag"),
        "color": c.get("color", "#3B82F6"),
        "type": c.get("type", "expense"),
        "is_default": c.get("is_default", False),
    }

@api_router.get("/categories")
async def list_categories(user=Depends(get_current_user)):
    cats = await db.categories.find({"user_id": user["id"]}).to_list(500)
    return [cat_to_dict(c) for c in cats]


@api_router.post("/categories")
async def create_category(payload: CategoryCreate, user=Depends(get_current_user)):
    doc = {
        "user_id": user["id"],
        "name": payload.name.strip(),
        "icon": payload.icon,
        "color": payload.color,
        "type": payload.type,
        "is_default": False,
        "created_at": datetime.now(timezone.utc),
    }
    res = await db.categories.insert_one(doc)
    doc["_id"] = res.inserted_id
    return cat_to_dict(doc)


@api_router.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, user=Depends(get_current_user)):
    await db.categories.delete_one({"_id": ObjectId(cat_id), "user_id": user["id"], "is_default": False})
    return {"ok": True}


# ---------------- Transactions ----------------
def txn_to_dict(t):
    return {
        "id": str(t["_id"]),
        "type": t["type"],
        "amount": t["amount"],
        "category": t["category"],
        "note": t.get("note", ""),
        "date": t["date"].isoformat() if isinstance(t.get("date"), datetime) else t.get("date"),
        "created_at": t["created_at"].isoformat() if isinstance(t.get("created_at"), datetime) else t.get("created_at"),
    }


def parse_date(s: Optional[str]) -> datetime:
    if not s:
        return datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(s.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return datetime.now(timezone.utc)


@api_router.post("/transactions")
async def create_transaction(payload: TransactionCreate, user=Depends(get_current_user)):
    if payload.type not in ("income", "expense"):
        raise HTTPException(status_code=400, detail="Invalid type")
    doc = {
        "user_id": user["id"],
        "type": payload.type,
        "amount": float(payload.amount),
        "category": payload.category,
        "note": payload.note or "",
        "date": parse_date(payload.date),
        "created_at": datetime.now(timezone.utc),
    }
    res = await db.transactions.insert_one(doc)
    doc["_id"] = res.inserted_id
    return txn_to_dict(doc)


@api_router.get("/transactions")
async def list_transactions(
    user=Depends(get_current_user),
    search: Optional[str] = None,
    category: Optional[str] = None,
    type: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    limit: int = Query(200, le=1000),
):
    q: dict = {"user_id": user["id"]}
    if category:
        q["category"] = category
    if type:
        q["type"] = type
    if start or end:
        range_q: dict = {}
        if start:
            range_q["$gte"] = parse_date(start)
        if end:
            range_q["$lte"] = parse_date(end)
        q["date"] = range_q
    if search:
        q["$or"] = [
            {"note": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
        ]
    cursor = db.transactions.find(q).sort("date", -1).limit(limit)
    items = await cursor.to_list(limit)
    return [txn_to_dict(t) for t in items]


@api_router.patch("/transactions/{tid}")
async def update_transaction(tid: str, payload: TransactionUpdate, user=Depends(get_current_user)):
    update: dict = {}
    data = payload.dict(exclude_unset=True)
    if "date" in data:
        data["date"] = parse_date(data["date"])
    if data:
        update["$set"] = data
        await db.transactions.update_one({"_id": ObjectId(tid), "user_id": user["id"]}, update)
    t = await db.transactions.find_one({"_id": ObjectId(tid), "user_id": user["id"]})
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    return txn_to_dict(t)


@api_router.delete("/transactions/{tid}")
async def delete_transaction(tid: str, user=Depends(get_current_user)):
    await db.transactions.delete_one({"_id": ObjectId(tid), "user_id": user["id"]})
    return {"ok": True}


# ---------------- Budget ----------------
def current_month() -> str:
    now = datetime.now(timezone.utc)
    return f"{now.year:04d}-{now.month:02d}"


@api_router.get("/budget")
async def get_budget(user=Depends(get_current_user), month: Optional[str] = None):
    m = month or current_month()
    b = await db.budgets.find_one({"user_id": user["id"], "month": m})
    amount = b["amount"] if b else 0.0
    # compute spent this month
    year, mo = m.split("-")
    start = datetime(int(year), int(mo), 1, tzinfo=timezone.utc)
    if int(mo) == 12:
        end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(int(year), int(mo) + 1, 1, tzinfo=timezone.utc)
    agg = db.transactions.aggregate([
        {"$match": {"user_id": user["id"], "type": "expense", "date": {"$gte": start, "$lt": end}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ])
    total = 0.0
    async for row in agg:
        total = row["total"]
    percent = (total / amount * 100) if amount > 0 else 0
    return {"month": m, "amount": amount, "spent": total, "percent": percent}


@api_router.post("/budget")
async def set_budget(payload: BudgetSet, user=Depends(get_current_user)):
    m = payload.month or current_month()
    await db.budgets.update_one(
        {"user_id": user["id"], "month": m},
        {"$set": {"amount": float(payload.amount), "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return await get_budget(user=user, month=m)


# ---------------- Analytics ----------------
@api_router.get("/analytics/summary")
async def analytics_summary(user=Depends(get_current_user), month: Optional[str] = None):
    m = month or current_month()
    year, mo = m.split("-")
    start = datetime(int(year), int(mo), 1, tzinfo=timezone.utc)
    if int(mo) == 12:
        end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(int(year), int(mo) + 1, 1, tzinfo=timezone.utc)

    # Total income / expense over all time & this month
    async def sum_type(t: str, date_range=None):
        q = {"user_id": user["id"], "type": t}
        if date_range:
            q["date"] = date_range
        agg = db.transactions.aggregate([
            {"$match": q},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ])
        total = 0.0
        async for row in agg:
            total = row["total"]
        return total

    total_income = await sum_type("income")
    total_expense = await sum_type("expense")
    month_income = await sum_type("income", {"$gte": start, "$lt": end})
    month_expense = await sum_type("expense", {"$gte": start, "$lt": end})

    # Pie chart: expense by category this month
    pie_cursor = db.transactions.aggregate([
        {"$match": {"user_id": user["id"], "type": "expense", "date": {"$gte": start, "$lt": end}}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}},
    ])
    pie = []
    async for row in pie_cursor:
        pie.append({"category": row["_id"], "total": row["total"]})

    # Bar chart: last 7 days expenses
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    days = []
    for i in range(6, -1, -1):
        day_start = today - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        agg = db.transactions.aggregate([
            {"$match": {"user_id": user["id"], "type": "expense", "date": {"$gte": day_start, "$lt": day_end}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ])
        total = 0.0
        async for row in agg:
            total = row["total"]
        days.append({"label": day_start.strftime("%a"), "date": day_start.strftime("%Y-%m-%d"), "total": total})

    # Insights (rule-based)
    insights = []
    if pie:
        top = pie[0]
        insights.append({"icon": "trending-up", "title": f"You spent most on {top['category']}", "detail": f"₹{top['total']:.0f} this month"})
    if month_expense > 0 and month_income > 0:
        ratio = month_expense / month_income
        if ratio > 0.8:
            insights.append({"icon": "alert-triangle", "title": "High spend-to-income ratio", "detail": f"You spent {ratio*100:.0f}% of your income"})
        elif ratio < 0.5:
            insights.append({"icon": "smile", "title": "Great saving pace", "detail": f"Only {ratio*100:.0f}% of your income spent"})
    if len(pie) >= 2 and pie[0]["total"] > pie[1]["total"] * 2:
        insights.append({"icon": "lightbulb", "title": f"Reduce {pie[0]['category']} expenses to save more", "detail": "This category dominates your spending"})
    if not insights:
        insights.append({"icon": "info", "title": "Start tracking to see insights", "detail": "Add a few transactions to get personalized tips"})

    return {
        "month": m,
        "totals": {
            "income": total_income,
            "expense": total_expense,
            "balance": total_income - total_expense,
        },
        "month_totals": {
            "income": month_income,
            "expense": month_expense,
        },
        "pie": pie,
        "bar": days,
        "insights": insights,
    }


# ---------------- Startup ----------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.transactions.create_index([("user_id", 1), ("date", -1)])
    await db.categories.create_index([("user_id", 1), ("name", 1)])
    await db.budgets.create_index([("user_id", 1), ("month", 1)], unique=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
