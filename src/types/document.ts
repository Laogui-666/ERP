export type DocReqStatus =
  | 'PENDING'
  | 'UPLOADED'
  | 'REVIEWING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUPPLEMENT'

export interface DocumentRequirement {
  id: string
  orderId: string
  companyId: string
  name: string
  description: string | null
  isRequired: boolean
  status: DocReqStatus
  rejectReason: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface DocumentFile {
  id: string
  requirementId: string
  companyId: string
  fileName: string
  fileSize: number
  fileType: string
  ossKey: string
  ossUrl: string
  uploadedBy: string
  createdAt: string
}

export interface CreateDocRequirementPayload {
  name: string
  description?: string
  isRequired?: boolean
  sortOrder?: number
}
