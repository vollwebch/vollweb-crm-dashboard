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
  LogOut, Loader2, ArrowLeft, Plus, Eye,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'

interface ClientUser {
  id: string
  email: string
  name: string
  client: { id: string; name: string; company: string }
}

interface Ticket {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  createdAt: string
  updatedAt: string
  assignedTo: { id: string; name: string } | null
  messages: { id: string }[]
  _count?: { messages: number }
}

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Abierto', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  IN_PROGRESS: { label: 'En Progreso', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  WAITING_CLIENT: { label: 'Espera Cliente', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  WAITING_STAFF: { label: 'Espera Staff', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' },
  RESOLVED: { label: 'Resuelto', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  CLOSED: { label: 'Cerrado', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' }
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Baja', color: 'text-gray-500' },
  MEDIUM: { label: 'Media', color: 'text-amber-500' },
  HIGH: { label: 'Alta', color: 'text-orange-500' },
  URGENT: { label: 'Urgente', color: 'text-red-500' }
}

export default function PortalTicketsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<ClientUser | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
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

      const ticketsRes = await fetch('/api/portal/tickets')
      if (ticketsRes.ok) {
        const data = await ticketsRes.json()
        setTickets(data.tickets || [])
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openTicketsCount = tickets.filter(t => 
    ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'WAITING_STAFF'].includes(t.status)
  ).length

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
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
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
            <Button variant="ghost" className="gap-2 rounded-none" onClick={() => router.push('/portal/services')}>
              <Wrench className="h-4 w-4" />
              Servicios
            </Button>
            <Button variant="ghost" className="gap-2 border-b-2 border-violet-600 text-violet-600 rounded-none">
              <MessageCircle className="h-4 w-4" />
              Soporte
              {openTicketsCount > 0 && (
                <Badge variant="secondary" className="ml-1">{openTicketsCount}</Badge>
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/portal/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button onClick={() => router.push('/portal/tickets/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ticket
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Mis Tickets de Soporte</CardTitle>
                <CardDescription>Gestiona tus consultas y solicitudes</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tickets..."
                  className="pl-10 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tienes tickets de soporte</p>
                <Button className="mt-4" onClick={() => router.push('/portal/tickets/new')}>
                  Crear primer ticket
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Asignado</TableHead>
                    <TableHead>Actualizado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {ticket.description.substring(0, 50)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[ticket.status]?.color || ''}>
                          {statusConfig[ticket.status]?.label || ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={priorityConfig[ticket.priority]?.color || ''}>
                          {priorityConfig[ticket.priority]?.label || ticket.priority}
                        </span>
                      </TableCell>
                      <TableCell>{ticket.assignedTo?.name || 'Sin asignar'}</TableCell>
                      <TableCell>{formatDate(ticket.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/portal/tickets/${ticket.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
