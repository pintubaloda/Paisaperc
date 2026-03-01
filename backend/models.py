from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    RETAILER = "retailer"
    DISTRIBUTOR = "distributor"
    SUPER_DISTRIBUTOR = "super_distributor"
    API_USER = "api_user"

class TransactionStatus(str, Enum):
    INIT = "init"
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

class ServiceType(str, Enum):
    MOBILE = "mobile"
    DTH = "dth"
    BILL_PAYMENT = "bill_payment"

class PaymentRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    mobile: str
    name: str
    role: UserRole

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    mobile: str
    role: UserRole
    kyc_status: bool = False
    is_active: bool = True
    created_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

# Wallet Models
class Wallet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    balance: float = 0.0
    locked_balance: float = 0.0
    updated_at: datetime

class LedgerEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    txn_id: Optional[str] = None
    debit: float = 0.0
    credit: float = 0.0
    balance_after: float
    type: str
    remark: str
    timestamp: datetime

# Operator Models
class OperatorCreate(BaseModel):
    name: str
    service: ServiceType
    op_code: str
    state_code: Optional[str] = None
    is_active: bool = True

class Operator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    service: ServiceType
    op_code: str
    state_code: Optional[str] = None
    is_active: bool
    created_at: datetime

# API Models
class APIParameter(BaseModel):
    field_name: str
    field_value: str
    is_dynamic: bool = False

class APICreate(BaseModel):
    name: str
    api_type: ServiceType
    protocol: str = "https"
    domain: str
    endpoint: str
    method: Literal["GET", "POST", "POST_JSON", "POSTDATA"]
    parameters: List[APIParameter] = []
    is_active: bool = True

class APIMaster(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    api_type: ServiceType
    protocol: str
    domain: str
    endpoint: str
    method: str
    parameters: List[APIParameter]
    is_active: bool
    success_rate: float = 100.0
    balance: float = 0.0
    created_at: datetime

# Commission Models
class CommissionCreate(BaseModel):
    role: UserRole
    operator_id: str
    commission_type: Literal["percentage", "flat"]
    commission_value: float

class Commission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    role: UserRole
    operator_id: str
    commission_type: str
    commission_value: float
    created_at: datetime

# Routing Models
class RoutingRuleCreate(BaseModel):
    role: Optional[UserRole] = None
    operator_id: Optional[str] = None
    api_id: str
    min_amount: float = 0.0
    max_amount: float = 999999.0
    priority: int = 1

class RoutingRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    role: Optional[UserRole]
    operator_id: Optional[str]
    api_id: str
    min_amount: float
    max_amount: float
    priority: int
    created_at: datetime

# Recharge Models
class RechargeRequest(BaseModel):
    operator_id: str
    mobile: str
    amount: float
    circle: Optional[str] = None

class RechargeTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    operator_id: str
    api_id: Optional[str] = None
    mobile: str
    amount: float
    commission: float = 0.0
    status: TransactionStatus
    provider_ref: Optional[str] = None
    response_code: Optional[str] = None
    response_message: Optional[str] = None
    circle: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Payment Request Models
class PaymentRequestCreate(BaseModel):
    amount: float
    payment_mode: str
    reference_number: str
    remarks: Optional[str] = None

class PaymentRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    amount: float
    payment_mode: str
    reference_number: str
    proof_url: Optional[str] = None
    status: PaymentRequestStatus
    admin_remarks: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class PaymentRequestUpdate(BaseModel):
    status: PaymentRequestStatus
    admin_remarks: Optional[str] = None

# Response Master Models
class ResponseMasterCreate(BaseModel):
    key: str
    message: str
    response_type: Literal["SUCCESS", "FAILED", "PENDING"]
    error_code: Optional[str] = None
    action: Literal["NONE", "REFUND", "CHECK_STATUS"]

class ResponseMaster(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    key: str
    message: str
    response_type: str
    error_code: Optional[str]
    action: str
    created_at: datetime

# Stats Models
class DashboardStats(BaseModel):
    total_users: int
    total_transactions: int
    total_volume: float
    today_transactions: int
    today_volume: float
    wallet_balance: Optional[float] = None
    pending_recharges: int
    success_rate: float
