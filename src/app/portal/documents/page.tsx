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
  LogOut, Loader2, ArrowLeft, Download, File,
  Search, FileImage, FileSpreadsheet, FileType
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ClientUser {
  id: string
  email: string
  name: string
  client: { id: string; name: string; company: string }
}

interface Document {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  description: string | null
  category: string
  createdAt: string
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  contract: { label: 'Contrato', color: 'bg-blue-100 text-blue-700' },
  invoice: { label: 'Factura', color: 'bg-emerald-100 text-emerald-700' },
  nda: { label: 'NDA', color: 'bg-purple-100 text-purple-700' },
  proposal: { label: 'Propuesta', color: 'bg-amber-100 text-amber-700' },
  briefing: { label: 'Briefing', color: 'bg-cyan-100 text-cyan-700' },
  design: { label: 'Diseño', color: 'bg-pink-100 text-pink-700' },
  documentation: { label: 'Documentación', color: 'bg-orange-100 text-orange-700' },
  general: { label: 'General', color: 'bg-gray-100 text-gray-700' }
}

export default function PortalDocumentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<ClientUser | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
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

      const docsRes = await fetch('/api/portal/documents')
      if (docsRes.ok) {
        const data = await docsRes.json()
        setDocuments(data.documents || [])
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet
    if (mimeType.includes('pdf')) return FileType
    return File
  }

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Documentos</CardTitle>
                <CardDescription>Documentos compartidos contigo</CardDescription>
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
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay documentos disponibles</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Tamaño</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => {
                    const Icon = getFileIcon(doc.mimeType)
                    const catConfig = categoryConfig[doc.category] || categoryConfig.general
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{doc.originalName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={catConfig.color}>
                            {catConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(doc.size)}</TableCell>
                        <TableCell>{formatDate(doc.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`/api/files/${doc.id}`, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
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
