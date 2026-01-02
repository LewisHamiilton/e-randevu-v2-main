from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta, date, time
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def time_to_minutes(time_str: str) -> int:
    """Saat string'ini dakikaya çevir (örn: '13:30' -> 810)"""
    hours, minutes = map(int, time_str.split(':'))
    return hours * 60 + minutes

def check_time_overlap(start1: int, end1: int, start2: int, end2: int) -> bool:
    """İki zaman aralığının çakışıp çakışmadığını kontrol et"""
    return start1 < end2 and end1 > start2

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Geçersiz token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi doldu")
    except Exception:
        raise HTTPException(status_code=401, detail="Geçersiz token")

class Business(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    working_hours: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BusinessCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_id: str
    name: str
    description: Optional[str] = None
    duration: int
    price: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration: int
    price: float

class Staff(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    services: List[str] = Field(default_factory=list)
    working_days: List[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5])
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StaffCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    services: List[str] = Field(default_factory=list)
    working_days: List[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5])

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_id: str
    customer_name: str
    customer_phone: str
    service_id: str
    service_name: str
    staff_id: Optional[str] = None
    staff_name: Optional[str] = None
    appointment_date: str
    time_slot: str
    duration: int
    price: float
    status: str = "confirmed"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AppointmentCreate(BaseModel):
    customer_name: str
    customer_phone: str
    service_id: str
    staff_id: Optional[str] = None
    appointment_date: str
    time_slot: str
    notes: Optional[str] = None

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    business_id: Optional[str] = None
    role: str = "business_owner"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    business_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="E-posta zaten kayıtlı")
    
    user_dict = user_data.model_dump(exclude={"password"})
    user = User(**user_dict)
    
    doc = user.model_dump()
    doc['password_hash'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    token = create_access_token({"sub": user.id, "email": user.email})
    return Token(access_token=token, user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Geçersiz e-posta veya şifre")
    
    user_doc.pop('password_hash', None)
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    token = create_access_token({"sub": user.id, "email": user.email})
    
    return Token(access_token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user.pop('password_hash', None)
    if isinstance(current_user.get('created_at'), str):
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
    return User(**current_user)

@api_router.post("/businesses", response_model=Business)
async def create_business(business_data: BusinessCreate, current_user: dict = Depends(get_current_user)):
    # Slug kontrolü
    existing = await db.businesses.find_one({"slug": business_data.slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Bu slug zaten kullanılıyor")
    
    business_dict = business_data.model_dump()
    business_dict['id'] = str(uuid.uuid4())
    business_dict['created_at'] = datetime.now()
    
    business = Business(**business_dict)
    await db.businesses.insert_one(business.model_dump())
    
    # User'ı güncelle
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"business_id": business.id}}
    )
    
    return business

@api_router.get("/businesses/{slug}", response_model=Business)
async def get_business_by_slug(slug: str):
    business = await db.businesses.find_one({"slug": slug}, {"_id": 0})
    if not business:
        raise HTTPException(status_code=404, detail="İşletme bulunamadı")
    
    if isinstance(business.get('created_at'), str):
        business['created_at'] = datetime.fromisoformat(business['created_at'])
    
    return Business(**business)

@api_router.get("/businesses", response_model=List[Business])
async def get_all_businesses():
    businesses = await db.businesses.find({}, {"_id": 0}).to_list(1000)
    for b in businesses:
        if isinstance(b.get('created_at'), str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
    return [Business(**b) for b in businesses]

@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get('business_id'):
        raise HTTPException(status_code=400, detail="Kullanıcı bir işletme ile ilişkilendirilmeli")
    
    service_dict = service_data.model_dump()
    service_dict['business_id'] = current_user['business_id']
    service = Service(**service_dict)
    
    doc = service.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.services.insert_one(doc)
    return service

@api_router.get("/services/{business_id}", response_model=List[Service])
async def get_services(business_id: str):
    services = await db.services.find({"business_id": business_id}, {"_id": 0}).to_list(1000)
    for s in services:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return [Service(**s) for s in services]

@api_router.put("/staff/{staff_id}", response_model=Staff)
async def update_staff(staff_id: str, staff_data: StaffCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get('business_id'):
        raise HTTPException(status_code=400, detail="Kullanıcı bir işletme ile ilişkilendirilmeli")
    
    # Personeli güncelle
    update_data = staff_data.model_dump()
    result = await db.staff.update_one(
        {"id": staff_id, "business_id": current_user['business_id']},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    
    # Güncellenmiş personeli getir
    updated_staff = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if isinstance(updated_staff.get('created_at'), str):
        updated_staff['created_at'] = datetime.fromisoformat(updated_staff['created_at'])
    
    return Staff(**updated_staff)

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, service_data: ServiceCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get('business_id'):
        raise HTTPException(status_code=400, detail="Kullanıcı bir işletme ile ilişkilendirilmeli")
    
    # Hizmeti güncelle
    update_data = service_data.model_dump()
    result = await db.services.update_one(
        {"id": service_id, "business_id": current_user['business_id']},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    
    # Güncellenmiş hizmeti getir
    updated_service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if isinstance(updated_service.get('created_at'), str):
        updated_service['created_at'] = datetime.fromisoformat(updated_service['created_at'])
    
    return Service(**updated_service)

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.services.delete_one({"id": service_id, "business_id": current_user.get('business_id')})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    return {"message": "Hizmet silindi"}

@api_router.post("/staff", response_model=Staff)
async def create_staff(staff_data: StaffCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get('business_id'):
        raise HTTPException(status_code=400, detail="Kullanıcı bir işletme ile ilişkilendirilmeli")
    
    staff_dict = staff_data.model_dump()
    staff_dict['business_id'] = current_user['business_id']
    staff = Staff(**staff_dict)
    
    doc = staff.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.staff.insert_one(doc)
    return staff

@api_router.get("/staff/{business_id}", response_model=List[Staff])
async def get_staff(business_id: str):
    staff_list = await db.staff.find({"business_id": business_id}, {"_id": 0}).to_list(1000)
    for s in staff_list:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return [Staff(**s) for s in staff_list]

@api_router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.staff.delete_one({"id": staff_id, "business_id": current_user.get('business_id')})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    return {"message": "Personel silindi"}

@api_router.get("/appointments/availability")
async def check_availability(business_id: str, staff_id: str, appointment_date: str, time_slot: str):
    existing = await db.appointments.find_one({
        "business_id": business_id,
        "staff_id": staff_id,
        "appointment_date": appointment_date,
        "time_slot": time_slot,
        "status": {"$ne": "cancelled"}
    })
    
    return {"available": existing is None}

@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appointment_data: AppointmentCreate, business_id: str):
    # Hizmet bilgisini al
    service = await db.services.find_one({"id": appointment_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    
    # Yeni randevunun başlangıç ve bitiş zamanını hesapla
    new_start_minutes = time_to_minutes(appointment_data.time_slot)
    new_end_minutes = new_start_minutes + service['duration']
    
    staff_name = None
    if appointment_data.staff_id:
        # O personelin o tarihteki tüm randevularını al
        existing_appointments = await db.appointments.find({
            "business_id": business_id,
            "staff_id": appointment_data.staff_id,
            "appointment_date": appointment_data.appointment_date,
            "status": {"$ne": "cancelled"}
        }, {"_id": 0}).to_list(1000)
        
        # Her randevuyla çakışma kontrolü yap
        for existing in existing_appointments:
            existing_start = time_to_minutes(existing['time_slot'])
            existing_end = existing_start + existing['duration']
            
            if check_time_overlap(new_start_minutes, new_end_minutes, existing_start, existing_end):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Bu saat aralığı dolu. Mevcut randevu: {existing['time_slot']} ({existing['duration']} dk)"
                )
        
        # Personel bilgisini al
        staff = await db.staff.find_one({"id": appointment_data.staff_id}, {"_id": 0})
        if staff:
            staff_name = staff['name']
    
    # Randevuyu oluştur
    appointment_dict = appointment_data.model_dump()
    appointment_dict['business_id'] = business_id
    appointment_dict['service_name'] = service['name']
    appointment_dict['staff_name'] = staff_name
    appointment_dict['duration'] = service['duration']
    appointment_dict['price'] = service['price']
    
    appointment = Appointment(**appointment_dict)
    
    doc = appointment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.appointments.insert_one(doc)
    
    business = await db.businesses.find_one({"id": business_id}, {"_id": 0})
    business_name = business['name'] if business else 'İşletme'
    
    print(f"\n[SMS - {appointment.customer_phone}] Randevunuz onaylandı - {business_name}")
    print(f"Hizmet: {appointment.service_name}")
    print(f"Tarih: {appointment.appointment_date} saat {appointment.time_slot}")
    if staff_name:
        print(f"Personel: {staff_name}")
    print(f"[SMS - İşletme] Yeni randevu: {appointment.customer_name} - {appointment.appointment_date}\n")
    
    return appointment

@api_router.get("/appointments/{business_id}", response_model=List[Appointment])
async def get_appointments(business_id: str, current_user: dict = Depends(get_current_user)):
    appointments = await db.appointments.find({"business_id": business_id}, {"_id": 0}).sort("appointment_date", -1).to_list(1000)
    for a in appointments:
        if isinstance(a.get('created_at'), str):
            a['created_at'] = datetime.fromisoformat(a['created_at'])
    return [Appointment(**a) for a in appointments]

@api_router.patch("/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, status: str, current_user: dict = Depends(get_current_user)):
    result = await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    
    return {"message": "Durum güncellendi"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()