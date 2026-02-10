import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  if (amount == null) return "$0.00"
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatNumber(num: number): string {
  if (num == null) return "0"
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function formatDate(date: string | Date): string {
  if (date == null) return "-"
  const d = new Date(date)
  if (isNaN(d.getTime())) return "-"
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'text-green-700 bg-green-50 border-green-300',
    healthy: 'text-green-700 bg-green-50 border-green-300',
    success: 'text-green-700 bg-green-50 border-green-300',
    completed: 'text-green-700 bg-green-50 border-green-300',
    enabled: 'text-green-700 bg-green-50 border-green-300',
    pending: 'text-amber-700 bg-amber-50 border-amber-300',
    warning: 'text-amber-700 bg-amber-50 border-amber-300',
    running: 'text-blue-700 bg-blue-50 border-blue-300',
    info: 'text-blue-700 bg-blue-50 border-blue-300',
    inactive: 'text-gray-600 bg-gray-50 border-gray-300',
    disabled: 'text-gray-600 bg-gray-50 border-gray-300',
    expired: 'text-gray-600 bg-gray-50 border-gray-300',
    suspended: 'text-red-700 bg-red-50 border-red-300',
    failed: 'text-red-700 bg-red-50 border-red-300',
    error: 'text-red-700 bg-red-50 border-red-300',
    critical: 'text-red-700 bg-red-50 border-red-300',
    danger: 'text-red-700 bg-red-50 border-red-300',
    rejected: 'text-red-700 bg-red-50 border-red-300',
  }
  return map[status.toLowerCase()] || 'text-gray-600 bg-gray-50 border-gray-300'
}
