'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  Users, DollarSign, TrendingUp, TrendingDown, Calendar,
  Plus, Search, Filter, Eye, EyeOff, Edit, Trash2, RefreshCw,
  Globe, Server, Mail, Wrench, Search as SeoIcon, AlertCircle,
  Building, Phone, Clock, ChevronRight, Bell, BellOff, X, Check,
  Settings, BarChart3, PieChart, Activity, Target, Zap, Star,
  AlertTriangle, Info, CheckCircle, XCircle, Timer, Wallet,
  FileText, Link, Shield, Sparkles, Award, Heart, ExternalLink,
  LayoutGrid, List, AlignJustify, Trash, Archive, RotateCcw,
  Maximize2, Minimize2, Languages, LogOut, Download, FileSpreadsheet,
  UserPlus, Receipt, CalendarClock, SlidersHorizontal, Sun, Moon, Lock,
  CreditCard, Send, ChevronDown, Palette, Upload, ImageIcon, StickyNote,
  MessageCircle, Bot, Loader2
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts'
import { translations, type Language } from '@/lib/translations'
import { useRouter } from 'next/navigation'
import {
  exportToCSV,
  exportToExcel,
  prepareClientsForExport,
  prepareServicesForExport,
  prepareDomainsForExport,
  prepareHostingForExport,
  prepareFinanceForExport,
  clientExportColumns,
  serviceExportColumns,
  domainExportColumns,
  hostingExportColumns,
  financeExportColumns,
} from '@/lib/export'
import { useTheme } from 'next-themes'

// User permissions type
interface UserPermissions {
  clients: boolean
  services: boolean
  hosting: boolean
  domains: boolean
  payments: boolean
  invoices: boolean
  alarms: boolean
  reminders: boolean
  trash: boolean
  audit: boolean
  stats: boolean
  config: boolean
}

// User type
interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  permissions?: UserPermissions
}

// Default permissions
const DEFAULT_PERMISSIONS: UserPermissions = {
  clients: true,
  services: true,
  hosting: true,
  domains: true,
  payments: true,
  invoices: true,
  alarms: true,
  reminders: true,
  trash: true,
  audit: true,
  stats: true,
  config: true
}

// Types
interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string | null
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  notes: string | null
  createdAt: string
  contractStart?: string | null
  contractEnd?: string | null
  contractYears?: number | null
  city?: string | null
  monthlyRevenue: number
  monthlyCosts?: number
  monthlyProfit?: number
  services: ClientService[]
  hosting: Hosting[]
  domains: Domain[]
  alarms?: ClientAlarm[]
  deletedAt?: string | null
  _count?: {
    services: number
    hosting: number
    domains: number
  }
}

interface ClientService {
  id: string
  serviceType: string
  description: string | null
  startDate: string
  renewalDate: string | null
  monthlyPrice: number
  annualPrice: number | null
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
}

interface Hosting {
  id: string
  provider: string
  plan: string
  username: string | null
  panelUrl: string | null
  renewalDate: string | null
  monthlyCost: number
}

interface Domain {
  id: string
  domainName: string
  registrar: string
  registrationDate: string
  renewalDate: string
  cost: number
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING'
}

interface ClientAlarm {
  id: string
  clientId: string
  type: string
  title: string
  description: string | null
  alarmDate: string
  priority: string
  isActive: boolean
  daysBefore: number
  isRecurring: boolean
  client?: { id: string; name: string; company: string }
  deletedAt?: string | null
}

interface Reminder {
  id: string
  type: string
  message: string
  reminderDate: string
  status: string
  clientId?: string | null
  client?: { id: string; name: string; company: string } | null
  deletedAt?: string | null
}

interface Payment {
  id: string
  clientId: string
  entityType: 'SERVICE' | 'HOSTING' | 'DOMAIN' | 'CUSTOM'
  entityId: string
  amount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  stripePaymentId: string | null
  stripeSessionId: string | null
  paymentMethod: string | null
  description: string | null
  dueDate: string | null
  paidAt: string | null
  createdAt: string
  client: {
    id: string
    name: string
    company: string
    email: string
  }
}

interface PaymentTotals {
  total: number
  pending: number
  paid: number
  failed: number
  pendingAmount: number
  paidAmount: number
}

interface NotificationConfig {
  id: string
  serviceRenewalEnabled: boolean
  serviceRenewalDays: string
  domainExpiryEnabled: boolean
  domainExpiryDays: string
  hostingRenewalEnabled: boolean
  hostingRenewalDays: string
  contractEndEnabled: boolean
  contractEndDays: string
  anniversaryEnabled: boolean
  anniversaryYears: string
  inactiveClientEnabled: boolean
  inactiveClientDays: number
  customAlarmsEnabled: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}

interface TrashConfig {
  id: string
  autoDeleteDays: number
  autoDeleteEnabled: boolean
}

interface TrashData {
  clients: Client[]
  reminders: Reminder[]
  alarms: ClientAlarm[]
  config: TrashConfig
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  subtotal: number
  taxAmount: number
  total: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  client?: {
    id: string
    name: string
    company: string
    email: string
    phone?: string | null
  }
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  issueDate: string
  dueDate: string
  language: string
  subtotal: number
  taxAmount: number
  total: number
  notes?: string | null
  terms?: string | null
  items: InvoiceItem[]
  sentAt?: string | null
  paidAt?: string | null
  createdAt: string
}

interface CalendarNote {
  id: string
  date: string
  title: string
  description?: string | null
  color: string
  createdAt: string
  updatedAt: string
}

interface ClientFile {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  description?: string | null
  category: string
  createdAt: string
  updatedAt: string
}

interface AssistantLink {
  tipo: 'cliente' | 'servicio' | 'dominio' | 'hosting' | 'pago'
  id: string
  label: string
  sublabel?: string
  url: string
}

interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
  links?: AssistantLink[]
  acciones?: string[]
}

interface DayEvent {
  id: string
  type: 'service' | 'domain' | 'hosting' | 'alarm' | 'contract' | 'reminder' | 'invoice' | 'note'
  client?: string
  description: string
  price?: number
  priority?: string
  status?: string
  color: string
  clientId?: string
  noteId?: string
}

interface SystemConfig {
  id: string
  companyName: string
  primaryColor: string
  companyLogo: string | null
  currency: string
  language: string
  timezone: string
  dateFormat: string
  // SMTP fields
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
  emailFrom?: string
  emailFromName?: string
  availableCurrencies?: Array<{ code: string; name: string; symbol: string; locale: string }>
  availableLanguages?: Array<{ code: string; name: string; flag: string }>
}

interface DashboardData {
  clients: {
    total: number
    active: number
    paused: number
    cancelled: number
    recent: Array<{
      id: string
      name: string
      company: string
      email: string
      status: string
      createdAt: string
      monthlyRevenue: number
      monthlyCosts: number
      monthlyProfit: number
    }>
  }
  finances: {
    monthlyRevenue: number
    monthlyCosts: number
    monthlyProfit: number
    annualRevenue: number
    annualCosts: number
    annualProfit: number
  }
  renewals: {
    services: Array<any>
    domains: Array<any>
    hosting: Array<any>
  }
  reminders: Reminder[]
  chart: Array<{
    month: string
    revenue: number
    costs: number
    profit: number
  }>
  servicesDistribution: Array<{
    type: string
    count: number
  }>
}

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6']

