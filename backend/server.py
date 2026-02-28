from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    
class UserCreate(BaseModel):
    name: str


class Item(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    amount: float
    currency: str = "DKK"
    type: Literal["cart", "expense"] = "cart"
    paidBy: Optional[str] = None  # userId who paid
    isDivided: bool = False  # Whether expense was divided/split
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    createdBy: str  # userId who created
    
class ItemCreate(BaseModel):
    name: str
    amount: float
    type: Literal["cart", "expense"] = "cart"
    paidBy: Optional[str] = None
    createdBy: str
    isDivided: bool = False

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[Literal["cart", "expense"]] = None
    paidBy: Optional[str] = None
    isDivided: Optional[bool] = None


# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "Shared Expense Tracker API"}


# User endpoints
@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(100)
    return [User(**user) for user in users]


@api_router.post("/users", response_model=User)
async def create_user(input: UserCreate):
    # Check if user with same name exists
    existing = await db.users.find_one({"name": input.name})
    if existing:
        return User(**existing)
    
    user_dict = input.model_dump()
    user_obj = User(**user_dict)
    await db.users.insert_one(user_obj.model_dump())
    return user_obj


@api_router.post("/users/init")
async def init_users():
    """Initialize the two default users: Matias and Agustina"""
    users_to_create = ["Matias", "Agustina"]
    created_users = []
    
    for name in users_to_create:
        existing = await db.users.find_one({"name": name})
        if existing:
            created_users.append(User(**existing))
        else:
            user_obj = User(name=name)
            await db.users.insert_one(user_obj.model_dump())
            created_users.append(user_obj)
    
    return {"users": [u.model_dump() for u in created_users]}


# Item endpoints
@api_router.get("/items", response_model=List[Item])
async def get_items(type: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type
    items = await db.items.find(query).sort("createdAt", -1).to_list(1000)
    return [Item(**item) for item in items]


@api_router.post("/items", response_model=Item)
async def create_item(input: ItemCreate):
    item_dict = input.model_dump()
    item_obj = Item(**item_dict)
    await db.items.insert_one(item_obj.model_dump())
    return item_obj


@api_router.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: str):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return Item(**item)


@api_router.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: str, input: ItemUpdate):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    if update_data:
        await db.items.update_one({"id": item_id}, {"$set": update_data})
    
    updated_item = await db.items.find_one({"id": item_id})
    return Item(**updated_item)


@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str):
    result = await db.items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}


@api_router.put("/items/{item_id}/toggle-divided", response_model=Item)
async def toggle_divided(item_id: str):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    new_divided = not item.get("isDivided", False)
    await db.items.update_one({"id": item_id}, {"$set": {"isDivided": new_divided}})
    
    updated_item = await db.items.find_one({"id": item_id})
    return Item(**updated_item)


@api_router.put("/items/{item_id}/move-to-expense", response_model=Item)
async def move_to_expense(item_id: str, paid_by: str):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await db.items.update_one(
        {"id": item_id}, 
        {"$set": {"type": "expense", "paidBy": paid_by}}
    )
    
    updated_item = await db.items.find_one({"id": item_id})
    return Item(**updated_item)


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
