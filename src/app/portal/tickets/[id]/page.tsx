'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  LayoutDashboard, FileText, Wrench, MessageCircle, 
  LogOut, Loader2, ArrowLeft, Send, Paperclip
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface ClientUser {
  id: string
  email: string
  name: string
  client: { id: string; name: string; company: string }
}

interface TicketMessage {
  id: string
  content: string
  authorId: string
  authorType: string
  createdAt: string
  isInternal: boolean
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
  messages: TicketMessage[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Abierto', color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'En Progreso', color: 'bg-amber-100 text-amber-700' },
  WAITING_CLIENT: { label: 'Espera Cliente', color: 'bg-purple-100 text-purple-700' },
  WAITING_STAFF: { label: 'Espera Staff', color: 'bg-cyan-100 text-cyan-700' },
  RESOLVED: { label: 'Resuelto', color: 'bg-emerald-100 text-emerald-700' },
  CLOSED: { label: 'Cerrado', color: 'bg-gray-100 text-gray-500' }
}

export default function PortalTicketDetailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<ClientUser | null>(null)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useState<HTMLDivElement>(null)

  // Get ticket ID from URL
  const ticketId = typeof window !== 'undefined' 
    ? window.location.pathname.split('/').pop() 
    : ''

  useEffect(() => {
    fetchData()
  }, [ticketId])

  const fetchData = async () => {
    if (!ticketId) return
    
    try {
      const userRes = await fetch('/api/portal/auth/me')
      if (!userRes.ok) {
        router.push('/portal/login')
        return
      }
      const userData = await userRes.json()
      setUser(userData.user)

      const ticketRes = await fetch(`/api/portal/tickets/${ticketId}`)
      if (ticketRes.ok) {
        const data = await ticketRes.json()
        setTicket(data.ticket)
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !ticket) return

    setSending(true)
    try {
      const res = await fetch(`/api/portal/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      })

      if (res.ok) {
        const data = await res.json()
        setTicket(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.message],
          status: 'WAITING_STAFF'
        } : null)
        setNewMessage('')
        toast({ title: '✓ Mensaje enviado' })
      } else {
        toast({ title: 'Error', description: 'No se pudo enviar el mensaje', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAuthorName = (message: TicketMessage) => {
    if (message.authorType === 'CLIENT_USER') {
      return user?.name || 'Cliente'
    }
    return 'Soporte'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Ticket no encontrado</p>
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
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => router.push('/portal/tickets')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a tickets
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{ticket.subject}</CardTitle>
                <CardDescription className="mt-1">
                  Creado el {formatDate(ticket.createdAt)}
                  {ticket.assignedTo && ` • Asignado a ${ticket.assignedTo.name}`}
                </CardDescription>
              </div>
              <Badge className={statusConfig[ticket.status]?.color || ''}>
                {statusConfig[ticket.status]?.label || ticket.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.messages.map((message) => (
              <div 
                key={message.id}
                className={`flex gap-3 ${message.authorType === 'CLIENT_USER' ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={message.authorType === 'CLIENT_USER' ? 'bg-violet-600' : 'bg-slate-600'}>
                    {getAuthorName(message).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 max-w-[80%] ${message.authorType === 'CLIENT_USER' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-3 rounded-lg ${
                    message.authorType === 'CLIENT_USER' 
                      ? 'bg-violet-100 dark:bg-violet-900' 
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getAuthorName(message)} • {formatDate(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef as any} />
          </CardContent>
        </Card>

        {/* Reply Form */}
        {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Textarea
                  placeholder="Escribe tu respuesta..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
