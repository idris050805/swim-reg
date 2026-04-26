import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export const EVENT_PRICE = {
  INDIVIDUAL: 125000,
  RELAY: 250000,
} as const

export const CATEGORIES = ['U-10', 'U-12', 'U-14', 'U-16', 'U-18', 'U-20', 'OPEN'] as const
export const STROKES = ['Gaya Bebas', 'Gaya Punggung', 'Gaya Dada', 'Gaya Kupu-Kupu', 'Gaya Ganti'] as const
export const DISTANCES = ['25m', '50m', '100m', '200m', '400m', '800m', '1500m'] as const
