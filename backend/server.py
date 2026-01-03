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

# LOG HELPER FONKSİYONU
async def create_log(action: str, user_email: str = None, details: dict = None, log_type: str = "info"):
    """
    Log oluştur
    action: Ne yapıldı (örn: "login", "create_business", "delete_appointment")
    user_email: Kim yaptı
    details: Ek bilgiler (dict)
    log_type: "info", "warning", "error", "admin"
    """
    log_entry = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "user_email": user_email,
        "details": details or {},
        "type": log_type
    }
    await db.logs.insert_one(log_entry)
    return log_entry

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

# Super Admin Email
SUPER_ADMIN_EMAIL = os.environ.get('SUPER_ADMIN_EMAIL', '')

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
        
        # Last login güncelle
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi doldu")
    except Exception:
        raise HTTPException(status_code=401, detail="Geçersiz token")

async def get_super_admin(current_user: dict = Depends(get_current_user)):
    """Super admin kontrolü - sadece belirlenen email erişebilir"""
    if current_user.get('email') != SUPER_ADMIN_EMAIL:
        raise HTTPException(
            status_code=403, 
            detail="Bu alana erişim yetkiniz yok"
        )
    return current_user

# ==================== MODELS ====================

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
    
    # 🆕 SUPER ADMIN ALANLARI
    owner_email: Optional[str] = None
    subscription_plan: str = "baslangic"  # baslangic / profesyonel / isletme
    subscription_expires: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=30)
    )
    is_active: bool = True
    last_login: Optional[datetime] = None
    total_appointments: int = 0
    total_staff: int = 0
    total_services: int = 0

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
    last_login: Optional[datetime] = None

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

# 🆕 SUPER ADMIN MODELS
class SuperAdminStats(BaseModel):
    total_businesses: int
    active_businesses: int
    inactive_businesses: int
    total_users: int
    total_appointments: int
    today_appointments: int
    monthly_revenue: float

class BusinessDetail(BaseModel):
    id: str
    name: str
    owner_email: str
    created_at: datetime
    last_login: Optional[datetime]
    staff_count: int
    service_count: int
    appointment_count: int
    subscription_plan: str
    subscription_expires: datetime
    days_remaining: int
    is_active: bool

class SubscriptionUpdate(BaseModel):
    subscription_plan: str
    subscription_expires: datetime

