'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  GripVertical, Settings, RefreshCw, Plus, X, Eye, EyeOff,
  LayoutGrid, Save, RotateCcw, ChevronUp, ChevronDown,
  LayoutDashboard, Sparkles
} from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  StatsOverviewWidget,
  PendingPaymentsWidget,
  UpcomingRenewalsWidget,
  TodayEventsWidget,
  RecentClientsWidget,
  RevenueChartWidget,
  KPIsWidget,
  DistributionWidget,
  QuickActionsWidget,
  ActivityWidget,
  WidgetConfig
} from './Widgets'

// ==========================================
// TYPES
// ==========================================
interface DashboardGridProps {
  onClientClick?: (clientId: string) => void
  onQuickAction?: (action: string) => void
}

// ==========================================
// DEFAULT WIDGETS CONFIG
// ==========================================
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stats-overview', type: 'stats', x: 0, y: 0, w: 4, h: 1, visible: true, size: 'large' },
  { id: 'kpis-overview', type: 'kpis', x: 0, y: 1, w: 4, h: 1, visible: true, size: 'large' },
  { id: 'revenue-chart', type: 'chart', x: 0, y: 2, w: 2, h: 2, visible: true, size: 'medium' },
  { id: 'pending-payments', type: 'payments', x: 2, y: 2, w: 2, h: 2, visible: true, size: 'medium' },
  { id: 'upcoming-renewals', type: 'renewals', x: 0, y: 4, w: 2, h: 2, visible: true, size: 'medium' },
  { id: 'recent-clients', type: 'list', x: 2, y: 4, w: 2, h: 2, visible: true, size: 'medium' },
  { id: 'today-events', type: 'events', x: 0, y: 6, w: 4, h: 1, visible: true, size: 'large' },
]

const AVAILABLE_WIDGETS = [
  { id: 'stats-overview', name: 'Resumen Stats', type: 'stats', icon: '📊', description: 'Vista general de métricas', defaultSize: 'large' },
  { id: 'kpis-overview', name: 'KPIs', type: 'kpis', icon: '🎯', description: 'Indicadores clave', defaultSize: 'large' },
  { id: 'revenue-chart', name: 'Gráfico Ingresos', type: 'chart', icon: '📈', description: 'Evolución financiera', defaultSize: 'medium' },
  { id: 'pending-payments', name: 'Pagos Pendientes', type: 'payments', icon: '💰', description: 'Lista de pagos', defaultSize: 'medium' },
  { id: 'upcoming-renewals', name: 'Próximas Renovaciones', type: 'renewals', icon: '🔄', description: 'Renovaciones de servicios', defaultSize: 'medium' },
  { id: 'recent-clients', name: 'Clientes Recientes', type: 'list', icon: '👥', description: 'Últimos clientes', defaultSize: 'medium' },
  { id: 'today-events', name: 'Eventos de Hoy', type: 'events', icon: '📅', description: 'Eventos del día', defaultSize: 'large' },
  { id: 'distribution-chart', name: 'Distribución Servicios', type: 'distribution', icon: '🥧', description: 'Tipos de servicio', defaultSize: 'medium' },
  { id: 'quick-actions', name: 'Acciones Rápidas', type: 'quickactions', icon: '⚡', description: 'Acceso rápido', defaultSize: 'medium' },
  { id: 'activity-feed', name: 'Actividad Reciente', type: 'activity', icon: '🔔', description: 'Últimas acciones', defaultSize: 'medium' },
]

