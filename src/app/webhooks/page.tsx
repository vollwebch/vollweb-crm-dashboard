'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  Webhook, Plus, Trash2, Edit, Play, Clock, CheckCircle, XCircle,
  Copy, ExternalLink, RefreshCw, History, Settings, ArrowLeft,
  Eye, EyeOff, AlertCircle, Check, X
} from 'lucide-react'

interface WebhookEvent {
  id: string
  name: string
  description: string
}

interface WebhookData {
  id: string
  name: string
  url: string
  secret: string | null
  events: string
  active: boolean
  description: string | null
  lastTriggeredAt: string | null
  failureCount: number
  createdAt: string
  _count?: { logs: number }
}

interface WebhookLog {
  id: string
  event: string
  payload: string
  responseStatus: number | null
  responseBody: string | null
  success: boolean
  error: string | null
  duration: number | null
  createdAt: string
}

const WEBHOOK_EVENTS: WebhookEvent[] = [
  { id: 'client.created', name: 'Cliente creado', description: 'Cuando se crea un nuevo cliente' },
  { id: 'client.updated', name: 'Cliente actualizado', description: 'Cuando se actualiza un cliente' },
  { id: 'client.deleted', name: 'Cliente eliminado', description: 'Cuando se elimina un cliente' },
  { id: 'invoice.created', name: 'Factura creada', description: 'Cuando se crea una nueva factura' },
  { id: 'invoice.sent', name: 'Factura enviada', description: 'Cuando se envía una factura' },
  { id: 'invoice.paid', name: 'Factura pagada', description: 'Cuando se marca una factura como pagada' },
  { id: 'invoice.cancelled', name: 'Factura cancelada', description: 'Cuando se cancela una factura' },
  { id: 'payment.received', name: 'Pago recibido', description: 'Cuando se recibe un pago' },
  { id: 'payment.failed', name: 'Pago fallido', description: 'Cuando falla un pago' },
  { id: 'alarm.triggered', name: 'Alarma activada', description: 'Cuando se activa una alarma' },
  { id: 'alarm.created', name: 'Alarma creada', description: 'Cuando se crea una alarma' },
  { id: 'service.created', name: 'Servicio creado', description: 'Cuando se crea un servicio' },
  { id: 'service.updated', name: 'Servicio actualizado', description: 'Cuando se actualiza un servicio' },
  { id: 'service.renewed', name: 'Servicio renovado', description: 'Cuando se renueva un servicio' },
  { id: 'domain.expiring', name: 'Dominio por expirar', description: 'Cuando un dominio está próximo a expirar' },
  { id: 'hosting.expiring', name: 'Hosting por expirar', description: 'Cuando un hosting está próximo a expirar' },
  { id: 'contract.ending', name: 'Contrato por terminar', description: 'Cuando un contrato está próximo a terminar' },
]

