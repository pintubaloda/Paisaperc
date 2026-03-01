export enum UserRole {
  ADMIN = 'admin',
  RETAILER = 'retailer',
  DISTRIBUTOR = 'distributor',
  SUPER_DISTRIBUTOR = 'super_distributor',
  API_USER = 'api_user',
}

export enum TransactionStatus {
  INIT = 'init',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum ServiceType {
  MOBILE = 'mobile',
  DTH = 'dth',
  BILL_PAYMENT = 'bill_payment',
}

export enum PaymentRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum APIMethod {
  GET = 'GET',
  POST = 'POST',
  POST_JSON = 'POST_JSON',
  POSTDATA = 'POSTDATA',
}

export enum CommissionType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
}

export enum ResponseType {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export enum ResponseAction {
  NONE = 'NONE',
  REFUND = 'REFUND',
  CHECK_STATUS = 'CHECK_STATUS',
}