// ==========================================
// WIDGET RENDERER
// ==========================================
function WidgetRenderer({ 
  widget, 
  data, 
  onClientClick, 
  onQuickAction, 
  theme 
}: { 
  widget: WidgetConfig
  data: any
  onClientClick?: (clientId: string) => void
  onQuickAction?: (action: string) => void
  theme?: string
}) {
  const renderWidget = () => {
    switch (widget.type) {
      case 'stats':
        return (
          <StatsOverviewWidget 
            data={{
              clients: data?.clients || { total: 0, active: 0, paused: 0, cancelled: 0 },
              finances: data?.finances || { monthlyRevenue: 0, monthlyCosts: 0, monthlyProfit: 0 },
              services: data?.servicesCount || 0,
              domains: data?.domainsCount || 0,
              hosting: data?.hostingCount || 0,
            }} 
          />
        )
      case 'kpis':
        return (
          <KPIsWidget 
            data={{
              newClientsThisMonth: data?.kpis?.newClientsThisMonth || 0,
              newClientsLastMonth: data?.kpis?.newClientsLastMonth || 0,
              retentionRate: data?.kpis?.retentionRate || 100,
              avgTicketPerClient: data?.kpis?.avgTicketPerClient || 0,
              upcomingRenewalsCount: data?.kpis?.upcomingRenewalsCount || 0,
              urgentRenewals: data?.kpis?.urgentRenewals || 0,
            }}
          />
        )
      case 'chart':
        return <RevenueChartWidget data={data?.chart || []} theme={theme} />
      case 'payments':
        return <PendingPaymentsWidget payments={data?.pendingPayments || []} onClientClick={onClientClick} />
      case 'renewals':
        return <UpcomingRenewalsWidget renewals={data?.upcomingRenewals || []} onClientClick={onClientClick} />
      case 'list':
        return <RecentClientsWidget clients={data?.recentClients || []} onClientClick={onClientClick} />
      case 'events':
        return <TodayEventsWidget events={data?.todayEvents || []} onClientClick={onClientClick} />
      case 'distribution':
        return <DistributionWidget data={data?.servicesDistribution || []} />
      case 'quickactions':
        return (
          <QuickActionsWidget 
            onAddClient={() => onQuickAction?.('addClient')}
            onAddService={() => onQuickAction?.('addService')}
            onAddInvoice={() => onQuickAction?.('addInvoice')}
            onOpenCalendar={() => onQuickAction?.('openCalendar')}
          />
        )
      case 'activity':
        return <ActivityWidget activities={data?.recentActivity || []} />
      default:
        return (
          <Card className="h-full">
            <CardContent className="p-4 flex items-center justify-center h-full">
              <p className="text-muted-foreground">Widget no encontrado</p>
            </CardContent>
          </Card>
        )
    }
  }

  // Determine grid span based on type
  const getGridSpan = () => {
    switch (widget.type) {
      case 'stats':
      case 'kpis':
      case 'events':
        return 'col-span-2 md:col-span-4'
      default:
        return 'col-span-2'
    }
  }

  return (
    <div className={`relative ${getGridSpan()}`}>
      {renderWidget()}
    </div>
  )
}