# ==================== AUTH ENDPOINTS ====================

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
    
    # 🆕 LOG EKLE
    await create_log("login", user.email, {"user_id": user.id}, "info")
    
    return Token(access_token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user.pop('password_hash', None)
    if isinstance(current_user.get('created_at'), str):
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
    return User(**current_user)

# ==================== BUSINESS ENDPOINTS ====================

@api_router.post("/businesses", response_model=Business)
async def create_business(business_data: BusinessCreate, current_user: dict = Depends(get_current_user)):
    # Slug kontrolü
    existing = await db.businesses.find_one({"slug": business_data.slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="URL adresi zaten kullanılıyor")
    
    business_dict = business_data.model_dump()
    business_dict['owner_email'] = current_user['email']  # 🆕 Owner email ekle
    business = Business(**business_dict)
    
    doc = business.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['subscription_expires'] = doc['subscription_expires'].isoformat()
    
    await db.businesses.insert_one(doc)
    
    # Kullanıcıya business_id ata
    await create_log(
        "create_business",
        current_user['email'],
        {"business_id": doc['id'], "business_name": doc['name']},
        "info"
    )
    
    return business

@api_router.put("/businesses/{business_id}", response_model=Business)
async def update_business(business_id: str, business_data: BusinessCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get('business_id') != business_id:
        raise HTTPException(status_code=403, detail="Bu işletmeyi güncelleme yetkiniz yok")
    
    existing = await db.businesses.find_one({"slug": business_data.slug, "id": {"$ne": business_id}}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="URL adresi zaten kullanılıyor")
    
    update_data = business_data.model_dump()
    result = await db.businesses.update_one(
        {"id": business_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="İşletme bulunamadı")
    
    updated_business = await db.businesses.find_one({"id": business_id}, {"_id": 0})
    if isinstance(updated_business.get('created_at'), str):
        updated_business['created_at'] = datetime.fromisoformat(updated_business['created_at'])
    if isinstance(updated_business.get('subscription_expires'), str):
        updated_business['subscription_expires'] = datetime.fromisoformat(updated_business['subscription_expires'])
    
    return Business(**updated_business)

@api_router.get("/businesses/{slug}", response_model=Business)
async def get_business_by_slug(slug: str):
    business = await db.businesses.find_one({"slug": slug}, {"_id": 0})
    if not business:
        raise HTTPException(status_code=404, detail="İşletme bulunamadı")
    
    if isinstance(business.get('created_at'), str):
        business['created_at'] = datetime.fromisoformat(business['created_at'])
    if isinstance(business.get('subscription_expires'), str):
        business['subscription_expires'] = datetime.fromisoformat(business['subscription_expires'])
    
    return Business(**business)

@api_router.get("/businesses", response_model=List[Business])
async def get_businesses_list():
    # Sadece aktif ve süresi dolmamış işletmeler
    now = datetime.now(timezone.utc)
    businesses = await db.businesses.find({
        "is_active": True,
        "subscription_expires": {"$gte": now.isoformat()}
    }, {"_id": 0}).to_list(1000)
    for b in businesses:
        if isinstance(b.get('created_at'), str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
    return [Business(**b) for b in businesses]

# ==================== SERVICE ENDPOINTS ====================

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
    
    # 🆕 İşletme total_services güncelle
    await db.businesses.update_one(
        {"id": current_user['business_id']},
        {"$inc": {"total_services": 1}}
    )
    
    return service

@api_router.get("/services/{business_id}", response_model=List[Service])
async def get_services(business_id: str):
    services = await db.services.find({"business_id": business_id}, {"_id": 0}).to_list(1000)
    for s in services:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return [Service(**s) for s in services]

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, service_data: ServiceCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get('business_id'):
        raise HTTPException(status_code=400, detail="Kullanıcı bir işletme ile ilişkilendirilmeli")
    
    update_data = service_data.model_dump()
    result = await db.services.update_one(
        {"id": service_id, "business_id": current_user['business_id']},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    
    updated_service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if isinstance(updated_service.get('created_at'), str):
        updated_service['created_at'] = datetime.fromisoformat(updated_service['created_at'])
    
    return Service(**updated_service)

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.services.delete_one({"id": service_id, "business_id": current_user.get('business_id')})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    
    # 🆕 İşletme total_services güncelle
    await db.businesses.update_one(
        {"id": current_user['business_id']},
        {"$inc": {"total_services": -1}}
    )
    
    await create_log(
        "delete_business",
        current_user['email'],
        {"business_id": business_id, "business_name": business.get('name', 'N/A')},
        "admin"
    )

    return {"message": "Hizmet silindi"}

# ==================== STAFF ENDPOINTS ====================

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
    
    # 🆕 İşletme total_staff güncelle
    await db.businesses.update_one(
        {"id": current_user['business_id']},
        {"$inc": {"total_staff": 1}}
    )
    
    await create_log(
        "create_staff",
        current_user['email'],
        {"staff_id": staff.id, "staff_name": staff.get('name', 'N/A')},
        "info"
    )

    return staff

@api_router.get("/staff/{business_id}", response_model=List[Staff])
async def get_staff(business_id: str):
    staff_list = await db.staff.find({"business_id": business_id}, {"_id": 0}).to_list(1000)
    for s in staff_list:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return [Staff(**s) for s in staff_list]

@api_router.put("/staff/{staff_id}", response_model=Staff)
async def update_staff(staff_id: str, staff_data: StaffCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get('business_id'):
        raise HTTPException(status_code=400, detail="Kullanıcı bir işletme ile ilişkilendirilmeli")
    
    update_data = staff_data.model_dump()
    result = await db.staff.update_one(
        {"id": staff_id, "business_id": current_user['business_id']},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    
    updated_staff = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if isinstance(updated_staff.get('created_at'), str):
        updated_staff['created_at'] = datetime.fromisoformat(updated_staff['created_at'])
    
    return Staff(**updated_staff)

@api_router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.staff.delete_one({"id": staff_id, "business_id": current_user.get('business_id')})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")
    
    # 🆕 İşletme total_staff güncelle
    await db.businesses.update_one(
        {"id": current_user['business_id']},
        {"$inc": {"total_staff": -1}}
    )
    
    return {"message": "Personel silindi"}

# ==================== APPOINTMENT ENDPOINTS ====================

@api_router.post("/appointments/{business_id}", response_model=Appointment)
async def create_appointment(business_id: str, appointment_data: AppointmentCreate):
    # 🆕 İşletme aktif mi ve süresi dolmamış mı kontrol et
    business = await db.businesses.find_one({"id": business_id}, {"_id": 0})
    if not business:
        raise HTTPException(status_code=404, detail="İşletme bulunamadı")
    
    now = datetime.now(timezone.utc)
    subscription_expires = datetime.fromisoformat(business.get('subscription_expires'))
    
    if not business.get('is_active', True):
        raise HTTPException(status_code=403, detail="Bu işletme askıya alınmış")
    
    if subscription_expires < now:
        raise HTTPException(status_code=403, detail="Bu işletmenin aboneliği sona ermiş")
    
    # Hizmet kontrolü (eski kod)
    service = await db.services.find_one({"id": appointment_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    
    staff_name = None
    if appointment_data.staff_id:
        existing_appointments = await db.appointments.find({
            "business_id": business_id,
            "staff_id": appointment_data.staff_id,
            "appointment_date": appointment_data.appointment_date,
            "status": {"$ne": "cancelled"}
        }, {"_id": 0}).to_list(1000)
        
        requested_start = time_to_minutes(appointment_data.time_slot)
        requested_end = requested_start + service['duration']
        
        for existing in existing_appointments:
            existing_start = time_to_minutes(existing['time_slot'])
            existing_end = existing_start + existing['duration']
            
            if check_time_overlap(requested_start, requested_end, existing_start, existing_end):
                raise HTTPException(
                    status_code=400,
                    detail=f"Bu saatte zaten bir randevu var. "
                           f"Mevcut randevu: {existing['time_slot']} ({existing['duration']} dk)"
                )
        
        staff = await db.staff.find_one({"id": appointment_data.staff_id}, {"_id": 0})
        if staff:
            staff_name = staff['name']
    
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
    
    # 🆕 İşletme total_appointments güncelle
    await db.businesses.update_one(
        {"id": business_id},
        {"$inc": {"total_appointments": 1}}
    )
    
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
async def get_appointments(business_id: str): 
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

# ==================== 🆕 SUPER ADMIN ENDPOINTS ====================

@api_router.get("/superadmin/stats", response_model=SuperAdminStats)
async def get_super_admin_stats(current_user: dict = Depends(get_super_admin)):
    """Dashboard istatistikleri"""
    
    # Toplam işletme
    total_businesses = await db.businesses.count_documents({})
    
    # Aktif/Pasif işletmeler
    active_businesses = await db.businesses.count_documents({"is_active": True})
    inactive_businesses = total_businesses - active_businesses
    
    # Toplam kullanıcı
    total_users = await db.users.count_documents({})
    
    # Toplam randevu
    total_appointments = await db.appointments.count_documents({})
    
    # Bugünkü randevular
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    today_appointments = await db.appointments.count_documents({"appointment_date": today})
    
    # Aylık gelir (bu ay oluşturulan randevuların toplamı)
    current_month = datetime.now(timezone.utc).strftime('%Y-%m')
    monthly_appointments = await db.appointments.find({
        "appointment_date": {"$regex": f"^{current_month}"},
        "status": "completed"  # 👈 Sadece tamamlananlar
    }, {"_id": 0, "price": 1}).to_list(10000)
    monthly_revenue = sum(a.get('price', 0) for a in monthly_appointments)
    
    return SuperAdminStats(
        total_businesses=total_businesses,
        active_businesses=active_businesses,
        inactive_businesses=inactive_businesses,
        total_users=total_users,
        total_appointments=total_appointments,
        today_appointments=today_appointments,
        monthly_revenue=monthly_revenue
    )

@api_router.get("/superadmin/businesses", response_model=List[BusinessDetail])
async def get_all_businesses_detail(current_user: dict = Depends(get_super_admin)):
    """Tüm işletmelerin detaylı listesi"""
    
    businesses = await db.businesses.find({}, {"_id": 0}).to_list(1000)
    result = []
    
    for b in businesses:
        # Datetime dönüşümleri
        if isinstance(b.get('created_at'), str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
        if isinstance(b.get('subscription_expires'), str):
            b['subscription_expires'] = datetime.fromisoformat(b['subscription_expires'])
        if isinstance(b.get('last_login'), str):
            b['last_login'] = datetime.fromisoformat(b['last_login'])
        
        # Kalan gün hesapla
        days_remaining = (b['subscription_expires'] - datetime.now(timezone.utc)).days
        
        # Detaylı istatistikler
        staff_count = await db.staff.count_documents({"business_id": b['id']})
        service_count = await db.services.count_documents({"business_id": b['id']})
        appointment_count = await db.appointments.count_documents({"business_id": b['id']})
        
        business_detail = BusinessDetail(
            id=b['id'],
            name=b['name'],
            owner_email=b.get('owner_email', 'N/A'),
            created_at=b['created_at'],
            last_login=b.get('last_login'),
            staff_count=staff_count,
            service_count=service_count,
            appointment_count=appointment_count,
            subscription_plan=b.get('subscription_plan', 'baslangic'),
            subscription_expires=b['subscription_expires'],
            days_remaining=days_remaining,
            is_active=b.get('is_active', True)
        )
        
        result.append(business_detail)
    
    return result

@api_router.patch("/superadmin/business/{business_id}/suspend")
async def suspend_business(business_id: str, suspend: bool, current_user: dict = Depends(get_super_admin)):
    """İşletmeyi askıya al / aktifleştir"""
    
    result = await db.businesses.update_one(
        {"id": business_id},
        {"$set": {"is_active": not suspend}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="İşletme bulunamadı")
    
    return {
        "message": f"İşletme {'askıya alındı' if suspend else 'aktifleştirildi'}",
        "business_id": business_id,
        "is_active": not suspend
    }

@api_router.put("/superadmin/business/{business_id}/subscription")
async def update_subscription(
    business_id: str, 
    subscription_data: SubscriptionUpdate, 
    current_user: dict = Depends(get_super_admin)
):
    """İşletme aboneliğini güncelle"""
    
    result = await db.businesses.update_one(
        {"id": business_id},
        {"$set": {
            "subscription_plan": subscription_data.subscription_plan,
            "subscription_expires": subscription_data.subscription_expires.isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="İşletme bulunamadı")
    
    await create_log(
        "update_subscription",
        current_user['email'],
        {
            "business_id": business_id,
            "new_plan": subscription_data.subscription_plan,
            "new_expires": subscription_data.subscription_expires.isoformat()  # ← .isoformat() ekle
        },
        "admin"
    )
    
    return {"message": "Abonelik güncellendi"}  # ← return ekle

    return {
        "message": "Abonelik güncellendi",
        "business_id": business_id,
        "subscription_plan": subscription_data.subscription_plan,
        "subscription_expires": subscription_data.subscription_expires
    }

@api_router.delete("/superadmin/business/{business_id}")
async def delete_business(business_id: str, current_user: dict = Depends(get_super_admin)):
    """İşletmeyi ve ilgili tüm verileri sil"""
    
    # İşletme var mı kontrol et
    business = await db.businesses.find_one({"id": business_id}, {"_id": 0})
    if not business:
        raise HTTPException(status_code=404, detail="İşletme bulunamadı")
    
    # İlgili verileri sil
    await db.services.delete_many({"business_id": business_id})
    await db.staff.delete_many({"business_id": business_id})
    await db.appointments.delete_many({"business_id": business_id})
    
    # İşletme sahibinin business_id'sini temizle
    await db.users.delete_many({"business_id": business_id})
    
    # İşletmeyi sil
    await db.users.delete_many({"business_id": business_id})
    
    return {
        "message": "İşletme ve tüm ilgili veriler silindi",
        "business_id": business_id,
        "business_name": business.get('name', 'N/A')
    }

@api_router.get("/superadmin/logs")
async def get_logs(
    limit: int = 100,
    log_type: str = None,
    current_user: dict = Depends(get_super_admin)
):
    """Son logları getir"""
    filter_query = {}
    if log_type:
        filter_query["type"] = log_type
    
    logs = await db.logs.find(filter_query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return logs

@api_router.post("/superadmin/migrate")
async def migrate_existing_businesses(current_user: dict = Depends(get_super_admin)):
    """Mevcut işletmelere varsayılan abonelik bilgileri ekle"""
    
    businesses = await db.businesses.find({}, {"_id": 0}).to_list(1000)
    updated_count = 0
    
    for business in businesses:
        # Eğer yeni alanlar yoksa ekle
        if 'subscription_plan' not in business:
            default_expires = datetime.now(timezone.utc) + timedelta(days=30)
            
            update_fields = {
                "subscription_plan": "baslangic",
                "subscription_expires": default_expires.isoformat(),
                "is_active": True,
                "total_appointments": 0,
                "total_staff": 0,
                "total_services": 0
            }
            
            # Owner email'i bul
            owner = await db.users.find_one({"business_id": business['id']}, {"_id": 0})
            if owner:
                update_fields["owner_email"] = owner['email']
            
            await db.businesses.update_one(
                {"id": business['id']},
                {"$set": update_fields}
            )
            
            updated_count += 1
    
    return {
        "message": f"{updated_count} işletme güncellendi",
        "total_businesses": len(businesses),
        "updated": updated_count
    }

# ==================== APP SETUP ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # Veya ["http://localhost:3000"]
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