export default function WebhooksPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [webhooks, setWebhooks] = useState<WebhookData[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookData | null>(null)
  const [selectedWebhookLogs, setSelectedWebhookLogs] = useState<WebhookLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret: '',
    description: '',
    events: [] as string[],
    active: true
  })

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch('/api/webhooks')
      const data = await res.json()
      if (data.webhooks) {
        setWebhooks(data.webhooks)
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los webhooks',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchWebhooks()
  }, [fetchWebhooks])

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      secret: '',
      description: '',
      events: [],
      active: true
    })
    setEditingWebhook(null)
  }

  const handleOpenDialog = (webhook?: WebhookData) => {
    if (webhook) {
      setEditingWebhook(webhook)
      setFormData({
        name: webhook.name,
        url: webhook.url,
        secret: webhook.secret || '',
        description: webhook.description || '',
        events: webhook.events.split(','),
        active: webhook.active
      })
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    resetForm()
  }

  const handleToggleEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast({
        title: 'Error',
        description: 'Nombre, URL y al menos un evento son requeridos',
        variant: 'destructive'
      })
      return
    }

    try {
      const url = editingWebhook 
        ? `/api/webhooks/${editingWebhook.id}`
        : '/api/webhooks'
      
      const method = editingWebhook ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar webhook')
      }

      toast({
        title: editingWebhook ? 'Webhook actualizado' : 'Webhook creado',
        description: `El webhook ha sido ${editingWebhook ? 'actualizado' : 'creado'} correctamente`
      })

      handleCloseDialog()
      fetchWebhooks()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar webhook',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este webhook?')) return

    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
      
      if (!res.ok) throw new Error('Error al eliminar webhook')

      toast({
        title: 'Webhook eliminado',
        description: 'El webhook ha sido eliminado correctamente'
      })

      fetchWebhooks()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el webhook',
        variant: 'destructive'
      })
    }
  }

  const handleToggleActive = async (webhook: WebhookData) => {
    try {
      const res = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !webhook.active })
      })

      if (!res.ok) throw new Error('Error al actualizar webhook')

      toast({
        title: webhook.active ? 'Webhook desactivado' : 'Webhook activado',
        description: `El webhook ha sido ${webhook.active ? 'desactivado' : 'activado'}`
      })

      fetchWebhooks()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el webhook',
        variant: 'destructive'
      })
    }
  }

  const handleTest = async (webhook: WebhookData) => {
    setTestingWebhook(webhook.id)
    
    try {
      const res = await fetch(`/api/webhooks/${webhook.id}/test`, { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        toast({
          title: 'Test exitoso',
          description: `El webhook respondió con status ${data.responseStatus} en ${data.duration}ms`
        })
      } else {
        toast({
          title: 'Test fallido',
          description: data.error || `Error: HTTP ${data.responseStatus}`,
          variant: 'destructive'
        })
      }

      fetchWebhooks()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo probar el webhook',
        variant: 'destructive'
      })
    } finally {
      setTestingWebhook(null)
    }
  }

  const handleViewLogs = async (webhook: WebhookData) => {
    setSelectedWebhookLogs([])
    setLoadingLogs(true)
    setShowLogsDialog(true)

    try {
      const res = await fetch(`/api/webhooks/${webhook.id}`)
      const data = await res.json()
      
      if (data.webhook?.logs) {
        setSelectedWebhookLogs(data.webhook.logs)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los logs',
        variant: 'destructive'
      })
    } finally {
      setLoadingLogs(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca'
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventLabel = (eventId: string) => {
    const event = WEBHOOK_EVENTS.find(e => e.id === eventId)
    return event?.name || eventId
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado',
      description: 'Copiado al portapapeles'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-brand" />
          <p className="text-muted-foreground">Cargando webhooks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Webhook className="h-6 w-6 text-brand" />
                <h1 className="text-xl font-bold">Webhooks</h1>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Webhook
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {webhooks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Webhook className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No hay webhooks configurados</h2>
              <p className="text-muted-foreground mb-6">
                Los webhooks permiten integrar tu CRM con sistemas externos
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {webhooks.map(webhook => (
              <Card key={webhook.id} className={!webhook.active ? 'opacity-60' : ''}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {webhook.name}
                        {webhook.failureCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {webhook.failureCount} fallos
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {webhook.url}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(webhook.url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <a 
                          href={webhook.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-brand hover:text-brand-dark"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.active}
                        onCheckedChange={() => handleToggleActive(webhook)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(webhook)}
                        disabled={testingWebhook === webhook.id}
                      >
                        {testingWebhook === webhook.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewLogs(webhook)}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(webhook)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.split(',').map(event => (
                      <Badge key={event} variant="secondary" className="text-xs">
                        {getEventLabel(event)}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Último trigger: {formatDate(webhook.lastTriggeredAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <History className="h-4 w-4" />
                      <span>{webhook._count?.logs || 0} logs</span>
                    </div>
                    {webhook.secret && (
                      <Badge variant="outline" className="text-xs">
                        Secreto configurado
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-brand" />
              ¿Cómo funcionan los webhooks?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Los webhooks permiten que tu CRM envíe datos a sistemas externos cuando ocurren eventos específicos.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Payload enviado</h4>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`{
  "id": "wh_1234567890_abc",
  "event": "client.created",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": { ... },
  "triggeredBy": {
    "id": "user_id",
    "name": "Juan",
    "email": "juan@empresa.com"
  }
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Headers incluidos</h4>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`Content-Type: application/json
X-Webhook-Event: client.created
X-Webhook-Timestamp: 2025-01-15T10:30:00Z
X-Webhook-ID: wh_1234567890_abc
X-Webhook-Signature: sha256=...`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? 'Editar Webhook' : 'Nuevo Webhook'}
            </DialogTitle>
            <DialogDescription>
              Configura un endpoint para recibir notificaciones de eventos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Mi integración"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL del endpoint *</Label>
                <Input
                  id="url"
                  placeholder="https://tu-servidor.com/webhook"
                  value={formData.url}
                  onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">Secreto (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="secret"
                    type={showSecret ? 'text' : 'password'}
                    placeholder="Se usará para firmar los webhooks"
                    value={formData.secret}
                    onChange={e => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Si se configura, se enviará una firma HMAC-SHA256 en el header X-Webhook-Signature
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe esta integración..."
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Events Selection */}
            <div className="space-y-4">
              <Label>Eventos a escuchar *</Label>
              <p className="text-sm text-muted-foreground">
                Selecciona los eventos que activarán este webhook
              </p>
              <div className="grid grid-cols-2 gap-3">
                {WEBHOOK_EVENTS.map(event => (
                  <div
                    key={event.id}
                    className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.events.includes(event.id)
                        ? 'border-brand bg-brand/5'
                        : 'border-border hover:border-brand/50'
                    }`}
                    onClick={() => handleToggleEvent(event.id)}
                  >
                    <Checkbox
                      checked={formData.events.includes(event.id)}
                      onCheckedChange={() => handleToggleEvent(event.id)}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Webhook activo</Label>
                <p className="text-sm text-muted-foreground">
                  Los webhooks inactivos no recibirán eventos
                </p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingWebhook ? 'Guardar cambios' : 'Crear webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de envíos
            </DialogTitle>
            <DialogDescription>
              Últimos 50 envíos de este webhook
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh]">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : selectedWebhookLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay logs disponibles
              </div>
            ) : (
              <div className="space-y-4">
                {selectedWebhookLogs.map(log => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${
                      log.success ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {getEventLabel(log.event)}
                        </Badge>
                        {log.responseStatus && (
                          <Badge variant={log.success ? 'default' : 'destructive'} className="text-xs">
                            HTTP {log.responseStatus}
                          </Badge>
                        )}
                        {log.duration && (
                          <span className="text-xs text-muted-foreground">
                            {log.duration}ms
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    
                    {log.error && (
                      <p className="text-sm text-red-500 mb-2">{log.error}</p>
                    )}
                    
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver payload
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto max-h-40">
                        {JSON.stringify(JSON.parse(log.payload), null, 2)}
                      </pre>
                    </details>
                    
                    {log.responseBody && (
                      <details className="text-xs mt-2">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Ver respuesta
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto max-h-40">
                          {log.responseBody}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
