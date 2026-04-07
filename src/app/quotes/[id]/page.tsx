'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, Loader2, Trash2, Calculator,
  ArrowRight, Save, FileText, Download
} from 'lucide-react'

interface Quote {
  id: string
  number: string
  status: string
  issueDate: string
  validUntil: string | null
  subtotal: number
  taxAmount: number
  total: number
  discount: number
  notes: string | null
  terms: string | null
  client: { 
    id: string
    name: string
    company: string
    email: string
    address: string | null
    taxId: string | null
  }
  items: QuoteItem[]
}

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
  SENT: { label: 'Enviada', color: 'bg-blue-100 text-blue-700' },
  VIEWED: { label: 'Vista', color: 'bg-cyan-100 text-cyan-700' },
  ACCEPTED: { label: 'Aceptada', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Expirada', color: 'bg-orange-100 text-orange-700' },
  CONVERTED: { label: 'Convertida', color: 'bg-purple-100 text-purple-700' }
}

export default function QuoteDetailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [discount, setDiscount] = useState(0)

  const quoteId = typeof window !== 'undefined' 
    ? window.location.pathname.split('/').pop() 
    : ''

  useEffect(() => {
    if (quoteId) fetchQuote()
  }, [quoteId])

  useEffect(() => {
    if (quote) {
      setItems(quote.items)
      setDiscount(quote.discount)
    }
  }, [quote])

  const fetchQuote = async () => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`)
      if (res.ok) {
        const data = await res.json()
        setQuote(data.quote)
      }
    } catch (error) {
      console.error('Error fetching quote:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateItemTotal = (item: QuoteItem) => {
    return Number(item.quantity) * Number(item.unitPrice)
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((acc, item) => acc + calculateItemTotal(item), 0)
    const discountVal = Number(discount) || 0
    const discountedSubtotal = subtotal - discountVal
    const taxAmount = discountedSubtotal * 0.21
    const total = discountedSubtotal + taxAmount
    return { subtotal, discount: discountVal, taxAmount, total }
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    setItems(prev => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }
      newItems[index].total = calculateItemTotal(newItems[index])
      return newItems
    })
  }

  const handleSave = async () => {
    if (!quote) return
    setSaving(true)
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate
          })),
          discount
        })
      })

      if (res.ok) {
        toast({ title: '✓ Cotización actualizada' })
        fetchQuote()
      } else {
        toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const convertToInvoice = async () => {
    if (!quote) return
    if (!confirm('¿Convertir esta cotización en factura?')) return

    setConverting(true)
    try {
      const res = await fetch(`/api/quotes/${quote.id}/convert`, {
        method: 'POST'
      })

      if (res.ok) {
        const data = await res.json()
        toast({ 
          title: '✓ Convertida a factura', 
          description: `Factura ${data.invoice.number} creada` 
        })
        router.push('/invoices')
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al convertir', variant: 'destructive' })
    } finally {
      setConverting(false)
    }
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

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="p-6 text-center">
        <p>Cotización no encontrada</p>
        <Button onClick={() => router.push('/quotes')} className="mt-4">
          Volver
        </Button>
      </div>
    )
  }

  const totals = calculateTotals()
  const canEdit = quote.status === 'DRAFT'
  const canConvert = ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED'].includes(quote.status)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/quotes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center gap-2">
          <Badge className={statusConfig[quote.status]?.color || ''}>
            {statusConfig[quote.status]?.label || quote.status}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{quote.number}</h1>
          <p className="text-muted-foreground mt-1">
            {quote.client.name} - {quote.client.company}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(quote.issueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Válida hasta</p>
                  <p className="font-medium">{quote.validUntil ? formatDate(quote.validUntil) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{quote.client.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NIF/CIF</p>
                  <p className="font-medium">{quote.client.taxId || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>
                        {canEdit ? (
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                          />
                        ) : (
                          item.description
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                          />
                        ) : (
                          formatCurrency(item.unitPrice)
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {(quote.notes || quote.terms) && (
            <Card>
              <CardHeader>
                <CardTitle>Notas y Condiciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quote.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas</p>
                    <p className="whitespace-pre-wrap">{quote.notes}</p>
                  </div>
                )}
                {quote.terms && (
                  <div>
                    <p className="text-sm text-muted-foreground">Condiciones</p>
                    <p className="whitespace-pre-wrap">{quote.terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Descuento</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  disabled={!canEdit}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Descuento</span>
                    <span>-{formatCurrency(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (21%)</span>
                  <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              {canEdit && (
                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Cambios
                </Button>
              )}
              {canConvert && (
                <Button variant="outline" className="w-full" onClick={convertToInvoice} disabled={converting}>
                  {converting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Convertir en Factura
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