export default function Dashboard() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [alarms, setAlarms] = useState<ClientAlarm[]>([])
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig | null>(null)
  const [trashData, setTrashData] = useState<TrashData | null>(null)
  const [trashConfig, setTrashConfig] = useState<TrashConfig | null>(null)
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
  const [currentLanguage, setCurrentLanguage] = useState<Language>('es')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    dateType: 'createdAt',
    revenueMin: '',
    revenueMax: '',
    serviceType: '',
    profitMin: '',
    profitMax: '',
  })
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [showAddClientDialog, setShowAddClientDialog] = useState(false)
  const [showEditClientDialog, setShowEditClientDialog] = useState(false)
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false)
  const [showAddHostingDialog, setShowAddHostingDialog] = useState(false)
  const [showAddDomainDialog, setShowAddDomainDialog] = useState(false)
  const [showAddAlarmDialog, setShowAddAlarmDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showEditServiceDialog, setShowEditServiceDialog] = useState(false)
  const [showEditHostingDialog, setShowEditHostingDialog] = useState(false)
  const [showEditDomainDialog, setShowEditDomainDialog] = useState(false)
  const [showAuditLogDialog, setShowAuditLogDialog] = useState(false)
  const [isAuditLogMaximized, setIsAuditLogMaximized] = useState(false)
  const [editingService, setEditingService] = useState<ClientService | null>(null)
  const [editingHosting, setEditingHosting] = useState<Hosting | null>(null)
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const { toast } = useToast()

  // Permission helper - Admins have all permissions
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (user?.role === 'ADMIN') return true
    if (!user?.permissions) return true // Default to allowed
    return user.permissions[permission] === true
  }

  // Selection states
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [selectedAlarmIds, setSelectedAlarmIds] = useState<string[]>([])
  const [selectedReminderIds, setSelectedReminderIds] = useState<string[]>([])

  // View mode for clients
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid')

  // Maximize state for client dialog
  const [isMaximized, setIsMaximized] = useState(false)

  // Financial history dialog states
  const [showFinanceHistoryDialog, setShowFinanceHistoryDialog] = useState(false)
  const [financeHistoryTab, setFinanceHistoryTab] = useState<'monthly' | 'daily'>('monthly')
  const [dashboardChartView, setDashboardChartView] = useState<'monthly' | 'daily'>('monthly')
  const [dashboardSelectedMonth, setDashboardSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [dashboardSelectedYear, setDashboardSelectedYear] = useState<number>(new Date().getFullYear())
  const [monthlyStats, setMonthlyStats] = useState<any[]>([])
  const [dailyStats, setDailyStats] = useState<any[]>([])
  const [dashboardDailyStats, setDashboardDailyStats] = useState<any[]>([])
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [editingMonthlyStat, setEditingMonthlyStat] = useState<any | null>(null)
  const [showEditMonthlyDialog, setShowEditMonthlyDialog] = useState(false)
  const [isInlineEditing, setIsInlineEditing] = useState<string | null>(null)
  const [inlineEditValue, setInlineEditValue] = useState<any>({})
  const [isFinanceHistoryMaximized, setIsFinanceHistoryMaximized] = useState(false)
  const [selectedMonthIds, setSelectedMonthIds] = useState<string[]>([])
  const [showMonthDetailDialog, setShowMonthDetailDialog] = useState(false)
  const [selectedMonthDetail, setSelectedMonthDetail] = useState<any | null>(null)
  const [monthClients, setMonthClients] = useState<any[]>([])
  const [monthClientsTotals, setMonthClientsTotals] = useState<any>(null)
  const [loadingMonthClients, setLoadingMonthClients] = useState(false)

  // Calendar states
  const [calendarFilters, setCalendarFilters] = useState({
    services: true,
    domains: true,
    hosting: true,
    alarms: true,
    contracts: true,
    reminders: true,
    invoices: true
  })
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'list'>('month')
  const [calendarReminders, setCalendarReminders] = useState<Reminder[]>([])
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showDayDialog, setShowDayDialog] = useState(false)
  const [isDayDialogMaximized, setIsDayDialogMaximized] = useState(false)
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false)
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null)
  const [newNote, setNewNote] = useState({
    title: '',
    description: '',
    color: 'brand',
    date: ''
  })

  // Client files states
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [editingFile, setEditingFile] = useState<ClientFile | null>(null)
  const [newFileCategory, setNewFileCategory] = useState('general')
  const [newFileDescription, setNewFileDescription] = useState('')
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<ClientFile | null>(null)
  const [showFilePreview, setShowFilePreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isFilePreviewMaximized, setIsFilePreviewMaximized] = useState(false)
  const MAX_FILES_PER_CLIENT = 20

  // AI Assistant states
  const [showAssistant, setShowAssistant] = useState(false)
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([])
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [isAssistantMaximized, setIsAssistantMaximized] = useState(false)

  // File categories with colors
  const fileCategories = [
    { value: 'contract', label: 'Contrato', color: 'bg-blue-500' },
    { value: 'invoice', label: 'Factura', color: 'bg-emerald-500' },
    { value: 'nda', label: 'NDA / Acuerdo', color: 'bg-purple-500' },
    { value: 'proposal', label: 'Propuesta', color: 'bg-amber-500' },
    { value: 'briefing', label: 'Briefing', color: 'bg-cyan-500' },
    { value: 'design', label: 'Diseño', color: 'bg-pink-500' },
    { value: 'documentation', label: 'Documentación', color: 'bg-orange-500' },
    { value: 'general', label: 'General', color: 'bg-gray-500' }
  ]

  // Form states
  const [newClient, setNewClient] = useState({
    name: '', company: '', email: '', phone: '', notes: '', status: 'ACTIVE',
    contractStart: '', contractEnd: '', contractYears: ''
  })
  const [newService, setNewService] = useState({
    serviceType: 'WEB', description: '', monthlyPrice: 0,
    startDate: new Date().toISOString().split('T')[0], renewalDate: '', status: 'ACTIVE'
  })
  const [newHosting, setNewHosting] = useState({
    provider: '', plan: '', username: '', panelUrl: '', monthlyCost: 0, renewalDate: ''
  })
  const [newDomain, setNewDomain] = useState({
    domainName: '', registrar: '', cost: 0,
    registrationDate: new Date().toISOString().split('T')[0], renewalDate: '', status: 'ACTIVE'
  })
  const [newAlarm, setNewAlarm] = useState({
    type: 'CONTRACT_END', title: '', description: '', alarmDate: '', priority: 'MEDIUM', daysBefore: 7, isRecurring: false
  })

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    smtp: false
  })

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLogFilter, setAuditLogFilter] = useState<string>('all')
  const [auditLogLoading, setAuditLogLoading] = useState(false)

  // Payments state
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentTotals, setPaymentTotals] = useState<PaymentTotals | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [newPayment, setNewPayment] = useState({
    clientId: '',
    entityType: 'CUSTOM',
    entityId: '',
    amount: 0,
    description: '',
    dueDate: '',
  })
  const [resyncingPayments, setResyncingPayments] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [assigningPayment, setAssigningPayment] = useState<Payment | null>(null)
  const [assignClientId, setAssignClientId] = useState('')
  const [unassignedPayments, setUnassignedPayments] = useState<Payment[]>([])
  const [stripeData, setStripeData] = useState<any>(null)
  const [loadingStripeData, setLoadingStripeData] = useState(false)
  const [showCreateClientFromPayment, setShowCreateClientFromPayment] = useState(false)

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all')
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [isInvoiceMaximized, setIsInvoiceMaximized] = useState(false)
  const [showInvoicePreviewDialog, setShowInvoicePreviewDialog] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    language: 'es',
    notes: '',
    terms: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 21 }]
  })

  // Fetch functions
  const fetchAuditLogs = useCallback(async (filter?: string) => {
    setAuditLogLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter && filter !== 'all') {
        params.append('entityType', filter)
      }
      params.append('limit', '200')
      const res = await fetch(`/api/audit?${params}`)
      const data = await res.json()
      setAuditLogs(data.logs || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setAuditLogLoading(false)
    }
  }, [])

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        // Not authenticated, redirect to login
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      router.push('/login')
    }
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden', variant: 'destructive' })
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        toast({ title: '✓ Contraseña actualizada', description: 'Tu contraseña ha sido cambiada correctamente' })
      } else {
        toast({ title: 'Error', description: data.error || 'No se pudo cambiar la contraseña', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo cambiar la contraseña', variant: 'destructive' })
    }
  }

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }, [])

  const fetchClients = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      
      // Advanced filters
      if (advancedFilters.dateFrom) params.append('dateFrom', advancedFilters.dateFrom)
      if (advancedFilters.dateTo) params.append('dateTo', advancedFilters.dateTo)
      if (advancedFilters.dateType) params.append('dateType', advancedFilters.dateType)
      if (advancedFilters.revenueMin) params.append('revenueMin', advancedFilters.revenueMin)
      if (advancedFilters.revenueMax) params.append('revenueMax', advancedFilters.revenueMax)
      if (advancedFilters.serviceType) params.append('serviceType', advancedFilters.serviceType)
      if (advancedFilters.profitMin) params.append('profitMin', advancedFilters.profitMin)
      if (advancedFilters.profitMax) params.append('profitMax', advancedFilters.profitMax)
      
      const res = await fetch(`/api/clients?${params}`)
      const data = await res.json()
      setClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchTerm, advancedFilters])

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      dateFrom: '',
      dateTo: '',
      dateType: 'createdAt',
      revenueMin: '',
      revenueMax: '',
      serviceType: '',
      profitMin: '',
      profitMax: '',
    })
  }

  const hasActiveFilters = () => {
    return advancedFilters.dateFrom || advancedFilters.dateTo || 
           advancedFilters.revenueMin || advancedFilters.revenueMax ||
           advancedFilters.serviceType || advancedFilters.profitMin || advancedFilters.profitMax
  }

  const fetchAlarms = useCallback(async () => {
    try {
      const res = await fetch('/api/alarms?isActive=true')
      const data = await res.json()
      setAlarms(data)
    } catch (error) {
      console.error('Error fetching alarms:', error)
    }
  }, [])

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders')
      const data = await res.json()
      setCalendarReminders(data.filter((r: Reminder) => !r.deletedAt))
    } catch (error) {
      console.error('Error fetching reminders:', error)
    }
  }, [])

  const fetchCalendarNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar-notes')
      if (res.ok) {
        const data = await res.json()
        setCalendarNotes(data)
      }
    } catch (error) {
      console.error('Error fetching calendar notes:', error)
    }
  }, [])

  const saveCalendarNote = useCallback(async (note: Partial<CalendarNote>, noteId?: string) => {
    try {
      const isEdit = !!noteId
      const url = isEdit ? `/api/calendar-notes/${noteId}` : '/api/calendar-notes'
      const method = isEdit ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      })
      
      if (res.ok) {
        fetchCalendarNotes()
        return true
      }
      return false
    } catch (error) {
      console.error('Error saving calendar note:', error)
      return false
    }
  }, [fetchCalendarNotes])

  const deleteCalendarNote = useCallback(async (noteId: string) => {
    try {
      const res = await fetch(`/api/calendar-notes/${noteId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchCalendarNotes()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting calendar note:', error)
      return false
    }
  }, [fetchCalendarNotes])

  const fetchNotificationConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config/notifications')
      const data = await res.json()
      setNotificationConfig(data)
    } catch (error) {
      console.error('Error fetching notification config:', error)
    }
  }, [])

  const fetchSystemConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config/system')
      const data = await res.json()
      setSystemConfig(data)
      if (data.language) {
        setCurrentLanguage(data.language as Language)
      }
    } catch (error) {
      console.error('Error fetching system config:', error)
    }
  }, [])

  const fetchTrashData = useCallback(async () => {
    try {
      const res = await fetch('/api/trash')
      const data = await res.json()
      setTrashData(data)
      setTrashConfig(data.config)
    } catch (error) {
      console.error('Error fetching trash data:', error)
    }
  }, [])

  const fetchPayments = useCallback(async (status?: string) => {
    setPaymentLoading(true)
    try {
      const params = new URLSearchParams()
      if (status && status !== 'all') {
        params.append('status', status)
      }
      const res = await fetch(`/api/payments?${params}`)
      const data = await res.json()
      setPayments(data.payments || [])
      setPaymentTotals(data.totals || null)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setPaymentLoading(false)
    }
  }, [])

  const fetchInvoices = useCallback(async (status?: string, search?: string) => {
    setInvoiceLoading(true)
    try {
      const params = new URLSearchParams()
      if (status && status !== 'all') {
        params.append('status', status)
      }
      if (search) {
        params.append('search', search)
      }
      const res = await fetch(`/api/invoices?${params}`)
      const data = await res.json()
      setInvoices(data.data?.invoices || data.invoices || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setInvoiceLoading(false)
    }
  }, [])

  const createStripeCheckout = async (clientId: string, entityType: string, entityId: string, amount: number, description: string) => {
    try {
      const client = clients.find(c => c.id === clientId)
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          entityType,
          entityId,
          amount,
          description,
          clientEmail: client?.email,
          clientName: client?.name,
        }),
      })
      const data = await res.json()
      if (data.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank')
        toast({ title: '✓ Link de pago generado', description: 'Se abrió la página de pago en una nueva pestaña' })
        fetchPayments()
      } else {
        toast({ title: 'Error', description: data.error || 'No se pudo crear el link de pago', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al crear la sesión de pago', variant: 'destructive' })
    }
  }

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast({ title: '✓ Estado actualizado' })
        fetchPayments(paymentStatusFilter)
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' })
    }
  }

  const deletePayment = async (paymentId: string) => {
    if (!confirm('¿Eliminar este pago?')) return
    try {
      const res = await fetch(`/api/payments/${paymentId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: '✓ Pago eliminado' })
        fetchPayments(paymentStatusFilter)
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el pago', variant: 'destructive' })
    }
  }

  const resyncPayments = async () => {
    setResyncingPayments(true)
    try {
      const res = await fetch('/api/payments/resync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceAll: true }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: '✓ Resincronización completada',
          description: data.message || 'Pagos actualizados'
        })
        fetchPayments(paymentStatusFilter)
        fetchClients()
      } else {
        toast({ title: 'Error', description: data.error || 'Error al resincronizar', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al resincronizar pagos', variant: 'destructive' })
    } finally {
      setResyncingPayments(false)
    }
  }

  const assignPaymentToClient = async () => {
    if (!assigningPayment || !assignClientId) return
    try {
      const res = await fetch('/api/payments/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: assigningPayment.id, clientId: assignClientId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: '✓ Pago asignado', description: `Asignado a ${data.payment?.client?.name || 'cliente'}` })
        setShowAssignDialog(false)
        setAssigningPayment(null)
        setAssignClientId('')
        // Recargar tanto pagos como clientes
        fetchPayments(paymentStatusFilter)
        fetchClients()
      } else {
        toast({ title: 'Error', description: data.error || 'Error al asignar', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al asignar el pago', variant: 'destructive' })
    }
  }

  const fetchStripeData = async (paymentId: string) => {
    setLoadingStripeData(true)
    try {
      const res = await fetch(`/api/stripe/payment-data?paymentId=${paymentId}`)
      const data = await res.json()
      if (res.ok) {
        setStripeData(data)
        return data
      }
    } catch (error) {
      console.error('Error fetching Stripe data:', error)
    } finally {
      setLoadingStripeData(false)
    }
    return null
  }

  const createClientFromPayment = async () => {
    if (!stripeData?.customer && !assigningPayment) return

    const customerInfo = stripeData?.customer || {}
    const name = customerInfo.name || assigningPayment?.description?.split(' - ')[1]?.split('(')[0]?.trim() || ''
    const email = customerInfo.email || ''
    const phone = customerInfo.phone || ''

    // Crear cliente con los datos de Stripe
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Nuevo Cliente',
          company: name || 'Nueva Empresa',
          email: email || `cliente_${Date.now()}@temp.local`,
          phone: phone || '',
          status: 'ACTIVE',
        }),
      })
      const client = await res.json()
      if (res.ok) {
        toast({ title: '✓ Cliente creado', description: `Cliente ${client.name} creado correctamente` })
        // Asignar el pago al nuevo cliente
        const assignRes = await fetch('/api/payments/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: assigningPayment?.id, clientId: client.id }),
        })
        if (assignRes.ok) {
          toast({ title: '✓ Pago asignado', description: 'Pago asignado al nuevo cliente' })
          setShowAssignDialog(false)
          setShowCreateClientFromPayment(false)
          setAssigningPayment(null)
          setStripeData(null)
          fetchPayments(paymentStatusFilter)
          fetchClients()
        }
      } else {
        toast({ title: 'Error', description: client.error || 'Error al crear cliente', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al crear cliente', variant: 'destructive' })
    }
  }

  const fetchClientById = useCallback(async (clientId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}`)
      if (res.ok) {
        const data = await res.json()
        return data
      }
    } catch (error) {
      console.error('Error fetching client:', error)
    }
    return null
  }, [])

  // Client files functions
  const fetchClientFiles = useCallback(async (clientId: string) => {
    setLoadingFiles(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/files`)
      if (res.ok) {
        const data = await res.json()
        setClientFiles(data)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoadingFiles(false)
    }
  }, [])

  const uploadFile = useCallback(async (clientId: string, file: File, category: string, description: string) => {
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      if (description) formData.append('description', description)

      const res = await fetch(`/api/clients/${clientId}/files`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const newFile = await res.json()
        setClientFiles(prev => [newFile, ...prev])
        toast({ title: '✓ Archivo subido', description: file.name })
        return true
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'No se pudo subir el archivo', variant: 'destructive' })
        return false
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({ title: 'Error', description: 'No se pudo subir el archivo', variant: 'destructive' })
      return false
    } finally {
      setUploadingFile(false)
    }
  }, [toast])

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' })
      if (res.ok) {
        setClientFiles(prev => prev.filter(f => f.id !== fileId))
        toast({ title: '✓ Archivo eliminado' })
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }, [toast])

  const downloadFile = useCallback(async (fileId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = fileName
        window.document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      toast({ title: 'Error', description: 'No se pudo descargar el archivo', variant: 'destructive' })
    }
  }, [toast])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />
    if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />
    return <FileText className="h-5 w-5 text-muted-foreground" />
  }

  const getCategoryColor = (category: string) => {
    const cat = fileCategories.find(c => c.value === category)
    return cat?.color || 'bg-gray-500'
  }

  const getCategoryLabel = (category: string) => {
    const cat = fileCategories.find(c => c.value === category)
    return cat?.label || category
  }

  const canPreviewFile = (mimeType: string) => {
    return mimeType.startsWith('image/') || mimeType === 'application/pdf'
  }

  const openFilePreview = useCallback(async (file: ClientFile) => {
    try {
      const res = await fetch(`/api/files/${file.id}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        setPreviewUrl(url)
        setSelectedFileForPreview(file)
        setShowFilePreview(true)
      }
    } catch (error) {
      console.error('Error loading preview:', error)
      toast({ title: 'Error', description: 'No se pudo cargar la vista previa', variant: 'destructive' })
    }
  }, [toast])

  // AI Assistant functions
  const sendAssistantMessage = useCallback(async () => {
    if (!assistantInput.trim() || assistantLoading) return

    const userMessage = assistantInput.trim()
    setAssistantInput('')
    setAssistantMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setAssistantLoading(true)

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: assistantMessages
        })
      })

      const data = await res.json()
      if (res.ok && data.response) {
        setAssistantMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          links: data.links || [],
          acciones: data.acciones || []
        }])
      } else {
        setAssistantMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.' }])
      }
    } catch (error) {
      console.error('Assistant error:', error)
      setAssistantMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Por favor intenta de nuevo.' }])
    } finally {
      setAssistantLoading(false)
    }
  }, [assistantInput, assistantLoading, assistantMessages])

  const handleAssistantLinkClick = useCallback((link: AssistantLink) => {
    // Usar la URL directamente
    if (link.url) {
      // Cerrar asistente y navegar
      setShowAssistant(false)
      router.push(link.url)
      
      // Si es un cliente, también abrir el diálogo
      if (link.tipo === 'cliente') {
        const client = clients.find(c => c.id === link.id)
        if (client) {
          setTimeout(() => {
            setSelectedClient(client)
            setShowClientDialog(true)
          }, 500)
        }
      }
    }
  }, [clients, router])

  const clearAssistantChat = useCallback(() => {
    setAssistantMessages([])
    setAssistantInput('')
  }, [])

  const quickAssistantQuestions = [
    { label: '📅 ¿Qué tengo hoy?', query: '¿Qué eventos tengo hoy?' },
    { label: '🔄 ¿Qué renueva?', query: '¿Qué renueva pronto?' },
    { label: '💰 Ingresos', query: '¿Cuáles son mis ingresos mensuales?' },
    { label: '👥 Clientes inactivos', query: '¿Qué clientes están inactivos?' },
    { label: '🏆 Top clientes', query: '¿Cuáles son mis mejores clientes?' },
    { label: '📊 Estadísticas', query: '¿Cuántos clientes tengo?' },
  ]

  // Generate automatic notifications
  const generateNotifications = useCallback(async () => {
    try {
      await fetch('/api/notifications/generate', { method: 'POST' })
    } catch (error) {
      console.error('Error generating notifications:', error)
    }
  }, [])

  // Handle hydration for theme toggle
  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard shortcuts for tab navigation (1-8)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input, textarea, or select
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
        return
      }

      const tabMap: Record<string, string> = {
        '1': 'dashboard',
        '2': 'calendar',
        '3': 'clients',
        '4': 'alarms',
        '5': 'finances',
        '6': 'payments',
        '7': 'invoices',
        '8': 'trash',
      }

      const key = e.key
      if (tabMap[key]) {
        e.preventDefault()
        setActiveTab(tabMap[key])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    fetchCurrentUser()
    fetchDashboard()
    fetchClients()
    fetchAlarms()
    fetchReminders()
    fetchCalendarNotes()
    fetchNotificationConfig()
    fetchSystemConfig()
    // Generate notifications automatically on load
    generateNotifications()
  }, [fetchCurrentUser, fetchDashboard, fetchClients, fetchAlarms, fetchReminders, fetchCalendarNotes, fetchNotificationConfig, fetchSystemConfig, generateNotifications])

  // Apply primary color as CSS variable - comprehensive brand theming
  useEffect(() => {
    if (systemConfig?.primaryColor) {
      const hex = systemConfig.primaryColor.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      
      // Helper to generate lighter/darker variants
      const adjustColor = (hexColor: string, percent: number) => {
        const num = parseInt(hexColor.replace('#', ''), 16)
        const amt = Math.round(2.55 * percent)
        const R = Math.min(255, Math.max(0, (num >> 16) + amt))
        const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`
      }
      
      const primaryColor = systemConfig.primaryColor
      const lighterColor = adjustColor(primaryColor, 30)  // For dark mode
      const darkerColor = adjustColor(primaryColor, -20)  // For hover states
      
      // ========================================
      // LIGHT MODE VARIABLES
      // ========================================
      document.documentElement.style.setProperty('--primary', primaryColor)
      document.documentElement.style.setProperty('--primary-foreground', '#ffffff')
      document.documentElement.style.setProperty('--ring', primaryColor)
      document.documentElement.style.setProperty('--chart-1', primaryColor)
      document.documentElement.style.setProperty('--sidebar-primary', primaryColor)
      document.documentElement.style.setProperty('--sidebar-primary-foreground', '#ffffff')
      document.documentElement.style.setProperty('--sidebar-ring', primaryColor)
      
      // Brand color system
      document.documentElement.style.setProperty('--brand-color', primaryColor)
      document.documentElement.style.setProperty('--brand-color-rgb', `${r}, ${g}, ${b}`)
      document.documentElement.style.setProperty('--brand-light', lighterColor)
      document.documentElement.style.setProperty('--brand-light-rgb', `${Math.min(255, r + 43)}, ${Math.min(255, g + 81)}, ${Math.min(255, b + 13)}`)
      document.documentElement.style.setProperty('--brand-dark', darkerColor)
      document.documentElement.style.setProperty('--brand-dark-rgb', `${Math.max(0, r - 15)}, ${Math.max(0, g - 18)}, ${Math.max(0, b - 22)}`)
      document.documentElement.style.setProperty('--brand-bg', `rgba(${r}, ${g}, ${b}, 0.1)`)
      document.documentElement.style.setProperty('--brand-border', `rgba(${r}, ${g}, ${b}, 0.2)`)
      
      // ========================================
      // DARK MODE VARIABLES (injected via style)
      // ========================================
      const darkStyle = document.getElementById('dynamic-dark-styles')
      if (darkStyle) {
        darkStyle.remove()
      }
      
      const styleEl = document.createElement('style')
      styleEl.id = 'dynamic-dark-styles'
      styleEl.textContent = `
        .dark {
          --primary: ${lighterColor} !important;
          --primary-foreground: #0f172a !important;
          --ring: ${lighterColor} !important;
          --chart-1: ${lighterColor} !important;
          --sidebar-primary: ${lighterColor} !important;
          --sidebar-ring: ${lighterColor} !important;
          
          /* Brand colors for dark mode */
          --brand-color: ${lighterColor} !important;
          --brand-color-rgb: ${Math.min(255, r + 43)}, ${Math.min(255, g + 81)}, ${Math.min(255, b + 13)} !important;
          --brand-light: ${adjustColor(primaryColor, 50)} !important;
          --brand-dark: ${primaryColor} !important;
          --brand-bg: rgba(${Math.min(255, r + 43)}, ${Math.min(255, g + 81)}, ${Math.min(255, b + 13)}, 0.15) !important;
          --brand-border: rgba(${Math.min(255, r + 43)}, ${Math.min(255, g + 81)}, ${Math.min(255, b + 13)}, 0.25) !important;
        }
        
        /* Dynamic brand gradient backgrounds */
        .bg-brand-gradient {
          background: linear-gradient(135deg, ${primaryColor}, ${darkerColor}) !important;
        }
        
        .dark .bg-brand-gradient {
          background: linear-gradient(135deg, ${lighterColor}, ${primaryColor}) !important;
        }
        
        /* Brand background page gradient */
        .bg-page-brand {
          background: linear-gradient(135deg, 
            rgba(${r}, ${g}, ${b}, 0.03) 0%, 
            rgba(${r}, ${g}, ${b}, 0.08) 50%, 
            rgba(${r}, ${g}, ${b}, 0.03) 100%
          ) !important;
        }
        
        .dark .bg-page-brand {
          background: linear-gradient(135deg, 
            rgba(${Math.min(255, r + 43)}, ${Math.min(255, g + 81)}, ${Math.min(255, b + 13)}, 0.05) 0%, 
            rgba(${Math.min(255, r + 43)}, ${Math.min(255, g + 81)}, ${Math.min(255, b + 13)}, 0.1) 50%, 
            rgba(${Math.min(255, r + 43)}, ${Math.min(255, g + 81)}, ${Math.min(255, b + 13)}, 0.05) 100%
          ) !important;
        }
        
        /* Card header brand accent */
        .card-header-brand {
          background: linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.1), rgba(${r}, ${g}, ${b}, 0.05)) !important;
          border-bottom: 1px solid rgba(${r}, ${g}, ${b}, 0.15) !important;
        }
        
        .dark .card-header-brand {
          background: linear-gradient(135deg, rgba(${Math.min(255, r + 43)}, ${Math.min(255, g + 81)}, ${Math.min(255, b + 13)}, 0.15), rgba(${Math.min(255, r + 43)}, ${Math.min(255, g + 81)}, ${Math.min(255, b + 13)}, 0.05)) !important;
          border-bottom: 1px solid rgba(${Math.min(255, r + 43)}, ${Math.min(255, g + 81)}, ${Math.min(255, b + 13)}, 0.2) !important;
        }
        
        /* Tab active state */
        .tab-brand-active {
          color: ${primaryColor} !important;
          border-bottom-color: ${primaryColor} !important;
        }
        
        .dark .tab-brand-active {
          color: ${lighterColor} !important;
          border-bottom-color: ${lighterColor} !important;
        }
        
        /* Icon container brand style */
        .icon-container-brand {
          background-color: rgba(${r}, ${g}, ${b}, 0.1) !important;
          color: ${primaryColor} !important;
        }
        
        .dark .icon-container-brand {
          background-color: rgba(${Math.min(255, r + 43)}, ${Math.min(255, g + 81)}, ${Math.min(255, b + 13)}, 0.2) !important;
          color: ${lighterColor} !important;
        }
      `
      document.head.appendChild(styleEl)
      
      // Update Tailwind color-primary CSS variable
      document.documentElement.style.setProperty('--color-primary', primaryColor)
    }
  }, [systemConfig?.primaryColor])

  // Fetch trash data when trash tab is active
  useEffect(() => {
    if (activeTab === 'trash') {
      fetchTrashData()
    }
  }, [activeTab, fetchTrashData])

  // Fetch payments when payments tab is active
  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments(paymentStatusFilter)
      // También cargar clientes si no están cargados (para poder abrir el diálogo)
      if (clients.length === 0) {
        fetchClients()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, paymentStatusFilter])

  // Fetch invoices when invoices tab is active
  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchInvoices(invoiceStatusFilter, invoiceSearchTerm)
      // Also load clients if not loaded
      if (clients.length === 0) {
        fetchClients()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, invoiceStatusFilter])

  // Fetch client files when a client is selected
  useEffect(() => {
    if (selectedClient && showClientDialog) {
      fetchClientFiles(selectedClient.id)
    } else if (!showClientDialog) {
      setClientFiles([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?.id, showClientDialog])

  // Refresh selected client data
  const refreshSelectedClient = useCallback(async () => {
    if (selectedClient) {
      const updatedClient = await fetchClientById(selectedClient.id)
      if (updatedClient) {
        setSelectedClient(updatedClient)
      }
    }
  }, [selectedClient, fetchClientById])

  // Fetch financial history data
  const fetchMonthlyStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats/monthly')
      const data = await res.json()
      setMonthlyStats(data.stats || [])
      setAvailableYears(data.years || [new Date().getFullYear()])
    } catch (error) {
      console.error('Error fetching monthly stats:', error)
    }
  }, [])

  const fetchDailyStats = useCallback(async (year: number, month: number) => {
    try {
      const res = await fetch(`/api/stats/daily?year=${year}&month=${month}`)
      const data = await res.json()
      setDailyStats(data.dailyStats || [])
    } catch (error) {
      console.error('Error fetching daily stats:', error)
    }
  }, [])

  const fetchDashboardDailyStats = useCallback(async (year: number, month: number) => {
    try {
      const res = await fetch(`/api/stats/daily?year=${year}&month=${month}`)
      const data = await res.json()
      setDashboardDailyStats(data.dailyStats || [])
    } catch (error) {
      console.error('Error fetching dashboard daily stats:', error)
    }
  }, [])

  const fetchMonthClients = useCallback(async (year: number, month: number) => {
    setLoadingMonthClients(true)
    try {
      const res = await fetch(`/api/stats/clients-by-month?year=${year}&month=${month}`)
      const data = await res.json()
      setMonthClients(data.clients || [])
      setMonthClientsTotals(data.totals || null)
    } catch (error) {
      console.error('Error fetching month clients:', error)
      setMonthClients([])
      setMonthClientsTotals(null)
    } finally {
      setLoadingMonthClients(false)
    }
  }, [])

  const handleOpenMonthDetail = async (stat: any) => {
    setSelectedMonthDetail(stat)
    setShowMonthDetailDialog(true)
    await fetchMonthClients(stat.year, stat.month)
  }

  const handleSaveMonthlyStat = async () => {
    if (!editingMonthlyStat) return
    try {
      const res = await fetch('/api/stats/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMonthlyStat.id,
          year: editingMonthlyStat.year,
          month: editingMonthlyStat.month,
          revenue: Number(editingMonthlyStat.revenue) || 0,
          costs: Number(editingMonthlyStat.costs) || 0,
          profit: Number(editingMonthlyStat.profit) || 0,
          activeClients: Number(editingMonthlyStat.activeClients) || 0,
          activeServices: Number(editingMonthlyStat.activeServices) || 0,
          activeDomains: Number(editingMonthlyStat.activeDomains) || 0,
          activeHosting: Number(editingMonthlyStat.activeHosting) || 0,
        })
      })
      if (res.ok) {
        toast({ title: '✓ Datos guardados correctamente' })
        setShowEditMonthlyDialog(false)
        setEditingMonthlyStat(null)
        fetchMonthlyStats()
        fetchDashboard()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron guardar los cambios', variant: 'destructive' })
    }
  }

  const handleInlineSave = async (stat: any) => {
    try {
      const res = await fetch('/api/stats/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: stat.id,
          year: stat.year,
          month: stat.month,
          revenue: Number(inlineEditValue.revenue ?? stat.revenue) || 0,
          costs: Number(inlineEditValue.costs ?? stat.costs) || 0,
          activeClients: Number(inlineEditValue.activeClients ?? stat.activeClients) || 0,
          activeServices: Number(inlineEditValue.activeServices ?? stat.activeServices) || 0,
        })
      })
      if (res.ok) {
        toast({ title: '✓ Guardado' })
        setIsInlineEditing(null)
        setInlineEditValue({})
        fetchMonthlyStats()
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  const handleCreateMonthlyStat = async (year: number, month: number) => {
    try {
      const res = await fetch('/api/stats/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          revenue: 0,
          costs: 0,
          profit: 0,
          activeClients: 0,
          activeServices: 0,
          activeDomains: 0,
          activeHosting: 0,
        })
      })
      if (res.ok) {
        toast({ title: '✓ Mes creado' })
        fetchMonthlyStats()
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  const handleDeleteMonthlyStat = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    try {
      const res = await fetch(`/api/stats/monthly?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: '✓ Eliminado' })
        fetchMonthlyStats()
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  // Clear month data (reset to 0)
  const handleClearMonthData = async (stat: any) => {
    if (!confirm(`¿Limpiar todos los datos de ${stat.monthName} ${stat.year}?\nEsto pondrá todos los valores a 0.`)) return
    try {
      const res = await fetch('/api/stats/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: stat.id,
          year: stat.year,
          month: stat.month,
          revenue: 0,
          costs: 0,
          profit: 0,
          activeClients: 0,
          activeServices: 0,
          activeDomains: 0,
          activeHosting: 0,
        })
      })
      if (res.ok) {
        toast({ title: '✓ Datos limpiados' })
        fetchMonthlyStats()
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  // Bulk delete selected months
  const handleBulkDeleteMonths = async () => {
    if (selectedMonthIds.length === 0) return
    if (!confirm(`¿Eliminar ${selectedMonthIds.length} registros seleccionados?`)) return
    try {
      await Promise.all(selectedMonthIds.map(id => 
        fetch(`/api/stats/monthly?id=${id}`, { method: 'DELETE' })
      ))
      toast({ title: '✓ Registros eliminados' })
      setSelectedMonthIds([])
      fetchMonthlyStats()
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  // Clear entire year
  const handleClearYear = async () => {
    if (!confirm(`¿Limpiar TODOS los datos del año ${selectedYear}?\nEsta acción pondrá todos los meses a 0.`)) return
    const yearData = getFullYearData(selectedYear).filter(s => !s.isEmpty && s.id)
    try {
      await Promise.all(yearData.map(stat => 
        fetch('/api/stats/monthly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: stat.id,
            year: stat.year,
            month: stat.month,
            revenue: 0,
            costs: 0,
            profit: 0,
            activeClients: 0,
            activeServices: 0,
            activeDomains: 0,
            activeHosting: 0,
          })
        })
      ))
      toast({ title: '✓ Año limpiado' })
      fetchMonthlyStats()
      fetchDashboard()
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  // Delete entire year (remove all records)
  const handleDeleteYear = async () => {
    if (!confirm(`¿ELIMINAR todos los registros del año ${selectedYear}?\nEsta acción NO se puede deshacer.`)) return
    const yearData = getFullYearData(selectedYear).filter(s => !s.isEmpty && s.id)
    try {
      await Promise.all(yearData.map(stat => 
        fetch(`/api/stats/monthly?id=${stat.id}`, { method: 'DELETE' })
      ))
      toast({ title: '✓ Registros del año eliminados' })
      fetchMonthlyStats()
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' })
    }
  }

  // Toggle month selection
  const toggleMonthSelection = (id: string) => {
    setSelectedMonthIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Select all months in year
  const toggleAllMonthsInYear = () => {
    const yearIds = getFullYearData(selectedYear).filter(s => s.id).map(s => s.id)
    if (selectedMonthIds.length === yearIds.length) {
      setSelectedMonthIds([])
    } else {
      setSelectedMonthIds(yearIds)
    }
  }

  // Get all 12 months data for a year (including empty ones)
  const getFullYearData = useCallback((year: number) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return months.map((monthName, index) => {
      const month = index + 1
      const existing = monthlyStats.find(s => s.year === year && s.month === month)
      return existing || {
        id: null,
        year,
        month,
        monthName,
        revenue: 0,
        costs: 0,
        profit: 0,
        activeClients: 0,
        activeServices: 0,
        activeDomains: 0,
        activeHosting: 0,
        isEmpty: true
      }
    })
  }, [monthlyStats])

  // Handlers
  const handleAddClient = async () => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newClient,
          contractStart: newClient.contractStart || null,
          contractEnd: newClient.contractEnd || null,
          contractYears: newClient.contractYears ? parseInt(newClient.contractYears) : null
        })
      })
      if (res.ok) {
        toast({ title: '✓ Cliente añadido', description: 'El cliente se ha añadido correctamente' })
        setShowAddClientDialog(false)
        setNewClient({ name: '', company: '', email: '', phone: '', notes: '', status: 'ACTIVE', contractStart: '', contractEnd: '', contractYears: '' })
        fetchClients()
        fetchDashboard()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo añadir el cliente', variant: 'destructive' })
    }
  }

  const handleAddService = async () => {
    if (!selectedClient) return
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      })
      if (res.ok) {
        toast({ title: '✓ Servicio añadido' })
        setShowAddServiceDialog(false)
        setNewService({ serviceType: 'WEB', description: '', monthlyPrice: 0, startDate: new Date().toISOString().split('T')[0], renewalDate: '', status: 'ACTIVE' })
        // Refresh client data
        const updatedClient = await fetchClientById(selectedClient.id)
        if (updatedClient) setSelectedClient(updatedClient)
        fetchClients()
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo añadir el servicio', variant: 'destructive' })
    }
  }

  const handleAddHosting = async () => {
    if (!selectedClient) return
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}/hosting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHosting)
      })
      if (res.ok) {
        toast({ title: '✓ Hosting añadido' })
        setShowAddHostingDialog(false)
        setNewHosting({ provider: '', plan: '', username: '', panelUrl: '', monthlyCost: 0, renewalDate: '' })
        // Refresh client data
        const updatedClient = await fetchClientById(selectedClient.id)
        if (updatedClient) setSelectedClient(updatedClient)
        fetchClients()
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo añadir el hosting', variant: 'destructive' })
    }
  }

  const handleAddDomain = async () => {
    if (!selectedClient) return
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDomain)
      })
      if (res.ok) {
        toast({ title: '✓ Dominio añadido' })
        setShowAddDomainDialog(false)
        setNewDomain({ domainName: '', registrar: '', cost: 0, registrationDate: new Date().toISOString().split('T')[0], renewalDate: '', status: 'ACTIVE' })
        // Refresh client data
        const updatedClient = await fetchClientById(selectedClient.id)
        if (updatedClient) setSelectedClient(updatedClient)
        fetchClients()
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo añadir el dominio', variant: 'destructive' })
    }
  }

  const handleAddAlarm = async () => {
    if (!selectedClient) return
    try {
      const res = await fetch('/api/alarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAlarm, clientId: selectedClient.id })
      })
      if (res.ok) {
        toast({ title: '✓ Alarma creada', description: 'La alarma se ha configurado correctamente' })
        setShowAddAlarmDialog(false)
        setNewAlarm({ type: 'CONTRACT_END', title: '', description: '', alarmDate: '', priority: 'MEDIUM', daysBefore: 7, isRecurring: false })
        // Refresh client data to show the new alarm
        const updatedClient = await fetchClientById(selectedClient.id)
        if (updatedClient) setSelectedClient(updatedClient)
        fetchAlarms()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear la alarma', variant: 'destructive' })
    }
  }

  const handleEditClient = async () => {
    if (!editingClient) return
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingClient.name,
          company: editingClient.company,
          email: editingClient.email,
          phone: editingClient.phone || null,
          notes: editingClient.notes || null,
          status: editingClient.status,
          contractStart: editingClient.contractStart || null,
          contractEnd: editingClient.contractEnd || null,
          contractYears: editingClient.contractYears ? parseInt(String(editingClient.contractYears)) : null,
        })
      })
      if (res.ok) {
        toast({ title: '✓ Cliente actualizado' })
        setShowEditClientDialog(false)
        // Update selectedClient with new data
        const updatedClient = await fetchClientById(editingClient.id)
        if (updatedClient) {
          setSelectedClient(updatedClient)
          setEditingClient(null)
        }
        fetchClients()
        fetchDashboard()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el cliente', variant: 'destructive' })
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente? Irá a la papelera.')) return
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: '✓ Cliente movido a papelera' })
        setSelectedClient(null)
        setShowClientDialog(false)
        fetchClients()
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el cliente', variant: 'destructive' })
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      const res = await fetch(`/api/reminders/${reminderId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: '✓ Notificación eliminada' })
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const handleDismissReminder = async (reminderId: string) => {
    try {
      const res = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISMISSED' })
      })
      if (res.ok) {
        toast({ title: '✓ Recordatorio descartado' })
        // Re-generate notifications (will re-create if <=7 days left)
        await fetch('/api/notifications/generate', { method: 'POST' })
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo descartar', variant: 'destructive' })
    }
  }

  const handleDeleteAlarm = async (alarmId: string) => {
    try {
      const res = await fetch(`/api/alarms/${alarmId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: '✓ Alarma eliminada' })
        fetchAlarms()
        refreshSelectedClient()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la alarma', variant: 'destructive' })
    }
  }

  // Bulk actions
  const handleBulkDeleteClients = async () => {
    if (selectedClientIds.length === 0) return
    if (!confirm(`¿Eliminar ${selectedClientIds.length} clientes?`)) return
    try {
      const res = await fetch('/api/clients/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: selectedClientIds })
      })
      if (res.ok) {
        toast({ title: '✓ Clientes eliminados', description: `${selectedClientIds.length} clientes movidos a papelera` })
        setSelectedClientIds([])
        fetchClients()
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron eliminar', variant: 'destructive' })
    }
  }

  const handleBulkDeleteAlarms = async () => {
    if (selectedAlarmIds.length === 0) return
    if (!confirm(`¿Eliminar ${selectedAlarmIds.length} alarmas?`)) return
    try {
      const res = await fetch('/api/alarms/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: selectedAlarmIds })
      })
      if (res.ok) {
        toast({ title: '✓ Alarmas eliminadas', description: `${selectedAlarmIds.length} alarmas movidas a papelera` })
        setSelectedAlarmIds([])
        fetchAlarms()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron eliminar', variant: 'destructive' })
    }
  }

  const handleBulkDeleteReminders = async () => {
    if (selectedReminderIds.length === 0) return
    if (!confirm(`¿Eliminar ${selectedReminderIds.length} notificaciones?`)) return
    try {
      const res = await fetch('/api/reminders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: selectedReminderIds })
      })
      if (res.ok) {
        toast({ title: '✓ Notificaciones eliminadas', description: `${selectedReminderIds.length} notificaciones movidas a papelera` })
        setSelectedReminderIds([])
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron eliminar', variant: 'destructive' })
    }
  }

  // Trash actions
  const handleRestoreFromTrash = async (type: 'client' | 'reminder' | 'alarm', ids: string[]) => {
    try {
      const res = await fetch('/api/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ids })
      })
      if (res.ok) {
        toast({ title: '✓ Restaurado', description: `${ids.length} elementos restaurados` })
        fetchTrashData()
        fetchClients()
        fetchAlarms()
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo restaurar', variant: 'destructive' })
    }
  }

  const handlePermanentDelete = async (type: 'client' | 'reminder' | 'alarm', ids: string[]) => {
    if (!confirm('Esta acción es permanente y no se puede deshacer.')) return
    try {
      const res = await fetch('/api/trash/delete-permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ids })
      })
      if (res.ok) {
        toast({ title: '✓ Eliminado permanentemente' })
        fetchTrashData()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const handleEmptyTrash = async () => {
    if (!confirm('¿Vaciar toda la papelera? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch('/api/trash/empty', { method: 'POST' })
      if (res.ok) {
        toast({ title: '✓ Papelera vaciada' })
        fetchTrashData()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo vaciar la papelera', variant: 'destructive' })
    }
  }

  const handleUpdateTrashConfig = async (updates: Partial<TrashConfig>) => {
    try {
      const res = await fetch('/api/trash/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        const data = await res.json()
        setTrashConfig(data)
        toast({ title: '✓ Configuración actualizada' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  const handleUpdateNotificationConfig = async (updates: Partial<NotificationConfig>) => {
    try {
      const res = await fetch('/api/config/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        const data = await res.json()
        setNotificationConfig(data)
        toast({ title: '✓ Configuración actualizada' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  const handleUpdateSystemConfig = async (updates: Partial<SystemConfig>) => {
    try {
      const res = await fetch('/api/config/system', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        const data = await res.json()
        setSystemConfig(data)
        if (data.language) {
          setCurrentLanguage(data.language as Language)
        }
        toast({ title: '✓ Configuración actualizada' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  // Helper function for translations
  const t = useCallback((key: string): string => {
    const keys = key.split('.')
    let result: any = translations[currentLanguage]
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k]
      } else {
        // Fallback to Spanish
        let fallback: any = translations['es']
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk]
          } else {
            return key
          }
        }
        return typeof fallback === 'string' ? fallback : key
      }
    }
    
    return typeof result === 'string' ? result : key
  }, [currentLanguage])

  // Service/Hosting/Domain edit handlers
  const handleEditService = async () => {
    if (!editingService || !selectedClient) return
    try {
      const res = await fetch(`/api/services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService)
      })
      if (res.ok) {
        toast({ title: '✓ Servicio actualizado' })
        setShowEditServiceDialog(false)
        setEditingService(null)
        const updatedClient = await fetchClientById(selectedClient.id)
        if (updatedClient) setSelectedClient(updatedClient)
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('¿Eliminar este servicio?')) return
    try {
      const res = await fetch(`/api/services/${serviceId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: '✓ Servicio eliminado' })
        refreshSelectedClient()
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const handleEditHosting = async () => {
    if (!editingHosting || !selectedClient) return
    try {
      const res = await fetch(`/api/hosting/${editingHosting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingHosting)
      })
      if (res.ok) {
        toast({ title: '✓ Hosting actualizado' })
        setShowEditHostingDialog(false)
        setEditingHosting(null)
        const updatedClient = await fetchClientById(selectedClient.id)
        if (updatedClient) setSelectedClient(updatedClient)
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  const handleDeleteHosting = async (hostingId: string) => {
    if (!confirm('¿Eliminar este hosting?')) return
    try {
      const res = await fetch(`/api/hosting/${hostingId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: '✓ Hosting eliminado' })
        refreshSelectedClient()
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  const handleEditDomain = async () => {
    if (!editingDomain || !selectedClient) return
    try {
      const res = await fetch(`/api/domains/${editingDomain.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDomain)
      })
      if (res.ok) {
        toast({ title: '✓ Dominio actualizado' })
        setShowEditDomainDialog(false)
        setEditingDomain(null)
        const updatedClient = await fetchClientById(selectedClient.id)
        if (updatedClient) setSelectedClient(updatedClient)
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('¿Eliminar este dominio?')) return
    try {
      const res = await fetch(`/api/domains/${domainId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: '✓ Dominio eliminado' })
        refreshSelectedClient()
        fetchDashboard()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  // Export handlers
  const handleExportClients = (format: 'csv' | 'excel') => {
    if (clients.length === 0) {
      toast({ title: t('export.noData'), variant: 'destructive' })
      return
    }
    const data = prepareClientsForExport(clients)
    const date = new Date().toISOString().split('T')[0]
    const filename = `${t('export.filename.clients')}_${date}`
    
    if (format === 'csv') {
      exportToCSV(data, clientExportColumns, `${filename}.csv`)
    } else {
      exportToExcel(data, clientExportColumns, `${filename}.xls`, t('export.clients'), {
        showTotals: true,
        currencyColumns: ['monthlyRevenue', 'monthlyCosts', 'monthlyProfit'],
        dateColumns: ['contractStart', 'contractEnd', 'createdAt'],
        statusColumns: ['status'],
      })
    }
    toast({ title: '✓ ' + t('export.success') })
  }

  const handleExportServices = (format: 'csv' | 'excel') => {
    const data = prepareServicesForExport(clients)
    if (data.length === 0) {
      toast({ title: t('export.noData'), variant: 'destructive' })
      return
    }
    const date = new Date().toISOString().split('T')[0]
    const filename = `${t('export.filename.services')}_${date}`
    
    if (format === 'csv') {
      exportToCSV(data, serviceExportColumns, `${filename}.csv`)
    } else {
      exportToExcel(data, serviceExportColumns, `${filename}.xls`, t('export.services'), {
        showTotals: true,
        currencyColumns: ['monthlyPrice', 'annualPrice'],
        dateColumns: ['startDate', 'renewalDate'],
        statusColumns: ['status'],
      })
    }
    toast({ title: '✓ ' + t('export.success') })
  }

  const handleExportDomains = (format: 'csv' | 'excel') => {
    const data = prepareDomainsForExport(clients)
    if (data.length === 0) {
      toast({ title: t('export.noData'), variant: 'destructive' })
      return
    }
    const date = new Date().toISOString().split('T')[0]
    const filename = `${t('export.filename.domains')}_${date}`
    
    if (format === 'csv') {
      exportToCSV(data, domainExportColumns, `${filename}.csv`)
    } else {
      exportToExcel(data, domainExportColumns, `${filename}.xls`, t('export.domains'), {
        showTotals: true,
        currencyColumns: ['cost'],
        dateColumns: ['registrationDate', 'renewalDate'],
        statusColumns: ['status'],
      })
    }
    toast({ title: '✓ ' + t('export.success') })
  }

  const handleExportHosting = (format: 'csv' | 'excel') => {
    const data = prepareHostingForExport(clients)
    if (data.length === 0) {
      toast({ title: t('export.noData'), variant: 'destructive' })
      return
    }
    const date = new Date().toISOString().split('T')[0]
    const filename = `${t('export.filename.hosting')}_${date}`
    
    if (format === 'csv') {
      exportToCSV(data, hostingExportColumns, `${filename}.csv`)
    } else {
      exportToExcel(data, hostingExportColumns, `${filename}.xls`, t('export.hosting'), {
        showTotals: true,
        currencyColumns: ['monthlyCost', 'annualCost'],
        dateColumns: ['renewalDate'],
      })
    }
    toast({ title: '✓ ' + t('export.success') })
  }

  const handleExportFinances = (format: 'csv' | 'excel') => {
    if (!dashboardData || clients.length === 0) {
      toast({ title: t('export.noData'), variant: 'destructive' })
      return
    }
    const data = prepareFinanceForExport(clients, dashboardData.finances.monthlyRevenue)
    const date = new Date().toISOString().split('T')[0]
    const filename = `${t('export.filename.finances')}_${date}`
    
    if (format === 'csv') {
      exportToCSV(data, financeExportColumns, `${filename}.csv`)
    } else {
      exportToExcel(data, financeExportColumns, `${filename}.xls`, t('export.finances'), {
        showTotals: true,
        currencyColumns: ['revenue', 'costs', 'profit'],
        statusColumns: ['status'],
      })
    }
    toast({ title: '✓ ' + t('export.success') })
  }

  // Helper functions
  const formatCurrency = (amount: number) => {
    const currency = systemConfig?.currency || 'EUR'
    const currencyConfig = systemConfig?.availableCurrencies?.find(c => c.code === currency)
    const locale = currencyConfig?.locale || 'es-ES'
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      ACTIVE: { bg: 'bg-emerald-500', text: 'text-white' },
      PAUSED: { bg: 'bg-amber-500', text: 'text-white' },
      CANCELLED: { bg: 'bg-red-500', text: 'text-white' },
      EXPIRED: { bg: 'bg-red-500', text: 'text-white' },
      PENDING: { bg: 'bg-yellow-500', text: 'text-white' }
    }
    const variant = variants[status] || variants.ACTIVE
    return (
      <Badge className={`${variant.bg} ${variant.text} font-medium px-3 py-1 rounded-full`}>
        {t(`status.${status}`)}
      </Badge>
    )
  }

  const getServiceTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      WEB: <Globe className="h-4 w-4" />,
      HOSTING: <Server className="h-4 w-4" />,
      MAINTENANCE: <Wrench className="h-4 w-4" />,
      SEO: <SeoIcon className="h-4 w-4" />,
      DOMAIN: <Globe className="h-4 w-4" />,
      EMAIL: <Mail className="h-4 w-4" />,
      OTHER: <AlertCircle className="h-4 w-4" />
    }
    return icons[type] || icons.OTHER
  }

  const getServiceTypeLabel = (type: string) => {
    return t(`services.types.${type}`)
  }

  const getDaysUntil = (dateString: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(dateString)
    targetDate.setHours(0, 0, 0, 0)
    return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      LOW: 'bg-muted text-muted-foreground',
      MEDIUM: 'bg-blue-500/20 text-blue-600',
      HIGH: 'bg-orange-500/20 text-orange-600',
      URGENT: 'bg-red-500/20 text-red-600'
    }
    return <Badge className={styles[priority] || styles.MEDIUM}>{t(`alarms.priority.${priority}`)}</Badge>
  }

  const getAlarmTypeLabel = (type: string) => {
    return t(`alarms.types.${type}`)
  }

  // Invoice helper functions
  const getInvoiceStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      DRAFT: { bg: 'bg-gray-500', text: 'text-white' },
      SENT: { bg: 'bg-blue-500', text: 'text-white' },
      PAID: { bg: 'bg-emerald-500', text: 'text-white' },
      OVERDUE: { bg: 'bg-red-500', text: 'text-white' },
      CANCELLED: { bg: 'bg-orange-500', text: 'text-white' }
    }
    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      SENT: 'Enviada',
      PAID: 'Pagada',
      OVERDUE: 'Vencida',
      CANCELLED: 'Cancelada'
    }
    const variant = variants[status] || variants.DRAFT
    return (
      <Badge className={`${variant.bg} ${variant.text} font-medium px-3 py-1 rounded-full`}>
        {labels[status] || status}
      </Badge>
    )
  }

  const calculateInvoiceTotals = (items: { quantity: number; unitPrice: number; taxRate: number }[]) => {
    let subtotal = 0
    let taxAmount = 0
    items.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice
      const itemTax = itemSubtotal * (item.taxRate / 100)
      subtotal += itemSubtotal
      taxAmount += itemTax
    })
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round((subtotal + taxAmount) * 100) / 100
    }
  }

  // Invoice handlers
  const handleCreateInvoice = async () => {
    if (!newInvoice.clientId || !newInvoice.dueDate) {
      toast({ title: 'Error', description: 'Cliente y fecha de vencimiento son obligatorios', variant: 'destructive' })
      return
    }
    if (newInvoice.items.some(item => !item.description || item.unitPrice <= 0)) {
      toast({ title: 'Error', description: 'Todos los items deben tener descripción y precio', variant: 'destructive' })
      return
    }
    try {
      const totals = calculateInvoiceTotals(newInvoice.items)
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: newInvoice.clientId,
          issueDate: newInvoice.issueDate,
          dueDate: newInvoice.dueDate,
          notes: newInvoice.notes || null,
          terms: newInvoice.terms || null,
          items: newInvoice.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate
          })),
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          total: totals.total,
          language: newInvoice.language,
          status: 'DRAFT'
        })
      })
      if (res.ok) {
        toast({ title: '✓ Factura creada', description: 'La factura se ha creado correctamente' })
        setShowInvoiceDialog(false)
        setNewInvoice({
          clientId: '',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          language: 'es',
          notes: '',
          terms: '',
          items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 21 }]
        })
        fetchInvoices(invoiceStatusFilter, invoiceSearchTerm)
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'No se pudo crear la factura', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear la factura', variant: 'destructive' })
    }
  }

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return
    if (!editingInvoice.clientId || !editingInvoice.dueDate) {
      toast({ title: 'Error', description: 'Cliente y fecha de vencimiento son obligatorios', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch(`/api/invoices/${editingInvoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: editingInvoice.clientId,
          issueDate: editingInvoice.issueDate,
          dueDate: editingInvoice.dueDate,
          notes: editingInvoice.notes,
          terms: editingInvoice.terms,
          items: editingInvoice.items,
          subtotal: editingInvoice.subtotal,
          taxAmount: editingInvoice.taxAmount,
          total: editingInvoice.total,
          language: editingInvoice.language
        })
      })
      if (res.ok) {
        toast({ title: '✓ Factura actualizada' })
        setShowInvoiceDialog(false)
        setEditingInvoice(null)
        fetchInvoices(invoiceStatusFilter, invoiceSearchTerm)
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'No se pudo actualizar', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar la factura', variant: 'destructive' })
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('¿Eliminar esta factura?')) return
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: '✓ Factura eliminada' })
        fetchInvoices(invoiceStatusFilter, invoiceSearchTerm)
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la factura', variant: 'destructive' })
    }
  }

  const handleMarkInvoicePaid = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID', paidAt: new Date().toISOString() })
      })
      if (res.ok) {
        toast({ title: '✓ Factura marcada como pagada' })
        fetchInvoices(invoiceStatusFilter, invoiceSearchTerm)
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' })
    }
  }

  const handleDownloadPdf = async (invoiceId: string, language: string = 'es') => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf?lang=${language}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = `factura-${invoiceId}.pdf`
        window.document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
        toast({ title: '✓ PDF descargado' })
      } else {
        toast({ title: 'Error', description: 'No se pudo generar el PDF', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al descargar PDF', variant: 'destructive' })
    }
  }

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: 'POST' })
      if (res.ok) {
        toast({ title: '✓ Factura enviada', description: 'El email ha sido enviado correctamente' })
        fetchInvoices(invoiceStatusFilter, invoiceSearchTerm)
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'No se pudo enviar el email', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al enviar la factura', variant: 'destructive' })
    }
  }

  // Toggle selection helpers
  const toggleClientSelection = (clientId: string) => {
    setSelectedClientIds(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  const toggleAlarmSelection = (alarmId: string) => {
    setSelectedAlarmIds(prev => 
      prev.includes(alarmId) 
        ? prev.filter(id => id !== alarmId)
        : [...prev, alarmId]
    )
  }

  const toggleReminderSelection = (reminderId: string) => {
    setSelectedReminderIds(prev => 
      prev.includes(reminderId) 
        ? prev.filter(id => id !== reminderId)
        : [...prev, reminderId]
    )
  }

  const toggleAllClients = () => {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([])
    } else {
      setSelectedClientIds(clients.map(c => c.id))
    }
  }

  const toggleAllAlarms = () => {
    if (selectedAlarmIds.length === alarms.length) {
      setSelectedAlarmIds([])
    } else {
      setSelectedAlarmIds(alarms.map(a => a.id))
    }
  }

  const toggleAllReminders = () => {
    if (dashboardData && selectedReminderIds.length === dashboardData.reminders.length) {
      setSelectedReminderIds([])
    } else if (dashboardData) {
      setSelectedReminderIds(dashboardData.reminders.map(r => r.id))
    }
  }

  // Open client dialog from notification/alarm
  const openClientFromAlarm = async (clientId: string) => {
    const client = await fetchClientById(clientId)
    if (client) {
      setSelectedClient(client)
      setShowClientDialog(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-brand to-brand-dark rounded-2xl animate-pulse"></div>
            <div className="absolute inset-2 bg-card rounded-xl flex items-center justify-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-transparent">V</span>
            </div>
          </div>
          <p className="text-muted-foreground font-medium">{t('misc.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background bg-page-brand">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {systemConfig?.companyLogo ? (
                <img 
                  src={systemConfig.companyLogo} 
                  alt={systemConfig.companyName || 'Logo'} 
                  className="h-10 w-auto object-contain"
                />
              ) : (
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-brand-gradient rounded-xl shadow-brand"></div>
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">V</div>
              </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-brand">{systemConfig?.companyName || t('header.title')}</h1>
                <p className="text-xs text-muted-foreground">{t('header.subtitle')}</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-1 bg-muted p-1 rounded-xl">
              {[
                { id: 'dashboard', icon: BarChart3, label: t('nav.dashboard'), key: '1', permission: 'stats' as keyof UserPermissions },
                { id: 'calendar', icon: Calendar, label: 'Calendario', key: '2', permission: 'reminders' as keyof UserPermissions },
                { id: 'clients', icon: Users, label: t('nav.clients'), key: '3', permission: 'clients' as keyof UserPermissions },
                { id: 'alarms', icon: Bell, label: t('nav.alarms'), key: '4', permission: 'alarms' as keyof UserPermissions },
              ].filter(tab => hasPermission(tab.permission)).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'bg-card text-brand shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  <span className="ml-1 text-[10px] opacity-50 font-mono">{tab.key}</span>
                  {tab.id === 'alarms' && alarms.length > 0 && (
                    <span className="h-5 w-5 bg-brand rounded-full text-xs flex items-center justify-center text-white">
                      {alarms.length}
                    </span>
                  )}
                </button>
              ))}
              
              {/* Finanzas Dropdown - only show if at least one finance permission */}
              {(hasPermission('payments') || hasPermission('invoices') || hasPermission('stats')) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'payments' || activeTab === 'finances' || activeTab === 'invoices' ? 'bg-card text-brand shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'}`}>
                    <Wallet className="h-4 w-4" />
                    Finanzas
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasPermission('stats') && (
                  <DropdownMenuItem onClick={() => setActiveTab('finances')}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Resumen
                    <span className="ml-auto text-[10px] opacity-50 font-mono">5</span>
                  </DropdownMenuItem>
                  )}
                  {hasPermission('payments') && (
                  <DropdownMenuItem onClick={() => setActiveTab('payments')}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagos
                    <span className="ml-auto text-[10px] opacity-50 font-mono">6</span>
                  </DropdownMenuItem>
                  )}
                  {hasPermission('invoices') && (
                  <DropdownMenuItem onClick={() => setActiveTab('invoices')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Facturas
                    <span className="ml-auto text-[10px] opacity-50 font-mono">7</span>
                  </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              )}
              
              {hasPermission('trash') && (
              <button
                onClick={() => setActiveTab('trash')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'trash' 
                    ? 'bg-card text-brand shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                <Trash className="h-4 w-4" />
                {t('nav.trash')}
                <span className="ml-1 text-[10px] opacity-50 font-mono">8</span>
              </button>
              )}
            </nav>

            <div className="flex items-center gap-2">
              {hasPermission('audit') && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setShowAuditLogDialog(true)
                  fetchAuditLogs()
                }} 
                title="Historial de cambios"
              >
                <FileText className="h-5 w-5 text-muted-foreground" />
              </Button>
              )}
              {hasPermission('config') && (
              <Button variant="ghost" size="icon" onClick={() => setShowConfigDialog(true)} className="relative" title="Configuración">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => router.push('/settings')} className="relative" title="Empresa y Empleados">
                <Users className="h-5 w-5 text-muted-foreground" />
              </Button>
              {/* Theme Toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  className="text-muted-foreground"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              )}
              <Button 
                onClick={() => setShowAddClientDialog(true)}
                className="bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand-dark shadow-lg shadow-brand"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('header.newClient')}
              </Button>
              {/* User Menu */}
              {user && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                  <Avatar className="h-8 w-8 border-2 border-brand/30">
                    <AvatarFallback className="bg-gradient-to-br from-brand to-brand-dark text-white text-xs font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Classic Dashboard */}
            {dashboardData && (
              <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Clients */}
              <Card className="relative overflow-hidden border-0 shadow-lg bg-card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-20 to-brand-20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('kpi.totalClients')}</p>
                      <p className="text-4xl font-bold text-foreground mt-1">{dashboardData.clients.total}</p>
                      <div className="flex gap-2 mt-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          {dashboardData.clients.active} {t('kpi.active')}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
                          {dashboardData.clients.paused} {t('kpi.paused')}
                        </span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-brand to-brand-dark rounded-2xl flex items-center justify-center shadow-lg shadow-brand">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Revenue */}
              <Card className="relative overflow-hidden border-0 shadow-lg bg-card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('kpi.monthlyRevenue')}</p>
                      <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(dashboardData.finances.monthlyRevenue)}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        {formatCurrency(dashboardData.finances.annualRevenue)}{t('kpi.perYear')}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Costs */}
              <Card className="relative overflow-hidden border-0 shadow-lg bg-card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('kpi.monthlyCosts')}</p>
                      <p className="text-4xl font-bold text-red-500 dark:text-red-400 mt-1">{formatCurrency(dashboardData.finances.monthlyCosts)}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        {formatCurrency(dashboardData.finances.annualCosts)}{t('kpi.perYear')}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25">
                      <TrendingDown className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Profit */}
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-brand to-brand-dark">
                <div className="absolute top-0 right-0 w-32 h-32 bg-card/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-white/80">{t('kpi.monthlyProfit')}</p>
                      <p className="text-4xl font-bold text-white mt-1">{formatCurrency(dashboardData.finances.monthlyProfit)}</p>
                      <p className="text-xs text-white/80 mt-2">
                        Margen: {dashboardData.finances.monthlyRevenue > 0 
                          ? Math.round((dashboardData.finances.monthlyProfit / dashboardData.finances.monthlyRevenue) * 100) 
                          : 0}%
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-card/20 rounded-2xl flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <Card className="lg:col-span-2 border-0 shadow-lg bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-foreground">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-brand" />
                      {t('finances.evolution')}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* View Toggle */}
                      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                        <Button
                          size="sm"
                          variant={dashboardChartView === 'monthly' ? 'default' : 'ghost'}
                          className={`h-7 px-2 text-xs ${dashboardChartView === 'monthly' ? 'bg-brand text-white' : 'text-muted-foreground dark:text-gray-300'}`}
                          onClick={() => setDashboardChartView('monthly')}
                        >
                          Mensual
                        </Button>
                        <Button
                          size="sm"
                          variant={dashboardChartView === 'daily' ? 'default' : 'ghost'}
                          className={`h-7 px-2 text-xs ${dashboardChartView === 'daily' ? 'bg-brand text-white' : 'text-muted-foreground dark:text-gray-300'}`}
                          onClick={() => {
                            setDashboardChartView('daily')
                            fetchDashboardDailyStats(dashboardSelectedYear, dashboardSelectedMonth)
                          }}
                        >
                          Diaria
                        </Button>
                      </div>
                      {/* Month/Year Selectors for Daily View */}
                      {dashboardChartView === 'daily' && (
                        <>
                          <Select value={dashboardSelectedMonth.toString()} onValueChange={(v) => {
                            setDashboardSelectedMonth(parseInt(v))
                            fetchDashboardDailyStats(dashboardSelectedYear, parseInt(v))
                          }}>
                            <SelectTrigger className="w-28 h-8 dark:bg-gray-800 dark:text-white dark:border-gray-600">
                              <SelectValue className="dark:text-white" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                                <SelectItem key={i} value={(i + 1).toString()} className="dark:text-white dark:hover:bg-gray-700">{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={dashboardSelectedYear.toString()} onValueChange={(v) => {
                            setDashboardSelectedYear(parseInt(v))
                            fetchDashboardDailyStats(parseInt(v), dashboardSelectedMonth)
                          }}>
                            <SelectTrigger className="w-20 h-8 dark:bg-gray-800 dark:text-white dark:border-gray-600">
                              <SelectValue className="dark:text-white" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                              {[2023, 2024, 2025, 2026].map(y => (
                                <SelectItem key={y} value={y.toString()} className="dark:text-white dark:hover:bg-gray-700">{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => {
                          setShowFinanceHistoryDialog(true)
                          fetchMonthlyStats()
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalle
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    {dashboardChartView === 'monthly' ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboardData.chart}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                          <XAxis dataKey="month" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tick={{ fill: theme === 'dark' ? '#ffffff' : '#374151' }} />
                          <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} tick={{ fill: theme === 'dark' ? '#ffffff' : '#374151' }} tickFormatter={(v) => `${v}€`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', color: theme === 'dark' ? '#ffffff' : '#1f2937' }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#colorRevenue)" name={t('finances.revenue')} />
                          <Area type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={3} fill="url(#colorCosts)" name={t('finances.costs')} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardDailyStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                          <XAxis dataKey="day" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={10} tick={{ fill: theme === 'dark' ? '#ffffff' : '#374151' }} />
                          <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={10} tick={{ fill: theme === 'dark' ? '#ffffff' : '#374151' }} tickFormatter={(v) => `${v}€`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', color: theme === 'dark' ? '#ffffff' : '#1f2937' }}
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => `Día ${label}`}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Ingresos" />
                          <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} name="Costos" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Services Distribution */}
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <PieChart className="h-5 w-5 text-brand" />
                    {t('services.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={dashboardData.servicesDistribution.map((s, i) => ({ ...s, name: getServiceTypeLabel(s.type), value: s.count }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {dashboardData.servicesDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {dashboardData.servicesDistribution.slice(0, 5).map((service, i) => (
                      <div key={service.type} className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                        <span className="text-muted-foreground">{getServiceTypeLabel(service.type)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional KPIs Row - Below Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* New Clients This Month */}
              <Card className="relative overflow-hidden border-0 shadow-lg bg-card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Clientes Nuevos</p>
                      <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {dashboardData.kpis?.newClientsThisMonth ?? dashboardData.clients.newThisMonth ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        {(dashboardData.kpis?.newClientsThisMonth ?? dashboardData.clients.newThisMonth ?? 0) > (dashboardData.kpis?.newClientsLastMonth ?? 0) ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">
                              +{((dashboardData.kpis?.newClientsThisMonth ?? 0) - (dashboardData.kpis?.newClientsLastMonth ?? 0))} vs mes anterior
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 text-red-500" />
                            <span className="text-red-600 dark:text-red-400">
                              {dashboardData.kpis?.newClientsLastMonth ?? 0} el mes pasado
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <UserPlus className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Retention Rate */}
              <Card className="relative overflow-hidden border-0 shadow-lg bg-card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tasa de Retención</p>
                      <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {dashboardData.kpis?.retentionRate ?? 100}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Shield className="h-3 w-3 text-emerald-500" />
                        Clientes que permanecen activos
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Average Ticket Per Client */}
              <Card className="relative overflow-hidden border-0 shadow-lg bg-card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ticket Medio</p>
                      <p className="text-4xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {formatCurrency(dashboardData.kpis?.avgTicketPerClient ?? dashboardData.finances.avgTicketPerClient ?? 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-amber-500" />
                        Por cliente activo/mes
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                      <Receipt className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Renewals */}
              <Card className="relative overflow-hidden border-0 shadow-lg bg-card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Próximas Renovaciones</p>
                      <p className="text-4xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                        {dashboardData.kpis?.upcomingRenewalsCount ?? 
                          (dashboardData.renewals?.services?.length + dashboardData.renewals?.domains?.length + dashboardData.renewals?.hosting?.length) ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <AlertTriangle className={`h-3 w-3 ${(dashboardData.kpis?.urgentRenewals ?? 0) > 0 ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
                        {(dashboardData.kpis?.urgentRenewals ?? 0) > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">{dashboardData.kpis?.urgentRenewals} urgentes (≤7 días)</span>
                        ) : (
                          <span>En los próximos 30 días</span>
                        )}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/25">
                      <CalendarClock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Renewals & Recent Clients */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Renewals */}
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <div className="h-8 w-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-amber-600" />
                    </div>
                    {t('notifications.upcomingRenewals')}
                  </CardTitle>
                  <CardDescription>{t('notifications.upcomingRenewals')} - {t('services.title').toLowerCase()}, {t('domains.title').toLowerCase()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-3">
                      {[...dashboardData.renewals.services, ...dashboardData.renewals.domains, ...dashboardData.renewals.hosting]
                        .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime())
                        .slice(0, 8)
                        .map((item: any) => {
                          const days = getDaysUntil(item.renewalDate)
                          const isUrgent = days <= 7
                          const isExpired = days < 0
                          return (
                            <div 
                              key={item.id} 
                              className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-muted ${
                                isExpired ? 'bg-red-500/10' : isUrgent ? 'bg-amber-500/10' : 'bg-muted'
                              }`}
                              onClick={() => {
                                const client = clients.find(c => c.id === item.clientId)
                                if (client) {
                                  setSelectedClient(client)
                                  setShowClientDialog(true)
                                }
                              }}
                            >
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                isExpired ? 'bg-red-500/20' : isUrgent ? 'bg-amber-500/20' : 'bg-brand-20'
                              }`}>
                                {item.serviceType ? getServiceTypeIcon(item.serviceType) : 
                                 item.domainName ? <Globe className="h-5 w-5 text-blue-500" /> : 
                                 <Server className="h-5 w-5 text-orange-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{item.client?.company}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {item.description || item.domainName || `${item.provider} - ${item.plan}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge className={isExpired ? 'bg-red-500 text-white' : isUrgent ? 'bg-amber-500/20 text-white' : 'bg-muted text-foreground'}>
                                  {isExpired ? `${Math.abs(days)} ${t('dates.days')}` : `${days} ${t('dates.days')}`}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      {dashboardData.renewals.services.length === 0 && 
                       dashboardData.renewals.domains.length === 0 && 
                       dashboardData.renewals.hosting.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                          <p>{t('misc.noData')}</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Clients */}
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <div className="h-8 w-8 bg-brand-20 rounded-lg flex items-center justify-center">
                      <Clock className="h-4 w-4 text-brand" />
                    </div>
                    {t('clients.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-3">
                      {dashboardData.clients.recent.map((client) => (
                        <div 
                          key={client.id} 
                          className="flex items-center gap-4 p-3 rounded-xl bg-muted hover:bg-brand-10 cursor-pointer transition-all"
                          onClick={() => {
                            const fullClient = clients.find(c => c.id === client.id)
                            if (fullClient) {
                              setSelectedClient(fullClient)
                              setShowClientDialog(true)
                            }
                          }}
                        >
                          <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                            <AvatarFallback className="bg-gradient-to-br from-brand to-brand-dark text-white font-semibold">
                              {client.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{client.company}</p>
                            <p className="text-sm text-muted-foreground">{client.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-600">{formatCurrency(client.monthlyProfit)}{t('misc.perMonth')}</p>
                            <p className="text-xs text-muted-foreground">{t('finances.netProfit')}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(client.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
              </div>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {/* Calendar Header with Navigation */}
            <div className="flex flex-col lg:flex-row gap-4">
              <Card className="border-0 shadow-lg shadow-black/5 flex-1">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => {
                        const newDate = new Date(selectedYear, selectedMonth - 2, 1)
                        setSelectedMonth(newDate.getMonth() + 1)
                        setSelectedYear(newDate.getFullYear())
                      }}>
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      </Button>
                      <h2 className="text-xl font-bold text-foreground min-w-[180px] text-center">
                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][selectedMonth - 1]} {selectedYear}
                      </h2>
                      <Button variant="outline" size="icon" onClick={() => {
                        const newDate = new Date(selectedYear, selectedMonth, 1)
                        setSelectedMonth(newDate.getMonth() + 1)
                        setSelectedYear(newDate.getFullYear())
                      }}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedMonth(new Date().getMonth() + 1)
                        setSelectedYear(new Date().getFullYear())
                      }}>
                        Hoy
                      </Button>
                      <div className="flex rounded-lg overflow-hidden border">
                        <Button 
                          variant={calendarViewMode === 'month' ? 'default' : 'ghost'} 
                          size="sm"
                          className="rounded-none"
                          onClick={() => setCalendarViewMode('month')}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Mes
                        </Button>
                        <Button 
                          variant={calendarViewMode === 'list' ? 'default' : 'ghost'} 
                          size="sm"
                          className="rounded-none"
                          onClick={() => setCalendarViewMode('list')}
                        >
                          <List className="h-4 w-4 mr-1" />
                          Lista
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Summary */}
              {(() => {
                const monthEvents: any[] = []
                const monthStart = new Date(selectedYear, selectedMonth - 1, 1)
                const monthEnd = new Date(selectedYear, selectedMonth, 0)
                
                clients.forEach(client => {
                  if (calendarFilters.services) {
                    client.services.forEach(service => {
                      if (service.renewalDate) {
                        const date = new Date(service.renewalDate)
                        if (date >= monthStart && date <= monthEnd) {
                          monthEvents.push({ type: 'service', price: service.monthlyPrice, date: service.renewalDate })
                        }
                      }
                    })
                  }
                  if (calendarFilters.domains) {
                    client.domains.forEach(domain => {
                      if (domain.renewalDate) {
                        const date = new Date(domain.renewalDate)
                        if (date >= monthStart && date <= monthEnd) {
                          monthEvents.push({ type: 'domain', price: domain.cost, date: domain.renewalDate })
                        }
                      }
                    })
                  }
                  if (calendarFilters.hosting) {
                    client.hosting.forEach(h => {
                      if (h.renewalDate) {
                        const date = new Date(h.renewalDate)
                        if (date >= monthStart && date <= monthEnd) {
                          monthEvents.push({ type: 'hosting', price: h.monthlyCost, date: h.renewalDate })
                        }
                      }
                    })
                  }
                  if (calendarFilters.contracts && client.contractEnd) {
                    const date = new Date(client.contractEnd)
                    if (date >= monthStart && date <= monthEnd) {
                      monthEvents.push({ type: 'contract', client: client.company, date: client.contractEnd })
                    }
                  }
                })
                
                if (calendarFilters.invoices) {
                  invoices.forEach(invoice => {
                    if (invoice.dueDate) {
                      const date = new Date(invoice.dueDate)
                      if (date >= monthStart && date <= monthEnd && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED') {
                        monthEvents.push({ type: 'invoice', price: invoice.total, date: invoice.dueDate, status: invoice.status })
                      }
                    }
                  })
                }
                
                const totalRevenue = monthEvents.filter(e => e.price).reduce((sum, e) => sum + (e.price || 0), 0)
                const serviceCount = monthEvents.filter(e => e.type === 'service').length
                const domainCount = monthEvents.filter(e => e.type === 'domain').length
                const hostingCount = monthEvents.filter(e => e.type === 'hosting').length
                
                return (
                  <Card className="border-0 shadow-lg shadow-black/5">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-xl bg-emerald-500/10">
                          <p className="text-2xl font-bold text-emerald-600">{serviceCount}</p>
                          <p className="text-xs text-muted-foreground">Servicios</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-blue-500/10">
                          <p className="text-2xl font-bold text-blue-600">{domainCount}</p>
                          <p className="text-xs text-muted-foreground">Dominios</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-orange-500/10">
                          <p className="text-2xl font-bold text-orange-600">{hostingCount}</p>
                          <p className="text-xs text-muted-foreground">Hosting</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-brand/10">
                          <p className="text-2xl font-bold text-brand">{formatCurrency(totalRevenue)}</p>
                          <p className="text-xs text-muted-foreground">Total Mes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  <span className="text-sm font-medium text-muted-foreground self-center mr-2">Mostrar:</span>
                  {[
                    { key: 'services', label: 'Servicios', color: 'emerald' },
                    { key: 'domains', label: 'Dominios', color: 'blue' },
                    { key: 'hosting', label: 'Hosting', color: 'orange' },
                    { key: 'alarms', label: 'Alarmas', color: 'red' },
                    { key: 'contracts', label: 'Contratos', color: 'purple' },
                    { key: 'reminders', label: 'Recordatorios', color: 'yellow' },
                    { key: 'invoices', label: 'Facturas', color: 'cyan' },
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => setCalendarFilters(prev => ({ ...prev, [filter.key]: !prev[filter.key as keyof typeof prev] }))}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        calendarFilters[filter.key as keyof typeof calendarFilters]
                          ? filter.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                            filter.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                            filter.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' :
                            filter.color === 'red' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                            filter.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' :
                            filter.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' :
                            'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'
                          : 'bg-muted text-muted-foreground opacity-50'
                      }`}
                    >
                      {calendarFilters[filter.key as keyof typeof calendarFilters] && <Check className="h-3 w-3" />}
                      {filter.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calendar Grid or List View */}
            {calendarViewMode === 'month' ? (
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardContent className="pt-6">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const firstDay = new Date(selectedYear, selectedMonth - 1, 1)
                      const lastDay = new Date(selectedYear, selectedMonth, 0)
                      const daysInMonth = lastDay.getDate()
                      const startDayOfWeek = (firstDay.getDay() + 6) % 7
                      
                      const getEventsForDay = (day: number) => {
                        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        const events: any[] = []
                        
                        clients.forEach(client => {
                          if (calendarFilters.services) {
                            client.services.forEach(service => {
                              if (service.renewalDate && service.renewalDate.startsWith(dateStr)) {
                                events.push({
                                  type: 'service', client: client.company, description: getServiceTypeLabel(service.serviceType),
                                  price: service.monthlyPrice, clientId: client.id
                                })
                              }
                            })
                          }
                          if (calendarFilters.domains) {
                            client.domains.forEach(domain => {
                              if (domain.renewalDate && domain.renewalDate.startsWith(dateStr)) {
                                events.push({
                                  type: 'domain', client: client.company, description: domain.domainName,
                                  price: domain.cost, clientId: client.id
                                })
                              }
                            })
                          }
                          if (calendarFilters.hosting) {
                            client.hosting.forEach(h => {
                              if (h.renewalDate && h.renewalDate.startsWith(dateStr)) {
                                events.push({
                                  type: 'hosting', client: client.company, description: `${h.provider} - ${h.plan}`,
                                  price: h.monthlyCost, clientId: client.id
                                })
                              }
                            })
                          }
                          if (calendarFilters.contracts && client.contractEnd && client.contractEnd.startsWith(dateStr)) {
                            events.push({
                              type: 'contract', client: client.company, description: 'Fin contrato',
                              clientId: client.id
                            })
                          }
                        })
                        
                        if (calendarFilters.alarms) {
                          alarms.forEach(alarm => {
                            if (alarm.alarmDate && alarm.alarmDate.startsWith(dateStr)) {
                              events.push({
                                type: 'alarm', client: alarm.client?.company || 'N/A', description: alarm.title,
                                priority: alarm.priority, clientId: alarm.clientId
                              })
                            }
                          })
                        }
                        
                        if (calendarFilters.reminders) {
                          calendarReminders.forEach(reminder => {
                            if (reminder.reminderDate && reminder.reminderDate.startsWith(dateStr)) {
                              events.push({
                                type: 'reminder', client: reminder.client?.company || 'Sistema', description: reminder.message,
                                clientId: reminder.clientId
                              })
                            }
                          })
                        }
                        
                        if (calendarFilters.invoices) {
                          invoices.forEach(invoice => {
                            if (invoice.dueDate && invoice.dueDate.startsWith(dateStr) && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED') {
                              events.push({
                                type: 'invoice', client: invoice.client?.company || 'N/A', description: `Factura ${invoice.invoiceNumber}`,
                                price: invoice.total, status: invoice.status
                              })
                            }
                          })
                        }
                        
                        // Calendar notes (always show if filter is on)
                        calendarNotes.forEach(note => {
                          const noteDate = new Date(note.date)
                          const noteDateStr = noteDate.toISOString().split('T')[0]
                          if (noteDateStr === dateStr) {
                            events.push({
                              type: 'note', client: 'Nota personal', description: note.title,
                              color: note.color, noteId: note.id
                            })
                          }
                        })
                        
                        return events
                      }
                      
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      
                      const days = []
                      
                      for (let i = 0; i < startDayOfWeek; i++) {
                        days.push(<div key={`empty-${i}`} className="h-28 bg-muted/30 rounded-lg"></div>)
                      }
                      
                      for (let day = 1; day <= daysInMonth; day++) {
                        const events = getEventsForDay(day)
                        const isToday = today.getDate() === day && today.getMonth() === selectedMonth - 1 && today.getFullYear() === selectedYear
                        const isWeekend = (startDayOfWeek + day - 1) % 7 >= 5
                        
                        days.push(
                          <div 
                            key={day} 
                            onClick={() => {
                              const clickedDate = new Date(selectedYear, selectedMonth - 1, day)
                              setSelectedDay(clickedDate)
                              setShowDayDialog(true)
                            }}
                            className={`h-28 p-1.5 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                              isToday 
                                ? 'bg-brand/10 dark:bg-brand/20 border-brand border-2' 
                                : isWeekend 
                                  ? 'bg-muted/50 border-muted' 
                                  : 'bg-card border-border hover:border-brand/50'
                            }`}
                          >
                            <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-brand' : 'text-muted-foreground'}`}>
                              {day}
                            </div>
                            <div className="space-y-0.5 overflow-hidden max-h-[78px]">
                              {events.slice(0, 4).map((event, idx) => (
                                <div 
                                  key={idx}
                                  className={`text-[9px] px-1 py-0.5 rounded truncate cursor-pointer transition-all hover:scale-[1.02] ${
                                    event.type === 'service' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                                    event.type === 'domain' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                                    event.type === 'hosting' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' :
                                    event.type === 'alarm' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                                    event.type === 'contract' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' :
                                    event.type === 'reminder' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' :
                                    event.type === 'invoice' ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' :
                                    event.type === 'note' ? 
                                      (event.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                                       event.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                                       event.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' :
                                       event.color === 'red' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                                       event.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' :
                                       event.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' :
                                       'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300') :
                                    'bg-muted text-muted-foreground'
                                  }`}
                                  title={`${event.client}: ${event.description}${event.price ? ` - ${formatCurrency(event.price)}` : ''}`}
                                  onClick={() => {
                                    if (event.clientId) {
                                      const client = clients.find(c => c.id === event.clientId)
                                      if (client) {
                                        setSelectedClient(client)
                                        setShowClientDialog(true)
                                      }
                                    }
                                  }}
                                >
                                  {event.description}
                                </div>
                              ))}
                              {events.length > 4 && (
                                <div className="text-[9px] text-muted-foreground text-center font-medium">
                                  +{events.length - 4} más
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }
                      
                      return days
                    })()}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* List View */
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-brand" />
                    Eventos del Mes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {(() => {
                      const allEvents: any[] = []
                      const monthStart = new Date(selectedYear, selectedMonth - 1, 1)
                      const monthEnd = new Date(selectedYear, selectedMonth, 0)
                      
                      clients.forEach(client => {
                        if (calendarFilters.services) {
                          client.services.forEach(service => {
                            if (service.renewalDate) {
                              const date = new Date(service.renewalDate)
                              if (date >= monthStart && date <= monthEnd) {
                                allEvents.push({
                                  date: service.renewalDate, type: 'service',
                                  client: client.company, description: getServiceTypeLabel(service.serviceType),
                                  price: service.monthlyPrice, clientId: client.id
                                })
                              }
                            }
                          })
                        }
                        if (calendarFilters.domains) {
                          client.domains.forEach(domain => {
                            if (domain.renewalDate) {
                              const date = new Date(domain.renewalDate)
                              if (date >= monthStart && date <= monthEnd) {
                                allEvents.push({
                                  date: domain.renewalDate, type: 'domain',
                                  client: client.company, description: domain.domainName,
                                  price: domain.cost, clientId: client.id
                                })
                              }
                            }
                          })
                        }
                        if (calendarFilters.hosting) {
                          client.hosting.forEach(h => {
                            if (h.renewalDate) {
                              const date = new Date(h.renewalDate)
                              if (date >= monthStart && date <= monthEnd) {
                                allEvents.push({
                                  date: h.renewalDate, type: 'hosting',
                                  client: client.company, description: `${h.provider} - ${h.plan}`,
                                  price: h.monthlyCost, clientId: client.id
                                })
                              }
                            }
                          })
                        }
                        if (calendarFilters.contracts && client.contractEnd) {
                          const date = new Date(client.contractEnd)
                          if (date >= monthStart && date <= monthEnd) {
                            allEvents.push({
                              date: client.contractEnd, type: 'contract',
                              client: client.company, description: 'Fin de contrato',
                              clientId: client.id
                            })
                          }
                        }
                      })
                      
                      if (calendarFilters.alarms) {
                        alarms.forEach(alarm => {
                          if (alarm.alarmDate) {
                            const date = new Date(alarm.alarmDate)
                            if (date >= monthStart && date <= monthEnd) {
                              allEvents.push({
                                date: alarm.alarmDate, type: 'alarm',
                                client: alarm.client?.company || 'N/A', description: alarm.title,
                                priority: alarm.priority, clientId: alarm.clientId
                              })
                            }
                          }
                        })
                      }
                      
                      if (calendarFilters.reminders) {
                        calendarReminders.forEach(reminder => {
                          if (reminder.reminderDate) {
                            const date = new Date(reminder.reminderDate)
                            if (date >= monthStart && date <= monthEnd) {
                              allEvents.push({
                                date: reminder.reminderDate, type: 'reminder',
                                client: reminder.client?.company || 'Sistema', description: reminder.message,
                                clientId: reminder.clientId
                              })
                            }
                          }
                        })
                      }
                      
                      if (calendarFilters.invoices) {
                        invoices.forEach(invoice => {
                          if (invoice.dueDate && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED') {
                            const date = new Date(invoice.dueDate)
                            if (date >= monthStart && date <= monthEnd) {
                              allEvents.push({
                                date: invoice.dueDate, type: 'invoice',
                                client: invoice.client?.company || 'N/A', description: `Factura ${invoice.invoiceNumber}`,
                                price: invoice.total, status: invoice.status
                              })
                            }
                          }
                        })
                      }
                      
                      allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      
                      if (allEvents.length === 0) {
                        return (
                          <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium">No hay eventos este mes</p>
                            <p className="text-sm">Prueba a activar más filtros o cambiar de mes</p>
                          </div>
                        )
                      }
                      
                      // Group by date
                      const groupedEvents: Record<string, any[]> = {}
                      allEvents.forEach(event => {
                        const dateKey = event.date.split('T')[0]
                        if (!groupedEvents[dateKey]) groupedEvents[dateKey] = []
                        groupedEvents[dateKey].push(event)
                      })
                      
                      return Object.entries(groupedEvents).map(([dateKey, events]) => (
                        <div key={dateKey} className="mb-4">
                          <div className="sticky top-0 bg-card text-sm font-semibold text-muted-foreground py-2 border-b mb-2">
                            {formatDate(dateKey)} ({events.length} eventos)
                          </div>
                          <div className="space-y-2">
                            {events.map((event, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-brand/10 cursor-pointer transition-all"
                                onClick={() => {
                                  if (event.clientId) {
                                    const client = clients.find(c => c.id === event.clientId)
                                    if (client) {
                                      setSelectedClient(client)
                                      setShowClientDialog(true)
                                    }
                                  }
                                }}
                              >
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                  event.type === 'service' ? 'bg-emerald-500/20' :
                                  event.type === 'domain' ? 'bg-blue-500/20' :
                                  event.type === 'hosting' ? 'bg-orange-500/20' :
                                  event.type === 'alarm' ? 'bg-red-500/20' :
                                  event.type === 'contract' ? 'bg-purple-500/20' :
                                  event.type === 'reminder' ? 'bg-yellow-500/20' :
                                  'bg-cyan-500/20'
                                }`}>
                                  {event.type === 'service' ? <Wrench className="h-5 w-5 text-emerald-600" /> :
                                   event.type === 'domain' ? <Globe className="h-5 w-5 text-blue-600" /> :
                                   event.type === 'hosting' ? <Server className="h-5 w-5 text-orange-600" /> :
                                   event.type === 'alarm' ? <AlertCircle className="h-5 w-5 text-red-600" /> :
                                   event.type === 'contract' ? <FileText className="h-5 w-5 text-purple-600" /> :
                                   event.type === 'reminder' ? <Bell className="h-5 w-5 text-yellow-600" /> :
                                   <Receipt className="h-5 w-5 text-cyan-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">{event.client}</p>
                                  <p className="text-sm text-muted-foreground truncate">{event.description}</p>
                                </div>
                                {event.price && (
                                  <div className="text-right">
                                    <p className="font-semibold text-foreground">{formatCurrency(event.price)}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    })()}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 justify-center">
                  {[
                    { label: 'Servicios', color: 'bg-emerald-100 dark:bg-emerald-900/40' },
                    { label: 'Dominios', color: 'bg-blue-100 dark:bg-blue-900/40' },
                    { label: 'Hosting', color: 'bg-orange-100 dark:bg-orange-900/40' },
                    { label: 'Alarmas', color: 'bg-red-100 dark:bg-red-900/40' },
                    { label: 'Contratos', color: 'bg-purple-100 dark:bg-purple-900/40' },
                    { label: 'Recordatorios', color: 'bg-yellow-100 dark:bg-yellow-900/40' },
                    { label: 'Facturas', color: 'bg-cyan-100 dark:bg-cyan-900/40' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${item.color}`}></div>
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            {/* Search, Filters, View Mode & Bulk Actions */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder={t('clients.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 bg-muted border-0 rounded-xl"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48 h-12 bg-muted border-0 rounded-xl">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder={t('clients.filter')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('clients.all')}</SelectItem>
                        <SelectItem value="ACTIVE">{t('status.ACTIVE')}</SelectItem>
                        <SelectItem value="PAUSED">{t('status.PAUSED')}</SelectItem>
                        <SelectItem value="CANCELLED">{t('status.CANCELLED')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Advanced Filters Button */}
                    <Button
                      variant={showAdvancedFilters ? 'default' : 'outline'}
                      size="sm"
                      className={`gap-2 ${showAdvancedFilters ? 'bg-brand text-white' : ''}`}
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtros
                      {hasActiveFilters() && (
                        <span className="ml-1 h-5 w-5 bg-card text-brand rounded-full text-xs flex items-center justify-center font-bold">
                          !
                        </span>
                      )}
                    </Button>
                    {/* View Mode Selector */}
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={viewMode === 'grid' ? 'bg-brand text-white' : ''}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={viewMode === 'list' ? 'bg-brand text-white' : ''}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'compact' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('compact')}
                        className={viewMode === 'compact' ? 'bg-brand text-white' : ''}
                      >
                        <AlignJustify className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Export Dropdown */}
                    <div className="relative group">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            {t('actions.export')}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>{t('export.title')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">{t('export.clients')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleExportClients('csv')}>
                            <FileText className="h-4 w-4 mr-2" />
                            {t('export.toCSV')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportClients('excel')}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            {t('export.toExcel')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">{t('export.services')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleExportServices('csv')}>
                            <FileText className="h-4 w-4 mr-2" />
                            {t('export.toCSV')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportServices('excel')}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            {t('export.toExcel')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">{t('export.domains')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleExportDomains('csv')}>
                            <FileText className="h-4 w-4 mr-2" />
                            {t('export.toCSV')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportDomains('excel')}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            {t('export.toExcel')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">{t('export.hosting')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleExportHosting('csv')}>
                            <FileText className="h-4 w-4 mr-2" />
                            {t('export.toCSV')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportHosting('excel')}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            {t('export.toExcel')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Advanced Filters Panel */}
                  {showAdvancedFilters && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-brand-20 to-brand-20 rounded-xl border border-brand/20">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-brand-dark dark:text-brand-light flex items-center gap-2">
                          <SlidersHorizontal className="h-4 w-4" />
                          Búsqueda Avanzada
                        </h4>
                        <div className="flex items-center gap-2">
                          {hasActiveFilters() && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={clearAdvancedFilters}
                              className="text-muted-foreground hover:text-red-500"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Limpiar filtros
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            className="bg-brand hover:bg-brand-dark"
                            onClick={() => fetchClients()}
                          >
                            <Search className="h-4 w-4 mr-1" />
                            Aplicar
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date Range Filter */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Fecha (tipo)</Label>
                          <Select 
                            value={advancedFilters.dateType} 
                            onValueChange={(v) => setAdvancedFilters({...advancedFilters, dateType: v})}
                          >
                            <SelectTrigger className="h-9 bg-card">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="createdAt">Fecha creación</SelectItem>
                              <SelectItem value="contractStart">Inicio contrato</SelectItem>
                              <SelectItem value="contractEnd">Fin contrato</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Desde</Label>
                          <Input
                            type="date"
                            value={advancedFilters.dateFrom}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, dateFrom: e.target.value})}
                            className="h-9 bg-card"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Hasta</Label>
                          <Input
                            type="date"
                            value={advancedFilters.dateTo}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, dateTo: e.target.value})}
                            className="h-9 bg-card"
                          />
                        </div>
                        
                        {/* Service Type Filter */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Tipo de servicio</Label>
                          <Select 
                            value={advancedFilters.serviceType} 
                            onValueChange={(v) => setAdvancedFilters({...advancedFilters, serviceType: v === 'all' ? '' : v})}
                          >
                            <SelectTrigger className="h-9 bg-card">
                              <SelectValue placeholder="Todos los tipos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos los tipos</SelectItem>
                              <SelectItem value="WEB">Web</SelectItem>
                              <SelectItem value="HOSTING">Hosting</SelectItem>
                              <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                              <SelectItem value="SEO">SEO</SelectItem>
                              <SelectItem value="DOMAIN">Dominio</SelectItem>
                              <SelectItem value="EMAIL">Email</SelectItem>
                              <SelectItem value="OTHER">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Revenue Range */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Ingresos mín. (€)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={advancedFilters.revenueMin}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, revenueMin: e.target.value})}
                            className="h-9 bg-card"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Ingresos máx. (€)</Label>
                          <Input
                            type="number"
                            placeholder="∞"
                            value={advancedFilters.revenueMax}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, revenueMax: e.target.value})}
                            className="h-9 bg-card"
                          />
                        </div>
                        
                        {/* Profit Range */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Beneficio mín. (€)</Label>
                          <Input
                            type="number"
                            placeholder="-∞"
                            value={advancedFilters.profitMin}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, profitMin: e.target.value})}
                            className="h-9 bg-card"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Beneficio máx. (€)</Label>
                          <Input
                            type="number"
                            placeholder="∞"
                            value={advancedFilters.profitMax}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, profitMax: e.target.value})}
                            className="h-9 bg-card"
                          />
                        </div>
                      </div>
                      
                      {/* Active Filters Summary */}
                      {hasActiveFilters() && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {advancedFilters.dateFrom && (
                            <Badge variant="secondary" className="bg-brand-20 text-brand-dark dark:text-brand-light">
                              Desde: {advancedFilters.dateFrom}
                              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setAdvancedFilters({...advancedFilters, dateFrom: ''})} />
                            </Badge>
                          )}
                          {advancedFilters.dateTo && (
                            <Badge variant="secondary" className="bg-brand-20 text-brand-dark dark:text-brand-light">
                              Hasta: {advancedFilters.dateTo}
                              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setAdvancedFilters({...advancedFilters, dateTo: ''})} />
                            </Badge>
                          )}
                          {advancedFilters.serviceType && (
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-700">
                              Servicio: {advancedFilters.serviceType}
                              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setAdvancedFilters({...advancedFilters, serviceType: ''})} />
                            </Badge>
                          )}
                          {advancedFilters.revenueMin && (
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                              Ingresos ≥ {advancedFilters.revenueMin}€
                              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setAdvancedFilters({...advancedFilters, revenueMin: ''})} />
                            </Badge>
                          )}
                          {advancedFilters.revenueMax && (
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                              Ingresos ≤ {advancedFilters.revenueMax}€
                              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setAdvancedFilters({...advancedFilters, revenueMax: ''})} />
                            </Badge>
                          )}
                          {advancedFilters.profitMin && (
                            <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400">
                              Beneficio ≥ {advancedFilters.profitMin}€
                              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setAdvancedFilters({...advancedFilters, profitMin: ''})} />
                            </Badge>
                          )}
                          {advancedFilters.profitMax && (
                            <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400">
                              Beneficio ≤ {advancedFilters.profitMax}€
                              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setAdvancedFilters({...advancedFilters, profitMax: ''})} />
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Bulk Actions */}
                  {selectedClientIds.length > 0 && (
                    <div className="flex items-center gap-4 p-3 bg-brand-10 rounded-xl">
                      <span className="text-sm text-brand-dark dark:text-brand-light font-medium">
                        {selectedClientIds.length} {t('actions.selected')}
                      </span>
                      <Button size="sm" variant="destructive" onClick={handleBulkDeleteClients}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('actions.delete')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedClientIds([])}>
                        {t('actions.cancel')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Clients Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((client) => (
                  <Card 
                    key={client.id} 
                    className="border-0 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-brand cursor-pointer transition-all group"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedClientIds.includes(client.id)}
                          onCheckedChange={() => toggleClientSelection(client.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="border-brand data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                        />
                        <Avatar className="h-14 w-14 border-2 border-white shadow-lg cursor-pointer" onClick={() => {
                          setSelectedClient(client)
                          setShowClientDialog(true)
                        }}>
                          <AvatarFallback className="bg-gradient-to-br from-brand to-brand-dark text-white font-bold text-lg">
                            {client.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0" onClick={() => {
                          setSelectedClient(client)
                          setShowClientDialog(true)
                        }}>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground truncate">{client.company}</p>
                            {getStatusBadge(client.status)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{client.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Wrench className="h-3.5 w-3.5" />
                              {client._count?.services || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3.5 w-3.5" />
                              {client._count?.domains || 0}
                            </span>
                          </div>
                          <p className="font-bold text-emerald-600">{formatCurrency(client.monthlyProfit ?? client.monthlyRevenue)}{t('misc.perMonth')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Clients List View */}
            {viewMode === 'list' && (
              <Card className="border-0 shadow-lg shadow-black/5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedClientIds.length === clients.length && clients.length > 0}
                          onCheckedChange={toggleAllClients}
                          className="border-brand data-[state=checked]:bg-brand"
                        />
                      </TableHead>
                      <TableHead>{t('clients.name')}</TableHead>
                      <TableHead>{t('clients.company')}</TableHead>
                      <TableHead>{t('clients.status')}</TableHead>
                      <TableHead>{t('services.title')}</TableHead>
                      <TableHead className="text-right">{t('finances.revenue')}</TableHead>
                      <TableHead className="text-right">{t('actions.title')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id} className="cursor-pointer hover:bg-brand-10">
                        <TableCell>
                          <Checkbox
                            checked={selectedClientIds.includes(client.id)}
                            onCheckedChange={() => toggleClientSelection(client.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="border-brand data-[state=checked]:bg-brand"
                          />
                        </TableCell>
                        <TableCell onClick={() => { setSelectedClient(client); setShowClientDialog(true) }}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-to-br from-brand to-brand-dark text-white text-sm">
                                {client.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-xs text-muted-foreground">{client.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell onClick={() => { setSelectedClient(client); setShowClientDialog(true) }}>{client.company}</TableCell>
                        <TableCell onClick={() => { setSelectedClient(client); setShowClientDialog(true) }}>{getStatusBadge(client.status)}</TableCell>
                        <TableCell onClick={() => { setSelectedClient(client); setShowClientDialog(true) }}>{client._count?.services || 0}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600" onClick={() => { setSelectedClient(client); setShowClientDialog(true) }}>
                          {formatCurrency(client.monthlyProfit ?? client.monthlyRevenue)}{t('misc.perMonth')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteClient(client.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Clients Compact View */}
            {viewMode === 'compact' && (
              <Card className="border-0 shadow-lg shadow-black/5">
                <div className="divide-y divide-slate-100">
                  {clients.map((client) => (
                    <div 
                      key={client.id} 
                      className="flex items-center gap-3 p-3 hover:bg-brand-10 cursor-pointer"
                      onClick={() => { setSelectedClient(client); setShowClientDialog(true) }}
                    >
                      <Checkbox
                        checked={selectedClientIds.includes(client.id)}
                        onCheckedChange={() => toggleClientSelection(client.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="border-brand data-[state=checked]:bg-brand"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-brand to-brand-dark text-white text-sm">
                          {client.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{client.company}</p>
                        <p className="text-xs text-muted-foreground">{client.name}</p>
                      </div>
                      {getStatusBadge(client.status)}
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600 text-sm">{formatCurrency(client.monthlyProfit ?? client.monthlyRevenue)}{t('misc.perMonth')}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id) }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {clients.length === 0 && (
              <div className="text-center py-16">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">{t('clients.noResults')}</p>
              </div>
            )}
          </div>
        )}

        {/* Alarms Tab */}
        {activeTab === 'alarms' && (
          <div className="space-y-6">
            {/* Active Alarms */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <div className="h-8 w-8 bg-brand-20 rounded-lg flex items-center justify-center">
                      <Bell className="h-4 w-4 text-brand" />
                    </div>
                    {t('alarms.title')}
                  </CardTitle>
                  {selectedAlarmIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-brand-dark dark:text-brand-light">{selectedAlarmIds.length}</span>
                      <Button size="sm" variant="destructive" onClick={handleBulkDeleteAlarms}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('actions.delete')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedAlarmIds([])}>
                        {t('actions.cancel')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alarms.length === 0 ? (
                    <div className="text-center py-12">
                      <BellOff className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-muted-foreground">{t('alarms.noAlarms')}</p>
                    </div>
                  ) : (
                    <>
                      {/* Select All */}
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Checkbox
                          checked={selectedAlarmIds.length === alarms.length}
                          onCheckedChange={toggleAllAlarms}
                          className="border-brand data-[state=checked]:bg-brand"
                        />
                        <span className="text-sm text-muted-foreground">{t('actions.selectAll')}</span>
                      </div>
                      {alarms.map((alarm) => {
                        const days = getDaysUntil(alarm.alarmDate)
                        const isPast = days < 0
                        return (
                          <div key={alarm.id} className={`flex items-center gap-4 p-4 rounded-xl ${isPast ? 'bg-red-500/10' : 'bg-muted'}`}>
                            <Checkbox
                              checked={selectedAlarmIds.includes(alarm.id)}
                              onCheckedChange={() => toggleAlarmSelection(alarm.id)}
                              className="border-brand data-[state=checked]:bg-brand"
                            />
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                              alarm.priority === 'URGENT' ? 'bg-red-500/20' : 
                              alarm.priority === 'HIGH' ? 'bg-orange-500/20' : 
                              alarm.priority === 'MEDIUM' ? 'bg-blue-500/20' : 'bg-muted'
                            }`}>
                              {alarm.type === 'CONTRACT_END' ? <FileText className="h-5 w-5 text-brand" /> :
                               alarm.type === 'ANNIVERSARY' ? <Award className="h-5 w-5 text-amber-600" /> :
                               alarm.type === 'FOLLOW_UP' ? <Target className="h-5 w-5 text-blue-600" /> :
                               <Bell className="h-5 w-5 text-muted-foreground" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground">{alarm.title}</p>
                                {getPriorityBadge(alarm.priority)}
                              </div>
                              <p className="text-sm text-muted-foreground">{alarm.client?.company}</p>
                              {alarm.description && <p className="text-xs text-muted-foreground mt-1">{alarm.description}</p>}
                            </div>
                            <div className="text-right flex items-center gap-2">
                              {alarm.client && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openClientFromAlarm(alarm.client!.id)}
                                  title={t('clients.title')}
                                >
                                  <ExternalLink className="h-4 w-4 text-brand" />
                                </Button>
                              )}
                              <Badge className={isPast ? 'bg-red-500 text-white' : 'bg-brand-20 text-brand-dark dark:text-brand-light'}>
                                {isPast ? t('alarms.expired') : `${days} ${t('dates.days')}`}
                              </Badge>
                              <p className="text-xs text-muted-foreground">{formatDate(alarm.alarmDate)}</p>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteAlarm(alarm.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending Reminders */}
            {dashboardData && dashboardData.reminders.length > 0 && (
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <div className="h-8 w-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </div>
                      {t('notifications.title')}
                    </CardTitle>
                    {selectedReminderIds.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-brand-dark dark:text-brand-light">{selectedReminderIds.length}</span>
                        <Button size="sm" variant="destructive" onClick={handleBulkDeleteReminders}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t('actions.delete')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedReminderIds([])}>
                          {t('actions.cancel')}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Select All */}
                    <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg">
                      <Checkbox
                        checked={selectedReminderIds.length === dashboardData.reminders.length}
                        onCheckedChange={toggleAllReminders}
                        className="border-brand data-[state=checked]:bg-brand"
                      />
                      <span className="text-sm text-muted-foreground">{t('actions.selectAll')}</span>
                    </div>
                    {dashboardData.reminders.map((reminder) => (
                      <div key={reminder.id} className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <Checkbox
                          checked={selectedReminderIds.includes(reminder.id)}
                          onCheckedChange={() => toggleReminderSelection(reminder.id)}
                          className="border-brand data-[state=checked]:bg-brand"
                        />
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <p className="flex-1 text-foreground">{reminder.message}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatDate(reminder.reminderDate)}</span>
                          {reminder.client && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openClientFromAlarm(reminder.client!.id)}
                              title={t('clients.title')}
                            >
                              <ExternalLink className="h-4 w-4 text-brand" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDismissReminder(reminder.id)}>
                            <Check className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteReminder(reminder.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Payment Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pagos</p>
                      <p className="text-2xl font-bold text-foreground">{paymentTotals?.total || 0}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-brand" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pendientes</p>
                      <p className="text-2xl font-bold text-amber-500">{paymentTotals?.pending || 0}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(paymentTotals?.pendingAmount || 0)}</p>
                    </div>
                    <Timer className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pagados</p>
                      <p className="text-2xl font-bold text-emerald-500">{paymentTotals?.paid || 0}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(paymentTotals?.paidAmount || 0)}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Fallidos</p>
                      <p className="text-2xl font-bold text-red-500">{paymentTotals?.failed || 0}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Actions */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="PENDING">Pendientes</SelectItem>
                        <SelectItem value="PAID">Pagados</SelectItem>
                        <SelectItem value="FAILED">Fallidos</SelectItem>
                        <SelectItem value="REFUNDED">Reembolsados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={resyncPayments}
                      disabled={resyncingPayments}
                    >
                      <RefreshCw className={`h-4 w-4 ${resyncingPayments ? 'animate-spin' : ''}`} />
                      {resyncingPayments ? 'Sincronizando...' : 'Resincronizar'}
                    </Button>
                  <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-brand hover:bg-brand-dark">
                        <Plus className="h-4 w-4" />
                        Nuevo Pago Manual
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Registrar Pago Manual</DialogTitle>
                        <DialogDescription>
                          Registra un pago recibido fuera de Stripe
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Cliente</Label>
                          <Select value={newPayment.clientId} onValueChange={(v) => setNewPayment({...newPayment, clientId: v})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>{client.company}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select value={newPayment.entityType} onValueChange={(v) => setNewPayment({...newPayment, entityType: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SERVICE">Servicio</SelectItem>
                              <SelectItem value="HOSTING">Hosting</SelectItem>
                              <SelectItem value="DOMAIN">Dominio</SelectItem>
                              <SelectItem value="CUSTOM">Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Importe (€)</Label>
                          <Input type="number" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Descripción</Label>
                          <Input value={newPayment.description} onChange={(e) => setNewPayment({...newPayment, description: e.target.value})} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancelar</Button>
                        <Button onClick={async () => {
                          if (!newPayment.clientId || newPayment.amount <= 0) {
                            toast({ title: 'Error', description: 'Completa todos los campos', variant: 'destructive' })
                            return
                          }
                          const res = await fetch('/api/payments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...newPayment, status: 'PAID', paidAt: new Date().toISOString() }),
                          })
                          if (res.ok) {
                            toast({ title: '✓ Pago registrado' })
                            setShowPaymentDialog(false)
                            setNewPayment({ clientId: '', entityType: 'CUSTOM', entityId: '', amount: 0, description: '', dueDate: '' })
                            fetchPayments(paymentStatusFilter)
                          }
                        }}>Guardar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments List */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Receipt className="h-5 w-5 text-brand" />
                  Historial de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando pagos...</div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No hay pagos registrados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Importe</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-muted/50">
                          <TableCell
                            className="font-medium cursor-pointer hover:text-brand transition-colors"
                            onClick={async () => {
                              // Cargar el cliente completo desde la API
                              const client = await fetchClientById(payment.clientId)
                              if (client) {
                                setSelectedClient(client)
                                setShowClientDialog(true)
                              }
                            }}
                          >
                            <span className="flex items-center gap-2">
                              {payment.client.company}
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              payment.entityType === 'SERVICE' ? 'border-emerald-500 text-emerald-600' :
                              payment.entityType === 'HOSTING' ? 'border-orange-500 text-orange-600' :
                              payment.entityType === 'DOMAIN' ? 'border-blue-500 text-blue-600' :
                              'border-gray-500 text-gray-600'
                            }>
                              {payment.entityType === 'SERVICE' ? 'Servicio' :
                               payment.entityType === 'HOSTING' ? 'Hosting' :
                               payment.entityType === 'DOMAIN' ? 'Dominio' : 'Otro'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{payment.description || '-'}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            <Badge className={
                              payment.status === 'PAID' ? 'bg-emerald-500' :
                              payment.status === 'PENDING' ? 'bg-amber-500' :
                              payment.status === 'FAILED' ? 'bg-red-500' :
                              payment.status === 'REFUNDED' ? 'bg-brand' :
                              'bg-gray-500'
                            }>
                              {payment.status === 'PAID' ? 'Pagado' :
                               payment.status === 'PENDING' ? 'Pendiente' :
                               payment.status === 'FAILED' ? 'Fallido' :
                               payment.status === 'REFUNDED' ? 'Reembolsado' : payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {/* Botón de asignar para pagos sin asignar */}
                              {(payment.client.email === 'unassigned@system.local' || payment.entityId === 'stripe-unassigned') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setAssigningPayment(payment)
                                    setAssignClientId('')
                                    setShowAssignDialog(true)
                                  }}
                                  title="Asignar a cliente"
                                >
                                  <UserPlus className="h-4 w-4 text-blue-500" />
                                </Button>
                              )}
                              {payment.status === 'PENDING' && (
                                <>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updatePaymentStatus(payment.id, 'PAID')} title="Marcar como pagado">
                                    <Check className="h-4 w-4 text-emerald-500" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                                    const client = clients.find(c => c.id === payment.clientId)
                                    if (client) {
                                      createStripeCheckout(payment.clientId, payment.entityType, payment.entityId, payment.amount, payment.description || '')
                                    }
                                  }} title="Enviar link de pago">
                                    <Send className="h-4 w-4 text-brand" />
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => deletePayment(payment.id)} title="Eliminar">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Assign Payment Dialog */}
            <Dialog open={showAssignDialog} onOpenChange={(open) => {
              setShowAssignDialog(open)
              if (!open) {
                setStripeData(null)
                setShowCreateClientFromPayment(false)
              }
            }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Asignar Pago a Cliente</DialogTitle>
                  <DialogDescription>
                    Selecciona un cliente existente o crea uno nuevo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {assigningPayment && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Pago a asignar:</p>
                      <p className="font-semibold text-lg">{formatCurrency(assigningPayment.amount)}</p>
                      <p className="text-xs text-muted-foreground truncate">{assigningPayment.description}</p>
                    </div>
                  )}

                  {/* Cargar datos de Stripe automáticamente */}
                  {assigningPayment?.stripeSessionId && !stripeData && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fetchStripeData(assigningPayment.id)}
                      disabled={loadingStripeData}
                    >
                      {loadingStripeData ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Cargando datos de Stripe...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Obtener datos de Stripe
                        </>
                      )}
                    </Button>
                  )}

                  {/* Mostrar datos de Stripe */}
                  {stripeData?.customer && (
                    <div className="p-3 bg-brand-10 border border-brand/20 rounded-lg">
                      <p className="text-sm font-semibold text-brand-dark dark:text-brand-light mb-2">
                        📋 Datos de Stripe:
                      </p>
                      <div className="space-y-1 text-sm">
                        {stripeData.customer.name && (
                          <p><span className="text-muted-foreground">Nombre:</span> <strong>{stripeData.customer.name}</strong></p>
                        )}
                        {stripeData.customer.email && (
                          <p><span className="text-muted-foreground">Email:</span> <strong>{stripeData.customer.email}</strong></p>
                        )}
                        {stripeData.customer.phone && (
                          <p><span className="text-muted-foreground">Teléfono:</span> <strong>{stripeData.customer.phone}</strong></p>
                        )}
                        {stripeData.customer.city && (
                          <p><span className="text-muted-foreground">Ciudad:</span> {stripeData.customer.city}</p>
                        )}
                        {stripeData.customer.country && (
                          <p><span className="text-muted-foreground">País:</span> {stripeData.customer.country}</p>
                        )}
                      </div>

                      {/* Botón para crear cliente */}
                      {!showCreateClientFromPayment && (
                        <Button
                          className="w-full mt-3 bg-brand hover:bg-brand-dark"
                          onClick={() => setShowCreateClientFromPayment(true)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Crear cliente con estos datos
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Confirmación para crear cliente */}
                  {showCreateClientFromPayment && stripeData?.customer && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                        ✓ Se creará el cliente:
                      </p>
                      <p className="font-semibold">{stripeData.customer.name || 'Nuevo Cliente'}</p>
                      <p className="text-sm text-muted-foreground">{stripeData.customer.email}</p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateClientFromPayment(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={createClientFromPayment}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Crear y asignar
                        </Button>
                      </div>
                    </div>
                  )}

                  {!showCreateClientFromPayment && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            o asignar a existente
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Cliente existente</Label>
                        <Select value={assignClientId} onValueChange={setAssignClientId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.filter(c => c.email !== 'unassigned@system.local').map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.company} - {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
                {!showCreateClientFromPayment && (
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancelar</Button>
                    <Button onClick={assignPaymentToClient} disabled={!assignClientId}>
                      Asignar a existente
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Finances Tab */}
        {activeTab === 'finances' && dashboardData && (
          <div className="space-y-6">
            {/* Export Actions */}
            <div className="flex justify-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    {t('actions.export')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{t('export.finances')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExportFinances('csv')}>
                    <FileText className="h-4 w-4 mr-2" />
                    {t('export.toCSV')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportFinances('excel')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {t('export.toExcel')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600">
                <CardContent className="relative pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-100">{t('finances.revenue')}</p>
                      <p className="text-4xl font-bold text-white mt-1">{formatCurrency(dashboardData.finances.annualRevenue)}</p>
                      <p className="text-sm text-emerald-200 mt-2">{formatCurrency(dashboardData.finances.monthlyRevenue)}{t('misc.perMonth')}</p>
                    </div>
                    <div className="h-16 w-16 bg-card/20 rounded-2xl flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600">
                <CardContent className="relative pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-100">{t('finances.costs')}</p>
                      <p className="text-4xl font-bold text-white mt-1">{formatCurrency(dashboardData.finances.annualCosts)}</p>
                      <p className="text-sm text-red-200 mt-2">{formatCurrency(dashboardData.finances.monthlyCosts)}{t('misc.perMonth')}</p>
                    </div>
                    <div className="h-16 w-16 bg-card/20 rounded-2xl flex items-center justify-center">
                      <TrendingDown className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-brand to-brand-dark">
                <CardContent className="relative pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white/80">{t('finances.profit')}</p>
                      <p className="text-4xl font-bold text-white mt-1">{formatCurrency(dashboardData.finances.annualProfit)}</p>
                      <p className="text-sm text-white/80 mt-2">{formatCurrency(dashboardData.finances.monthlyProfit)}{t('misc.perMonth')}</p>
                    </div>
                    <div className="h-16 w-16 bg-card/20 rounded-2xl flex items-center justify-center">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Client */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Star className="h-5 w-5 text-brand" />
                  {t('finances.distribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {clients
                      .filter(c => c.status === 'ACTIVE')
                      .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
                      .map((client, index) => {
                        const percentage = dashboardData.finances.monthlyRevenue > 0 
                          ? (client.monthlyRevenue / dashboardData.finances.monthlyRevenue) * 100
                          : 0
                        return (
                          <div 
                            key={client.id}
                            className="flex items-center gap-4 p-4 rounded-xl bg-muted hover:bg-brand-10 cursor-pointer transition-all"
                            onClick={() => {
                              setSelectedClient(client)
                              setShowClientDialog(true)
                            }}
                          >
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-amber-400 text-white' :
                              index === 1 ? 'bg-zinc-400 text-white' :
                              index === 2 ? 'bg-amber-600 text-white' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              #{index + 1}
                            </div>
                            <Avatar className="h-10 w-10 border-2 border-white shadow">
                              <AvatarFallback className="bg-gradient-to-br from-brand to-brand-dark text-white">
                                {client.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{client.company}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={percentage} className="h-2 flex-1" />
                                <span className="text-xs text-muted-foreground w-12">{Math.round(percentage)}%</span>
                              </div>
                            </div>
                            <p className="font-bold text-emerald-600">{formatCurrency(client.monthlyProfit ?? client.monthlyRevenue)}{t('misc.perMonth')}</p>
                          </div>
                        )
                      })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            {/* Invoice Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Facturas</p>
                      <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-brand" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Borradores</p>
                      <p className="text-2xl font-bold text-gray-500">{invoices.filter(i => i.status === 'DRAFT').length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pendientes</p>
                      <p className="text-2xl font-bold text-blue-500">{invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE').length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pagadas</p>
                      <p className="text-2xl font-bold text-emerald-500">{invoices.filter(i => i.status === 'PAID').length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Actions */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por número, cliente..."
                        value={invoiceSearchTerm}
                        onChange={(e) => {
                          setInvoiceSearchTerm(e.target.value)
                          fetchInvoices(invoiceStatusFilter, e.target.value)
                        }}
                        className="pl-10"
                      />
                    </div>
                    <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filtrar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="DRAFT">Borrador</SelectItem>
                        <SelectItem value="SENT">Enviada</SelectItem>
                        <SelectItem value="PAID">Pagada</SelectItem>
                        <SelectItem value="OVERDUE">Vencida</SelectItem>
                        <SelectItem value="CANCELLED">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Dialog open={showInvoiceDialog} onOpenChange={(open) => {
                    setShowInvoiceDialog(open)
                    if (!open) {
                      setIsInvoiceMaximized(false)
                      setEditingInvoice(null)
                      setNewInvoice({
                        clientId: '',
                        issueDate: new Date().toISOString().split('T')[0],
                        dueDate: '',
                        notes: '',
                        terms: '',
                        items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 21 }]
                      })
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand-dark">
                        <Plus className="h-4 w-4" />
                        Nueva Factura
                      </Button>
                    </DialogTrigger>
                    <DialogContent className={`${isInvoiceMaximized ? '!w-screen !h-screen !max-w-none rounded-none inset-0 translate-x-0 translate-y-0' : '!w-[95vw] !max-w-[1400px] !max-h-[90vh]'} overflow-hidden flex flex-col p-0 transition-all duration-200`}>
                      <DialogHeader className="flex-shrink-0 p-6 pb-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <DialogTitle className="text-xl">{editingInvoice ? 'Editar Factura' : 'Nueva Factura'}</DialogTitle>
                            <DialogDescription>
                              {editingInvoice ? 'Modifica los datos de la factura' : 'Crea una nueva factura para un cliente'}
                            </DialogDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsInvoiceMaximized(!isInvoiceMaximized)}
                            className="h-9 w-9 hover:bg-muted"
                          >
                            {isInvoiceMaximized ? (
                              <Minimize2 className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Maximize2 className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </DialogHeader>
                      <div className="flex-1 min-h-0 px-6 pb-6 overflow-auto">
                        <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Cliente *</Label>
                            <Select 
                              value={editingInvoice ? editingInvoice.clientId : newInvoice.clientId} 
                              onValueChange={(v) => {
                                if (editingInvoice) {
                                  setEditingInvoice({...editingInvoice, clientId: v})
                                } else {
                                  setNewInvoice({...newInvoice, clientId: v})
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cliente" />
                              </SelectTrigger>
                              <SelectContent>
                                {clients.filter(c => c.status === 'ACTIVE').map(client => (
                                  <SelectItem key={client.id} value={client.id}>{client.company} - {client.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label>Número de Factura</Label>
                              <Input 
                                value={editingInvoice?.invoiceNumber || 'Auto'} 
                                disabled 
                                className="bg-muted"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Idioma PDF</Label>
                              <Select 
                                value={editingInvoice ? editingInvoice.language : newInvoice.language}
                                onValueChange={(v) => {
                                  if (editingInvoice) {
                                    setEditingInvoice({...editingInvoice, language: v})
                                  } else {
                                    setNewInvoice({...newInvoice, language: v})
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                                  <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                                  <SelectItem value="en">🇬🇧 English</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Fecha de emisión</Label>
                            <Input 
                              type="date" 
                              value={editingInvoice ? editingInvoice.issueDate : newInvoice.issueDate}
                              onChange={(e) => {
                                if (editingInvoice) {
                                  setEditingInvoice({...editingInvoice, issueDate: e.target.value})
                                } else {
                                  setNewInvoice({...newInvoice, issueDate: e.target.value})
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Fecha de vencimiento *</Label>
                            <Input 
                              type="date" 
                              value={editingInvoice ? editingInvoice.dueDate : newInvoice.dueDate}
                              onChange={(e) => {
                                if (editingInvoice) {
                                  setEditingInvoice({...editingInvoice, dueDate: e.target.value})
                                } else {
                                  setNewInvoice({...newInvoice, dueDate: e.target.value})
                                }
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Items */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Conceptos</Label>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              data-action="add-item"
                              onClick={() => {
                                if (editingInvoice) {
                                  setEditingInvoice({
                                    ...editingInvoice, 
                                    items: [...editingInvoice.items, { id: '', description: '', quantity: 1, unitPrice: 0, taxRate: 21, subtotal: 0, taxAmount: 0, total: 0 }]
                                  })
                                } else {
                                  setNewInvoice({
                                    ...newInvoice, 
                                    items: [...newInvoice.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 21 }]
                                  })
                                }
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Añadir línea
                            </Button>
                          </div>
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[40%]">Descripción</TableHead>
                                  <TableHead className="w-[15%]">Cantidad</TableHead>
                                  <TableHead className="w-[15%]">Precio</TableHead>
                                  <TableHead className="w-[10%]">IVA %</TableHead>
                                  <TableHead className="w-[15%]">Total</TableHead>
                                  <TableHead className="w-[5%]"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(editingInvoice ? editingInvoice.items : newInvoice.items).map((item, index) => {
                                  const subtotal = item.quantity * item.unitPrice
                                  const taxAmount = subtotal * (item.taxRate / 100)
                                  const total = subtotal + taxAmount
                                  const totalItems = (editingInvoice ? editingInvoice.items : newInvoice.items).length
                                  
                                  return (
                                    <TableRow key={index}>
                                      <TableCell>
                                        <Input 
                                          value={item.description}
                                          onChange={(e) => {
                                            const newItems = [...(editingInvoice ? editingInvoice.items : newInvoice.items)]
                                            newItems[index] = { ...newItems[index], description: e.target.value }
                                            if (editingInvoice) {
                                              const totals = calculateInvoiceTotals(newItems)
                                              setEditingInvoice({...editingInvoice, items: newItems, ...totals})
                                            } else {
                                              setNewInvoice({...newInvoice, items: newItems})
                                            }
                                          }}
                                          placeholder="Descripción del concepto"
                                          onFocus={(e) => e.target.select()}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input 
                                          type="number"
                                          min="1"
                                          inputMode="numeric"
                                          value={item.quantity}
                                          onChange={(e) => {
                                            const newItems = [...(editingInvoice ? editingInvoice.items : newInvoice.items)]
                                            newItems[index] = { ...newItems[index], quantity: parseInt(e.target.value) || 1 }
                                            if (editingInvoice) {
                                              const totals = calculateInvoiceTotals(newItems)
                                              setEditingInvoice({...editingInvoice, items: newItems, ...totals})
                                            } else {
                                              setNewInvoice({...newInvoice, items: newItems})
                                            }
                                          }}
                                          onFocus={(e) => e.target.select()}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault()
                                              // Move to next row's quantity or add new item
                                              const nextInput = document.querySelector(`[data-item-index="${index + 1}"][data-field="quantity"]`) as HTMLInputElement
                                              if (nextInput) {
                                                nextInput.focus()
                                              } else if (index === totalItems - 1) {
                                                // Add new item if on last row
                                                const addBtn = document.querySelector('[data-action="add-item"]') as HTMLButtonElement
                                                addBtn?.click()
                                                setTimeout(() => {
                                                  const newInput = document.querySelector(`[data-item-index="${index + 1}"][data-field="quantity"]`) as HTMLInputElement
                                                  newInput?.focus()
                                                }, 50)
                                              }
                                            }
                                          }}
                                          data-item-index={index}
                                          data-field="quantity"
                                          className="text-center"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input 
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          inputMode="decimal"
                                          value={item.unitPrice}
                                          onChange={(e) => {
                                            const newItems = [...(editingInvoice ? editingInvoice.items : newInvoice.items)]
                                            newItems[index] = { ...newItems[index], unitPrice: parseFloat(e.target.value) || 0 }
                                            if (editingInvoice) {
                                              const totals = calculateInvoiceTotals(newItems)
                                              setEditingInvoice({...editingInvoice, items: newItems, ...totals})
                                            } else {
                                              setNewInvoice({...newInvoice, items: newItems})
                                            }
                                          }}
                                          onFocus={(e) => e.target.select()}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault()
                                              const nextInput = document.querySelector(`[data-item-index="${index}"][data-field="taxRate"]`) as HTMLInputElement
                                              nextInput?.focus()
                                            }
                                          }}
                                          data-item-index={index}
                                          data-field="unitPrice"
                                          className="text-right"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input 
                                          type="number"
                                          min="0"
                                          max="100"
                                          inputMode="numeric"
                                          value={item.taxRate}
                                          onChange={(e) => {
                                            const newItems = [...(editingInvoice ? editingInvoice.items : newInvoice.items)]
                                            newItems[index] = { ...newItems[index], taxRate: parseFloat(e.target.value) || 0 }
                                            if (editingInvoice) {
                                              const totals = calculateInvoiceTotals(newItems)
                                              setEditingInvoice({...editingInvoice, items: newItems, ...totals})
                                            } else {
                                              setNewInvoice({...newInvoice, items: newItems})
                                            }
                                          }}
                                          onFocus={(e) => e.target.select()}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault()
                                              // Move to next row's quantity
                                              const nextInput = document.querySelector(`[data-item-index="${index + 1}"][data-field="quantity"]`) as HTMLInputElement
                                              if (nextInput) {
                                                nextInput.focus()
                                              } else if (index === totalItems - 1) {
                                                // Add new item if on last row
                                                const addBtn = document.querySelector('[data-action="add-item"]') as HTMLButtonElement
                                                addBtn?.click()
                                                setTimeout(() => {
                                                  const newInput = document.querySelector(`[data-item-index="${index + 1}"][data-field="quantity"]`) as HTMLInputElement
                                                  newInput?.focus()
                                                }, 50)
                                              }
                                            }
                                          }}
                                          data-item-index={index}
                                          data-field="taxRate"
                                          className="text-center"
                                        />
                                      </TableCell>
                                      <TableCell className="font-medium text-right">
                                        {formatCurrency(total)}
                                      </TableCell>
                                      <TableCell>
                                        <Button 
                                          type="button"
                                          variant="ghost" 
                                          size="sm"
                                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                          onClick={() => {
                                            const newItems = (editingInvoice ? editingInvoice.items : newInvoice.items).filter((_, i) => i !== index)
                                            if (editingInvoice) {
                                              const totals = calculateInvoiceTotals(newItems)
                                              setEditingInvoice({...editingInvoice, items: newItems, ...totals})
                                            } else {
                                              setNewInvoice({...newInvoice, items: newItems})
                                            }
                                          }}
                                          disabled={(editingInvoice ? editingInvoice.items : newInvoice.items).length === 1}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end">
                          <div className="w-64 space-y-2 p-4 bg-muted rounded-lg">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Subtotal:</span>
                              <span className="font-medium">{formatCurrency(editingInvoice ? editingInvoice.subtotal : calculateInvoiceTotals(newInvoice.items).subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">IVA:</span>
                              <span className="font-medium">{formatCurrency(editingInvoice ? editingInvoice.taxAmount : calculateInvoiceTotals(newInvoice.items).taxAmount)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total:</span>
                              <span className="text-brand">{formatCurrency(editingInvoice ? editingInvoice.total : calculateInvoiceTotals(newInvoice.items).total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Notes and Terms */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Notas</Label>
                            <Textarea 
                              value={editingInvoice ? editingInvoice.notes || '' : newInvoice.notes}
                              onChange={(e) => {
                                if (editingInvoice) {
                                  setEditingInvoice({...editingInvoice, notes: e.target.value})
                                } else {
                                  setNewInvoice({...newInvoice, notes: e.target.value})
                                }
                              }}
                              placeholder="Notas adicionales para el cliente..."
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Condiciones</Label>
                            <Textarea 
                              value={editingInvoice ? editingInvoice.terms || '' : newInvoice.terms}
                              onChange={(e) => {
                                if (editingInvoice) {
                                  setEditingInvoice({...editingInvoice, terms: e.target.value})
                                } else {
                                  setNewInvoice({...newInvoice, terms: e.target.value})
                                }
                              }}
                              placeholder="Condiciones de pago..."
                              rows={3}
                            />
                          </div>
                        </div>
                        </div>
                      </div>
                      <DialogFooter className="flex-shrink-0 px-6 py-4 border-t">
                        <Button variant="outline" onClick={() => {
                          setShowInvoiceDialog(false)
                          setEditingInvoice(null)
                        }}>Cancelar</Button>
                        <Button onClick={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}>
                          {editingInvoice ? 'Guardar cambios' : 'Crear factura'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Invoices List */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Receipt className="h-5 w-5 text-brand" />
                  Listado de Facturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoiceLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando facturas...</div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No hay facturas</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>
                            <span className="cursor-pointer hover:text-brand transition-colors" onClick={async () => {
                              if (invoice.client) {
                                const client = await fetchClientById(invoice.clientId)
                                if (client) {
                                  setSelectedClient(client)
                                  setShowClientDialog(true)
                                }
                              }
                            }}>
                              {invoice.client?.company || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(invoice.total)}</TableCell>
                          <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menú</span>
                                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                    <path d="M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedInvoice(invoice)
                                  setShowInvoicePreviewDialog(true)
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadPdf(invoice.id, invoice.language || 'es')}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Descargar PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendInvoice(invoice.id)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setEditingInvoice(invoice)
                                    setShowInvoiceDialog(true)
                                  }}
                                  disabled={invoice.status === 'PAID'}
                                  className={invoice.status === 'PAID' ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                                  <DropdownMenuItem onClick={() => handleMarkInvoicePaid(invoice.id)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marcar como pagada
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  disabled={invoice.status === 'PAID'}
                                  className={`text-red-600 ${invoice.status === 'PAID' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Invoice Preview Dialog */}
            <Dialog open={showInvoicePreviewDialog} onOpenChange={setShowInvoicePreviewDialog}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                {selectedInvoice && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-brand" />
                        Factura {selectedInvoice.invoiceNumber}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedInvoice.client?.company || 'Cliente'} - {formatDate(selectedInvoice.issueDate)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Status and info */}
                      <div className="flex items-center justify-between">
                        {getInvoiceStatusBadge(selectedInvoice.status)}
                        {selectedInvoice.sentAt && (
                          <span className="text-sm text-muted-foreground">
                            Enviada: {formatDate(selectedInvoice.sentAt)}
                          </span>
                        )}
                      </div>

                      {/* Client info */}
                      <Card className="bg-muted">
                        <CardContent className="pt-4">
                          <h4 className="font-semibold mb-2">Datos del cliente</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-muted-foreground">Empresa:</span> {selectedInvoice.client?.company}</div>
                            <div><span className="text-muted-foreground">Contacto:</span> {selectedInvoice.client?.name}</div>
                            <div><span className="text-muted-foreground">Email:</span> {selectedInvoice.client?.email}</div>
                            <div><span className="text-muted-foreground">Teléfono:</span> {selectedInvoice.client?.phone || '-'}</div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Items table */}
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descripción</TableHead>
                              <TableHead className="text-center">Cant.</TableHead>
                              <TableHead className="text-right">Precio</TableHead>
                              <TableHead className="text-center">IVA</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedInvoice.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                <TableCell className="text-center">{item.taxRate}%</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Totals */}
                      <div className="flex justify-end">
                        <div className="w-64 space-y-2 p-4 bg-muted rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">IVA:</span>
                            <span className="font-medium">{formatCurrency(selectedInvoice.taxAmount)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-brand">{formatCurrency(selectedInvoice.total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Notes and Terms */}
                      {(selectedInvoice.notes || selectedInvoice.terms) && (
                        <div className="grid grid-cols-2 gap-4">
                          {selectedInvoice.notes && (
                            <div>
                              <h4 className="font-semibold mb-1">Notas</h4>
                              <p className="text-sm text-muted-foreground">{selectedInvoice.notes}</p>
                            </div>
                          )}
                          {selectedInvoice.terms && (
                            <div>
                              <h4 className="font-semibold mb-1">Condiciones</h4>
                              <p className="text-sm text-muted-foreground">{selectedInvoice.terms}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dates info */}
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>Fecha de emisión: {formatDate(selectedInvoice.issueDate)}</div>
                        <div>Fecha de vencimiento: {formatDate(selectedInvoice.dueDate)}</div>
                        {selectedInvoice.paidAt && (
                          <div className="text-emerald-600">Pagada: {formatDate(selectedInvoice.paidAt)}</div>
                        )}
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => handleDownloadPdf(selectedInvoice.id, selectedInvoice.language || 'es')}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                      {selectedInvoice.status !== 'PAID' && (
                        <Button variant="outline" onClick={() => handleSendInvoice(selectedInvoice.id)}>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar email
                        </Button>
                      )}
                      {(selectedInvoice.status === 'SENT' || selectedInvoice.status === 'OVERDUE') && (
                        <Button onClick={() => handleMarkInvoicePaid(selectedInvoice.id)} className="bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar pagada
                        </Button>
                      )}
                      {selectedInvoice.status !== 'PAID' && (
                        <Button variant="outline" onClick={() => {
                          setShowInvoicePreviewDialog(false)
                          setEditingInvoice(selectedInvoice)
                          setShowInvoiceDialog(true)
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      )}
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Trash Tab */}
        {activeTab === 'trash' && trashData && (
          <div className="space-y-6">
            {/* Trash Config */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Settings className="h-5 w-5 text-brand" />
                  {t('trash.title')} - {t('config.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand-20 rounded-lg flex items-center justify-center">
                      <Timer className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t('trash.autoDelete')}</p>
                      <p className="text-sm text-muted-foreground">{t('trash.autoDeleteDesc')} {trashConfig?.autoDeleteDays || 10} {t('trash.days')}</p>
                    </div>
                  </div>
                  <Switch
                    checked={trashConfig?.autoDeleteEnabled ?? true}
                    onCheckedChange={(checked) => handleUpdateTrashConfig({ autoDeleteEnabled: checked })}
                  />
                </div>
                {trashData.clients.length + trashData.alarms.length + trashData.reminders.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="destructive" onClick={handleEmptyTrash}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('trash.emptyTrash')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deleted Clients */}
            {trashData.clients.length > 0 && (
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Users className="h-5 w-5 text-brand" />
                    {t('trash.deletedClients')} ({trashData.clients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trashData.clients.map((client) => (
                      <div key={client.id} className="flex items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-red-400 to-rose-500 text-white">
                            {client.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{client.company}</p>
                          <p className="text-sm text-muted-foreground">{client.name} · {client.email}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('trash.deleted')}: {formatDate(client.deletedAt)}</p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleRestoreFromTrash('client', [client.id])}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            {t('trash.restore')}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handlePermanentDelete('client', [client.id])}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deleted Alarms */}
            {trashData.alarms.length > 0 && (
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Bell className="h-5 w-5 text-brand" />
                    {t('trash.deletedAlarms')} ({trashData.alarms.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trashData.alarms.map((alarm) => (
                      <div key={alarm.id} className="flex items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="h-10 w-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <Bell className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{alarm.title}</p>
                          <p className="text-sm text-muted-foreground">{alarm.client?.company}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('trash.deleted')}: {formatDate(alarm.deletedAt)}</p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleRestoreFromTrash('alarm', [alarm.id])}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            {t('trash.restore')}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handlePermanentDelete('alarm', [alarm.id])}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deleted Reminders */}
            {trashData.reminders.length > 0 && (
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <AlertTriangle className="h-5 w-5 text-brand" />
                    {t('trash.deletedNotifications')} ({trashData.reminders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trashData.reminders.map((reminder) => (
                      <div key={reminder.id} className="flex items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="h-10 w-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{reminder.message}</p>
                          <p className="text-sm text-muted-foreground">{reminder.client?.company || t('clients.noClients')}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('trash.deleted')}: {formatDate(reminder.deletedAt)}</p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleRestoreFromTrash('reminder', [reminder.id])}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            {t('trash.restore')}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handlePermanentDelete('reminder', [reminder.id])}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {trashData.clients.length === 0 && trashData.alarms.length === 0 && trashData.reminders.length === 0 && (
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardContent className="py-16 text-center">
                  <Archive className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">{t('trash.empty')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Client Detail Dialog */}
      <Dialog open={showClientDialog} onOpenChange={(open) => {
        setShowClientDialog(open)
        if (!open) setIsMaximized(false)
      }}>
        <DialogContent className={`${isMaximized ? '!w-screen !h-screen !max-w-none rounded-none inset-0 translate-x-0 translate-y-0' : '!w-[98vw] !max-w-[1800px] !h-[90vh]'} overflow-hidden flex flex-col p-0 transition-all duration-200`}>
          {selectedClient && (
            <>
              <DialogHeader className="flex-shrink-0 p-6 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-brand to-brand-dark text-white font-bold text-xl">
                        {selectedClient.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-xl">{selectedClient.company}</DialogTitle>
                      <DialogDescription className="flex items-center gap-2 mt-1">
                        {selectedClient.name} · {selectedClient.email}
                        {getStatusBadge(selectedClient.status)}
                      </DialogDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="h-9 w-9 hover:bg-muted"
                  >
                    {isMaximized ? (
                      <Minimize2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Maximize2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 min-h-0 px-8 py-4 overflow-auto">
                <div className="space-y-5 py-2">
                  {/* Financial Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl text-white">
                      <p className="text-xs text-emerald-100">{t('clients.incomeMonth')}</p>
                      <p className="text-2xl font-bold">{formatCurrency(selectedClient.monthlyRevenue)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl text-white">
                      <p className="text-xs text-red-100">{t('clients.costsMonth')}</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(selectedClient.hosting?.reduce((acc, h) => acc + Number(h.monthlyCost), 0) || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-brand to-brand-dark rounded-xl text-white">
                      <p className="text-xs text-white/80">{t('clients.profitMonth')}</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(selectedClient.monthlyRevenue - (selectedClient.hosting?.reduce((acc, h) => acc + Number(h.monthlyCost), 0) || 0))}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Services */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-brand" />
                        {t('services.title')}
                      </h4>
                      <Button size="sm" variant="outline" onClick={() => setShowAddServiceDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        {t('services.add')}
                      </Button>
                    </div>
                    {selectedClient.services?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedClient.services.map((service) => (
                          <div key={service.id} className="flex items-center gap-4 p-3 bg-muted rounded-xl">
                            <div className="h-10 w-10 bg-brand-20 rounded-lg flex items-center justify-center text-brand">
                              {getServiceTypeIcon(service.serviceType)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{getServiceTypeLabel(service.serviceType)}</p>
                              <p className="text-sm text-muted-foreground">{service.description || t('services.description')}</p>
                            </div>
                            <p className="font-semibold text-emerald-600">{formatCurrency(service.monthlyPrice)}{t('misc.perMonth')}</p>
                            {getStatusBadge(service.status)}
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => createStripeCheckout(selectedClient.id, 'SERVICE', service.id, service.monthlyPrice, `${getServiceTypeLabel(service.serviceType)} - ${selectedClient.company}`)}
                                title="Cobrar con Stripe"
                              >
                                <CreditCard className="h-4 w-4 text-brand" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => { setEditingService(service); setShowEditServiceDialog(true) }}
                              >
                                <Edit className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeleteService(service.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4 bg-muted rounded-xl">{t('services.noServices')}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Hosting */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Server className="h-4 w-4 text-orange-500" />
                        {t('hosting.title')}
                      </h4>
                      <Button size="sm" variant="outline" onClick={() => setShowAddHostingDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        {t('hosting.add')}
                      </Button>
                    </div>
                    {selectedClient.hosting?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedClient.hosting.map((h) => (
                          <div key={h.id} className="flex items-center gap-4 p-3 bg-orange-500/10 rounded-xl">
                            <div className="h-10 w-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                              <Server className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{h.provider}</p>
                              <p className="text-sm text-muted-foreground">{h.plan}</p>
                            </div>
                            <p className="font-semibold text-red-600">-{formatCurrency(h.monthlyCost)}{t('misc.perMonth')}</p>
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => createStripeCheckout(selectedClient.id, 'HOSTING', h.id, h.monthlyCost, `Hosting ${h.provider} - ${h.plan}`)}
                                title="Cobrar con Stripe"
                              >
                                <CreditCard className="h-4 w-4 text-brand" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => { setEditingHosting(h); setShowEditHostingDialog(true) }}
                              >
                                <Edit className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeleteHosting(h.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4 bg-muted rounded-xl">{t('hosting.noHosting')}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Domains */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        {t('domains.title')}
                      </h4>
                      <Button size="sm" variant="outline" onClick={() => setShowAddDomainDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        {t('domains.add')}
                      </Button>
                    </div>
                    {selectedClient.domains?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedClient.domains.map((d) => (
                          <div key={d.id} className="flex items-center gap-4 p-3 bg-blue-500/10 rounded-xl">
                            <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <Globe className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{d.domainName}</p>
                              <p className="text-sm text-muted-foreground">{d.registrar}</p>
                            </div>
                            <p className="font-semibold text-red-600">-{formatCurrency(d.cost)}{t('domains.perYear')}</p>
                            {getStatusBadge(d.status)}
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => createStripeCheckout(selectedClient.id, 'DOMAIN', d.id, d.cost, `Dominio ${d.domainName}`)}
                                title="Cobrar con Stripe"
                              >
                                <CreditCard className="h-4 w-4 text-brand" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => { setEditingDomain(d); setShowEditDomainDialog(true) }}
                              >
                                <Edit className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeleteDomain(d.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4 bg-muted rounded-xl">{t('domains.noDomains')}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Contract Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand" />
                        Contrato
                      </h4>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setEditingClient({
                            ...selectedClient,
                            contractStart: selectedClient.contractStart ? selectedClient.contractStart.split('T')[0] : '',
                            contractEnd: selectedClient.contractEnd ? selectedClient.contractEnd.split('T')[0] : '',
                          })
                          setShowEditClientDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {selectedClient.contractStart ? 'Editar' : 'Añadir'}
                      </Button>
                    </div>
                    {selectedClient.contractStart || selectedClient.contractEnd ? (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/20">
                          <p className="text-xs text-emerald-600 font-medium mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t('clients.contractStart')}
                          </p>
                          <p className="font-bold text-foreground text-lg">{formatDate(selectedClient.contractStart)}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-xl border border-red-500/20">
                          <p className="text-xs text-red-600 font-medium mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t('clients.contractEnd')}
                          </p>
                          <p className="font-bold text-foreground text-lg">{formatDate(selectedClient.contractEnd)}</p>
                          {selectedClient.contractEnd && (
                            <p className={`text-xs mt-1 font-medium ${
                              getDaysUntil(selectedClient.contractEnd) <= 30 ? 'text-red-600' :
                              getDaysUntil(selectedClient.contractEnd) <= 90 ? 'text-amber-600' : 'text-muted-foreground'
                            }`}>
                              {getDaysUntil(selectedClient.contractEnd) < 0 
                                ? `Vencido hace ${Math.abs(getDaysUntil(selectedClient.contractEnd))} días`
                                : `Vence en ${getDaysUntil(selectedClient.contractEnd)} días`
                              }
                            </p>
                          )}
                        </div>
                        <div className="p-4 bg-gradient-to-br from-brand-20 to-brand-20 rounded-xl border border-brand/20">
                          <p className="text-xs text-brand font-medium mb-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t('clients.duration')}
                          </p>
                          <p className="font-bold text-foreground text-lg">
                            {selectedClient.contractYears || '-'} {t('clients.years')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-gradient-to-r from-muted to-brand-10 rounded-xl border border-dashed border-border text-center">
                        <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-muted-foreground mb-2">Sin contrato configurado</p>
                        <p className="text-xs text-muted-foreground">Añade las fechas de contrato para llevar un mejor seguimiento</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Files Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Upload className="h-4 w-4 text-brand" />
                        Archivos
                        <Badge variant="outline" className="ml-2 text-xs">
                          {clientFiles.length}/{MAX_FILES_PER_CLIENT}
                        </Badge>
                      </h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file && selectedClient) {
                              if (clientFiles.length >= MAX_FILES_PER_CLIENT) {
                                toast({ title: 'Límite alcanzado', description: `Máximo ${MAX_FILES_PER_CLIENT} archivos por cliente`, variant: 'destructive' })
                                e.target.value = ''
                                return
                              }
                              await uploadFile(selectedClient.id, file, newFileCategory, newFileDescription)
                            }
                            e.target.value = ''
                          }}
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            if (clientFiles.length >= MAX_FILES_PER_CLIENT) {
                              toast({ title: 'Límite alcanzado', description: `Máximo ${MAX_FILES_PER_CLIENT} archivos por cliente`, variant: 'destructive' })
                              return
                            }
                            setShowFileDialog(true)
                          }}
                          disabled={uploadingFile}
                        >
                          {uploadingFile ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Subir archivo
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {loadingFiles ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2" />
                        Cargando archivos...
                      </div>
                    ) : clientFiles.length > 0 ? (
                      <div className="space-y-2">
                        {clientFiles.map((file) => (
                          <div 
                            key={file.id} 
                            className="flex items-center gap-4 p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                          >
                            <div className="h-10 w-10 bg-brand-20 rounded-lg flex items-center justify-center text-brand">
                              {getFileIcon(file.mimeType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{file.originalName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <Badge className={`${getCategoryColor(file.category)} text-white text-[10px] px-2 py-0`}>
                                  {getCategoryLabel(file.category)}
                                </Badge>
                                {file.description && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{file.description}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {canPreviewFile(file.mimeType) && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => openFilePreview(file)}
                                  title="Vista previa"
                                >
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => downloadFile(file.id, file.originalName)}
                                title="Descargar"
                              >
                                <Download className="h-4 w-4 text-brand" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-red-500/20"
                                onClick={async () => {
                                  if (confirm('¿Eliminar este archivo?')) {
                                    await deleteFile(file.id)
                                  }
                                }}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-gradient-to-r from-muted to-brand-10 rounded-xl border border-dashed border-border text-center">
                        <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-muted-foreground mb-2">Sin archivos adjuntos</p>
                        <p className="text-xs text-muted-foreground">Sube contratos, facturas u otros documentos (máx. {MAX_FILES_PER_CLIENT})</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Alarms */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Bell className="h-4 w-4 text-amber-500" />
                        {t('alarms.title')}
                      </h4>
                      <Button size="sm" variant="outline" onClick={() => setShowAddAlarmDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        {t('alarms.add')}
                      </Button>
                    </div>
                    {selectedClient.alarms?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedClient.alarms.map((alarm: any) => (
                          <div key={alarm.id} className="flex items-center gap-4 p-3 bg-amber-500/10 rounded-xl">
                            <div className="h-10 w-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                              <Bell className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{alarm.title}</p>
                              <p className="text-sm text-muted-foreground">{alarm.description || getAlarmTypeLabel(alarm.type)}</p>
                            </div>
                            {getPriorityBadge(alarm.priority)}
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeleteAlarm(alarm.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4 bg-muted rounded-xl">{t('alarms.noAlarms')}</p>
                    )}
                  </div>

                  {/* Notes */}
                  {selectedClient.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {t('clients.notes')}
                        </h4>
                        <p className="text-muted-foreground bg-muted p-4 rounded-xl">{selectedClient.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-shrink-0 border-t p-4 bg-muted/50">
                <Button variant="destructive" onClick={() => handleDeleteClient(selectedClient.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('actions.delete')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingClient({
                      ...selectedClient,
                      contractStart: selectedClient.contractStart ? selectedClient.contractStart.split('T')[0] : '',
                      contractEnd: selectedClient.contractEnd ? selectedClient.contractEnd.split('T')[0] : '',
                    })
                    setShowEditClientDialog(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('clients.edit')}
                </Button>
                <Button variant="outline" onClick={() => setShowClientDialog(false)}>
                  {t('actions.close')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={showEditClientDialog} onOpenChange={setShowEditClientDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('clients.edit')}</DialogTitle>
            <DialogDescription>{editingClient?.company}</DialogDescription>
          </DialogHeader>
          {editingClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('clients.name')} *</Label>
                  <Input 
                    value={editingClient.name} 
                    onChange={(e) => setEditingClient({...editingClient, name: e.target.value})} 
                  />
                </div>
                <div>
                  <Label>{t('clients.company')} *</Label>
                  <Input 
                    value={editingClient.company} 
                    onChange={(e) => setEditingClient({...editingClient, company: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('clients.email')} *</Label>
                  <Input 
                    type="email" 
                    value={editingClient.email} 
                    onChange={(e) => setEditingClient({...editingClient, email: e.target.value})} 
                  />
                </div>
                <div>
                  <Label>{t('clients.phone')}</Label>
                  <Input 
                    value={editingClient.phone || ''} 
                    onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{t('clients.status')}</Label>
                  <Select 
                    value={editingClient.status} 
                    onValueChange={(v) => setEditingClient({...editingClient, status: v as any})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">{t('status.ACTIVE')}</SelectItem>
                      <SelectItem value="PAUSED">{t('status.PAUSED')}</SelectItem>
                      <SelectItem value="CANCELLED">{t('status.CANCELLED')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('clients.contractStart')}</Label>
                  <Input 
                    type="date" 
                    value={editingClient.contractStart || ''} 
                    onChange={(e) => setEditingClient({...editingClient, contractStart: e.target.value})} 
                  />
                </div>
                <div>
                  <Label>{t('clients.contractEnd')}</Label>
                  <Input 
                    type="date" 
                    value={editingClient.contractEnd || ''} 
                    onChange={(e) => setEditingClient({...editingClient, contractEnd: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('clients.duration')} ({t('clients.years')})</Label>
                  <Input 
                    type="number" 
                    value={editingClient.contractYears || ''} 
                    onChange={(e) => setEditingClient({...editingClient, contractYears: e.target.value ? parseInt(e.target.value) : null})} 
                    placeholder="4"
                  />
                </div>
              </div>
              <div>
                <Label>{t('clients.notes')}</Label>
                <Textarea 
                  value={editingClient.notes || ''} 
                  onChange={(e) => setEditingClient({...editingClient, notes: e.target.value})} 
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditClientDialog(false)
              setEditingClient(null)
            }}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleEditClient} className="bg-brand hover:bg-brand-dark">
              {t('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-brand" />
              {t('config.title')}
            </DialogTitle>
            <DialogDescription>{t('config.description')}</DialogDescription>
          </DialogHeader>
          
          {notificationConfig && systemConfig && (
            <div className="space-y-6 py-4">
              {/* Language Selection */}
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Languages className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('config.language')}</p>
                    <p className="text-sm text-muted-foreground">{t('config.languageDescription')}</p>
                  </div>
                </div>
                <Select
                  value={systemConfig.language || 'es'}
                  onValueChange={(value) => handleUpdateSystemConfig({ language: value })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder={t('config.language')} />
                  </SelectTrigger>
                  <SelectContent>
                    {systemConfig.availableLanguages?.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Currency Selection */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('config.currency')}</p>
                    <p className="text-sm text-muted-foreground">{t('config.currencyDescription')}</p>
                  </div>
                </div>
                <Select
                  value={systemConfig.currency || 'EUR'}
                  onValueChange={(value) => handleUpdateSystemConfig({ currency: value })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder={t('config.currency')} />
                  </SelectTrigger>
                  <SelectContent>
                    {systemConfig.availableCurrencies?.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand Customization */}
              <div className="p-4 bg-gradient-to-r from-brand-10 to-brand-10 rounded-xl border border-brand-20">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${systemConfig.primaryColor || '#7c3aed'}20` }}
                  >
                    <Palette 
                      className="h-5 w-5" 
                      style={{ color: systemConfig.primaryColor || '#7c3aed' }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Personalización de Marca</p>
                    <p className="text-sm text-muted-foreground">Colores y logo de tu empresa</p>
                  </div>
                </div>
                
                {/* Color Preview */}
                <div 
                  className="p-4 rounded-lg mb-4 border"
                  style={{ 
                    backgroundColor: `${systemConfig.primaryColor || '#7c3aed'}10`,
                    borderColor: `${systemConfig.primaryColor || '#7c3aed'}30`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: systemConfig.primaryColor || '#7c3aed' }}
                    >
                      Botón Ejemplo
                    </button>
                    <span 
                      className="text-sm font-medium"
                      style={{ color: systemConfig.primaryColor || '#7c3aed' }}
                    >
                      Texto coloreado
                    </span>
                    <div 
                      className="px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: systemConfig.primaryColor || '#7c3aed' }}
                    >
                      Badge
                    </div>
                  </div>
                </div>
                
                {/* Color Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Color Principal</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { color: '#7c3aed', name: 'Violeta' },
                      { color: '#2563eb', name: 'Azul' },
                      { color: '#0891b2', name: 'Cyan' },
                      { color: '#059669', name: 'Verde' },
                      { color: '#ea580c', name: 'Naranja' },
                      { color: '#dc2626', name: 'Rojo' },
                      { color: '#db2777', name: 'Rosa' },
                      { color: '#7c2d12', name: 'Marrón' },
                      { color: '#1f2937', name: 'Gris Oscuro' },
                      { color: '#0f172a', name: 'Negro' },
                    ].map((c) => {
                      const currentColor = (systemConfig.primaryColor || '#7c3aed').toLowerCase()
                      const isSelected = currentColor === c.color.toLowerCase()
                      return (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => handleUpdateSystemConfig({ primaryColor: c.color })}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            isSelected 
                              ? 'border-foreground scale-110 shadow-lg ring-2 ring-offset-2' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ 
                            backgroundColor: c.color,
                            ringColor: isSelected ? c.color : undefined
                          }}
                          title={c.name}
                        />
                      )
                    })}
                  </div>
                  
                  {/* Custom Color */}
                  <div className="flex items-center gap-3 mt-3 p-3 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-medium">Color personalizado:</Label>
                    <input
                      type="color"
                      value={systemConfig.primaryColor || '#7c3aed'}
                      onChange={(e) => handleUpdateSystemConfig({ primaryColor: e.target.value })}
                      className="w-12 h-8 rounded cursor-pointer border border-input"
                    />
                    <span className="text-sm font-mono bg-background px-2 py-1 rounded border">
                      {systemConfig.primaryColor || '#7c3aed'}
                    </span>
                  </div>
                </div>
                
                {/* Logo Upload */}
                <div className="mt-4 pt-4 border-t border-brand-20">
                  <Label className="text-sm font-medium">Logo de la Empresa</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {systemConfig.companyLogo ? (
                      <div className="relative group">
                        <img 
                          src={systemConfig.companyLogo} 
                          alt="Logo" 
                          className="h-16 w-auto object-contain rounded-lg border border-brand-30 bg-white p-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateSystemConfig({ companyLogo: null })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-24 border-2 border-dashed border-brand-30 rounded-lg flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = async () => {
                              const base64 = reader.result as string
                              await handleUpdateSystemConfig({ companyLogo: base64 })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Logo
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG o SVG. Max 2MB</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notifications Section */}
              <div>
                <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-brand" />
                  {t('config.notifications')}
                </h4>
                <div className="space-y-3">
              {/* Service Renewals */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-brand-20 rounded-lg flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('config.serviceRenewal')}</p>
                    <p className="text-sm text-muted-foreground">{t('config.serviceRenewalDesc')}</p>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.serviceRenewalEnabled}
                  onCheckedChange={(checked) => handleUpdateNotificationConfig({ serviceRenewalEnabled: checked })}
                />
              </div>

              {/* Domain Expiry */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('config.domainExpiry')}</p>
                    <p className="text-sm text-muted-foreground">{t('config.domainExpiryDesc')}</p>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.domainExpiryEnabled}
                  onCheckedChange={(checked) => handleUpdateNotificationConfig({ domainExpiryEnabled: checked })}
                />
              </div>

              {/* Hosting Renewal */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Server className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('config.hostingRenewal')}</p>
                    <p className="text-sm text-muted-foreground">{t('config.hostingRenewalDesc')}</p>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.hostingRenewalEnabled}
                  onCheckedChange={(checked) => handleUpdateNotificationConfig({ hostingRenewalEnabled: checked })}
                />
              </div>

              {/* Contract End */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('config.contractEnd')}</p>
                    <p className="text-sm text-muted-foreground">{t('config.contractEndDesc')}</p>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.contractEndEnabled}
                  onCheckedChange={(checked) => handleUpdateNotificationConfig({ contractEndEnabled: checked })}
                />
              </div>

              {/* Anniversary */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('config.anniversary')}</p>
                    <p className="text-sm text-muted-foreground">{t('config.anniversaryDesc')}</p>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.anniversaryEnabled}
                  onCheckedChange={(checked) => handleUpdateNotificationConfig({ anniversaryEnabled: checked })}
                />
              </div>

              {/* Custom Alarms */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t('config.customAlarms')}</p>
                    <p className="text-sm text-muted-foreground">{t('config.customAlarmsDesc')}</p>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.customAlarmsEnabled}
                  onCheckedChange={(checked) => handleUpdateNotificationConfig({ customAlarmsEnabled: checked })}
                />
              </div>
                </div>
              </div>

              <Separator />

              {/* General Settings */}
              <div>
                <h4 className="font-medium text-foreground mb-4">{t('config.generalPreferences')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-foreground">{t('config.pushNotifications')}</span>
                    <Switch
                      checked={notificationConfig.pushNotifications}
                      onCheckedChange={(checked) => handleUpdateNotificationConfig({ pushNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-foreground">{t('config.emailNotifications')}</span>
                    <Switch
                      checked={notificationConfig.emailNotifications}
                      onCheckedChange={(checked) => handleUpdateNotificationConfig({ emailNotifications: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* SMTP Email Configuration */}
              <div>
                <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-brand" />
                  Configuración de Email SMTP
                </h4>
                <div className="space-y-4 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Servidor SMTP</Label>
                      <Input
                        value={systemConfig.smtpHost || ''}
                        onChange={(e) => handleUpdateSystemConfig({ smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                        className="bg-card"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Puerto</Label>
                      <Input
                        type="number"
                        value={systemConfig.smtpPort || 587}
                        onChange={(e) => handleUpdateSystemConfig({ smtpPort: parseInt(e.target.value) || 587 })}
                        placeholder="587"
                        className="bg-card"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Usuario SMTP</Label>
                      <Input
                        value={systemConfig.smtpUser || ''}
                        onChange={(e) => handleUpdateSystemConfig({ smtpUser: e.target.value })}
                        placeholder="tu@email.com"
                        className="bg-card"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Contraseña SMTP</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.smtp ? 'text' : 'password'}
                          value={systemConfig.smtpPassword || ''}
                          onChange={(e) => handleUpdateSystemConfig({ smtpPassword: e.target.value })}
                          placeholder="••••••••"
                          className="bg-card pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, smtp: !showPasswords.smtp })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.smtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email Remitente</Label>
                      <Input
                        value={systemConfig.emailFrom || ''}
                        onChange={(e) => handleUpdateSystemConfig({ emailFrom: e.target.value })}
                        placeholder="noreply@tuempresa.com"
                        className="bg-card"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Nombre Remitente</Label>
                      <Input
                        value={systemConfig.emailFromName || ''}
                        onChange={(e) => handleUpdateSystemConfig({ emailFromName: e.target.value })}
                        placeholder="Mi Empresa"
                        className="bg-card"
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Gmail:</strong> smtp.gmail.com:587 con contraseña de aplicación.<br/>
                    💡 <strong>Outlook:</strong> smtp.office365.com:587<br/>
                    💡 <strong>SendGrid:</strong> smtp.sendgrid.net:587 con API key como password
                  </p>
                </div>
              </div>

              <Separator />

              {/* Change Password Section */}
              <div>
                <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand" />
                  Cambiar Contraseña
                </h4>
                <div className="space-y-4 p-4 bg-gradient-to-r from-brand-20 to-brand-20 rounded-xl border border-brand/20">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-medium">Contraseña Actual</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="pl-10 pr-10 bg-card"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium">Nueva Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="pl-10 pr-10 bg-card"
                          placeholder="Mínimo 6 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="pl-10 bg-card"
                          placeholder="Repetir contraseña"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    className="w-full bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand-dark"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Cambiar Contraseña
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowConfigDialog(false)} className="bg-brand hover:bg-brand-dark">
              {t('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('header.newClient')}</DialogTitle>
            <DialogDescription>{t('clients.add')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('clients.name')} *</Label>
                <Input value={newClient.name} onChange={(e) => setNewClient({...newClient, name: e.target.value})} />
              </div>
              <div>
                <Label>{t('clients.company')} *</Label>
                <Input value={newClient.company} onChange={(e) => setNewClient({...newClient, company: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('clients.email')} *</Label>
                <Input type="email" value={newClient.email} onChange={(e) => setNewClient({...newClient, email: e.target.value})} />
              </div>
              <div>
                <Label>{t('clients.phone')}</Label>
                <Input value={newClient.phone} onChange={(e) => setNewClient({...newClient, phone: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t('clients.status')}</Label>
                <Select value={newClient.status} onValueChange={(v) => setNewClient({...newClient, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t('status.ACTIVE')}</SelectItem>
                    <SelectItem value="PAUSED">{t('status.PAUSED')}</SelectItem>
                    <SelectItem value="CANCELLED">{t('status.CANCELLED')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('clients.contractStart')}</Label>
                <Input type="date" value={newClient.contractStart} onChange={(e) => setNewClient({...newClient, contractStart: e.target.value})} />
              </div>
              <div>
                <Label>{t('clients.duration')} ({t('clients.years')})</Label>
                <Input type="number" value={newClient.contractYears} onChange={(e) => setNewClient({...newClient, contractYears: e.target.value})} placeholder="4" />
              </div>
            </div>
            <div>
              <Label>{t('clients.notes')}</Label>
              <Textarea value={newClient.notes} onChange={(e) => setNewClient({...newClient, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddClientDialog(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleAddClient} className="bg-brand hover:bg-brand-dark">{t('clients.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={showAddServiceDialog} onOpenChange={setShowAddServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('services.add')} {t('services.title')}</DialogTitle>
            <DialogDescription>{t('services.add')} {t('services.title').toLowerCase()} {t('misc.for')} {selectedClient?.company}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('services.type')}</Label>
                <Select value={newService.serviceType} onValueChange={(v) => setNewService({...newService, serviceType: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEB">{t('services.types.WEB')}</SelectItem>
                    <SelectItem value="HOSTING">{t('services.types.HOSTING')}</SelectItem>
                    <SelectItem value="MAINTENANCE">{t('services.types.MAINTENANCE')}</SelectItem>
                    <SelectItem value="SEO">{t('services.types.SEO')}</SelectItem>
                    <SelectItem value="DOMAIN">{t('services.types.DOMAIN')}</SelectItem>
                    <SelectItem value="EMAIL">{t('services.types.EMAIL')}</SelectItem>
                    <SelectItem value="OTHER">{t('services.types.OTHER')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('services.monthlyPrice')}</Label>
                <Input type="number" value={newService.monthlyPrice} onChange={(e) => setNewService({...newService, monthlyPrice: parseFloat(e.target.value)})} />
              </div>
            </div>
            <div>
              <Label>{t('services.description')}</Label>
              <Input value={newService.description} onChange={(e) => setNewService({...newService, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('services.startDate')}</Label>
                <Input type="date" value={newService.startDate} onChange={(e) => setNewService({...newService, startDate: e.target.value})} />
              </div>
              <div>
                <Label>{t('services.renewalDate')}</Label>
                <Input type="date" value={newService.renewalDate} onChange={(e) => setNewService({...newService, renewalDate: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddServiceDialog(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleAddService} className="bg-brand hover:bg-brand-dark">{t('services.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={showEditServiceDialog} onOpenChange={setShowEditServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('actions.edit')} {t('services.title')}</DialogTitle>
          </DialogHeader>
          {editingService && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('services.type')}</Label>
                  <Select value={editingService.serviceType} onValueChange={(v) => setEditingService({...editingService, serviceType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEB">{t('services.types.WEB')}</SelectItem>
                      <SelectItem value="HOSTING">{t('services.types.HOSTING')}</SelectItem>
                      <SelectItem value="MAINTENANCE">{t('services.types.MAINTENANCE')}</SelectItem>
                      <SelectItem value="SEO">{t('services.types.SEO')}</SelectItem>
                      <SelectItem value="DOMAIN">{t('services.types.DOMAIN')}</SelectItem>
                      <SelectItem value="EMAIL">{t('services.types.EMAIL')}</SelectItem>
                      <SelectItem value="OTHER">{t('services.types.OTHER')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('services.monthlyPrice')}</Label>
                  <Input type="number" value={editingService.monthlyPrice} onChange={(e) => setEditingService({...editingService, monthlyPrice: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div>
                <Label>{t('services.description')}</Label>
                <Input value={editingService.description || ''} onChange={(e) => setEditingService({...editingService, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('clients.status')}</Label>
                  <Select value={editingService.status} onValueChange={(v) => setEditingService({...editingService, status: v as any})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">{t('status.ACTIVE')}</SelectItem>
                      <SelectItem value="PAUSED">{t('status.PAUSED')}</SelectItem>
                      <SelectItem value="CANCELLED">{t('status.CANCELLED')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('services.renewalDate')}</Label>
                  <Input type="date" value={editingService.renewalDate?.split('T')[0] || ''} onChange={(e) => setEditingService({...editingService, renewalDate: e.target.value})} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditServiceDialog(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleEditService} className="bg-brand hover:bg-brand-dark">{t('actions.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Hosting Dialog */}
      <Dialog open={showAddHostingDialog} onOpenChange={setShowAddHostingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('hosting.add')} {t('hosting.title')}</DialogTitle>
            <DialogDescription>{t('hosting.title')} {t('misc.for')} {selectedClient?.company}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('hosting.provider')} *</Label>
                <Input value={newHosting.provider} onChange={(e) => setNewHosting({...newHosting, provider: e.target.value})} />
              </div>
              <div>
                <Label>{t('hosting.plan')} *</Label>
                <Input value={newHosting.plan} onChange={(e) => setNewHosting({...newHosting, plan: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('hosting.username')}</Label>
                <Input value={newHosting.username} onChange={(e) => setNewHosting({...newHosting, username: e.target.value})} />
              </div>
              <div>
                <Label>{t('hosting.panelUrl')}</Label>
                <Input value={newHosting.panelUrl} onChange={(e) => setNewHosting({...newHosting, panelUrl: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('hosting.monthlyCost')}</Label>
                <Input type="number" value={newHosting.monthlyCost} onChange={(e) => setNewHosting({...newHosting, monthlyCost: parseFloat(e.target.value)})} />
              </div>
              <div>
                <Label>{t('services.renewalDate')}</Label>
                <Input type="date" value={newHosting.renewalDate} onChange={(e) => setNewHosting({...newHosting, renewalDate: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddHostingDialog(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleAddHosting} className="bg-brand hover:bg-brand-dark">{t('hosting.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Hosting Dialog */}
      <Dialog open={showEditHostingDialog} onOpenChange={setShowEditHostingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('actions.edit')} {t('hosting.title')}</DialogTitle>
          </DialogHeader>
          {editingHosting && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('hosting.provider')}</Label>
                  <Input value={editingHosting.provider} onChange={(e) => setEditingHosting({...editingHosting, provider: e.target.value})} />
                </div>
                <div>
                  <Label>{t('hosting.plan')}</Label>
                  <Input value={editingHosting.plan} onChange={(e) => setEditingHosting({...editingHosting, plan: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('hosting.username')}</Label>
                  <Input value={editingHosting.username || ''} onChange={(e) => setEditingHosting({...editingHosting, username: e.target.value})} />
                </div>
                <div>
                  <Label>{t('hosting.panelUrl')}</Label>
                  <Input value={editingHosting.panelUrl || ''} onChange={(e) => setEditingHosting({...editingHosting, panelUrl: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('hosting.monthlyCost')}</Label>
                  <Input type="number" value={editingHosting.monthlyCost} onChange={(e) => setEditingHosting({...editingHosting, monthlyCost: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <Label>{t('services.renewalDate')}</Label>
                  <Input type="date" value={editingHosting.renewalDate?.split('T')[0] || ''} onChange={(e) => setEditingHosting({...editingHosting, renewalDate: e.target.value})} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditHostingDialog(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleEditHosting} className="bg-brand hover:bg-brand-dark">{t('actions.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Domain Dialog */}
      <Dialog open={showAddDomainDialog} onOpenChange={setShowAddDomainDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('domains.add')} {t('domains.title')}</DialogTitle>
            <DialogDescription>{t('domains.title')} {t('misc.for')} {selectedClient?.company}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('domains.domainName')} {t('misc.required')}</Label>
                <Input value={newDomain.domainName} onChange={(e) => setNewDomain({...newDomain, domainName: e.target.value})} placeholder="ejemplo.com" />
              </div>
              <div>
                <Label>{t('domains.registrar')} {t('misc.required')}</Label>
                <Input value={newDomain.registrar} onChange={(e) => setNewDomain({...newDomain, registrar: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('domains.registrationDate')}</Label>
                <Input type="date" value={newDomain.registrationDate} onChange={(e) => setNewDomain({...newDomain, registrationDate: e.target.value})} />
              </div>
              <div>
                <Label>{t('domains.renewalDate')} {t('misc.required')}</Label>
                <Input type="date" value={newDomain.renewalDate} onChange={(e) => setNewDomain({...newDomain, renewalDate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('domains.cost')}</Label>
                <Input type="number" value={newDomain.cost} onChange={(e) => setNewDomain({...newDomain, cost: parseFloat(e.target.value)})} />
              </div>
              <div>
                <Label>{t('domains.status')}</Label>
                <Select value={newDomain.status} onValueChange={(v) => setNewDomain({...newDomain, status: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t('status.ACTIVE')}</SelectItem>
                    <SelectItem value="PENDING">{t('status.PENDING')}</SelectItem>
                    <SelectItem value="EXPIRED">{t('status.EXPIRED')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDomainDialog(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleAddDomain} className="bg-brand hover:bg-brand-dark">{t('domains.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Domain Dialog */}
      <Dialog open={showEditDomainDialog} onOpenChange={setShowEditDomainDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('actions.edit')} {t('domains.title')}</DialogTitle>
          </DialogHeader>
          {editingDomain && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('domains.domainName')}</Label>
                  <Input value={editingDomain.domainName} onChange={(e) => setEditingDomain({...editingDomain, domainName: e.target.value})} />
                </div>
                <div>
                  <Label>{t('domains.registrar')}</Label>
                  <Input value={editingDomain.registrar} onChange={(e) => setEditingDomain({...editingDomain, registrar: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('domains.renewalDate')}</Label>
                  <Input type="date" value={editingDomain.renewalDate?.split('T')[0] || ''} onChange={(e) => setEditingDomain({...editingDomain, renewalDate: e.target.value})} />
                </div>
                <div>
                  <Label>{t('domains.cost')}</Label>
                  <Input type="number" value={editingDomain.cost} onChange={(e) => setEditingDomain({...editingDomain, cost: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div>
                <Label>{t('domains.status')}</Label>
                <Select value={editingDomain.status} onValueChange={(v) => setEditingDomain({...editingDomain, status: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t('status.ACTIVE')}</SelectItem>
                    <SelectItem value="PENDING">{t('status.PENDING')}</SelectItem>
                    <SelectItem value="EXPIRED">{t('status.EXPIRED')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDomainDialog(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleEditDomain} className="bg-brand hover:bg-brand-dark">{t('actions.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Alarm Dialog */}
      <Dialog open={showAddAlarmDialog} onOpenChange={setShowAddAlarmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('alarms.create')}</DialogTitle>
            <DialogDescription>{t('alarms.title')} {t('misc.for')} {selectedClient?.company}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('services.type')}</Label>
                <Select value={newAlarm.type} onValueChange={(v) => setNewAlarm({...newAlarm, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTRACT_END">{t('alarms.types.CONTRACT_END')}</SelectItem>
                    <SelectItem value="ANNIVERSARY">{t('alarms.types.ANNIVERSARY')}</SelectItem>
                    <SelectItem value="FOLLOW_UP">{t('alarms.types.FOLLOW_UP')}</SelectItem>
                    <SelectItem value="PAYMENT_DUE">{t('alarms.types.PAYMENT_DUE')}</SelectItem>
                    <SelectItem value="CUSTOM">{t('alarms.types.CUSTOM')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('alarms.priority')}</Label>
                <Select value={newAlarm.priority} onValueChange={(v) => setNewAlarm({...newAlarm, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">{t('alarms.priority.LOW')}</SelectItem>
                    <SelectItem value="MEDIUM">{t('alarms.priority.MEDIUM')}</SelectItem>
                    <SelectItem value="HIGH">{t('alarms.priority.HIGH')}</SelectItem>
                    <SelectItem value="URGENT">{t('alarms.priority.URGENT')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t('alarms.title_field')} {t('misc.required')}</Label>
              <Input value={newAlarm.title} onChange={(e) => setNewAlarm({...newAlarm, title: e.target.value})} />
            </div>
            <div>
              <Label>{t('alarms.description')}</Label>
              <Textarea value={newAlarm.description} onChange={(e) => setNewAlarm({...newAlarm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('alarms.alarmDate')} {t('misc.required')}</Label>
                <Input type="date" value={newAlarm.alarmDate} onChange={(e) => setNewAlarm({...newAlarm, alarmDate: e.target.value})} />
              </div>
              <div>
                <Label>{t('alarms.daysBefore')}</Label>
                <Input type="number" value={newAlarm.daysBefore} onChange={(e) => setNewAlarm({...newAlarm, daysBefore: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={newAlarm.isRecurring}
                onChange={(e) => setNewAlarm({...newAlarm, isRecurring: e.target.checked})}
                className="h-4 w-4"
              />
              <Label htmlFor="recurring" className="text-sm">{t('alarms.recurring')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAlarmDialog(false)}>{t('actions.cancel')}</Button>
            <Button onClick={handleAddAlarm} className="bg-brand hover:bg-brand-dark">{t('alarms.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Financial History Dialog - MAXIMIZABLE & FULL FEATURED */}
      <Dialog open={showFinanceHistoryDialog} onOpenChange={(open) => {
        setShowFinanceHistoryDialog(open)
        if (!open) {
          setIsFinanceHistoryMaximized(false)
          setSelectedMonthIds([])
        }
      }}>
        <DialogContent className={`${isFinanceHistoryMaximized ? '!w-screen !h-screen !max-w-none rounded-none inset-0 translate-x-0 translate-y-0' : '!w-[95vw] !max-w-[1400px] !h-[90vh]'} overflow-hidden flex flex-col p-0 transition-all duration-200`}>
          {/* Header with maximize button */}
          <DialogHeader className="flex-shrink-0 p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-brand to-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl text-foreground">Histórico Financiero</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Gestiona y edita los datos financieros mensuales</DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => fetchMonthlyStats()} title="Actualizar">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFinanceHistoryMaximized(!isFinanceHistoryMaximized)}
                  className="h-9 w-9 hover:bg-muted"
                >
                  {isFinanceHistoryMaximized ? (
                    <Minimize2 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 px-6 py-4 overflow-auto">
            <Tabs value={financeHistoryTab} onValueChange={(v) => {
              setFinanceHistoryTab(v as 'monthly' | 'daily')
              if (v === 'daily') {
                fetchDailyStats(selectedYear, selectedMonth)
              }
            }} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                <TabsTrigger value="monthly" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Vista Mensual
                </TabsTrigger>
                <TabsTrigger value="daily" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Vista Diaria
                </TabsTrigger>
              </TabsList>

              {/* Monthly View */}
              <TabsContent value="monthly" className="flex-1 overflow-auto mt-4 space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {(() => {
                    const yearData = getFullYearData(selectedYear)
                    const totalRevenue = yearData.reduce((sum, s) => sum + s.revenue, 0)
                    const totalCosts = yearData.reduce((sum, s) => sum + s.costs, 0)
                    const totalProfit = yearData.reduce((sum, s) => sum + s.profit, 0)
                    const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0

                    return (
                      <>
                        <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/20">
                          <p className="text-xs text-muted-foreground font-medium">Ingresos Anuales</p>
                          <p className="text-xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-xl border border-red-500/20">
                          <p className="text-xs text-muted-foreground font-medium">Costos Anuales</p>
                          <p className="text-xl font-bold text-foreground">{formatCurrency(totalCosts)}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-brand-20 to-brand-20 rounded-xl border border-brand/20">
                          <p className="text-xs text-muted-foreground font-medium">Beneficio Neto</p>
                          <p className="text-xl font-bold text-foreground">{formatCurrency(totalProfit)}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                          <p className="text-xs text-muted-foreground font-medium">Margen Medio</p>
                          <p className="text-xl font-bold text-foreground">{avgMargin}%</p>
                        </div>
                      </>
                    )
                  })()}
              </div>

              {/* Year Actions */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <div className="flex items-center gap-2">
                  {selectedMonthIds.length > 0 ? (
                    <>
                      <span className="text-sm text-foreground font-medium">{selectedMonthIds.length} seleccionados</span>
                      <Button size="sm" variant="destructive" onClick={handleBulkDeleteMonths}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar seleccionados
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedMonthIds([])}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Selecciona meses para acciones en lote</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleClearYear} className="text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/10">
                    <Archive className="h-4 w-4 mr-1" />
                    Limpiar Año
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDeleteYear} className="text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar Año
                  </Button>
                </div>
              </div>

              {/* Monthly Table - All 12 months */}
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="font-bold w-10 text-foreground">
                        <Checkbox
                          checked={selectedMonthIds.length === getFullYearData(selectedYear).filter(s => s.id).length && selectedMonthIds.length > 0}
                          onCheckedChange={toggleAllMonthsInYear}
                          className="border-brand"
                        />
                      </TableHead>
                      <TableHead className="font-bold w-28 text-foreground">Mes</TableHead>
                      <TableHead className="font-bold text-right text-foreground">Ingresos</TableHead>
                      <TableHead className="font-bold text-right text-foreground">Costos</TableHead>
                      <TableHead className="font-bold text-right text-foreground">Beneficio</TableHead>
                      <TableHead className="font-bold text-center w-20 text-foreground">Clientes</TableHead>
                      <TableHead className="font-bold text-center w-20 text-foreground">Servicios</TableHead>
                      <TableHead className="font-bold text-center w-44 text-foreground">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFullYearData(selectedYear).map((stat) => (
                      <TableRow 
                        key={`${stat.year}-${stat.month}`} 
                        className={`${stat.isEmpty ? 'bg-muted/50' : selectedMonthIds.includes(stat.id) ? 'bg-brand-10' : 'bg-card'} hover:bg-brand-10 transition-colors`}
                      >
                        <TableCell>
                          {stat.id && (
                            <Checkbox
                              checked={selectedMonthIds.includes(stat.id)}
                              onCheckedChange={() => toggleMonthSelection(stat.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="border-brand"
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{stat.monthName}</TableCell>
                        <TableCell className="text-right">
                          {isInlineEditing === `${stat.year}-${stat.month}` ? (
                            <Input
                              type="number"
                              className="w-28 h-8 text-right ml-auto"
                              value={inlineEditValue.revenue ?? stat.revenue}
                              onChange={(e) => setInlineEditValue({...inlineEditValue, revenue: parseFloat(e.target.value) || 0})}
                              autoFocus
                            />
                          ) : (
                            <span className={stat.revenue > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}>
                              {formatCurrency(stat.revenue)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isInlineEditing === `${stat.year}-${stat.month}` ? (
                            <Input
                              type="number"
                              className="w-28 h-8 text-right ml-auto"
                              value={inlineEditValue.costs ?? stat.costs}
                              onChange={(e) => setInlineEditValue({...inlineEditValue, costs: parseFloat(e.target.value) || 0})}
                            />
                          ) : (
                            <span className={stat.costs > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}>
                              {formatCurrency(stat.costs)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold text-foreground`}>
                            {formatCurrency(stat.profit)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {isInlineEditing === `${stat.year}-${stat.month}` ? (
                            <Input
                              type="number"
                              className="w-16 h-8 text-center mx-auto"
                              value={inlineEditValue.activeClients ?? stat.activeClients}
                              onChange={(e) => setInlineEditValue({...inlineEditValue, activeClients: parseInt(e.target.value) || 0})}
                            />
                          ) : (
                            <span className={stat.activeClients > 0 ? 'font-medium' : 'text-muted-foreground'}>
                              {stat.activeClients}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isInlineEditing === `${stat.year}-${stat.month}` ? (
                            <Input
                              type="number"
                              className="w-16 h-8 text-center mx-auto"
                              value={inlineEditValue.activeServices ?? stat.activeServices}
                              onChange={(e) => setInlineEditValue({...inlineEditValue, activeServices: parseInt(e.target.value) || 0})}
                            />
                          ) : (
                            <span className={stat.activeServices > 0 ? 'font-medium' : 'text-muted-foreground'}>
                              {stat.activeServices}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isInlineEditing === `${stat.year}-${stat.month}` ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-500/10"
                                onClick={() => handleInlineSave(stat)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10"
                                onClick={() => {
                                  setIsInlineEditing(null)
                                  setInlineEditValue({})
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              {stat.isEmpty ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-brand hover:bg-brand-10"
                                  onClick={() => handleCreateMonthlyStat(stat.year, stat.month)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Crear
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 hover:bg-blue-500/10"
                                    onClick={() => handleOpenMonthDetail(stat)}
                                    title="Ver detalle del mes"
                                  >
                                    <Eye className="h-4 w-4 text-blue-500" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-brand-10"
                                    onClick={() => {
                                      setIsInlineEditing(`${stat.year}-${stat.month}`)
                                      setInlineEditValue({
                                        revenue: stat.revenue,
                                        costs: stat.costs,
                                        activeClients: stat.activeClients,
                                        activeServices: stat.activeServices,
                                      })
                                    }}
                                    title="Edición rápida"
                                  >
                                    <Edit className="h-4 w-4 text-brand" />
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-brand-10"
                                    onClick={() => {
                                      setEditingMonthlyStat(stat)
                                      setShowEditMonthlyDialog(true)
                                    }}
                                    title="Editar completo"
                                  >
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-amber-500/10"
                                    onClick={() => handleClearMonthData(stat)}
                                    title="Limpiar datos (poner a 0)"
                                  >
                                    <Archive className="h-4 w-4 text-amber-500" />
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-red-500/10"
                                    onClick={() => stat.id && handleDeleteMonthlyStat(stat.id)}
                                    title="Eliminar registro"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-400" />
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            {/* Daily View */}
            <TabsContent value="daily" className="flex-1 overflow-auto mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <Select value={selectedYear.toString()} onValueChange={(v) => {
                  setSelectedYear(parseInt(v))
                  fetchDailyStats(parseInt(v), selectedMonth)
                }}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedMonth.toString()} onValueChange={(v) => {
                  setSelectedMonth(parseInt(v))
                  fetchDailyStats(selectedYear, parseInt(v))
                }}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Daily Chart */}
              <div className="h-[300px] border rounded-xl p-4 bg-card">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `${v}€`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Día ${label}`}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Ingresos" />
                    <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} name="Costos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Daily Table */}
              <ScrollArea className="h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="font-semibold text-foreground">Día</TableHead>
                      <TableHead className="font-semibold text-right text-foreground">Ingresos</TableHead>
                      <TableHead className="font-semibold text-right text-foreground">Costos</TableHead>
                      <TableHead className="font-semibold text-right text-foreground">Beneficio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyStats.map((day) => (
                      <TableRow key={day.day} className={`${day.isWeekend ? 'bg-muted' : ''} hover:bg-brand-10`}>
                        <TableCell className="font-medium text-foreground">
                          {day.day} <span className="text-xs text-muted-foreground">({day.dayName})</span>
                        </TableCell>
                        <TableCell className="text-right text-foreground">{formatCurrency(day.revenue)}</TableCell>
                        <TableCell className="text-right text-foreground">{formatCurrency(day.costs)}</TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {formatCurrency(day.profit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          </div>

          <DialogFooter className="flex-shrink-0 border-t p-4 bg-muted/50">
            <Button variant="outline" onClick={() => setShowFinanceHistoryDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Monthly Stat Dialog - FULL EDIT */}
      <Dialog open={showEditMonthlyDialog} onOpenChange={setShowEditMonthlyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-brand" />
              Editar Mes Completo
            </DialogTitle>
            <DialogDescription className="text-lg font-medium text-foreground">
              {editingMonthlyStat?.monthName} {editingMonthlyStat?.year}
            </DialogDescription>
          </DialogHeader>
          {editingMonthlyStat && (
            <div className="space-y-4">
              {/* Financial Data */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl space-y-3">
                <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">Datos Financieros</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Ingresos (€)</Label>
                    <Input 
                      type="number" 
                      value={editingMonthlyStat.revenue} 
                      onChange={(e) => setEditingMonthlyStat({
                        ...editingMonthlyStat, 
                        revenue: parseFloat(e.target.value) || 0,
                        profit: (parseFloat(e.target.value) || 0) - editingMonthlyStat.costs
                      })} 
                      className="bg-card"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Costos (€)</Label>
                    <Input 
                      type="number" 
                      value={editingMonthlyStat.costs} 
                      onChange={(e) => setEditingMonthlyStat({
                        ...editingMonthlyStat, 
                        costs: parseFloat(e.target.value) || 0,
                        profit: editingMonthlyStat.revenue - (parseFloat(e.target.value) || 0)
                      })} 
                      className="bg-card"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Beneficio:</span>
                    <span className={`text-lg font-bold ${editingMonthlyStat.profit >= 0 ? 'text-brand' : 'text-red-600'}`}>
                      {formatCurrency(editingMonthlyStat.profit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Data */}
              <div className="p-4 bg-gradient-to-r from-brand-20 to-brand-20 rounded-xl space-y-3">
                <h4 className="font-semibold text-brand-dark dark:text-brand-light text-sm">Actividad</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Clientes Activos</Label>
                    <Input 
                      type="number" 
                      value={editingMonthlyStat.activeClients} 
                      onChange={(e) => setEditingMonthlyStat({...editingMonthlyStat, activeClients: parseInt(e.target.value) || 0})} 
                      className="bg-card"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Servicios Activos</Label>
                    <Input 
                      type="number" 
                      value={editingMonthlyStat.activeServices} 
                      onChange={(e) => setEditingMonthlyStat({...editingMonthlyStat, activeServices: parseInt(e.target.value) || 0})} 
                      className="bg-card"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Dominios Activos</Label>
                    <Input 
                      type="number" 
                      value={editingMonthlyStat.activeDomains} 
                      onChange={(e) => setEditingMonthlyStat({...editingMonthlyStat, activeDomains: parseInt(e.target.value) || 0})} 
                      className="bg-card"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Hosting Activo</Label>
                    <Input 
                      type="number" 
                      value={editingMonthlyStat.activeHosting} 
                      onChange={(e) => setEditingMonthlyStat({...editingMonthlyStat, activeHosting: parseInt(e.target.value) || 0})} 
                      className="bg-card"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditMonthlyDialog(false)}>Cancelar</Button>
            {editingMonthlyStat && (
              <Button variant="outline" onClick={() => handleClearMonthData(editingMonthlyStat)} className="text-amber-600 border-amber-500/20">
                <Archive className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
            <Button onClick={handleSaveMonthlyStat} className="bg-brand hover:bg-brand-dark gap-2">
              <Check className="h-4 w-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Month Detail Dialog - Shows clients and services for the month */}
      <Dialog open={showMonthDetailDialog} onOpenChange={setShowMonthDetailDialog}>
        <DialogContent className="!w-[95vw] !max-w-[1200px] !h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    {selectedMonthDetail?.monthName} {selectedMonthDetail?.year}
                  </DialogTitle>
                  <DialogDescription>Detalle del mes - Clientes y servicios activos</DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 px-6 py-4 overflow-auto">
            {loadingMonthClients ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-brand" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                {monthClientsTotals && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/20">
                      <p className="text-xs text-emerald-600 font-medium">Clientes Activos</p>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{monthClientsTotals.totalClients}</p>
                      <p className="text-xs text-emerald-500 mt-1">{monthClientsTotals.activeClients} activos, {monthClientsTotals.pausedClients} pausados</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl border border-emerald-200">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Ingresos Mensuales</p>
                      <p className="text-2xl font-bold text-emerald-800">{formatCurrency(monthClientsTotals.totalRevenue)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-xl border border-red-500/20">
                      <p className="text-xs text-red-600 font-medium">Costos Mensuales</p>
                      <p className="text-2xl font-bold text-red-700">{formatCurrency(monthClientsTotals.totalCosts)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-brand-20 to-brand-20 rounded-xl border border-brand/20">
                      <p className="text-xs text-brand font-medium">Beneficio Neto</p>
                      <p className="text-2xl font-bold text-brand-dark dark:text-brand-light">{formatCurrency(monthClientsTotals.totalProfit)}</p>
                    </div>
                  </div>
                )}

                {/* Services Summary */}
                {monthClientsTotals && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-brand-10 rounded-lg flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-brand" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{monthClientsTotals.totalServices} Servicios</p>
                        <p className="text-xs text-muted-foreground">Activos en el mes</p>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg flex items-center gap-3">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{monthClientsTotals.totalDomains} Dominios</p>
                        <p className="text-xs text-muted-foreground">Activos en el mes</p>
                      </div>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-lg flex items-center gap-3">
                      <Server className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{monthClientsTotals.totalHosting} Hosting</p>
                        <p className="text-xs text-muted-foreground">Activos en el mes</p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Clients List */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand" />
                    Clientes del Mes ({monthClients.length})
                  </h3>

                  {monthClients.length === 0 ? (
                    <div className="text-center py-12 bg-muted rounded-xl">
                      <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No hay clientes activos en este mes</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {monthClients.map((client: any) => (
                        <div
                          key={client.id}
                          className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:bg-brand-10 transition-colors cursor-pointer"
                          onClick={async () => {
                            const fullClient = await fetchClientById(client.id)
                            if (fullClient) {
                              setSelectedClient(fullClient)
                              setShowMonthDetailDialog(false)
                              setShowClientDialog(true)
                            }
                          }}
                        >
                          <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                            <AvatarFallback className="bg-gradient-to-br from-brand to-brand-dark text-white font-semibold">
                              {client.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{client.company}</p>
                            <p className="text-sm text-muted-foreground">{client.name} · {client.servicesCount} servicios</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-600">{formatCurrency(client.monthlyRevenue)}/mes</p>
                            <p className="text-xs text-red-500">-{formatCurrency(client.monthlyCosts)} costos</p>
                          </div>
                          {getStatusBadge(client.status)}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t p-4 bg-muted/50">
            <Button variant="outline" onClick={() => setShowMonthDetailDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditLogDialog} onOpenChange={(open) => {
        setShowAuditLogDialog(open)
        if (!open) setIsAuditLogMaximized(false)
      }}>
        <DialogContent className={`${isAuditLogMaximized ? '!w-screen !h-screen !max-w-none rounded-none inset-0 translate-x-0 translate-y-0' : '!w-[95vw] !max-w-[1400px] !h-[90vh]'} overflow-hidden flex flex-col p-0 transition-all duration-200`}>
          <DialogHeader className="flex-shrink-0 p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-brand to-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Historial de Cambios</DialogTitle>
                  <DialogDescription>Registro de auditoría de todas las acciones del sistema</DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Select value={auditLogFilter} onValueChange={(value) => {
                  setAuditLogFilter(value)
                  fetchAuditLogs(value)
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="CLIENT">Clientes</SelectItem>
                    <SelectItem value="SERVICE">Servicios</SelectItem>
                    <SelectItem value="DOMAIN">Dominios</SelectItem>
                    <SelectItem value="HOSTING">Hosting</SelectItem>
                    <SelectItem value="ALARM">Alarmas</SelectItem>
                    <SelectItem value="USER">Usuarios</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAuditLogMaximized(!isAuditLogMaximized)}
                  className="h-9 w-9 hover:bg-muted"
                >
                  {isAuditLogMaximized ? (
                    <Minimize2 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 px-6 py-4 overflow-auto">
            {auditLogLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay registros de auditoría</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-bold w-44">Fecha</TableHead>
                    <TableHead className="font-bold w-24">Acción</TableHead>
                    <TableHead className="font-bold w-28">Tipo</TableHead>
                    <TableHead className="font-bold">Entidad</TableHead>
                    <TableHead className="font-bold w-32">Usuario</TableHead>
                    <TableHead className="font-bold">Descripción</TableHead>
                    <TableHead className="font-bold w-20 text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{new Date(log.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          log.action === 'CREATE' ? 'bg-emerald-500/20 text-emerald-600' :
                          log.action === 'UPDATE' ? 'bg-blue-500/20 text-blue-600' :
                          log.action === 'DELETE' ? 'bg-red-500/20 text-red-600' :
                          log.action === 'RESTORE' ? 'bg-amber-500/20 text-amber-600' :
                          log.action === 'LOGIN' ? 'bg-brand-20 text-brand' :
                          log.action === 'LOGOUT' ? 'bg-slate-500/20 text-slate-600' :
                          log.action === 'PASSWORD_CHANGE' ? 'bg-orange-500/20 text-orange-600' :
                          'bg-muted'
                        }>
                          {log.action === 'CREATE' ? 'Crear' :
                           log.action === 'UPDATE' ? 'Editar' :
                           log.action === 'DELETE' ? 'Eliminar' :
                           log.action === 'RESTORE' ? 'Restaurar' :
                           log.action === 'LOGIN' ? 'Login' :
                           log.action === 'LOGOUT' ? 'Logout' :
                           log.action === 'PASSWORD_CHANGE' ? 'Contraseña' : log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.entityType === 'CLIENT' ? 'Cliente' : log.entityType === 'SERVICE' ? 'Servicio' : log.entityType === 'DOMAIN' ? 'Dominio' : log.entityType === 'HOSTING' ? 'Hosting' : log.entityType === 'ALARM' ? 'Alarma' : log.entityType === 'USER' ? 'Usuario' : log.entityType}</span>
                      </TableCell>
                      <TableCell className="font-medium">{log.entityName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-gradient-to-br from-brand to-brand-dark text-white text-xs">
                              {log.user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{log.user?.name || 'Sistema'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={log.description}>
                        {log.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {['CLIENT', 'SERVICE', 'DOMAIN', 'HOSTING', 'ALARM'].includes(log.entityType) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-brand-10"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/audit/client-by-entity?entityType=${log.entityType}&entityId=${log.entityId}`)
                                  const data = await res.json()
                                  if (data.client) {
                                    const fullClient = await fetchClientById(data.client.id)
                                    if (fullClient) {
                                      setSelectedClient(fullClient)
                                      setShowAuditLogDialog(false)
                                      setShowClientDialog(true)
                                    } else {
                                      toast({ title: 'Cliente no encontrado', variant: 'destructive' })
                                    }
                                  } else {
                                    toast({ title: 'Cliente no encontrado', description: 'El cliente puede haber sido eliminado', variant: 'destructive' })
                                  }
                                } catch (error) {
                                  toast({ title: 'Error', description: 'No se pudo encontrar el cliente', variant: 'destructive' })
                                }
                              }}
                              title="Ver cliente"
                            >
                              <ExternalLink className="h-4 w-4 text-brand" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-red-500/10"
                            onClick={async () => {
                              if (!confirm('¿Eliminar este registro de auditoría?')) return
                              try {
                                const res = await fetch(`/api/audit?id=${log.id}`, { method: 'DELETE' })
                                if (res.ok) {
                                  toast({ title: '✓ Registro eliminado' })
                                  fetchAuditLogs(auditLogFilter)
                                } else {
                                  toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' })
                                }
                              } catch (error) {
                                toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' })
                              }
                            }}
                            title="Eliminar registro"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t p-4 bg-muted/50">
            <Button variant="outline" onClick={() => setShowAuditLogDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={() => fetchAuditLogs(auditLogFilter)} className="bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand-dark shadow-lg shadow-brand">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Dialog - Full day view with events */}
      <Dialog open={showDayDialog} onOpenChange={(open) => {
        setShowDayDialog(open)
        if (!open) setIsDayDialogMaximized(false)
      }}>
        <DialogContent className={`${isDayDialogMaximized ? '!w-screen !h-screen !max-w-none rounded-none inset-0 translate-x-0 translate-y-0' : '!w-[95vw] !max-w-[1400px] !h-[90vh]'} overflow-hidden flex flex-col p-0 transition-all duration-200`}>
          <DialogHeader className="flex-shrink-0 p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-brand-20 rounded-xl flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-brand" />
                </div>
                <div>
                  <DialogTitle className="text-xl capitalize">
                    {selectedDay?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </DialogTitle>
                  <DialogDescription>
                    Todos los eventos y notas del día
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDayDialogMaximized(!isDayDialogMaximized)}
                className="h-9 w-9 hover:bg-muted"
              >
                {isDayDialogMaximized ? (
                  <Minimize2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 px-6 py-4 overflow-auto">
            {(() => {
              if (!selectedDay) return null
              
              const dateStr = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`
              const dayEvents: DayEvent[] = []
              
              // Services
              clients.forEach(client => {
                client.services.forEach(service => {
                  if (service.renewalDate && service.renewalDate.startsWith(dateStr)) {
                    dayEvents.push({
                      id: service.id,
                      type: 'service',
                      client: client.company,
                      description: getServiceTypeLabel(service.serviceType),
                      price: service.monthlyPrice,
                      color: 'emerald',
                      clientId: client.id
                    })
                  }
                })
                client.domains.forEach(domain => {
                  if (domain.renewalDate && domain.renewalDate.startsWith(dateStr)) {
                    dayEvents.push({
                      id: domain.id,
                      type: 'domain',
                      client: client.company,
                      description: domain.domainName,
                      price: domain.cost,
                      color: 'blue',
                      clientId: client.id
                    })
                  }
                })
                client.hosting.forEach(h => {
                  if (h.renewalDate && h.renewalDate.startsWith(dateStr)) {
                    dayEvents.push({
                      id: h.id,
                      type: 'hosting',
                      client: client.company,
                      description: `${h.provider} - ${h.plan}`,
                      price: h.monthlyCost,
                      color: 'orange',
                      clientId: client.id
                    })
                  }
                })
                if (client.contractEnd && client.contractEnd.startsWith(dateStr)) {
                  dayEvents.push({
                    id: `contract-${client.id}`,
                    type: 'contract',
                    client: client.company,
                    description: 'Fin de contrato',
                    color: 'purple',
                    clientId: client.id
                  })
                }
              })
              
              // Alarms
              alarms.forEach(alarm => {
                if (alarm.alarmDate && alarm.alarmDate.startsWith(dateStr)) {
                  dayEvents.push({
                    id: alarm.id,
                    type: 'alarm',
                    client: alarm.client?.company || 'N/A',
                    description: alarm.title,
                    priority: alarm.priority,
                    color: 'red',
                    clientId: alarm.clientId
                  })
                }
              })
              
              // Reminders
              calendarReminders.forEach(reminder => {
                if (reminder.reminderDate && reminder.reminderDate.startsWith(dateStr)) {
                  dayEvents.push({
                    id: reminder.id,
                    type: 'reminder',
                    client: reminder.client?.company || 'Sistema',
                    description: reminder.message,
                    color: 'yellow',
                    clientId: reminder.clientId
                  })
                }
              })
              
              // Invoices
              invoices.forEach(invoice => {
                if (invoice.dueDate && invoice.dueDate.startsWith(dateStr) && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED') {
                  dayEvents.push({
                    id: invoice.id,
                    type: 'invoice',
                    client: invoice.client?.company || 'N/A',
                    description: `Factura ${invoice.invoiceNumber}`,
                    price: invoice.total,
                    status: invoice.status,
                    color: 'cyan'
                  })
                }
              })
              
              // Calendar Notes
              calendarNotes.forEach(note => {
                const noteDate = new Date(note.date)
                const noteDateStr = noteDate.toISOString().split('T')[0]
                if (noteDateStr === dateStr) {
                  dayEvents.push({
                    id: note.id,
                    type: 'note',
                    client: 'Nota personal',
                    description: note.title,
                    color: note.color === 'brand' ? 'pink' : note.color,
                    noteId: note.id
                  })
                }
              })
              
              const colorClasses: Record<string, string> = {
                emerald: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                blue: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
                orange: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
                red: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
                purple: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
                yellow: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
                cyan: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
                pink: 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30'
              }
              
              const iconMap: Record<string, React.ReactNode> = {
                service: <Wrench className="h-5 w-5" />,
                domain: <Globe className="h-5 w-5" />,
                hosting: <Server className="h-5 w-5" />,
                alarm: <AlertCircle className="h-5 w-5" />,
                contract: <FileText className="h-5 w-5" />,
                reminder: <Bell className="h-5 w-5" />,
                invoice: <Receipt className="h-5 w-5" />,
                note: <StickyNote className="h-5 w-5" />
              }
              
              return (
                <>
                  {/* Add Note Button */}
                  <Button 
                    onClick={() => {
                      setNewNote({
                        title: '',
                        description: '',
                        color: 'brand',
                        date: dateStr
                      })
                      setEditingNote(null)
                      setShowAddNoteDialog(true)
                    }}
                    className="w-full bg-gradient-to-r from-brand to-brand-dark hover:from-brand-dark hover:to-brand-dark"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir nota personal
                  </Button>
                  
                  {dayEvents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">No hay eventos este día</p>
                      <p className="text-sm">Añade una nota personal para recordar algo</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayEvents.map((event, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${colorClasses[event.color] || colorClasses.pink}`}
                          onClick={() => {
                            if (event.clientId) {
                              const client = clients.find(c => c.id === event.clientId)
                              if (client) {
                                setSelectedClient(client)
                                setShowClientDialog(true)
                                setShowDayDialog(false)
                              }
                            }
                          }}
                        >
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorClasses[event.color] || colorClasses.pink}`}>
                            {iconMap[event.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">{event.description}</p>
                              {event.type === 'note' && (
                                <Badge variant="outline" className="text-xs">Nota personal</Badge>
                              )}
                              {event.priority && (
                                <Badge variant="outline" className="text-xs">{event.priority}</Badge>
                              )}
                              {event.status && (
                                <Badge variant="outline" className="text-xs">{event.status}</Badge>
                              )}
                            </div>
                            <p className="text-sm opacity-80 truncate">{event.client}</p>
                          </div>
                          {event.price !== undefined && event.price > 0 && (
                            <div className="text-right">
                              <p className="font-bold text-lg">{formatCurrency(event.price)}</p>
                            </div>
                          )}
                          {event.type === 'note' && event.noteId && (
                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  const note = calendarNotes.find(n => n.id === event.noteId)
                                  if (note) {
                                    setEditingNote(note)
                                    setNewNote({
                                      title: note.title,
                                      description: note.description || '',
                                      color: note.color,
                                      date: dateStr
                                    })
                                    setShowAddNoteDialog(true)
                                  }
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-500/20"
                                onClick={async () => {
                                  if (confirm('¿Eliminar esta nota?')) {
                                    await deleteCalendarNote(event.noteId!)
                                    toast({ title: '✓ Nota eliminada' })
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                          {event.clientId && <ChevronRight className="h-5 w-5 opacity-50" />}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </div>

          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" onClick={() => setShowDayDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Note Dialog */}
      <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-brand" />
              {editingNote ? 'Editar nota' : 'Nueva nota personal'}
            </DialogTitle>
            <DialogDescription>
              Añade una nota para recordar citas, reuniones o tareas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Título *</Label>
              <Input
                id="note-title"
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Reunión con cliente"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note-description">Descripción (opcional)</Label>
              <Textarea
                id="note-description"
                value={newNote.description}
                onChange={(e) => setNewNote(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalles adicionales..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'brand', color: 'bg-brand' },
                  { value: 'emerald', color: 'bg-emerald-500' },
                  { value: 'blue', color: 'bg-blue-500' },
                  { value: 'orange', color: 'bg-orange-500' },
                  { value: 'red', color: 'bg-red-500' },
                  { value: 'purple', color: 'bg-purple-500' },
                  { value: 'yellow', color: 'bg-yellow-500' },
                ].map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewNote(prev => ({ ...prev, color: c.value }))}
                    className={`w-8 h-8 rounded-full ${c.color} transition-all ${
                      newNote.color === c.value ? 'ring-2 ring-offset-2 ring-brand scale-110' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddNoteDialog(false)
              setEditingNote(null)
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                if (!newNote.title.trim()) {
                  toast({ title: 'Error', description: 'El título es obligatorio', variant: 'destructive' })
                  return
                }
                
                const success = await saveCalendarNote(
                  {
                    title: newNote.title,
                    description: newNote.description || null,
                    color: newNote.color,
                    date: newNote.date
                  },
                  editingNote?.id
                )
                
                if (success) {
                  toast({ title: editingNote ? '✓ Nota actualizada' : '✓ Nota creada' })
                  setShowAddNoteDialog(false)
                  setEditingNote(null)
                  setNewNote({ title: '', description: '', color: 'brand', date: '' })
                } else {
                  toast({ title: 'Error', description: 'No se pudo guardar la nota', variant: 'destructive' })
                }
              }}
              className="bg-gradient-to-r from-brand to-brand-dark"
            >
              {editingNote ? 'Guardar cambios' : 'Crear nota'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload File Dialog with Category Selection */}
      <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-brand" />
              Subir archivo
            </DialogTitle>
            <DialogDescription>
              Selecciona un archivo y asígnale una categoría
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={newFileCategory} onValueChange={setNewFileCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {fileCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file-desc">Descripción (opcional)</Label>
              <Input
                id="file-desc"
                value={newFileDescription}
                onChange={(e) => setNewFileDescription(e.target.value)}
                placeholder="Ej: Contrato firmado 2024"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Archivo</Label>
              <input
                type="file"
                id="file-upload-dialog"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file && selectedClient) {
                    const success = await uploadFile(selectedClient.id, file, newFileCategory, newFileDescription)
                    if (success) {
                      setShowFileDialog(false)
                      setNewFileCategory('general')
                      setNewFileDescription('')
                    }
                  }
                  e.target.value = ''
                }}
              />
              <Button 
                variant="outline" 
                className="w-full h-20 border-dashed border-2"
                onClick={() => document.getElementById('file-upload-dialog')?.click()}
                disabled={uploadingFile}
              >
                {uploadingFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span>Subiendo...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <span>Haz clic para seleccionar archivo</span>
                    <span className="text-xs">Máximo 10MB</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowFileDialog(false)
              setNewFileCategory('general')
              setNewFileDescription('')
            }}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog - MAXIMIZABLE */}
      <Dialog open={showFilePreview} onOpenChange={(open) => {
        setShowFilePreview(open)
        if (!open) {
          setIsFilePreviewMaximized(false)
          if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
            setSelectedFileForPreview(null)
          }
        }
      }}>
        <DialogContent className={`${isFilePreviewMaximized ? '!w-screen !h-screen !max-w-none rounded-none inset-0 translate-x-0 translate-y-0' : '!w-[95vw] !max-w-[1400px] !h-[90vh]'} overflow-hidden flex flex-col p-0 transition-all duration-200`}>
          {/* Header with maximize button */}
          <DialogHeader className="flex-shrink-0 p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-brand to-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl text-foreground flex items-center gap-2">
                    {selectedFileForPreview?.originalName}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {selectedFileForPreview && (
                      <div className="flex items-center gap-2">
                        <span>{formatFileSize(selectedFileForPreview.size)}</span>
                        <span>•</span>
                        <Badge className={`${getCategoryColor(selectedFileForPreview.category)} text-white`}>
                          {getCategoryLabel(selectedFileForPreview.category)}
                        </Badge>
                        {selectedFileForPreview.description && (
                          <>
                            <span>•</span>
                            <span>{selectedFileForPreview.description}</span>
                          </>
                        )}
                      </div>
                    )}
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFilePreviewMaximized(!isFilePreviewMaximized)}
                className="h-9 w-9 hover:bg-muted"
              >
                {isFilePreviewMaximized ? (
                  <Minimize2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 px-6 py-4 overflow-auto">
            {previewUrl && selectedFileForPreview && (
              selectedFileForPreview.mimeType.startsWith('image/') ? (
                <div className="flex justify-center items-center h-full">
                  <img 
                    src={previewUrl} 
                    alt={selectedFileForPreview.originalName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                  />
                </div>
              ) : selectedFileForPreview.mimeType === 'application/pdf' ? (
                <iframe 
                  src={previewUrl} 
                  className="w-full h-full rounded-lg border"
                  title={selectedFileForPreview.originalName}
                />
              ) : null
            )}
          </div>

          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" onClick={() => setShowFilePreview(false)}>
              Cerrar
            </Button>
            {selectedFileForPreview && (
              <Button onClick={() => {
                downloadFile(selectedFileForPreview.id, selectedFileForPreview.originalName)
              }} className="bg-gradient-to-r from-brand to-brand-dark">
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Floating Chat */}
      {/* Floating Button */}
      {!showAssistant && (
        <button
          onClick={() => setShowAssistant(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-brand to-brand-dark text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center group"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-popover text-popover-foreground px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border">
            VollBot - Asistente IA
          </span>
        </button>
      )}

      {/* Chat Window */}
      {showAssistant && (
        <div className={`fixed z-50 flex flex-col bg-background border shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${
          isAssistantMaximized 
            ? 'inset-4 rounded-2xl' 
            : 'bottom-6 right-6 w-[420px] h-[600px]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand to-brand-dark text-white">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">VollBot</h3>
                <p className="text-xs text-white/80">Asistente de CRM</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {assistantMessages.length > 0 && (
                <button
                  onClick={clearAssistantChat}
                  className="h-8 w-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                  title="Nueva conversación"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsAssistantMaximized(!isAssistantMaximized)}
                className="h-8 w-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                title={isAssistantMaximized ? "Minimizar" : "Maximizar"}
              >
                {isAssistantMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                  setShowAssistant(false)
                  setIsAssistantMaximized(false)
                }}
                className="h-8 w-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {assistantMessages.length === 0 && (
              <div className="text-center py-4">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-brand to-brand-dark flex items-center justify-center">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">¡Hola! Soy VollBot 👋</h4>
                <p className="text-sm text-muted-foreground mb-4 px-4">
                  Tu asistente inteligente de CRM. Pregúntame sobre clientes, ingresos, renovaciones y más.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-4 px-2">
                  {quickAssistantQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setAssistantInput(q.query)
                        setTimeout(() => {
                          sendAssistantMessage()
                        }, 100)
                      }}
                      className="text-left px-3 py-2.5 rounded-lg bg-background border hover:border-brand hover:bg-brand/5 transition-colors text-xs font-medium"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {assistantMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[90%] ${
                  msg.role === 'user'
                    ? 'bg-brand text-white rounded-2xl rounded-br-md px-4 py-2.5'
                    : 'bg-background border rounded-2xl rounded-bl-md px-4 py-3'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                      <div className="h-5 w-5 rounded-full bg-gradient-to-r from-brand to-brand-dark flex items-center justify-center">
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-brand">VollBot</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  
                  {/* Links */}
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-3 pt-2 border-t space-y-1">
                      <p className="text-xs text-muted-foreground font-medium mb-2">🔗 Acceso rápido:</p>
                      {msg.links.slice(0, 6).map((link, li) => {
                        const icon = link.tipo === 'cliente' ? Users : 
                                    link.tipo === 'dominio' ? Globe :
                                    link.tipo === 'servicio' ? Wrench :
                                    link.tipo === 'pago' ? CreditCard : Server
                        return (
                          <button
                            key={li}
                            onClick={() => handleAssistantLinkClick(link)}
                            className="flex items-center gap-2 w-full text-left px-2 py-2 rounded-lg hover:bg-brand/10 border border-transparent hover:border-brand/20 transition-all group"
                          >
                            <div className="h-7 w-7 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                              {(() => {
                                const IconComponent = link.tipo === 'cliente' ? Users : 
                                                    link.tipo === 'dominio' ? Globe :
                                                    link.tipo === 'servicio' ? Wrench :
                                                    link.tipo === 'pago' ? CreditCard : Server
                                return <IconComponent className="h-3.5 w-3.5 text-brand" />
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate group-hover:text-brand transition-colors">
                                {link.label}
                              </p>
                              {link.sublabel && (
                                <p className="text-[10px] text-muted-foreground truncate">{link.sublabel}</p>
                              )}
                            </div>
                            <ExternalLink className="h-3 w-3 text-brand opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </button>
                        )
                      })}
                      {msg.links.length > 6 && (
                        <p className="text-xs text-muted-foreground pl-2 mt-1">+{msg.links.length - 6} más...</p>
                      )}
                    </div>
                  )}
                  
                  {/* Acciones sugeridas */}
                  {msg.acciones && msg.acciones.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground font-medium mb-1">💡 Puedes preguntar:</p>
                      <div className="flex flex-wrap gap-1">
                        {msg.acciones.slice(0, 3).map((accion, ai) => (
                          <button
                            key={ai}
                            onClick={() => {
                              setAssistantInput(accion)
                              setTimeout(() => {
                                sendAssistantMessage()
                              }, 100)
                            }}
                            className="text-[10px] px-2 py-1 rounded-full bg-brand/5 text-brand hover:bg-brand/10 transition-colors"
                          >
                            {accion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {assistantLoading && (
              <div className="flex justify-start">
                <div className="bg-background border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-gradient-to-r from-brand to-brand-dark flex items-center justify-center">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                    <Loader2 className="h-4 w-4 animate-spin text-brand" />
                    <span className="text-sm text-muted-foreground">Buscando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-background">
            <div className="flex gap-2">
              <input
                type="text"
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendAssistantMessage()
                  }
                }}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                disabled={assistantLoading}
              />
              <button
                onClick={sendAssistantMessage}
                disabled={!assistantInput.trim() || assistantLoading}
                className="h-10 w-10 rounded-xl bg-gradient-to-r from-brand to-brand-dark text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Presiona Enter para enviar
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
