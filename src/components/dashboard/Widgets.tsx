'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, Users, Calendar, Globe, Server, Wrench, 
  AlertTriangle, Clock, TrendingUp, TrendingDown, ChevronRight, CheckCircle,
  XCircle, Pause, RefreshCw, CalendarDays, ArrowUpRight, ArrowDownRight,
  Shield, Receipt, UserPlus, Target, Activity, PieChart, BarChart3,
  Zap, Star, Award, Heart, FileText, CreditCard, Wallet, Bell,
  Mail, Phone, Building, ExternalLink, Minimize2, Maximize2
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts'

// ==========================================
// WIDGET TYPES
// ==========================================
export interface WidgetConfig {
  id: string
  type: 'stats' | 'chart' | 'list' | 'events' | 'renewals' | 'payments' | 'kpis' | 'distribution' | 'quickactions' | 'activity'
  x: number
  y: number
  w: number
  h: number
  visible: boolean
  size?: 'small' | 'medium' | 'large'
}

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6']

// ==========================================
// STATS OVERVIEW WIDGET
// ==========================================
interface StatsOverviewWidgetProps {
  data: {
    clients: { total: number; active: number; paused: number; cancelled: number }
    finances: { monthlyRevenue: number; monthlyCosts: number; monthlyProfit: number }
    services: number
    domains: number
    hosting: number
  }
}

