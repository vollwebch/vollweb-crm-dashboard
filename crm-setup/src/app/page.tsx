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
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, DollarSign, TrendingUp, TrendingDown, Calendar, 
  Plus, Search, Filter, Eye, Edit, Trash2, RefreshCw,
  Globe, Server, Mail, Wrench, Search as SeoIcon, AlertCircle,
  Building, Phone, Clock, ChevronRight, Bell, BellOff, X, Check,
  Settings, BarChart3, PieChart, Activity, Target, Zap, Star,
  AlertTriangle, Info, CheckCircle, XCircle, Timer, Wallet,
  FileText, Link, Shield, Sparkles, Award, Heart, ExternalLink,
  LayoutGrid, List, AlignJustify, Trash, Archive, RotateCcw,
  Maximize2, Minimize2, Languages, LogOut
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts'
import { translations, type Language } from '@/lib/translations'
import { useRouter } from 'next/navigation'

// User type
interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
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

interface SystemConfig {
  id: string
  companyName: string
  primaryColor: string
  currency: string
  language: string
  timezone: string
  dateFormat: string
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [showAddClientDialog, setShowAddClientDialog] = useState(false)
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false)
  const [showAddHostingDialog, setShowAddHostingDialog] = useState(false)
  const [showAddDomainDialog, setShowAddDomainDialog] = useState(false)
  const [showAddAlarmDialog, setShowAddAlarmDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showEditServiceDialog, setShowEditServiceDialog] = useState(false)
  const [showEditHostingDialog, setShowEditHostingDialog] = useState(false)
  const [showEditDomainDialog, setShowEditDomainDialog] = useState(false)
  const [editingService, setEditingService] = useState<ClientService | null>(null)
  const [editingHosting, setEditingHosting] = useState<Hosting | null>(null)
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null)
  const { toast } = useToast()

  // Selection states
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [selectedAlarmIds, setSelectedAlarmIds] = useState<string[]>([])
  const [selectedReminderIds, setSelectedReminderIds] = useState<string[]>([])

  // View mode for clients
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid')

  // Maximize state for client dialog
  const [isMaximized, setIsMaximized] = useState(false)

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

  // Fetch functions
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
      const res = await fetch(`/api/clients?${params}`)
      const data = await res.json()
      setClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchTerm])

  const fetchAlarms = useCallback(async () => {
    try {
      const res = await fetch('/api/alarms?isActive=true')
      const data = await res.json()
      setAlarms(data)
    } catch (error) {
      console.error('Error fetching alarms:', error)
    }
  }, [])

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

  useEffect(() => {
    fetchCurrentUser()
    fetchDashboard()
    fetchClients()
    fetchAlarms()
    fetchNotificationConfig()
    fetchSystemConfig()
  }, [fetchCurrentUser, fetchDashboard, fetchClients, fetchAlarms, fetchNotificationConfig, fetchSystemConfig])

  // Fetch trash data when trash tab is active
  useEffect(() => {
    if (activeTab === 'trash') {
      fetchTrashData()
    }
  }, [activeTab, fetchTrashData])

  // Refresh selected client data
  const refreshSelectedClient = useCallback(async () => {
    if (selectedClient) {
      const updatedClient = await fetchClientById(selectedClient.id)
      if (updatedClient) {
        setSelectedClient(updatedClient)
      }
    }
  }, [selectedClient, fetchClientById])

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
      LOW: 'bg-slate-100 text-slate-600',
      MEDIUM: 'bg-blue-100 text-blue-600',
      HIGH: 'bg-orange-100 text-orange-600',
      URGENT: 'bg-red-100 text-red-600'
    }
    return <Badge className={styles[priority] || styles.MEDIUM}>{t(`alarms.priority.${priority}`)}</Badge>
  }

  const getAlarmTypeLabel = (type: string) => {
    return t(`alarms.types.${type}`)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-violet-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">V</span>
            </div>
          </div>
          <p className="text-slate-600 font-medium">{t('misc.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl shadow-lg shadow-violet-200"></div>
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">V</div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{t('header.title')}</h1>
                <p className="text-xs text-slate-500">{t('header.subtitle')}</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'dashboard', icon: BarChart3, label: t('nav.dashboard') },
                { id: 'clients', icon: Users, label: t('nav.clients') },
                { id: 'alarms', icon: Bell, label: t('nav.alarms') },
                { id: 'finances', icon: Wallet, label: t('nav.finances') },
                { id: 'trash', icon: Trash, label: t('nav.trash') },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white text-violet-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.id === 'alarms' && alarms.length > 0 && (
                    <span className="ml-1 h-5 w-5 bg-violet-600 rounded-full text-xs flex items-center justify-center text-white">
                      {alarms.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowConfigDialog(true)} className="relative">
                <Settings className="h-5 w-5 text-slate-600" />
              </Button>
              <Button 
                onClick={() => setShowAddClientDialog(true)}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('header.newClient')}
              </Button>
              {/* User Menu */}
              {user && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200">
                  <Avatar className="h-8 w-8 border-2 border-violet-200">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-slate-700">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-500 hover:bg-red-50"
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
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Clients */}
              <Card className="relative overflow-hidden border-0 shadow-lg shadow-slate-200/50 bg-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{t('kpi.totalClients')}</p>
                      <p className="text-4xl font-bold text-slate-900 mt-1">{dashboardData.clients.total}</p>
                      <div className="flex gap-2 mt-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          {dashboardData.clients.active} {t('kpi.active')}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          {dashboardData.clients.paused} {t('kpi.paused')}
                        </span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Revenue */}
              <Card className="relative overflow-hidden border-0 shadow-lg shadow-slate-200/50 bg-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{t('kpi.monthlyRevenue')}</p>
                      <p className="text-4xl font-bold text-emerald-600 mt-1">{formatCurrency(dashboardData.finances.monthlyRevenue)}</p>
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        {formatCurrency(dashboardData.finances.annualRevenue)}{t('kpi.perYear')}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Costs */}
              <Card className="relative overflow-hidden border-0 shadow-lg shadow-slate-200/50 bg-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100 to-rose-100 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{t('kpi.monthlyCosts')}</p>
                      <p className="text-4xl font-bold text-red-500 mt-1">{formatCurrency(dashboardData.finances.monthlyCosts)}</p>
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        {formatCurrency(dashboardData.finances.annualCosts)}{t('kpi.perYear')}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                      <TrendingDown className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Profit */}
              <Card className="relative overflow-hidden border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-violet-600 to-purple-700">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <CardContent className="relative pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-violet-200">{t('kpi.monthlyProfit')}</p>
                      <p className="text-4xl font-bold text-white mt-1">{formatCurrency(dashboardData.finances.monthlyProfit)}</p>
                      <p className="text-xs text-violet-200 mt-2">
                        Margen: {dashboardData.finances.monthlyRevenue > 0 
                          ? Math.round((dashboardData.finances.monthlyProfit / dashboardData.finances.monthlyRevenue) * 100) 
                          : 0}%
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <Card className="lg:col-span-2 border-0 shadow-lg shadow-slate-200/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <BarChart3 className="h-5 w-5 text-violet-600" />
                    {t('finances.evolution')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}€`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#colorRevenue)" name={t('finances.revenue')} />
                        <Area type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={3} fill="url(#colorCosts)" name={t('finances.costs')} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Services Distribution */}
              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <PieChart className="h-5 w-5 text-violet-600" />
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
                        <span className="text-slate-600">{getServiceTypeLabel(service.type)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Renewals & Recent Clients */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Renewals */}
              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
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
                              className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${
                                isExpired ? 'bg-red-50' : isUrgent ? 'bg-amber-50' : 'bg-slate-50'
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
                                isExpired ? 'bg-red-100' : isUrgent ? 'bg-amber-100' : 'bg-violet-100'
                              }`}>
                                {item.serviceType ? getServiceTypeIcon(item.serviceType) : 
                                 item.domainName ? <Globe className="h-5 w-5 text-blue-500" /> : 
                                 <Server className="h-5 w-5 text-orange-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate">{item.client?.company}</p>
                                <p className="text-sm text-slate-500 truncate">
                                  {item.description || item.domainName || `${item.provider} - ${item.plan}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge className={isExpired ? 'bg-red-500 text-white' : isUrgent ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'}>
                                  {isExpired ? `${Math.abs(days)} ${t('dates.days')}` : `${days} ${t('dates.days')}`}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      {dashboardData.renewals.services.length === 0 && 
                       dashboardData.renewals.domains.length === 0 && 
                       dashboardData.renewals.hosting.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                          <p>{t('misc.noData')}</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Clients */}
              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <div className="h-8 w-8 bg-violet-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-4 w-4 text-violet-600" />
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
                          className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-violet-50 cursor-pointer transition-all"
                          onClick={() => {
                            const fullClient = clients.find(c => c.id === client.id)
                            if (fullClient) {
                              setSelectedClient(fullClient)
                              setShowClientDialog(true)
                            }
                          }}
                        >
                          <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold">
                              {client.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800">{client.company}</p>
                            <p className="text-sm text-slate-500">{client.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-600">{formatCurrency(client.monthlyRevenue)}{t('misc.perMonth')}</p>
                            <p className="text-xs text-slate-400">{formatDate(client.createdAt)}</p>
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

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            {/* Search, Filters, View Mode & Bulk Actions */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        placeholder={t('clients.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 bg-slate-50 border-0 rounded-xl"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48 h-12 bg-slate-50 border-0 rounded-xl">
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
                    {/* View Mode Selector */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={viewMode === 'grid' ? 'bg-violet-600 text-white' : ''}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={viewMode === 'list' ? 'bg-violet-600 text-white' : ''}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'compact' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('compact')}
                        className={viewMode === 'compact' ? 'bg-violet-600 text-white' : ''}
                      >
                        <AlignJustify className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Bulk Actions */}
                  {selectedClientIds.length > 0 && (
                    <div className="flex items-center gap-4 p-3 bg-violet-50 rounded-xl">
                      <span className="text-sm text-violet-700 font-medium">
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
                    className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-violet-200/50 cursor-pointer transition-all group"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedClientIds.includes(client.id)}
                          onCheckedChange={() => toggleClientSelection(client.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="border-violet-400 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                        />
                        <Avatar className="h-14 w-14 border-2 border-white shadow-lg cursor-pointer" onClick={() => {
                          setSelectedClient(client)
                          setShowClientDialog(true)
                        }}>
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-lg">
                            {client.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0" onClick={() => {
                          setSelectedClient(client)
                          setShowClientDialog(true)
                        }}>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-800 truncate">{client.company}</p>
                            {getStatusBadge(client.status)}
                          </div>
                          <p className="text-sm text-slate-500 truncate">{client.name}</p>
                          <p className="text-xs text-slate-400 truncate">{client.email}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Wrench className="h-3.5 w-3.5" />
                              {client._count?.services || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3.5 w-3.5" />
                              {client._count?.domains || 0}
                            </span>
                          </div>
                          <p className="font-bold text-emerald-600">{formatCurrency(client.monthlyRevenue)}{t('misc.perMonth')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Clients List View */}
            {viewMode === 'list' && (
              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedClientIds.length === clients.length && clients.length > 0}
                          onCheckedChange={toggleAllClients}
                          className="border-violet-400 data-[state=checked]:bg-violet-600"
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
                      <TableRow key={client.id} className="cursor-pointer hover:bg-violet-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedClientIds.includes(client.id)}
                            onCheckedChange={() => toggleClientSelection(client.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="border-violet-400 data-[state=checked]:bg-violet-600"
                          />
                        </TableCell>
                        <TableCell onClick={() => { setSelectedClient(client); setShowClientDialog(true) }}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
                                {client.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-xs text-slate-500">{client.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell onClick={() => { setSelectedClient(client); setShowClientDialog(true) }}>{client.company}</TableCell>
                        <TableCell onClick={() => { setSelectedClient(client); setShowClientDialog(true) }}>{getStatusBadge(client.status)}</TableCell>
                        <TableCell onClick={() => { setSelectedClient(client); setShowClientDialog(true) }}>{client._count?.services || 0}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600" onClick={() => { setSelectedClient(client); setShowClientDialog(true) }}>
                          {formatCurrency(client.monthlyRevenue)}{t('misc.perMonth')}
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
              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <div className="divide-y divide-slate-100">
                  {clients.map((client) => (
                    <div 
                      key={client.id} 
                      className="flex items-center gap-3 p-3 hover:bg-violet-50 cursor-pointer"
                      onClick={() => { setSelectedClient(client); setShowClientDialog(true) }}
                    >
                      <Checkbox
                        checked={selectedClientIds.includes(client.id)}
                        onCheckedChange={() => toggleClientSelection(client.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="border-violet-400 data-[state=checked]:bg-violet-600"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
                          {client.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{client.company}</p>
                        <p className="text-xs text-slate-500">{client.name}</p>
                      </div>
                      {getStatusBadge(client.status)}
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600 text-sm">{formatCurrency(client.monthlyRevenue)}{t('misc.perMonth')}</p>
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
                <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">{t('clients.noResults')}</p>
              </div>
            )}
          </div>
        )}

        {/* Alarms Tab */}
        {activeTab === 'alarms' && (
          <div className="space-y-6">
            {/* Active Alarms */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <div className="h-8 w-8 bg-violet-100 rounded-lg flex items-center justify-center">
                      <Bell className="h-4 w-4 text-violet-600" />
                    </div>
                    {t('alarms.title')}
                  </CardTitle>
                  {selectedAlarmIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-violet-700">{selectedAlarmIds.length}</span>
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
                      <BellOff className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500">{t('alarms.noAlarms')}</p>
                    </div>
                  ) : (
                    <>
                      {/* Select All */}
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <Checkbox
                          checked={selectedAlarmIds.length === alarms.length}
                          onCheckedChange={toggleAllAlarms}
                          className="border-violet-400 data-[state=checked]:bg-violet-600"
                        />
                        <span className="text-sm text-slate-600">{t('actions.selectAll')}</span>
                      </div>
                      {alarms.map((alarm) => {
                        const days = getDaysUntil(alarm.alarmDate)
                        const isPast = days < 0
                        return (
                          <div key={alarm.id} className={`flex items-center gap-4 p-4 rounded-xl ${isPast ? 'bg-red-50' : 'bg-slate-50'}`}>
                            <Checkbox
                              checked={selectedAlarmIds.includes(alarm.id)}
                              onCheckedChange={() => toggleAlarmSelection(alarm.id)}
                              className="border-violet-400 data-[state=checked]:bg-violet-600"
                            />
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                              alarm.priority === 'URGENT' ? 'bg-red-100' : 
                              alarm.priority === 'HIGH' ? 'bg-orange-100' : 
                              alarm.priority === 'MEDIUM' ? 'bg-blue-100' : 'bg-slate-100'
                            }`}>
                              {alarm.type === 'CONTRACT_END' ? <FileText className="h-5 w-5 text-violet-600" /> :
                               alarm.type === 'ANNIVERSARY' ? <Award className="h-5 w-5 text-amber-600" /> :
                               alarm.type === 'FOLLOW_UP' ? <Target className="h-5 w-5 text-blue-600" /> :
                               <Bell className="h-5 w-5 text-slate-600" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-800">{alarm.title}</p>
                                {getPriorityBadge(alarm.priority)}
                              </div>
                              <p className="text-sm text-slate-500">{alarm.client?.company}</p>
                              {alarm.description && <p className="text-xs text-slate-400 mt-1">{alarm.description}</p>}
                            </div>
                            <div className="text-right flex items-center gap-2">
                              {alarm.client && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openClientFromAlarm(alarm.client!.id)}
                                  title={t('clients.title')}
                                >
                                  <ExternalLink className="h-4 w-4 text-violet-600" />
                                </Button>
                              )}
                              <Badge className={isPast ? 'bg-red-500 text-white' : 'bg-violet-100 text-violet-700'}>
                                {isPast ? t('alarms.expired') : `${days} ${t('dates.days')}`}
                              </Badge>
                              <p className="text-xs text-slate-400">{formatDate(alarm.alarmDate)}</p>
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
              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </div>
                      {t('notifications.title')}
                    </CardTitle>
                    {selectedReminderIds.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-violet-700">{selectedReminderIds.length}</span>
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
                    <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                      <Checkbox
                        checked={selectedReminderIds.length === dashboardData.reminders.length}
                        onCheckedChange={toggleAllReminders}
                        className="border-violet-400 data-[state=checked]:bg-violet-600"
                      />
                      <span className="text-sm text-slate-600">{t('actions.selectAll')}</span>
                    </div>
                    {dashboardData.reminders.map((reminder) => (
                      <div key={reminder.id} className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <Checkbox
                          checked={selectedReminderIds.includes(reminder.id)}
                          onCheckedChange={() => toggleReminderSelection(reminder.id)}
                          className="border-violet-400 data-[state=checked]:bg-violet-600"
                        />
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <p className="flex-1 text-slate-700">{reminder.message}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{formatDate(reminder.reminderDate)}</span>
                          {reminder.client && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openClientFromAlarm(reminder.client!.id)}
                              title={t('clients.title')}
                            >
                              <ExternalLink className="h-4 w-4 text-violet-600" />
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

        {/* Finances Tab */}
        {activeTab === 'finances' && dashboardData && (
          <div className="space-y-6">
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
                    <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
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
                    <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <TrendingDown className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-600 to-purple-700">
                <CardContent className="relative pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-violet-200">{t('finances.profit')}</p>
                      <p className="text-4xl font-bold text-white mt-1">{formatCurrency(dashboardData.finances.annualProfit)}</p>
                      <p className="text-sm text-violet-200 mt-2">{formatCurrency(dashboardData.finances.monthlyProfit)}{t('misc.perMonth')}</p>
                    </div>
                    <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Client */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Star className="h-5 w-5 text-violet-600" />
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
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-violet-50 cursor-pointer transition-all"
                            onClick={() => {
                              setSelectedClient(client)
                              setShowClientDialog(true)
                            }}
                          >
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-amber-400 text-white' :
                              index === 1 ? 'bg-slate-300 text-white' :
                              index === 2 ? 'bg-amber-600 text-white' :
                              'bg-slate-200 text-slate-600'
                            }`}>
                              #{index + 1}
                            </div>
                            <Avatar className="h-10 w-10 border-2 border-white shadow">
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                {client.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{client.company}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={percentage} className="h-2 flex-1" />
                                <span className="text-xs text-slate-500 w-12">{Math.round(percentage)}%</span>
                              </div>
                            </div>
                            <p className="font-bold text-emerald-600">{formatCurrency(client.monthlyRevenue)}{t('misc.perMonth')}</p>
                          </div>
                        )
                      })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trash Tab */}
        {activeTab === 'trash' && trashData && (
          <div className="space-y-6">
            {/* Trash Config */}
            <Card className="border-0 shadow-lg shadow-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Settings className="h-5 w-5 text-violet-600" />
                  {t('trash.title')} - {t('config.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-violet-100 rounded-lg flex items-center justify-center">
                      <Timer className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{t('trash.autoDelete')}</p>
                      <p className="text-sm text-slate-500">{t('trash.autoDeleteDesc')} {trashConfig?.autoDeleteDays || 10} {t('trash.days')}</p>
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
              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Users className="h-5 w-5 text-violet-600" />
                    {t('trash.deletedClients')} ({trashData.clients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trashData.clients.map((client) => (
                      <div key={client.id} className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-red-400 to-rose-500 text-white">
                            {client.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{client.company}</p>
                          <p className="text-sm text-slate-500">{client.name} · {client.email}</p>
                        </div>
                        <p className="text-xs text-slate-400">{t('trash.deleted')}: {formatDate(client.deletedAt)}</p>
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
              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Bell className="h-5 w-5 text-violet-600" />
                    {t('trash.deletedAlarms')} ({trashData.alarms.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trashData.alarms.map((alarm) => (
                      <div key={alarm.id} className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                        <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <Bell className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{alarm.title}</p>
                          <p className="text-sm text-slate-500">{alarm.client?.company}</p>
                        </div>
                        <p className="text-xs text-slate-400">{t('trash.deleted')}: {formatDate(alarm.deletedAt)}</p>
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
              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <AlertTriangle className="h-5 w-5 text-violet-600" />
                    {t('trash.deletedNotifications')} ({trashData.reminders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trashData.reminders.map((reminder) => (
                      <div key={reminder.id} className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                        <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{reminder.message}</p>
                          <p className="text-sm text-slate-500">{reminder.client?.company || t('clients.noClients')}</p>
                        </div>
                        <p className="text-xs text-slate-400">{t('trash.deleted')}: {formatDate(reminder.deletedAt)}</p>
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
              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <CardContent className="py-16 text-center">
                  <Archive className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">{t('trash.empty')}</p>
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
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-xl">
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
                    className="h-9 w-9 hover:bg-slate-100"
                  >
                    {isMaximized ? (
                      <Minimize2 className="h-4 w-4 text-slate-600" />
                    ) : (
                      <Maximize2 className="h-4 w-4 text-slate-600" />
                    )}
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 min-h-0 px-8 py-4 overflow-auto">
                <div className="space-y-5 py-2">
                  {/* Contract Info */}
                  {(selectedClient.contractStart || selectedClient.contractEnd) && (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl">
                      <div className="text-center">
                        <p className="text-xs text-violet-600 font-medium">{t('clients.contractStart')}</p>
                        <p className="font-semibold text-slate-800">{formatDate(selectedClient.contractStart)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-violet-600 font-medium">{t('clients.contractEnd')}</p>
                        <p className="font-semibold text-slate-800">{formatDate(selectedClient.contractEnd)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-violet-600 font-medium">{t('clients.duration')}</p>
                        <p className="font-semibold text-slate-800">{selectedClient.contractYears || '-'} {t('clients.years')}</p>
                      </div>
                    </div>
                  )}

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
                    <div className="p-4 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl text-white">
                      <p className="text-xs text-violet-200">{t('clients.profitMonth')}</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(selectedClient.monthlyRevenue - (selectedClient.hosting?.reduce((acc, h) => acc + Number(h.monthlyCost), 0) || 0))}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Services */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-violet-600" />
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
                          <div key={service.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                            <div className="h-10 w-10 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600">
                              {getServiceTypeIcon(service.serviceType)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">{getServiceTypeLabel(service.serviceType)}</p>
                              <p className="text-sm text-slate-500">{service.description || t('services.description')}</p>
                            </div>
                            <p className="font-semibold text-emerald-600">{formatCurrency(service.monthlyPrice)}{t('misc.perMonth')}</p>
                            {getStatusBadge(service.status)}
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => { setEditingService(service); setShowEditServiceDialog(true) }}
                              >
                                <Edit className="h-4 w-4 text-slate-500" />
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
                      <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-xl">{t('services.noServices')}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Hosting */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
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
                          <div key={h.id} className="flex items-center gap-4 p-3 bg-orange-50 rounded-xl">
                            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Server className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">{h.provider}</p>
                              <p className="text-sm text-slate-500">{h.plan}</p>
                            </div>
                            <p className="font-semibold text-red-600">-{formatCurrency(h.monthlyCost)}{t('misc.perMonth')}</p>
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => { setEditingHosting(h); setShowEditHostingDialog(true) }}
                              >
                                <Edit className="h-4 w-4 text-slate-500" />
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
                      <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-xl">{t('hosting.noHosting')}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Domains */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
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
                          <div key={d.id} className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Globe className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">{d.domainName}</p>
                              <p className="text-sm text-slate-500">{d.registrar}</p>
                            </div>
                            <p className="font-semibold text-red-600">-{formatCurrency(d.cost)}{t('domains.perYear')}</p>
                            {getStatusBadge(d.status)}
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => { setEditingDomain(d); setShowEditDomainDialog(true) }}
                              >
                                <Edit className="h-4 w-4 text-slate-500" />
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
                      <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-xl">{t('domains.noDomains')}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Alarms */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
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
                          <div key={alarm.id} className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl">
                            <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                              <Bell className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">{alarm.title}</p>
                              <p className="text-sm text-slate-500">{alarm.description || getAlarmTypeLabel(alarm.type)}</p>
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
                      <p className="text-slate-500 text-center py-4 bg-slate-50 rounded-xl">{t('alarms.noAlarms')}</p>
                    )}
                  </div>

                  {/* Notes */}
                  {selectedClient.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-slate-500" />
                          {t('clients.notes')}
                        </h4>
                        <p className="text-slate-600 bg-slate-50 p-4 rounded-xl">{selectedClient.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-shrink-0 border-t p-4 bg-slate-50/50">
                <Button variant="destructive" onClick={() => handleDeleteClient(selectedClient.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('actions.delete')}
                </Button>
                <Button variant="outline" onClick={() => setShowClientDialog(false)}>
                  {t('actions.close')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Notification Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-violet-600" />
              {t('config.title')}
            </DialogTitle>
            <DialogDescription>{t('config.description')}</DialogDescription>
          </DialogHeader>
          
          {notificationConfig && systemConfig && (
            <div className="space-y-6 py-4">
              {/* Language Selection */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Languages className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{t('config.language')}</p>
                    <p className="text-sm text-slate-500">{t('config.languageDescription')}</p>
                  </div>
                </div>
                <Select
                  value={systemConfig.language || 'es'}
                  onValueChange={(value) => handleUpdateSystemConfig({ language: value })}
                >
                  <SelectTrigger className="bg-white">
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
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{t('config.currency')}</p>
                    <p className="text-sm text-slate-500">{t('config.currencyDescription')}</p>
                  </div>
                </div>
                <Select
                  value={systemConfig.currency || 'EUR'}
                  onValueChange={(value) => handleUpdateSystemConfig({ currency: value })}
                >
                  <SelectTrigger className="bg-white">
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

              <Separator />

              {/* Notifications Section */}
              <div>
                <h4 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-violet-600" />
                  {t('config.notifications')}
                </h4>
                <div className="space-y-3">
              {/* Service Renewals */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{t('config.serviceRenewal')}</p>
                    <p className="text-sm text-slate-500">{t('config.serviceRenewalDesc')}</p>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.serviceRenewalEnabled}
                  onCheckedChange={(checked) => handleUpdateNotificationConfig({ serviceRenewalEnabled: checked })}
                />
              </div>

              {/* Domain Expiry */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{t('config.domainExpiry')}</p>
                    <p className="text-sm text-slate-500">{t('config.domainExpiryDesc')}</p>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.domainExpiryEnabled}
                  onCheckedChange={(checked) => handleUpdateNotificationConfig({ domainExpiryEnabled: checked })}
                />
              </div>

              {/* Hosting Renewal */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Server className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{t('config.hostingRenewal')}</p>
                    <p className="text-sm text-slate-500">{t('config.hostingRenewalDesc')}</p>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.hostingRenewalEnabled}
                  onCheckedChange={(checked) => handleUpdateNotificationConfig({ hostingRenewalEnabled: checked })}
                />
              </div>

              {/* Contract End */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{t('config.contractEnd')}</p>
                    <p className="text-sm text-slate-500">{t('config.contractEndDesc')}</p>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.contractEndEnabled}
                  onCheckedChange={(checked) => handleUpdateNotificationConfig({ contractEndEnabled: checked })}
                />
              </div>

              {/* Anniversary */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{t('config.anniversary')}</p>
                    <p className="text-sm text-slate-500">{t('config.anniversaryDesc')}</p>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.anniversaryEnabled}
                  onCheckedChange={(checked) => handleUpdateNotificationConfig({ anniversaryEnabled: checked })}
                />
              </div>

              {/* Custom Alarms */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{t('config.customAlarms')}</p>
                    <p className="text-sm text-slate-500">{t('config.customAlarmsDesc')}</p>
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
                <h4 className="font-medium text-slate-800 mb-4">{t('config.generalPreferences')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-700">{t('config.pushNotifications')}</span>
                    <Switch
                      checked={notificationConfig.pushNotifications}
                      onCheckedChange={(checked) => handleUpdateNotificationConfig({ pushNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-700">{t('config.emailNotifications')}</span>
                    <Switch
                      checked={notificationConfig.emailNotifications}
                      onCheckedChange={(checked) => handleUpdateNotificationConfig({ emailNotifications: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowConfigDialog(false)} className="bg-violet-600 hover:bg-violet-700">
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
            <Button onClick={handleAddClient} className="bg-violet-600 hover:bg-violet-700">{t('clients.add')}</Button>
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
            <Button onClick={handleAddService} className="bg-violet-600 hover:bg-violet-700">{t('services.add')}</Button>
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
            <Button onClick={handleEditService} className="bg-violet-600 hover:bg-violet-700">{t('actions.save')}</Button>
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
            <Button onClick={handleAddHosting} className="bg-violet-600 hover:bg-violet-700">{t('hosting.add')}</Button>
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
            <Button onClick={handleEditHosting} className="bg-violet-600 hover:bg-violet-700">{t('actions.save')}</Button>
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
            <Button onClick={handleAddDomain} className="bg-violet-600 hover:bg-violet-700">{t('domains.add')}</Button>
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
            <Button onClick={handleEditDomain} className="bg-violet-600 hover:bg-violet-700">{t('actions.save')}</Button>
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
            <Button onClick={handleAddAlarm} className="bg-violet-600 hover:bg-violet-700">{t('alarms.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
