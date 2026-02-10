// Dashboard Metrics
export interface DashboardMetrics {
  user: UserMetrics
  financial: FinancialMetrics
  listing: ListingMetrics
  system: SystemMetrics
}

export interface UserMetrics {
  totalUsers: number
  activeUsers24h: number
  activeUsers7d: number
  activeUsers30d: number
  completedOnboarding: number
  pendingVerification: number
  growthTrend: GrowthPoint[]
  engagement: UserEngagement
}

export interface UserEngagement {
  avgSessionDuration: number
  avgSessionsPerUser: number
  topLocations: { location: string; searches: number }[]
  retentionRates: Record<string, number>
  avgTimeToFirstView: number
  avgTimeToFirstSave: number
}

export interface GrowthPoint {
  date: string
  count: number
}

export interface FinancialMetrics {
  totalRevenue: number
  revenueDaily: number
  revenueMonthly: number
  revenueYTD: number
  referralRevenue: number
  nonReferralRevenue: number
  outstandingBalances: number
  failedPayments: number
  discountRedemptions: number
  revenueByType: Record<string, { amount: number; percentage: number }>
  revenueByRegion: Record<string, { amount: number; percentage: number }>
  paymentsByMethod: Record<string, { amount: number; count: number }>
  refundStats: { count: number; amount: number }
}

export interface ListingMetrics {
  totalListings: number
  activeListings: number
  pendingListings: number
  rentedListings: number
  inactiveListings: number
  sponsoredCount: number
  avgQualityScore: number
  conversionRates: {
    viewToSave: number
    saveToContact: number
  }
}

export interface SystemMetrics {
  avgResponseTime: number
  cacheHitRate: number
  memoryUsageMB: number
  cpuUsagePercent: number
  databaseStatus: string
  uptime: number
  errorRate: number
}

// Admin User
export interface AdminUser {
  id: string
  name: string | null
  email: string
  role: 'USER' | 'LANDLORD' | 'ADMIN' | 'HYBRID'
  createdAt: string
  verificationStatus: string | null
  twoFactorEnabled: boolean
  backgroundCheckCompleted: boolean
  salaryVerified: boolean
  idVerified: boolean
  lastLoginAt: string | null
  failedLoginAttempts: number
}

// Admin Listing
export interface AdminListing {
  id: string
  title: string
  description: string | null
  price: number
  bedrooms: number
  bathrooms: number
  propertyType: string
  status: 'ACTIVE' | 'PENDING' | 'RENTED' | 'INACTIVE'
  city: string | null
  state: string | null
  isSponsored: boolean
  isFeatured: boolean
  petsAllowed: boolean
  viewCount: number
  saveCount: number
  contactCount: number
  createdAt: string
  updatedAt: string | null
  user: { id: string; name: string | null; email: string } | null
}

// Pagination
export interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// Audit Log
export interface AuditLog {
  id: string
  category: 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_MODIFICATION' | 'ADMIN_ACTION' | 'SYSTEM_EVENT' | 'COMPLIANCE' | 'PAYMENT'
  action: string
  level: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO'
  userId: string | null
  resourceType: string | null
  resourceId: string | null
  ipAddress: string | null
  complianceFlag: boolean
  riskScore: number | null
  timestamp: string
  user: { id: string; email: string; name: string | null } | null
  metadata: Record<string, unknown> | null
}

// Feature Flag
export interface FeatureFlag {
  id: string
  name: string
  description: string | null
  enabled: boolean
  rolloutPercentage: number
  conditions: Record<string, unknown> | null
  variants: Record<string, unknown> | null
  metadata: {
    createdBy?: string
    createdAt?: string
    updatedBy?: string
    updatedAt?: string
    environment?: string
    tags?: string[]
  } | null
}

// Corporate Partner
export interface CorporatePartner {
  id: string
  name: string
  slug: string | null
  discountPercentage: number
  contactEmail: string | null
  contactName: string | null
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED'
  agreementStartDate: string | null
  agreementEndDate: string | null
  createdAt: string
  _count: { employees: number }
  stats: {
    totalEmployees: number
    employeesWithDiscount: number
    recentSignups: number
    conversionRate: number
  } | null
}

// Monitoring
export interface HealthStatus {
  database: ServiceStatus
  cache: ServiceStatus
  api: ServiceStatus
  overall: 'healthy' | 'degraded' | 'down'
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number | null
  details: string | null
}

// API Usage
export interface APIUsageMetric {
  provider: string
  category: string
  totalRequests: number
  totalCost: number
  avgResponseTime: number
  errorRate: number
  monthlyLimit: number | null
  usagePercentage: number
  recentErrors: { endpoint: string; statusCode: number; errorMessage: string; timestamp: string }[]
}

// Scraping
export interface ScrapingJob {
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: string | null
  endTime: string | null
  progress: {
    marketData: { status: string; collected: number }
    competitors: { status: string; scraped: number }
    indicators: { status: string; calculated: number }
  } | null
  errors: string[]
  summary: {
    totalListingsCollected: number
    totalIndicatorsCalculated: number
    areasProcessed: number
    timeElapsed: string
  } | null
}

// GDPR
export interface GDPRStats {
  totalExportRequests: number
  completedExportRequests: number
  totalDeletionRequests: number
  completedDeletionRequests: number
  usersByRole: Record<string, number>
}

export interface DeletionEligibility {
  eligible: boolean
  blockers: string[]
  warnings: string[]
}
