'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  LayoutDashboard, FileText, Wrench, MessageCircle, 
  LogOut, Loader2, DollarSign, Clock, CheckCircle, 
  AlertCircle, Ticket, Settings, ExternalLink
} from 'lucide-react'

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

interface Stats {
  invoices: number
  pendingInvoices: number
  paidInvoices: number
  services: number
  activeServices: number
  tickets: number
  openTickets: number
  totalRevenue: number
  pendingAmount: number
}

export default function PortalDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<ClientUser | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get user
      const userRes = await fetch('/api/portal/auth/me')
      if (!userRes.ok) {
        router.push('/portal/login')
        return
      }
      const userData = await userRes.json()
      setUser(userData.user)

      // Get stats
      const statsRes = await fetch('/api/portal/dashboard')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      router.push('/portal/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/portal/auth/logout', { method: 'POST' })
      router.push('/portal/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0)
  }

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
            <span className="text-sm text-muted-foreground hidden sm:block">
              Hola, {user?.name}
            </span>
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
            <Button 
              variant="ghost" 
              className="gap-2 border-b-2 border-violet-600 text-violet-600 rounded-none"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button 
              variant="ghost" 
              className="gap-2 rounded-none"
              onClick={() => router.push('/portal/invoices')}
            >
              <FileText className="h-4 w-4" />
              Facturas
            </Button>
            <Button 
              variant="ghost" 
              className="gap-2 rounded-none"
              onClick={() => router.push('/portal/services')}
            >
              <Wrench className="h-4 w-4" />
              Servicios
            </Button>
            <Button 
              variant="ghost" 
              className="gap-2 rounded-none"
              onClick={() => router.push('/portal/tickets')}
            >
              <MessageCircle className="h-4 w-4" />
              Soporte
              {stats && stats.openTickets > 0 && (
                <Badge variant="secondary" className="ml-1">{stats.openTickets}</Badge>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className="gap-2 rounded-none"
              onClick={() => router.push('/portal/documents')}
            >
              <FileText className="h-4 w-4" />
              Documentos
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-r from-violet-600 to-violet-700 text-white border-0">
          <CardHeader>
            <CardTitle className="text-2xl">¡Bienvenido, {user?.name}!</CardTitle>
            <CardDescription className="text-violet-100">
              Gestiona tus facturas, servicios y tickets de soporte desde este portal.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/portal/invoices')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Facturas</p>
                  <p className="text-3xl font-bold">{stats?.invoices || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/portal/invoices')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendiente de Pago</p>
                  <p className="text-3xl font-bold text-amber-600">{formatCurrency(stats?.pendingAmount)}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/portal/services')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Servicios Activos</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats?.activeServices || 0}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/portal/tickets')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tickets Abiertos</p>
                  <p className="text-3xl font-bold">{stats?.openTickets || 0}</p>
                </div>
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900 rounded-lg flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push('/portal/invoices')}
              >
                <FileText className="h-6 w-6" />
                <span>Ver Facturas</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push('/portal/services')}
              >
                <Wrench className="h-6 w-6" />
                <span>Mis Servicios</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push('/portal/tickets/new')}
              >
                <MessageCircle className="h-6 w-6" />
                <span>Nuevo Ticket</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push('/portal/documents')}
              >
                <ExternalLink className="h-6 w-6" />
                <span>Documentos</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
