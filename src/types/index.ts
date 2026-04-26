export type UserRole = 'manager' | 'admin'
export type PaymentStatus = 'UNPAID' | 'PAID'
export type EventType = 'INDIVIDUAL' | 'RELAY'
export type Gender = 'MALE' | 'FEMALE' | 'MIXED'

export interface User {
  id: string
  name: string
  email: string
  institution: string
  role: UserRole
  created_at: string
}

export interface Athlete {
  id: string
  user_id: string
  name: string
  gender: Gender
  category: string
  institution: string
  created_at: string
}

export interface Event {
  id: string
  code: string
  name: string
  gender: Gender
  category: string
  stroke: string
  distance: string
  type: EventType
  price: number
}

export interface Registration {
  id: string
  athlete_id: string
  event_id: string
  created_at: string
}

export interface Payment {
  id: string
  athlete_id: string
  total_amount: number
  status: PaymentStatus
  proof_url: string | null
  created_at: string
}

// Joined / view types
export interface AthleteWithDetails extends Athlete {
  events: EventSummary[]
  payment: Payment | null
  manager_name: string
}

export interface EventSummary {
  id: string
  code: string
  name: string
  type: EventType
  price: number
}

export interface DashboardStats {
  total_athletes: number
  total_paid: number
  total_unpaid: number
  total_revenue: number
  total_registrations: number
}
