#!/bin/bash
# Script para iniciar el servidor de desarrollo con las variables de entorno correctas

export DATABASE_URL="postgresql://postgres.mgdrmsgpumouuuzzssxr:260415Jc.chocolate@aws-1-eu-central-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
export DIRECT_DATABASE_URL="postgresql://postgres.mgdrmsgpumouuuzzssxr:260415Jc.chocolate@aws-1-eu-central-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

echo "🚀 Iniciando Vollweb CRM..."
echo "📊 Base de datos: Supabase PostgreSQL"
echo "🌐 Servidor: http://localhost:3000"
echo ""

npm run dev
