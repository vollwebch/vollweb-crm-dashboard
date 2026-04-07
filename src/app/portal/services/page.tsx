'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { 
  LayoutDashboard, FileText, Wrench, MessageCircle, 
  LogOut, Loader2, ArrowLeft, Globe, Server, 
  Search, Mail, Settings
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ClientUser {
  id: string
  email: string
  name: string
  client: {
    id: string
    name: string
    company: string
  }
}

interface Service {
  id: string
  serviceType: string
  description: string | null
  startDate: string
  renewalDate: string | null
  monthlyPrice: number
  annualPrice: number | null
  status: string
}

const serviceTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  WEB: { label: 'Web', icon: Globe, color: 'text-blue-600' },
  HOSTING: { label: 'Hosting', icon: Server, color: 'text-emerald-600' },
  MAINTENANCE: { label: 'Mantenimiento', icon: Settings, color: 'text-amber-600' },
  SEO: { label: 'SEO', icon: Search, color: 'text-purple-600' },
  DOMAIN: { label: 'Dominio', icon: Globe, color: 'text-cyan-600' },
  EMAIL: { label: 'Email', icon: Mail, color: 'text-pink-600' },
  OTHER: { label: 'Otro', icon: Settings, color: 'text-gray-600' }
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Activo', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  PAUSED: { label: 'Pausado', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' }
}

export default function PortalServicesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<ClientUser | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/portal/auth/me')
      if (!userRes.ok) {
        router.push('/portal/login')
        return
      }
      const userData = await userRes.json()
      setUser(userData.user)

      const servicesRes = await fetch('/api/portal/services')
      if (servicesRes.ok) {
        const data = await servicesRes.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/portal/auth/logout', { method: 'POST' })
    router.push('/portal/login')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const filteredServices = services.filter(service => {
    const typeLabel = serviceTypeConfig[service.serviceType]?.label || service.serviceType
    return typeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (service.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const totalMonthly = services
    .filter(s => s.status === 'ACTIVE')
    .reduce((acc, s) => acc + (s.monthlyPrice || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-700 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Portal de Clientes</h1>
              <p className="text-sm text-muted-foreground">{user?.client?.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <Button variant="ghost" className="gap-2 rounded-none" onClick={() => router.push('/portal/dashboard')}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="gap-2 rounded-none" onClick={() => router.push('/portal/invoices')}>
              <FileText className="h-4 w-4" />
              Facturas
            </Button>
            <Button variant="ghost" className="gap-2 border-b-2 border-violet-600 text-violet-600 rounded-none">
              <Wrench className="h-4 w-4" />
              Servicios
            </Button>
            <Button variant="ghost" className="gap-2 rounded-none" onClick={() => router.push('/portal/tickets')}>
              <MessageCircle className="h-4 w-4" />
              Soporte
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/portal/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Summary Card */}
        <Card className="mb-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Total mensual de servicios activos</p>
                <p className="text-3xl font-bold">{formatCurrency(totalMonthly)}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-sm">Servicios activos</p>
                <p className="text-2xl font-bold">{services.filter(s => s.status === 'ACTIVE').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Mis Servicios</CardTitle>
                <CardDescription>Consulta todos tus servicios contratados</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-10 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay servicios disponibles</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Renovación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Precio Mensual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => {
                    const config = serviceTypeConfig[service.serviceType] || serviceTypeConfig.OTHER
                    const Icon = config.icon
                    return (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <span>{config.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>{service.description || '-'}</TableCell>
                        <TableCell>{formatDate(service.startDate)}</TableCell>
                        <TableCell>{service.renewalDate ? formatDate(service.renewalDate) : '-'}</TableCell>
                        <TableCell>
                          <Badge className={statusConfig[service.status]?.color || ''}>
                            {statusConfig[service.status]?.label || service.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(service.monthlyPrice)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