// ==========================================
// MAIN DASHBOARD GRID COMPONENT (SIMPLE VERSION)
// ==========================================
export function DashboardGrid({ onClientClick, onQuickAction }: DashboardGridProps) {
  const { theme } = useTheme()
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS)
  const [isEditing, setIsEditing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddWidget, setShowAddWidget] = useState(false)

  // Storage key for localStorage
  const STORAGE_KEY = 'dashboard-widgets-preferences'

  // Load preferences and data
  useEffect(() => {
    loadData()
    loadPreferences()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/dashboard')
      const dashboardData = await res.json()

      const processedData = {
        ...dashboardData,
        pendingPayments: dashboardData.pendingPayments || [],
        upcomingRenewals: [
          ...(dashboardData.renewals?.services || []).map((s: any) => ({
            id: s.id,
            clientId: s.clientId,
            client: s.client?.name || s.client?.company || 'Cliente',
            type: 'service',
            description: s.description || s.serviceType,
            renewalDate: s.renewalDate,
            price: s.monthlyPrice,
          })),
          ...(dashboardData.renewals?.domains || []).map((d: any) => ({
            id: d.id,
            clientId: d.clientId,
            client: d.client?.name || d.client?.company || 'Cliente',
            type: 'domain',
            description: d.domainName,
            renewalDate: d.renewalDate,
            price: d.cost,
          })),
          ...(dashboardData.renewals?.hosting || []).map((h: any) => ({
            id: h.id,
            clientId: h.clientId,
            client: h.client?.name || h.client?.company || 'Cliente',
            type: 'hosting',
            description: `${h.provider} - ${h.plan}`,
            renewalDate: h.renewalDate,
            price: h.monthlyCost,
          })),
        ].sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()),
        recentClients: dashboardData.clients?.recent || [],
        todayEvents: dashboardData.todayEvents || [],
        recentActivity: dashboardData.recentActivity || [],
        servicesCount: dashboardData.servicesDistribution?.reduce((acc: number, s: any) => acc + s.count, 0) || 0,
        domainsCount: dashboardData.renewals?.domains?.length || 0,
        hostingCount: dashboardData.renewals?.hosting?.length || 0,
        chart: dashboardData.chart || [],
        servicesDistribution: dashboardData.servicesDistribution || [],
        kpis: dashboardData.kpis || {},
      }

      setData(processedData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const prefs = JSON.parse(saved)
        if (prefs.layout && Array.isArray(prefs.layout) && prefs.layout.length > 0) {
          setWidgets(prefs.layout)
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const savePreferences = (newWidgets: WidgetConfig[]) => {
    setSaving(true)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout: newWidgets }))
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setTimeout(() => setSaving(false), 300)
    }
  }

  const resetPreferences = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setWidgets(DEFAULT_WIDGETS)
    } catch (error) {
      console.error('Error resetting preferences:', error)
    }
  }

  // Simple move functions - NO DRAG AND DROP
  const moveWidgetUp = (index: number) => {
    if (index === 0) return
    const newWidgets = [...widgets]
    const temp = newWidgets[index - 1]
    newWidgets[index - 1] = newWidgets[index]
    newWidgets[index] = temp
    setWidgets(newWidgets)
    savePreferences(newWidgets)
  }

  const moveWidgetDown = (index: number) => {
    if (index === widgets.length - 1) return
    const newWidgets = [...widgets]
    const temp = newWidgets[index + 1]
    newWidgets[index + 1] = newWidgets[index]
    newWidgets[index] = temp
    setWidgets(newWidgets)
    savePreferences(newWidgets)
  }

  const toggleWidgetVisibility = (widgetId: string) => {
    const newWidgets = widgets.map((w) =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    )
    setWidgets(newWidgets)
    savePreferences(newWidgets)
  }

  const addWidget = (widgetId: string) => {
    const widgetTemplate = AVAILABLE_WIDGETS.find((w) => w.id === widgetId)
    if (widgetTemplate && !widgets.find((w) => w.id === widgetId)) {
      const newWidget: WidgetConfig = {
        id: widgetTemplate.id,
        type: widgetTemplate.type as any,
        x: 0,
        y: widgets.length,
        w: widgetTemplate.defaultSize === 'large' ? 4 : 2,
        h: 2,
        visible: true,
        size: widgetTemplate.defaultSize as any,
      }
      const newWidgets = [...widgets, newWidget]
      setWidgets(newWidgets)
      savePreferences(newWidgets)
    }
    setShowAddWidget(false)
  }

  const removeWidget = (widgetId: string) => {
    const newWidgets = widgets.filter((w) => w.id !== widgetId)
    setWidgets(newWidgets)
    savePreferences(newWidgets)
  }

  const visibleWidgets = useMemo(() => widgets.filter((w) => w.visible), [widgets])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold">Dashboard Personalizable</h2>
          {saving && (
            <Badge variant="secondary" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Guardando...
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowAddWidget(true)} className="gap-1">
                <Plus className="h-4 w-4" />
                Añadir
              </Button>
              <Button variant="outline" size="sm" onClick={resetPreferences} className="gap-1">
                <RotateCcw className="h-4 w-4" />
                Resetear
              </Button>
            </>
          )}
          <Button
            variant={isEditing ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className={`gap-1 ${isEditing ? 'bg-brand hover:bg-brand-dark' : ''}`}
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4" />
                Listo
              </>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                Personalizar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Edit Mode Panel - REORDENAR CON BOTONES */}
      {isEditing && (
        <Card className="p-4 bg-muted/30 border-dashed">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-medium">Modo Edición - Usa los botones ↑↓ para reordenar</p>
            </div>
            
            {/* Widget List with Up/Down buttons */}
            <div className="space-y-2">
              {widgets.map((widget, index) => {
                const widgetInfo = AVAILABLE_WIDGETS.find((w) => w.id === widget.id)
                return (
                  <div
                    key={widget.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                      widget.visible ? 'bg-background border-border' : 'bg-muted/50 border-dashed opacity-60'
                    }`}
                  >
                    {/* Move buttons */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => moveWidgetUp(index)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => moveWidgetDown(index)}
                        disabled={index === widgets.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Drag handle icon */}
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    
                    {/* Widget info */}
                    <span className="text-sm">{widgetInfo?.icon}</span>
                    <span className={`text-sm font-medium flex-1 ${!widget.visible && 'text-muted-foreground line-through'}`}>
                      {widgetInfo?.name}
                    </span>
                    
                    {/* Position badge */}
                    <Badge variant="outline" className="text-xs">
                      Posición {index + 1}
                    </Badge>
                    
                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      title={widget.visible ? 'Ocultar' : 'Mostrar'}
                    >
                      {widget.visible ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:text-red-500"
                      onClick={() => removeWidget(widget.id)}
                      title="Eliminar"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Add Widget Modal */}
      {showAddWidget && (
        <Card className="p-4 bg-background border-2 border-dashed border-brand/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Añadir nuevo widget</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddWidget(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {AVAILABLE_WIDGETS.filter((w) => !widgets.find((existing) => existing.id === w.id)).map((widget) => (
                <Button
                  key={widget.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addWidget(widget.id)}
                  className="h-auto py-3 flex-col gap-1 hover:bg-brand/10 hover:border-brand"
                >
                  <span className="text-xl">{widget.icon}</span>
                  <span className="text-xs font-medium">{widget.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-fr">
        {visibleWidgets.map((widget) => (
          <WidgetRenderer
            key={widget.id}
            widget={widget}
            data={data}
            onClientClick={onClientClick}
            onQuickAction={onQuickAction}
            theme={theme}
          />
        ))}
      </div>

      {/* Empty State */}
      {visibleWidgets.length === 0 && !loading && (
        <Card className="p-8 bg-muted/30 border-dashed">
          <div className="text-center">
            <LayoutGrid className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No hay widgets visibles</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Haz clic en "Personalizar" para añadir widgets
            </p>
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Settings className="h-4 w-4" />
              Personalizar Dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
