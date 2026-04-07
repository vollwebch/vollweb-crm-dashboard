'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, Search, Eye, Ticket, Loader2, ArrowUpDown,
  User, Clock, AlertCircle
} from 'lucide-react'

interface Ticket {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  createdAt: string
  updatedAt: string
  client: { id: string; name: string; company: string; email: string }
  clientUser: { id: string; name: string; email: string } | null
  assignedTo: { id: string; name: string } | null
  messages: { id: string }[]
  _count: { messages: number }
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
  URGENT: { label: 'Urgente', color: 'text-red-500 font-bold' }
}

export default function TicketsAdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      const res = await fetch(`/api/tickets?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.client.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openCount = tickets.filter(t => 
    ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'WAITING_STAFF'].includes(t.status)
  ).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ticket className="h-8 w-8" />
            Tickets de Soporte
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las consultas y solicitudes de tus clientes
          </p>
        </div>
        <Button onClick={() => router.push('/tickets/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abiertos</p>
                <p className="text-2xl font-bold text-blue-600">{openCount}</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">
                  {tickets.filter(t => t.priority === 'URGENT' && !['CLOSED', 'RESOLVED'].includes(t.status)).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Esperando Cliente</p>
                <p className="text-2xl font-bold text-purple-600">
                  {tickets.filter(t => t.status === 'WAITING_CLIENT').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tickets..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="OPEN">Abierto</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="WAITING_CLIENT">Espera Cliente</SelectItem>
                <SelectItem value="WAITING_STAFF">Espera Staff</SelectItem>
                <SelectItem value="RESOLVED">Resuelto</SelectItem>
                <SelectItem value="CLOSED">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay tickets</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
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
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/tickets/${ticket.id}`)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.client.name}</p>
                        <p className="text-sm text-muted-foreground">{ticket.client.company}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground">{ticket._count?.messages || 0} mensajes</p>
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
                    <TableCell>{ticket.assignedTo?.name || '-'}</TableCell>
                    <TableCell>{formatDate(ticket.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/tickets/${ticket.id}`)
                      }}>
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
    </div>
  )
}