export function StatsOverviewWidget({ data }: StatsOverviewWidgetProps) {
  const { clients, finances, services, domains, hosting } = data
  
  const stats = [
    {
      title: 'Clientes',
      value: clients.total,
      subtitle: `${clients.active} activos`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: clients.active > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Ingresos',
      value: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(finances.monthlyRevenue),
      subtitle: 'Este mes',
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      trend: finances.monthlyRevenue > finances.monthlyCosts ? 'up' : 'down',
    },
    {
      title: 'Servicios',
      value: services,
      subtitle: `${domains} dom · ${hosting} host`,
      icon: Wrench,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Beneficio',
      value: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(finances.monthlyProfit),
      subtitle: finances.monthlyProfit >= 0 ? 'Positivo' : 'Negativo',
      icon: finances.monthlyProfit >= 0 ? TrendingUp : TrendingDown,
      color: finances.monthlyProfit >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: finances.monthlyProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      trend: finances.monthlyProfit >= 0 ? 'up' : 'down',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-full">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="hover:shadow-md transition-all hover:scale-[1.02] group cursor-pointer">
            <CardContent className="p-4 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                {stat.trend && (
                  <div className={`p-1 rounded-full ${stat.trend === 'up' ? 'bg-emerald-500/20' : stat.trend === 'down' ? 'bg-red-500/20' : 'bg-gray-500/20'}`}>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className={`h-3 w-3 ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`} />
                    ) : stat.trend === 'down' ? (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold truncate">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ==========================================
// KPIs WIDGET
// ==========================================
interface KPIsWidgetProps {
  data: {
    newClientsThisMonth: number
    newClientsLastMonth: number
    retentionRate: number
    avgTicketPerClient: number
    upcomingRenewalsCount: number
    urgentRenewals: number
  }
}

export function KPIsWidget({ data }: KPIsWidgetProps) {
  const kpis = [
    {
      title: 'Nuevos Clientes',
      value: data.newClientsThisMonth,
      subtitle: data.newClientsThisMonth > data.newClientsLastMonth 
        ? `+${data.newClientsThisMonth - data.newClientsLastMonth} vs mes anterior` 
        : `${data.newClientsLastMonth} el mes pasado`,
      icon: UserPlus,
      color: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      trend: data.newClientsThisMonth > data.newClientsLastMonth ? 'up' : 'down',
    },
    {
      title: 'Retención',
      value: `${data.retentionRate}%`,
      subtitle: 'Clientes activos',
      icon: Shield,
      color: 'text-emerald-500',
      bgColor: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      progress: data.retentionRate,
    },
    {
      title: 'Ticket Medio',
      value: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(data.avgTicketPerClient),
      subtitle: 'Por cliente/mes',
      icon: Receipt,
      color: 'text-amber-500',
      bgColor: 'bg-gradient-to-br from-amber-500 to-orange-600',
    },
    {
      title: 'Renovaciones',
      value: data.upcomingRenewalsCount,
      subtitle: data.urgentRenewals > 0 ? `${data.urgentRenewals} urgentes` : 'Próximos 30 días',
      icon: CalendarDays,
      color: data.urgentRenewals > 0 ? 'text-red-500' : 'text-rose-500',
      bgColor: 'bg-gradient-to-br from-rose-500 to-pink-600',
      alert: data.urgentRenewals > 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-full">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.title} className={`relative overflow-hidden ${kpi.alert ? 'animate-pulse border-red-500/50' : ''}`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${kpi.bgColor} rounded-full -translate-y-1/2 translate-x-1/2 opacity-20`} />
            <CardContent className="relative p-4 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${kpi.bgColor} shadow-lg`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{kpi.subtitle}</p>
              </div>
              {kpi.progress !== undefined && (
                <Progress value={kpi.progress} className="h-1 mt-2" />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ==========================================
// PENDING PAYMENTS WIDGET
// ==========================================
interface PendingPaymentsWidgetProps {
  payments: Array<{
    id: string
    clientId: string
    client: string
    amount: number
    dueDate: string | null
    status: string
    description?: string
  }>
  onClientClick?: (clientId: string) => void
}

export function PendingPaymentsWidget({ payments, onClientClick }: PendingPaymentsWidgetProps) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
  
  const formatDate = (date: string | null) => {
    if (!date) return 'Sin fecha'
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }

  const getDaysUntil = (date: string | null) => {
    if (!date) return null
    const target = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-orange-500" />
            Pagos Pendientes
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {payments.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[200px]">
          {payments.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              ¡Todo al día!
            </div>
          ) : (
            <div className="space-y-1 p-3 pt-0">
              {payments.slice(0, 8).map((payment) => {
                const days = getDaysUntil(payment.dueDate)
                const isOverdue = days !== null && days < 0
                const isUrgent = days !== null && days >= 0 && days <= 7
                
                return (
                  <div
                    key={payment.id}
                    className={`flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                      isOverdue ? 'bg-red-500/10 border-l-2 border-red-500' : isUrgent ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                    }`}
                    onClick={() => onClientClick?.(payment.clientId)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{payment.client}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.dueDate ? formatDate(payment.dueDate) : 'Sin fecha'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(payment.amount)}</p>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                          Vencido
                        </Badge>
                      )}
                      {isUrgent && !isOverdue && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-orange-500 text-orange-500">
                          {days}d
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ==========================================
// UPCOMING RENEWALS WIDGET
// ==========================================
interface UpcomingRenewalsWidgetProps {
  renewals: Array<{
    id: string
    clientId: string
    client: string
    type: 'service' | 'domain' | 'hosting'
    description?: string
    renewalDate: string
    price?: number
  }>
  onClientClick?: (clientId: string) => void
}

export function UpcomingRenewalsWidget({ renewals, onClientClick }: UpcomingRenewalsWidgetProps) {
  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })

  const getDaysUntil = (date: string) => {
    const target = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'domain': return Globe
      case 'hosting': return Server
      default: return Wrench
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'domain': return 'text-blue-500 bg-blue-500/10'
      case 'hosting': return 'text-green-500 bg-green-500/10'
      default: return 'text-purple-500 bg-purple-500/10'
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-blue-500" />
            Próximas Renovaciones
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {renewals.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[200px]">
          {renewals.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              Sin renovaciones próximas
            </div>
          ) : (
            <div className="space-y-1 p-3 pt-0">
              {renewals.slice(0, 8).map((item) => {
                const days = getDaysUntil(item.renewalDate)
                const Icon = getTypeIcon(item.type)
                const colorClass = getTypeColor(item.type)
                const isUrgent = days <= 7
                const isExpired = days < 0
                
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                      isExpired ? 'bg-red-500/10' : isUrgent ? 'bg-amber-500/10' : ''
                    }`}
                    onClick={() => onClientClick?.(item.clientId)}
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.client}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description || item.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{formatDate(item.renewalDate)}</p>
                      <Badge variant="outline" className={`text-[10px] px-1 py-0 ${isExpired ? 'border-red-500 text-red-500' : isUrgent ? 'border-amber-500 text-amber-500' : ''}`}>
                        {days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `${days}d`}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ==========================================
// TODAY EVENTS WIDGET
// ==========================================
interface TodayEventsWidgetProps {
  events: Array<{
    id: string
    type: string
    title: string
    description?: string
    client?: string
    clientId?: string
    time?: string
    priority?: string
  }>
  onClientClick?: (clientId: string) => void
}

export function TodayEventsWidget({ events, onClientClick }: TodayEventsWidgetProps) {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'URGENT': return 'border-l-red-500 bg-red-500/5'
      case 'HIGH': return 'border-l-orange-500 bg-orange-500/5'
      case 'MEDIUM': return 'border-l-yellow-500 bg-yellow-500/5'
      default: return 'border-l-blue-500 bg-blue-500/5'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'service': return Wrench
      case 'domain': return Globe
      case 'hosting': return Server
      case 'alarm': return Bell
      case 'contract': return FileText
      case 'reminder': return Clock
      case 'invoice': return Receipt
      default: return Calendar
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-violet-500" />
            Hoy - {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {events.length} eventos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-violet-500" />
            No hay eventos para hoy
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {events.slice(0, 6).map((event) => {
              const Icon = getTypeIcon(event.type)
              return (
                <div
                  key={event.id}
                  className={`flex-shrink-0 w-48 p-3 rounded-lg border-l-4 ${getPriorityColor(event.priority)} hover:shadow-md transition-all cursor-pointer`}
                  onClick={() => event.clientId && onClientClick?.(event.clientId)}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      {event.client && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {event.client}
                        </p>
                      )}
                      {event.time && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==========================================
// RECENT CLIENTS WIDGET
// ==========================================
interface RecentClientsWidgetProps {
  clients: Array<{
    id: string
    name: string
    company: string
    email: string
    status: string
    createdAt: string
    monthlyRevenue: number
  }>
  onClientClick?: (clientId: string) => void
}

export function RecentClientsWidget({ clients, onClientClick }: RecentClientsWidgetProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-3.5 w-3.5 text-green-500" />
      case 'PAUSED': return <Pause className="h-3.5 w-3.5 text-yellow-500" />
      case 'CANCELLED': return <XCircle className="h-3.5 w-3.5 text-red-500" />
      default: return null
    }
  }

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-500" />
            Clientes Recientes
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {clients.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[200px]">
          {clients.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <Users className="h-8 w-8 mx-auto mb-2 text-cyan-500" />
              No hay clientes
            </div>
          ) : (
            <div className="space-y-1 p-3 pt-0">
              {clients.slice(0, 8).map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                  onClick={() => onClientClick?.(client.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(client.status)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-emerald-600">{formatCurrency(client.monthlyRevenue)}/mes</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(client.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ==========================================
// REVENUE CHART WIDGET (Enhanced)
// ==========================================
interface RevenueChartWidgetProps {
  data: Array<{
    month: string
    revenue: number
    costs: number
    profit: number
  }>
  theme?: string
}

export function RevenueChartWidget({ data, theme }: RevenueChartWidgetProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          Evolución Financiera
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.slice(-6)}>
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
              <XAxis dataKey="month" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={10} />
              <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={10} tickFormatter={(v) => `${v}€`} />
              <Tooltip 
                contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#colorRevenue)" name="Ingresos" />
              <Area type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} fill="url(#colorCosts)" name="Costos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground">Ingresos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-muted-foreground">Costos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==========================================
// SERVICES DISTRIBUTION WIDGET
// ==========================================
interface DistributionWidgetProps {
  data: Array<{
    type: string
    count: number
  }>
}

export function DistributionWidget({ data }: DistributionWidgetProps) {
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      WEB: 'Web',
      HOSTING: 'Hosting',
      MAINTENANCE: 'Mantenimiento',
      SEO: 'SEO',
      DOMAIN: 'Dominio',
      EMAIL: 'Email',
      OTHER: 'Otros',
    }
    return labels[type] || type
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChart className="h-4 w-4 text-violet-500" />
          Distribución Servicios
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={data.map((s, i) => ({ ...s, name: getTypeLabel(s.type), value: s.count }))}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {data.slice(0, 5).map((service, i) => (
            <div key={service.type} className="flex items-center gap-1 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
              <span className="text-muted-foreground">{getTypeLabel(service.type)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ==========================================
// QUICK ACTIONS WIDGET
// ==========================================
interface QuickActionsWidgetProps {
  onAddClient?: () => void
  onAddService?: () => void
  onAddInvoice?: () => void
  onOpenCalendar?: () => void
}

export function QuickActionsWidget({ onAddClient, onAddService, onAddInvoice, onOpenCalendar }: QuickActionsWidgetProps) {
  const actions = [
    { icon: UserPlus, label: 'Nuevo Cliente', color: 'bg-blue-500 hover:bg-blue-600', onClick: onAddClient },
    { icon: Wrench, label: 'Nuevo Servicio', color: 'bg-purple-500 hover:bg-purple-600', onClick: onAddService },
    { icon: Receipt, label: 'Nueva Factura', color: 'bg-emerald-500 hover:bg-emerald-600', onClick: onAddInvoice },
    { icon: Calendar, label: 'Calendario', color: 'bg-amber-500 hover:bg-amber-600', onClick: onOpenCalendar },
    { icon: Mail, label: 'Email', color: 'bg-cyan-500 hover:bg-cyan-600', onClick: undefined },
    { icon: Bell, label: 'Alarmas', color: 'bg-rose-500 hover:bg-rose-600', onClick: undefined },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.label}
                variant="ghost"
                className={`h-auto py-3 flex-col gap-1 ${action.color} text-white hover:text-white`}
                onClick={action.onClick}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ==========================================
// ACTIVITY WIDGET
// ==========================================
interface ActivityWidgetProps {
  activities: Array<{
    id: string
    type: string
    description: string
    client?: string
    timestamp: string
  }>
}

export function ActivityWidget({ activities }: ActivityWidgetProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'client': return Users
      case 'payment': return CreditCard
      case 'service': return Wrench
      case 'invoice': return Receipt
      case 'alarm': return Bell
      default: return Activity
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 60) return `${minutes}min`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-green-500" />
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[200px]">
          {activities.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" />
              Sin actividad reciente
            </div>
          ) : (
            <div className="space-y-2 p-3 pt-0">
              {activities.slice(0, 10).map((activity) => {
                const Icon = getTypeIcon(activity.type)
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="p-1.5 rounded-lg bg-muted">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.description}</p>
                      {activity.client && (
                        <p className="text-xs text-muted-foreground truncate">{activity.client}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {getTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
