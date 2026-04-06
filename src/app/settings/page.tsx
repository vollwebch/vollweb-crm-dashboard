'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, Building2, Users, UserPlus, Edit, Trash2, Eye, EyeOff,
  Shield, ShieldCheck, ShieldAlert, Save, Loader2, AlertTriangle, Lock, LockOpen
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  permissions: UserPermissions
  createdAt: string
  updatedAt: string
}

interface UserPermissions {
  clients: boolean
  services: boolean
  hosting: boolean
  domains: boolean
  payments: boolean
  invoices: boolean
  alarms: boolean
  reminders: boolean
  trash: boolean
  audit: boolean
  stats: boolean
  config: boolean
}

interface Company {
  id: string
  name: string
  createdAt: string
  usersCount: number
  clientsCount: number
}

interface CurrentUser {
  id: string
  name: string
  email: string
  role: string
  permissions: UserPermissions
  companyId: string
  company: { id: string; name: string }
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  clients: true,
  services: true,
  hosting: true,
  domains: true,
  payments: true,
  invoices: true,
  alarms: true,
  reminders: true,
  trash: true,
  audit: true,
  stats: true,
  config: true
}

const PERMISSION_LABELS: Record<keyof UserPermissions, { label: string; description: string; icon: any }> = {
  clients: { label: 'Clientes', description: 'Ver y gestionar clientes', icon: Users },
  services: { label: 'Servicios', description: 'Ver y gestionar servicios', icon: Shield },
  hosting: { label: 'Hosting', description: 'Ver y gestionar hosting', icon: Building2 },
  domains: { label: 'Dominios', description: 'Ver y gestionar dominios', icon: ShieldCheck },
  payments: { label: 'Pagos', description: 'Ver y gestionar pagos', icon: Shield },
  invoices: { label: 'Facturas', description: 'Ver y gestionar facturas', icon: Shield },
  alarms: { label: 'Alarmas', description: 'Ver y gestionar alarmas', icon: AlertTriangle },
  reminders: { label: 'Recordatorios', description: 'Ver y gestionar recordatorios', icon: Shield },
  trash: { label: 'Papelera', description: 'Ver y gestionar papelera', icon: Trash2 },
  audit: { label: 'Auditoría', description: 'Ver historial de cambios', icon: Shield },
  stats: { label: 'Estadísticas', description: 'Ver estadísticas', icon: Shield },
  config: { label: 'Configuración', description: 'Ver y cambiar configuración', icon: Shield }
}

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Company form
  const [companyName, setCompanyName] = useState('')
  
  // Employee form
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false)
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false)
  const [showDeleteEmployeeDialog, setShowDeleteEmployeeDialog] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [editingPermissions, setEditingPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data.user)
        // Fetch company and users after getting current user
        await Promise.all([fetchCompany(), fetchUsers()])
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/company')
      if (res.ok) {
        const data = await res.json()
        setCompany(data.company)
        setCompanyName(data.company.name)
      }
    } catch (error) {
      console.error('Error fetching company:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSaveCompanyName = async () => {
    if (!companyName.trim()) {
      toast({ title: 'Error', description: 'El nombre de la empresa es requerido', variant: 'destructive' })
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName.trim() })
      })
      
      if (res.ok) {
        const data = await res.json()
        setCompany(data.company)
        toast({ title: '✓ Guardado', description: 'Nombre de empresa actualizado correctamente' })
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'No se pudo guardar', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al guardar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddEmployee = async () => {
    if (!employeeForm.name || !employeeForm.email || !employeeForm.password) {
      toast({ title: 'Error', description: 'Todos los campos son obligatorios', variant: 'destructive' })
      return
    }
    
    if (employeeForm.password.length < 6) {
      toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' })
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/auth/register-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeForm)
      })
      
      if (res.ok) {
        toast({ title: '✓ Empleado creado', description: `${employeeForm.name} ha sido añadido al equipo` })
        setShowAddEmployeeDialog(false)
        setEmployeeForm({ name: '', email: '', password: '', role: 'USER' })
        fetchUsers()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'No se pudo crear el empleado', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al crear empleado', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleEditEmployee = async () => {
    if (!selectedUser) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          name: employeeForm.name,
          role: employeeForm.role
        })
      })
      
      if (res.ok) {
        toast({ title: '✓ Actualizado', description: 'Empleado actualizado correctamente' })
        setShowEditEmployeeDialog(false)
        setSelectedUser(null)
        setEmployeeForm({ name: '', email: '', password: '', role: 'USER' })
        fetchUsers()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'No se pudo actualizar', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al actualizar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!selectedUser) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/users?id=${selectedUser.id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        toast({ title: '✓ Eliminado', description: 'Empleado eliminado correctamente' })
        setShowDeleteEmployeeDialog(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'No se pudo eliminar', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al eliminar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          permissions: editingPermissions
        })
      })
      
      if (res.ok) {
        toast({ title: '✓ Permisos actualizados', description: `Permisos de ${selectedUser.name} actualizados` })
        setShowPermissionsDialog(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'No se pudo actualizar permisos', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al actualizar permisos', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEmployeeForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    })
    setShowEditEmployeeDialog(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setShowDeleteEmployeeDialog(true)
  }

  const openPermissionsDialog = (user: User) => {
    setSelectedUser(user)
    setEditingPermissions(user.permissions || DEFAULT_PERMISSIONS)
    setShowPermissionsDialog(true)
  }

  const togglePermission = (key: keyof UserPermissions) => {
    setEditingPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const toggleAllPermissions = (value: boolean) => {
    setEditingPermissions({
      clients: value,
      services: value,
      hosting: value,
      domains: value,
      payments: value,
      invoices: value,
      alarms: value,
      reminders: value,
      trash: value,
      audit: value,
      stats: value,
      config: value
    })
  }

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <Badge className="bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-light border-brand/20 dark:border-brand/30">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Administrador
        </Badge>
      )
    }
    return (
      <Badge className="bg-muted text-muted-foreground border-border">
        <Shield className="h-3 w-3 mr-1" />
        Usuario
      </Badge>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getBlockedPermissionsCount = (permissions: UserPermissions) => {
    if (!permissions) return 0
    return Object.values(permissions).filter(v => !v).length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-page-brand">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background bg-page-brand">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground">Gestiona tu empresa y empleados</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Company Settings */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 icon-container-brand rounded-lg">
                  <Building2 className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <CardTitle>Empresa</CardTitle>
                  <CardDescription>Información de tu empresa</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <div className="flex gap-2">
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nombre de tu empresa"
                    disabled={currentUser?.role !== 'ADMIN'}
                  />
                  {currentUser?.role === 'ADMIN' && (
                    <Button 
                      onClick={handleSaveCompanyName}
                      disabled={saving || companyName === company?.name}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              {company && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Empleados</p>
                    <p className="text-2xl font-bold text-foreground">{company.usersCount}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Clientes</p>
                    <p className="text-2xl font-bold text-foreground">{company.clientsCount}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Creada</p>
                    <p className="text-lg font-semibold text-foreground">
                      {new Date(company.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              )}
              
              {currentUser?.role !== 'ADMIN' && (
                <p className="text-sm text-amber-600 dark:text-amber-500 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Solo administradores pueden editar el nombre de la empresa
                </p>
              )}
            </CardContent>
          </Card>

          {/* Employees */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 icon-container-brand rounded-lg">
                    <Users className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <CardTitle>Empleados</CardTitle>
                    <CardDescription>Gestiona los usuarios y permisos de tu empresa</CardDescription>
                  </div>
                </div>
                {currentUser?.role === 'ADMIN' && (
                  <Button onClick={() => setShowAddEmployeeDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Añadir Empleado
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No hay empleados registrados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Permisos</TableHead>
                      <TableHead>Creado</TableHead>
                      {currentUser?.role === 'ADMIN' && <TableHead className="text-right">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const blockedCount = getBlockedPermissionsCount(user.permissions)
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-light text-xs font-medium">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.name}</span>
                              {user.id === currentUser?.id && (
                                <Badge variant="outline" className="text-xs">
                                  Tú
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            {user.role === 'ADMIN' ? (
                              <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                                <LockOpen className="h-3 w-3 mr-1" />
                                Acceso total
                              </Badge>
                            ) : blockedCount > 0 ? (
                              <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 cursor-pointer" onClick={() => openPermissionsDialog(user)}>
                                <Lock className="h-3 w-3 mr-1" />
                                {blockedCount} bloqueado{blockedCount > 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                                <LockOpen className="h-3 w-3 mr-1" />
                                Acceso total
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString('es-ES')}
                          </TableCell>
                          {currentUser?.role === 'ADMIN' && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {user.role !== 'ADMIN' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openPermissionsDialog(user)}
                                    title="Editar permisos"
                                  >
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(user)}
                                  disabled={user.id === currentUser?.id}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteDialog(user)}
                                  disabled={user.id === currentUser?.id}
                                  className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
              
              {currentUser?.role !== 'ADMIN' && (
                <p className="text-sm text-amber-600 flex items-center gap-2 mt-4">
                  <ShieldAlert className="h-4 w-4" />
                  Solo administradores pueden gestionar empleados
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={showAddEmployeeDialog} onOpenChange={setShowAddEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Empleado</DialogTitle>
            <DialogDescription>
              Crea un nuevo usuario para tu empresa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employeeName">Nombre completo</Label>
              <Input
                id="employeeName"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeEmail">Email</Label>
              <Input
                id="employeeEmail"
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                placeholder="juan@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeePassword">Contraseña</Label>
              <div className="relative">
                <Input
                  id="employeePassword"
                  type={showPassword ? 'text' : 'password'}
                  value={employeeForm.password}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeRole">Rol</Label>
              <Select
                value={employeeForm.role}
                onValueChange={(value) => setEmployeeForm({ ...employeeForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuario</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEmployeeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddEmployee} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Crear Empleado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={showEditEmployeeDialog} onOpenChange={setShowEditEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
            <DialogDescription>
              Modifica los datos del empleado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Nombre</Label>
              <Input
                id="editName"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                value={employeeForm.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Rol</Label>
              <Select
                value={employeeForm.role}
                onValueChange={(value) => setEmployeeForm({ ...employeeForm, role: value })}
                disabled={selectedUser?.id === currentUser?.id}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuario</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
              {selectedUser?.id === currentUser?.id && (
                <p className="text-xs text-amber-600">No puedes cambiar tu propio rol</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEmployeeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditEmployee} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-brand" />
              Permisos de {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Controla qué secciones puede acceder este empleado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Quick actions */}
            <div className="flex gap-2 mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toggleAllPermissions(true)}
              >
                <LockOpen className="h-4 w-4 mr-2" />
                Permitir todo
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toggleAllPermissions(false)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Bloquear todo
              </Button>
            </div>
            
            {/* Permissions list */}
            <div className="grid gap-3">
              {(Object.keys(PERMISSION_LABELS) as Array<keyof UserPermissions>).map((key) => {
                const { label, description, icon: Icon } = PERMISSION_LABELS[key]
                const isAllowed = editingPermissions[key]
                
                return (
                  <div 
                    key={key}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isAllowed 
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' 
                        : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isAllowed ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                        <Icon className={`h-4 w-4 ${isAllowed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{label}</p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isAllowed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isAllowed ? 'Permitido' : 'Bloqueado'}
                      </span>
                      <Switch
                        checked={isAllowed}
                        onCheckedChange={() => togglePermission(key)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar Permisos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Employee Dialog */}
      <Dialog open={showDeleteEmployeeDialog} onOpenChange={setShowDeleteEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Eliminar Empleado
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar a <strong>{selectedUser?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Esta acción no se puede deshacer. El empleado perderá acceso inmediatamente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteEmployeeDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteEmployee} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
