export interface CostItem {
  id: string
  containerId: string
  title: string
  amount: number
  currency: string
  notes?: string | null
  isPaid: boolean
  paidDate?: Date | string | null
  paidAmount?: number | null
  paymentReference?: string | null
  createdBy?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface AgentPayment {
  id: string
  agentId: string
  containerId: string
  amount: number
  currency: string
  description?: string | null
  paymentDate: Date | string
  paymentMethod?: string | null
  reference?: string | null
  notes?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ContainerWithCosts {
  id: string
  containerNumber: string
  carrierId?: string | null
  carrier?: { id: string; name: string; code: string } | null
  agentId?: string | null
  agent?: { id: string; name: string; email?: string | null; phone?: string | null; company?: string | null } | null
  routeType: 'SEA' | 'AIR' | 'LAND' | 'MULTI'
  origin: string
  destination: string
  departureDate?: Date | string | null
  arrivalDate?: Date | string | null
  costItems: CostItem[]
  agentPayments: AgentPayment[]
  totalCost?: number | null
  totalAgentFees?: number | null
  status: 'PLANNING' | 'LOADING' | 'DEPARTED' | 'IN_TRANSIT' | 'AT_CUSTOMS' | 'ARRIVED' | 'DELIVERED' | 'CANCELLED'
  notes?: string | null
  purchaseOrders?: any[]
  orders?: any[]
  routes?: any[]
  createdAt: Date | string
  updatedAt: Date | string
}
