export type OrderStatus =
  | 'PENDING_CONNECTION'
  | 'CONNECTED'
  | 'COLLECTING_DOCS'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'MAKING_MATERIALS'
  | 'PENDING_DELIVERY'
  | 'DELIVERED'
  | 'APPROVED'
  | 'REJECTED'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_CONNECTION: '待对接',
  CONNECTED: '已对接',
  COLLECTING_DOCS: '资料收集中',
  PENDING_REVIEW: '待审核',
  UNDER_REVIEW: '资料审核中',
  MAKING_MATERIALS: '材料制作中',
  PENDING_DELIVERY: '待交付',
  DELIVERED: '已交付',
  APPROVED: '出签',
  REJECTED: '拒签',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING_CONNECTION: '#8E99A8',
  CONNECTED: '#7CA8B8',
  COLLECTING_DOCS: '#C4A97D',
  PENDING_REVIEW: '#C49A7D',
  UNDER_REVIEW: '#9B8EC4',
  MAKING_MATERIALS: '#7DADA8',
  PENDING_DELIVERY: '#8B8EC4',
  DELIVERED: '#7FA87A',
  APPROVED: '#7FA87A',
  REJECTED: '#B87C7C',
}

export type DocReqStatus =
  | 'PENDING'
  | 'UPLOADED'
  | 'REVIEWING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUPPLEMENT'

export type NotificationType =
  | 'ORDER_NEW'
  | 'ORDER_CREATED'
  | 'STATUS_CHANGE'
  | 'DOC_REVIEWED'
  | 'MATERIAL_UPLOADED'
  | 'MATERIAL_FEEDBACK'
  | 'APPOINTMENT_REMIND'
  | 'SYSTEM'

export const DOC_REQ_STATUS_LABELS: Record<DocReqStatus, string> = {
  PENDING: '待上传',
  UPLOADED: '已上传',
  REVIEWING: '审核中',
  APPROVED: '已合格',
  REJECTED: '需修改',
  SUPPLEMENT: '需补充',
}

export interface Order {
  id: string
  orderNo: string
  externalOrderNo: string | null
  customerName: string
  customerPhone: string
  customerEmail: string | null
  passportNo: string | null
  passportIssue: string | null
  passportExpiry: string | null
  targetCountry: string
  visaType: string
  visaCategory: string | null
  travelDate: string | null
  amount: string
  paymentMethod: string | null
  sourceChannel: string | null
  remark: string | null
  status: OrderStatus
  customerId: string | null
  collectorId: string | null
  operatorId: string | null
  createdBy: string
  appointmentDate: string | null
  fingerprintRequired: boolean
  companyId: string
  createdAt: string
  updatedAt: string
  deliveredAt: string | null
  completedAt: string | null
}

export interface OrderDetail extends Order {
  customer: { id: string; realName: string } | null
  collector: { id: string; realName: string } | null
  operator: { id: string; realName: string } | null
  documentRequirements: DocumentRequirement[]
  visaMaterials: VisaMaterial[]
  orderLogs: OrderLog[]
}

export interface DocumentRequirement {
  id: string
  orderId: string
  name: string
  description: string | null
  isRequired: boolean
  status: DocReqStatus
  rejectReason: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  files: DocumentFile[]
}

export interface DocumentFile {
  id: string
  requirementId: string
  fileName: string
  fileSize: number
  fileType: string
  ossKey: string
  ossUrl: string
  uploadedBy: string
  sortOrder: number
  label: string | null
  createdAt: string
}

export interface VisaMaterial {
  id: string
  orderId: string
  fileName: string
  fileSize: number
  fileType: string
  ossKey: string
  ossUrl: string
  remark: string | null
  uploadedBy: string
  version: number
  createdAt: string
}

export interface OrderLog {
  id: string
  orderId: string
  userId: string
  action: string
  fromStatus: string | null
  toStatus: string | null
  detail: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  user: { realName: string }
}

export interface CreateOrderPayload {
  customerName: string
  customerPhone: string
  customerEmail?: string
  passportNo?: string
  targetCountry: string
  visaType: string
  visaCategory?: string
  travelDate?: string
  amount: number
  paymentMethod?: string
  sourceChannel?: string
  remark?: string
  externalOrderNo?: string
}

export interface OrderQuery {
  page?: number
  pageSize?: number
  status?: OrderStatus
  search?: string
  startDate?: string
  endDate?: string
}

export interface UpdateOrderPayload {
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  passportNo?: string
  targetCountry?: string
  visaType?: string
  visaCategory?: string
  travelDate?: string
  amount?: number
  paymentMethod?: string
  sourceChannel?: string
  remark?: string
}
