'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, TrendingUp, TrendingDown, Calendar, Globe, Server, Wrench } from 'lucide-react'

interface StatsOverviewWidgetProps {
  data: {
    clients: { total: number; active: number; paused: number; cancelled: number }
    finances: { monthlyRevenue: number; monthlyCosts: number; monthlyProfit: number }
    services: number
    domains: number
    hosting: number
  }
}

export function StatsOverviewWidget({ data }: StatsOverviewWidgetProps) {
  const { clients, finances, services, domains, hosting } = data

  const stats = [
    {
      title: 'Clientes Activos',
      value: clients.active,
      subtitle: `de ${clients.total} total`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Ingresos Mensuales',
      value: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(finances.monthlyRevenue),
      subtitle: finances.monthlyProfit >= 0 ? 'Beneficio positivo' : 'Pérdida',
      icon: DollarSign,
      color: finances.monthlyProfit >= 0 ? 'text-emerald-500' : 'text-red-500',
      bgColor: finances.monthlyProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      trend: finances.monthlyProfit >= 0 ? 'up' : 'down',
    },
    {
      title: 'Servicios Activos',
      value: services,
      subtitle: `${domains} dominios, ${hosting} hosting`,
      icon: Wrench,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Beneficio Mensual',
      value: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(finances.monthlyProfit),
      subtitle: `${finances.monthlyCosts > 0 ? '-' + new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(finances.monthlyCosts) : 'Sin costes'}`,
      icon: finances.monthlyProfit >= 0 ? TrendingUp : TrendingDown,
      color: finances.monthlyProfit >= 0 ? 'text-emerald-500' : 'text-red-500',
      bgColor: finances.monthlyProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
