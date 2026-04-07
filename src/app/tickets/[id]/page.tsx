'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, Loader2, Send, User, Clock, CheckCircle,
  MessageCircle, AlertCircle
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
  closedAt: string | null
  client: { id: string; name: string; company: string; email: string; phone: string | null }
  clientUser: { id: string; name: string; email: string } | null
  assignedTo: { id: string; name: string } | null
  messages: TicketMessage[]
}

interface TicketMessage {
  id: string
  content: string
  authorId: string
  authorType: string
  createdAt: string
  isInternal: boolean
}

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Abierto', color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'En Progreso', color: 'bg-amber-100 text-amber-700' },
  WAITING_CLIENT: { label: 'Espera Cliente', color: 'bg-purple-100 text-purple-700' },
  WAITING_STAFF: { label: 'Espera Staff', color: 'bg-cyan-100 text-cyan-700' },
  RESOLVED: { label: 'Resuelto', color: 'bg-emerald-100 text-emerald-700' },
  CLOSED: { label: 'Cerrado', color: 'bg-gray-100 text-gray-500' }
}

export default function TicketDetailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)

  // Get ticket ID from URL
  const ticketId = typeof window !== 'undefined' 
    ? window.location.pathname.split('/').pop() 
    : ''

  useEffect(() => {
    if (ticketId) fetchTicket()
  }, [ticketId])

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`)
      if (res.ok) {
        const data = await res.json()
        setTicket(data.ticket)
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        const data = await res.json()
        setTicket(prev => prev ? { ...prev, status: data.ticket.status } : null)
        toast({ title: '✓ Estado actualizado' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !ticket) return

    setSending(true)
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage, isInternal })
      })

      if (res.ok) {
        const data = await res.json()
        setTicket(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.message],
          status: isInternal ? prev.status : 'WAITING_CLIENT'
        } : null)
        setNewMessage('')
        toast({ title: '✓ Mensaje enviado' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo enviar', variant: 'destructive' })
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
      return ticket?.clientUser?.name || 'Cliente'
    }
    return 'Soporte'
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="p-6 text-center">
        <p>Ticket no encontrado</p>
        <Button onClick={() => router.push('/tickets')} className="mt-4">
          Volver a tickets
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.push('/tickets')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a tickets
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{ticket.subject}</CardTitle>
                  <CardDescription className="mt-1">
                    {ticket.category} • Prioridad: {ticket.priority}
                  </CardDescription>
                </div>
                <Badge className={statusConfig[ticket.status]?.color || ''}>
                  {statusConfig[ticket.status]?.label || ticket.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Cliente</Label>
                <p className="font-medium">{ticket.client.name}</p>
                <p className="text-sm text-muted-foreground">{ticket.client.company}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-sm">{ticket.client.email}</p>
              </div>
              {ticket.client.phone && (
                <div>
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="text-sm">{ticket.client.phone}</p>
                </div>
              )}
              <Separator />
              <div>
                <Label className="text-muted-foreground">Creado</Label>
                <p className="text-sm">{formatDate(ticket.createdAt)}</p>
              </div>
              {ticket.assignedTo && (
                <div>
                  <Label className="text-muted-foreground">Asignado a</Label>
                  <p className="text-sm">{ticket.assignedTo.name}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Label>Cambiar Estado</Label>
              <Select value={ticket.status} onValueChange={updateStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Abierto</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="WAITING_CLIENT">Espera Cliente</SelectItem>
                  <SelectItem value="WAITING_STAFF">Espera Staff</SelectItem>
                  <SelectItem value="RESOLVED">Resuelto</SelectItem>
                  <SelectItem value="CLOSED">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </CardFooter>
          </Card>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversación
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-4">
              {ticket.messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex gap-3 ${message.authorType === 'CLIENT_USER' ? 'flex-row-reverse' : ''} ${message.isInternal ? 'opacity-70' : ''}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={message.authorType === 'CLIENT_USER' ? 'bg-violet-600' : 'bg-slate-600'}>
                      {getAuthorName(message).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 max-w-[80%] ${message.authorType === 'CLIENT_USER' ? 'text-right' : ''}`}>
                    {message.isInternal && (
                      <span className="text-xs text-amber-600 mb-1 block">Nota interna</span>
                    )}
                    <div className={`inline-block p-3 rounded-lg ${
                      message.authorType === 'CLIENT_USER' 
                        ? 'bg-violet-100 dark:bg-violet-900' 
                        : message.isInternal
                          ? 'bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700'
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
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="w-full space-y-3">
                <Textarea
                  placeholder="Escribe tu respuesta..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={isInternal} 
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    Nota interna (solo visible para el equipo)
                  </label>
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
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
