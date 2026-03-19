export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_OWNER'
  | 'CS_ADMIN'
  | 'CUSTOMER_SERVICE'
  | 'VISA_ADMIN'
  | 'DOC_COLLECTOR'
  | 'OPERATOR'
  | 'OUTSOURCE'
  | 'CUSTOMER'

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: '超级管理员',
  COMPANY_OWNER: '公司负责人',
  CS_ADMIN: '客服部管理员',
  CUSTOMER_SERVICE: '客服',
  VISA_ADMIN: '签证部管理员',
  DOC_COLLECTOR: '资料员',
  OPERATOR: '签证操作员',
  OUTSOURCE: '外包业务员',
  CUSTOMER: '普通用户',
}

export const ROLE_LEVELS: Record<UserRole, number> = {
  SUPER_ADMIN: 1,
  COMPANY_OWNER: 2,
  CS_ADMIN: 3,
  CUSTOMER_SERVICE: 4,
  VISA_ADMIN: 5,
  DOC_COLLECTOR: 6,
  OPERATOR: 7,
  OUTSOURCE: 8,
  CUSTOMER: 9,
}

export interface UserProfile {
  id: string
  username: string
  realName: string
  phone: string
  email: string | null
  role: UserRole
  departmentId: string | null
  companyId: string
  avatar: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  company: {
    name: string
    phone?: string
    email?: string
  }
  user: {
    username: string
    password: string
    realName: string
    phone: string
    email?: string
  }
}
