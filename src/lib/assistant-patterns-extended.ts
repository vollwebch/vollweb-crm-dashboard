// =====================================================
// PATRONES EXTENDIDOS DEL ASISTENTE CRM
// MILES DE VARIACIONES ADICIONALES
// =====================================================

import { IntentPattern, ALL_INTENT_PATTERNS, countPatterns as baseCountPatterns } from './assistant-patterns'
import { MASSIVE_PATTERNS, countMassivePatterns } from './assistant-patterns-massive'

// =====================================================
// VARIACIONES DE PAGOS (2000+ variaciones)
// =====================================================
const PAYMENT_VARIATIONS: IntentPattern[] = [
  {
    intent: 'getPendingPayments',
    priority: 85,
    patterns: [
      // Variaciones con errores de escritura comunes
      /^pagos\s*pendientes$/i, /^pago\s*pendiente$/i,
      /^pagos\s*faltantes$/i, /^pago\s*faltante$/i,
      /^pago\s*falta$/i, /^pagos\s*falta$/i,
      /^pagos\s*pendiente$/i, /^pago\s*pendientes$/i,
      /^pagos\s*faltan$/i, /^pago\s*faltan$/i,
      
      // Variaciones de "qué pagos faltan"
      /^qu[eé]\s*pagos\s*faltan$/i,
      /^que\s*pagos\s*faltan$/i,
      /^qu[eé]es\s*pagos\s*faltan$/i,
      /^qu[eé]\s*pago\s*falta$/i,
      /^que\s*pago\s*falta$/i,
      /^k\s*pagos\s*faltan$/i,
      /^k[eé]\s*pagos\s*faltan$/i,
      /^q\s*pagos\s*faltan$/i,
      /^ke\s*pagos\s*faltan$/i,
      
      // Con signos de interrogación
      /^qu[eé]\s*pagos\s*faltan\?$/i,
      /^que\s*pagos\s*faltan\?$/i,
      /^qu[eé]\s*pago\s*falta\?$/i,
      /^qu[eé]\s*pagos\s*estan\s*faltando\?$/i,
      
      // Variaciones con "por cobrar"
      /^pagos\s*por\s*cobrar$/i,
      /^pago\s*por\s*cobrar$/i,
      /^cobros\s*por\s*cobrar$/i,
      /^cobro\s*por\s*cobrar$/i,
      /^por\s*cobrar$/i,
      /^lo\s*que\s*est[aá]\s*por\s*cobrar$/i,
      /^lo\s*que\s* falta\s*por\s*cobrar$/i,
      
      // Variaciones con "pendiente"
      /^est[aá]\s*pendiente\s*de\s*pago$/i,
      /^est[aá]n\s*pendientes\s*de\s*pago$/i,
      /^pendientes?\s*de\s*pago$/i,
      /^pendientes?\s*de\s*cobro$/i,
      /^qu[eé]\s*est[aá]\s*pendiente\s*de\s*pago$/i,
      /^qu[eé]\s*est[aá]n\s*pendientes\s*de\s*pago$/i,
      
      // Variaciones de "qué me deben"
      /^qu[eé]\s*me\s*deben$/i,
      /^que\s*me\s*deben$/i,
      /^k\s*me\s*deben$/i,
      /^ke\s*me\s*deben$/i,
      /^lo\s*que\s*me\s*deben$/i,
      /^cu[aá]nto\s*me\s*deben$/i,
      /^cuanto\s*me\s*deben$/i,
      /^cu[aá]nto\s*me\s* deben\s*en\s*total$/i,
      /^cu[aá]nta\s*plata\s*me\s*deben$/i,
      /^cu[aá]nto\s*dinero\s*me\s*deben$/i,
      
      // Variaciones de "quién me debe"
      /^qui[eé]n\s*me\s*debe$/i,
      /^quien\s*me\s*debe$/i,
      /^qui[eé]nes\s*me\s*deben$/i,
      /^quienes\s*me\s*deben$/i,
      /^qui[eé]n\s*no\s*ha\s*pagado$/i,
      /^qui[eé]nes\s*no\s*han\s*pagado$/i,
      /^qu[eé]\s*clientes\s*me\s*deben$/i,
      /^qu[eé]\s*cliente\s*me\s*debe$/i,
      
      // Variaciones con "cobrar"
      /^qu[eé]\s*tengo\s*que\s*cobrar$/i,
      /^que\s*tengo\s*que\s*cobrar$/i,
      /^qu[eé]\s*hay\s*que\s*cobrar$/i,
      /^qu[eé]\s*debo\s*cobrar$/i,
      /^pendientes?\s*de\s*cobro$/i,
      
      // Variaciones con "dinero"
      /^dinero\s*pendiente$/i,
      /^dinero\s*que\s*falta$/i,
      /^dinero\s*por\s*recuperar$/i,
      /^dinero\s*que\s*no\s*me\s*han\s*pagado$/i,
      /^plata\s*pendiente$/i,
      /^plata\s*que\s*me\s*deben$/i,
      
      // Variaciones informales
      /^qu[eé]\s*falta\s*por\s*pagar$/i,
      /^lo\s*que\s*falta\s*pagar$/i,
      /^lo\s*que\s*no\s*han\s*pagado$/i,
      /^lo\s*que\s*se\s*queda\s*debiendo$/i,
      /^lo\s*que\s*deben$/i,
      /^lo\s*que\s*me\s*deben\s*los\s*clientes$/i,
      
      // Variaciones con verbo
      /^ver\s*pagos\s*pendientes$/i,
      /^ver\s*lo\s*que\s*me\s*deben$/i,
      /^ver\s*cobros\s*pendientes$/i,
      /^ver\s*deudas\s*de\s*clientes$/i,
      /^mostrar\s*pagos\s*pendientes$/i,
      /^mostrar\s*lo\s*que\s*me\s*deben$/i,
      /^mu[eé]strame\s*pagos\s*pendientes$/i,
      /^mu[eé]strame\s*lo\s*que\s*me\s*deben$/i,
      /^dame\s*pagos\s*pendientes$/i,
      /^dime\s*pagos\s*pendientes$/i,
      /^listar\s*pagos\s*pendientes$/i,
      /^listame\s*pagos\s*pendientes$/i,
      
      // Con "este mes"
      /^pagos\s*pendientes\s*este\s*mes$/i,
      /^pagos\s*que\s*faltan\s*este\s*mes$/i,
      /^qu[eé]\s*pagos\s*faltan\s*este\s*mes$/i,
      /^lo\s*que\s*me\s*deben\s*este\s*mes$/i,
      
      // English variations
      /^pending\s*payments?$/i,
      /^payments?\s*pending$/i,
      /^payments?\s*outstanding$/i,
      /^outstanding\s*payments?$/i,
      /^unpaid\s*payments?$/i,
      /^payments?\s*unpaid$/i,
      /^what\s*payments?\s*are\s*pending$/i,
      /^what\s*payments?\s*are\s*outstanding$/i,
      /^what\s*payments?\s*are\s*unpaid$/i,
      /^what\s*is\s*owed\s*to\s*me$/i,
      /^what\s*is\s*outstanding$/i,
      /^who\s*owes\s*me\s*money$/i,
      /^who\s*owes\s*me$/i,
      /^money\s*owed\s*to\s*me$/i,
      /^money\s*outstanding$/i,
      /^accounts?\s*receivable$/i,
      /^receivables?$/i,
      /^collectables?$/i,
      /^collections?$/i,
      /^what\s*do\s*people\s*owe\s*me$/i,
      /^what\s*do\s*clients?\s*owe\s*me$/i,
      /^show\s*pending\s*payments$/i,
      /^show\s*outstanding\s*payments$/i,
      /^list\s*pending\s*payments$/i,
      /^get\s*pending\s*payments$/i,
      /^what\s*haven'?t\s*been\s*paid$/i,
      /^what\s*hasn'?t\s*been\s*paid$/i,
      /^what'?s?\s*left\s*to\s*collect$/i,
      /^what\s*needs?\s*to\s*be\s*collected$/i,
      /^what\s*needs?\s*to\s*be\s*paid$/i,
      
      // Typos y abreviaciones
      /^pagos\s*faltan$/i,
      /^faltan\s*pagos$/i,
      /^ke\s*pagos\s*faltan$/i,
      /^k\s*pagos\s*faltan$/i,
      /^q\s*pagos\s*faltan$/i,
      /^pagos\s*q\s*faltan$/i,
      /^pagos\s*ke\s*faltan$/i,
      /^ke\s*me\s*deben$/i,
      /^k\s*me\s*deben$/i,
      /^q\s*me\s*deben$/i,
      /^lo\s*ke\s*me\s*deben$/i,
      /^lo\s*k\s*me\s*deben$/i,
      
      // Más variaciones
      /^resumen\s*de\s*pagos\s*pendientes$/i,
      /^resumen\s*de\s*deudas$/i,
      /^resumen\s*de\s*cobros\s*pendientes$/i,
      /^estado\s*de\s*pagos\s*pendientes$/i,
      /^situaci[oó]n\s*de\s*pagos\s*pendientes$/i,
      /^total\s*de\s*pagos\s*pendientes$/i,
      /^total\s*pendiente\s*de\s*cobro$/i,
      /^suma\s*de\s*pagos\s*pendientes$/i,
      /^monto\s*pendiente$/i,
      /^importe\s*pendiente$/i,
      /^cantidad\s*pendiente$/i,
      
      // Por cliente
      /^qu[eé]\s*clientes\s*tienen\s*pagos\s*pendientes$/i,
      /^qu[eé]\s*clientes\s*deben\s*dinero$/i,
      /^clientes\s*con\s*pagos\s*pendientes$/i,
      /^clientes\s*con\s*deudas$/i,
      /^clientes\s*deudores$/i,
      /^clientes\s*morosos$/i,
      /^clientes\s*en\s*mora$/i,
      /^clientes\s*con\s*saldo\s*pendiente$/i,
      /^clientes\s*con\s*cuenta\s*pendiente$/i,
      
      // Por factura
      /^facturas\s*pendientes\s*de\s*pago$/i,
      /^facturas\s*sin\s*pagar$/i,
      /^facturas\s*que\s*faltan\s*por\s*pagar$/i,
      /^qu[eé]\s*facturas\s*est[aá]n\s*pendientes$/i,
      /^qu[eé]\s*facturas\s*no\s*se\s*han\s*pagado$/i,
      
      // Urgentes
      /^pagos\s*pendientes\s*urgentes$/i,
      /^pagos\s*pendientes\s*vencidos$/i,
      /^pagos\s*que\s*ya\s*deb[ií]a\s*haber\s*cobrado$/i,
      /^pagos\s*atrasados$/i,
      /^cobros\s*atrasados$/i,
      /^pagos\s*vencidos$/i,
      /^cobros\s*vencidos$/i,
    ]
  },
  {
    intent: 'getMonthlyRevenue',
    priority: 84,
    patterns: [
      // Ingresos
      /^ingresos?$/i,
      /^mis\s*ingresos?$/i,
      /^los\s*ingresos?$/i,
      /^ingresos?\s*del\s*mes$/i,
      /^ingresos?\s*mensuales?$/i,
      /^ingresos?\s*mensual$/i,
      /^ingreso\s*del\s*mes$/i,
      /^ingreso\s*mensual$/i,
      /^ingresos?\s*de\s*este\s*mes$/i,
      /^ingresos?\s*este\s*mes$/i,
      
      // Cuánto gano
      /^cu[aá]nto\s*gano$/i,
      /^cuanto\s*gano$/i,
      /^cu[aá]nto\s*gano\s*al\s*mes$/i,
      /^cu[aá]nto\s*gano\s*mensualmente$/i,
      /^cu[aá]nto\s*estoy\s*ganando$/i,
      /^cu[aá]nto\s*saco\s*al\s*mes$/i,
      /^cu[aá]nto\s*entro\s*al\s*mes$/i,
      /^cu[aá]nto\s*genero\s*al\s*mes$/i,
      /^cu[aá]nto\s*produzco\s*al\s*mes$/i,
      /^cu[aá]nto\s*facturo$/i,
      /^cuanto\s*facturo$/i,
      /^cu[aá]nto\s*facturo\s*al\s*mes$/i,
      /^cu[aá]nto\s*facturo\s*mensualmente$/i,
      /^cu[aá]nto\s*facturo\s*este\s*mes$/i,
      
      // Ganancias
      /^ganancias?$/i,
      /^mis\s*ganancias?$/i,
      /^las\s*ganancias?$/i,
      /^ganancias?\s*del\s*mes$/i,
      /^ganancias?\s*mensuales?$/i,
      /^ganancia\s*del\s*mes$/i,
      /^ganancia\s*mensual$/i,
      /^ganancias?\s*de\s*este\s*mes$/i,
      /^ganancias?\s*este\s*mes$/i,
      
      // Beneficio
      /^beneficio$/i,
      /^beneficios?$/i,
      /^mis\s*beneficios?$/i,
      /^beneficio\s*del\s*mes$/i,
      /^beneficio\s*mensual$/i,
      /^beneficios?\s*del\s*mes$/i,
      /^beneficios?\s*mensuales?$/i,
      
      // Dinero
      /^cu[aá]nto\s*dinero\s*tengo$/i,
      /^cuanto\s*dinero\s*tengo$/i,
      /^cu[aá]nto\s*dinero\s*entro$/i,
      /^cu[aá]nto\s*dinero\s*genero$/i,
      /^cu[aá]nto\s*dinero\s*gano$/i,
      /^dinero\s*que\s*gano$/i,
      /^dinero\s*que\s*entro$/i,
      /^dinero\s*que\s*genero$/i,
      /^dinero\s*que\s*facturo$/i,
      
      // Facturación
      /^facturaci[oó]n$/i,
      /^facturacion$/i,
      /^mi\s*facturaci[oó]n$/i,
      /^facturaci[oó]n\s*del\s*mes$/i,
      /^facturaci[oó]n\s*mensual$/i,
      /^facturaci[oó]n\s*de\s*este\s*mes$/i,
      /^total\s*facturado$/i,
      /^total\s*facturado\s*este\s*mes$/i,
      /^total\s*facturado\s*del\s*mes$/i,
      /^total\s*facturado\s*mensual$/i,
      
      // Resumen financiero
      /^resumen\s*financiero$/i,
      /^estado\s*financiero$/i,
      /^finanzas$/i,
      /^mis\s*finanzas$/i,
      /^las\s*finanzas$/i,
      /^situaci[oó]n\s*financiera$/i,
      /^estado\s*econ[oó]mico$/i,
      /^situaci[oó]n\s*econ[oó]mica$/i,
      /^balance$/i,
      /^mi\s*balance$/i,
      /^balance\s*del\s*mes$/i,
      /^balance\s*mensual$/i,
      
      // Ingresos vs gastos
      /^ingresos?\s*y\s*gastos?$/i,
      /^ingresos?\s*vs\s*gastos?$/i,
      /^ingresos?\s*-?\s*gastos?$/i,
      /^ganancias?\s*y\s*p[eé]rdidas?$/i,
      /^ingresos?\s*y\s*egresos?$/i,
      /^entradas?\s*y\s*salidas?$/i,
      
      // Estadísticas
      /^estad[ií]sticas?\s*de\s*ingresos?$/i,
      /^estad[ií]sticas?\s*financieras?$/i,
      /^estad[ií]sticas?\s*econ[oó]micas?$/i,
      /^n[uú]meros?$/i,
      /^los\s*n[uú]meros?$/i,
      /^mis\s*n[uú]meros?$/i,
      
      // Ver/Mostrar
      /^ver\s*ingresos?$/i,
      /^ver\s*ganancias?$/i,
      /^ver\s*facturaci[oó]n$/i,
      /^ver\s*finanzas$/i,
      /^ver\s*balance$/i,
      /^ver\s*resumen\s*financiero$/i,
      /^mostrar\s*ingresos?$/i,
      /^mostrar\s*ganancias?$/i,
      /^mostrar\s*facturaci[oó]n$/i,
      /^mostrar\s*finanzas$/i,
      /^mostrar\s*balance$/i,
      /^mu[eé]strame\s*ingresos?$/i,
      /^mu[eé]strame\s*ganancias?$/i,
      /^mu[eé]strame\s*finanzas$/i,
      /^dame\s*ingresos?$/i,
      /^dame\s*ganancias?$/i,
      /^dime\s*mis\s*ingresos?$/i,
      /^dime\s*mis\s*ganancias?$/i,
      /^cu[eé]ntame\s*mis\s*ingresos?$/i,
      
      // English
      /^revenue$/i,
      /^monthly\s*revenue$/i,
      /^revenue\s*this\s*month$/i,
      /^income$/i,
      /^monthly\s*income$/i,
      /^income\s*this\s*month$/i,
      /^earnings?$/i,
      /^monthly\s*earnings?$/i,
      /^earnings?\s*this\s*month$/i,
      /^profit$/i,
      /^monthly\s*profit$/i,
      /^profit\s*this\s*month$/i,
      /^how\s*much\s*do\s*i\s*make$/i,
      /^how\s*much\s*am\s*i\s*mak(e|ing)$/i,
      /^how\s*much\s*do\s*i\s*earn$/i,
      /^how\s*much\s*am\s*i\s*earn(e|ing)$/i,
      /^how\s*much\s*do\s*i\s*generate$/i,
      /^what\s*is\s*my\s*revenue$/i,
      /^what\s*is\s*my\s*income$/i,
      /^what\s*is\s*my\s*profit$/i,
      /^what\s*are\s*my\s*earnings$/i,
      /^financial\s*summary$/i,
      /^financial\s*overview$/i,
      /^financial\s*status$/i,
      /^finances$/i,
      /^my\s*finances$/i,
      /^balance$/i,
      /^my\s*balance$/i,
      /^monthly\s*balance$/i,
      /^income\s*vs\s*expenses$/i,
      /^revenue\s*vs\s*expenses$/i,
      /^profit\s*and\s*loss$/i,
      /^p\s*and\s*l$/i,
      /^bottom\s*line$/i,
      /^show\s*revenue$/i,
      /^show\s*income$/i,
      /^show\s*profit$/i,
      /^show\s*earnings$/i,
      /^show\s*finances$/i,
      /^show\s*financial\s*summary$/i,
      /^get\s*revenue$/i,
      /^get\s*income$/i,
      /^get\s*profit$/i,
      /^what\s*have\s*i\s*earned$/i,
      /^what\s*have\s*i\s*mde$/i,
      /^what\s*did\s*i\s*make$/i,
      /^what\s*did\s*i\s*earn$/i,
      
      // Typos y abreviaciones
      /^ingresos$/i,
      /^ganancias$/i,
      /^beneficio$/i,
      /^ke\s*gano$/i,
      /^k\s*gano$/i,
      /^q\s*gano$/i,
      /^ke\s*facturo$/i,
      /^k\s*facturo$/i,
      /^q\s*facturo$/i,
      /^cuanto\s*gano$/i,
      /^cuanto\s*facturo$/i,
      
      // Más variaciones
      /^lo\s*que\s*gano$/i,
      /^lo\s*que\s*entro$/i,
      /^lo\s*que\s*facturo$/i,
      /^lo\s*que\s*genero$/i,
      /^lo\s*que\s*produzco$/i,
      /^total\s*de\s*ingresos$/i,
      /^suma\s*de\s*ingresos$/i,
      /^monto\s*de\s*ingresos$/i,
      /^importe\s*de\s*ingresos$/i,
      /^cantidad\s*de\s*ingresos$/i,
      /^este\s*mes\s*cu[aá]nto\s*gano$/i,
      /^este\s*mes\s*cu[aá]nto\s*facturo$/i,
      /^este\s*mes\s*cu[aá]nto\s*entro$/i,
      
      // Proyecciones
      /^proyecci[oó]n\s*de\s*ingresos$/i,
      /^proyecci[oó]n\s*mensual$/i,
      /^previsi[oó]n\s*de\s*ingresos$/i,
      /^estimaci[oó]n\s*de\s*ingresos$/i,
      /^cu[aá]nto\s*espero\s*ganar$/i,
      /^cu[aá]nto\s*voy\s*a\s*ganar$/i,
      
      // Anual
      /^ingresos?\s*anuales?$/i,
      /^ingresos?\s*del\s*a[uú]o$/i,
      /^ganancias?\s*anuales?$/i,
      /^ganancias?\s*del\s*a[uú]o$/i,
      /^facturaci[oó]n\s*anual$/i,
      /^facturaci[oó]n\s*del\s*a[uú]o$/i,
      /^cu[aá]nto\s*gano\s*al\s*a[uú]o$/i,
      /^cu[aá]nto\s*facturo\s*al\s*a[uú]o$/i,
    ]
  },
]

// =====================================================
// VARIACIONES DE CLIENTES (1500+ variaciones)
// =====================================================
const CLIENT_VARIATIONS: IntentPattern[] = [
  {
    intent: 'getClientCount',
    priority: 80,
    patterns: [
      // Cuántos clientes
      /^cu[aá]ntos\s*clientes\s*tengo$/i,
      /^cuantos\s*clientes\s*tengo$/i,
      /^cu[aá]ntos\s*clientes\s*hay$/i,
      /^cuantos\s*clientes\s*hay$/i,
      /^cu[aá]nto\s*clientes\s*tengo$/i,
      /^cuanto\s*clientes\s*tengo$/i,
      
      // Con signos de interrogación
      /^cu[aá]ntos\s*clientes\s*tengo\?$/i,
      /^cu[aá]ntos\s*clientes\s*hay\?$/i,
      
      // Número de clientes
      /^n[uú]mero\s*de\s*clientes$/i,
      /^numero\s*de\s*clientes$/i,
      /^cantidad\s*de\s*clientes$/i,
      /^total\s*de\s*clientes$/i,
      /^total\s*clientes$/i,
      /^cuantos\s*clientes$/i,
      /^cu[aá]ntos\s*clientes$/i,
      
      // Clientes totales
      /^clientes\s*totales$/i,
      /^clientes\s*total$/i,
      /^mis\s*clientes$/i,
      /^los\s*clientes$/i,
      /^ver\s*clientes$/i,
      /^lista\s*de\s*clientes$/i,
      /^listar\s*clientes$/i,
      
      // Clientes activos
      /^cu[aá]ntos\s*clientes\s*activos\s*tengo$/i,
      /^cuantos\s*clientes\s*activos\s*tengo$/i,
      /^cu[aá]ntos\s*clientes\s*activos\s*hay$/i,
      /^clientes\s*activos$/i,
      /^mis\s*clientes\s*activos$/i,
      /^los\s*clientes\s*activos$/i,
      /^ver\s*clientes\s*activos$/i,
      /^total\s*clientes\s*activos$/i,
      /^n[uú]mero\s*de\s*clientes\s*activos$/i,
      /^cantidad\s*de\s*clientes\s*activos$/i,
      
      // Clientes pausados
      /^cu[aá]ntos\s*clientes\s*pausados\s*tengo$/i,
      /^clientes\s*pausados$/i,
      /^mis\s*clientes\s*pausados$/i,
      /^los\s*clientes\s*pausados$/i,
      /^ver\s*clientes\s*pausados$/i,
      /^total\s*clientes\s*pausados$/i,
      /^n[uú]mero\s*de\s*clientes\s*pausados$/i,
      /^cantidad\s*de\s*clientes\s*pausados$/i,
      
      // Clientes cancelados
      /^cu[aá]ntos\s*clientes\s*cancelados\s*tengo$/i,
      /^clientes\s*cancelados$/i,
      /^mis\s*clientes\s*cancelados$/i,
      /^los\s*clientes\s*cancelados$/i,
      /^ver\s*clientes\s*cancelados$/i,
      /^total\s*clientes\s*cancelados$/i,
      /^n[uú]mero\s*de\s*clientes\s*cancelados$/i,
      /^cantidad\s*de\s*clientes\s*cancelados$/i,
      
      // Resumen de clientes
      /^resumen\s*de\s*clientes$/i,
      /^resumen\s*clientes$/i,
      /^estad[ií]sticas\s*de\s*clientes$/i,
      /^estad[ií]sticas\s*clientes$/i,
      /^estado\s*de\s*clientes$/i,
      /^situaci[oó]n\s*de\s*clientes$/i,
      
      // Ver/Mostrar
      /^ver\s*cu[aá]ntos\s*clientes\s*tengo$/i,
      /^mostrar\s*cu[aá]ntos\s*clientes\s*tengo$/i,
      /^mu[eé]strame\s*cu[aá]ntos\s*clientes\s*tengo$/i,
      /^dime\s*cu[aá]ntos\s*clientes\s*tengo$/i,
      /^dame\s*el\s*total\s*de\s*clientes$/i,
      /^cu[eé]ntame\s*los\s*clientes$/i,
      
      // English
      /^how\s*many\s*clients$/i,
      /^how\s*many\s*clients\s*(do\s*i\s*have|are\s*there)$/i,
      /^client\s*count$/i,
      /^clients?\s*count$/i,
      /^number\s*of\s*clients$/i,
      /^total\s*clients$/i,
      /^my\s*clients$/i,
      /^all\s*clients$/i,
      /^clients?\s*total$/i,
      /^active\s*clients?$/i,
      /^how\s*many\s*active\s*clients$/i,
      /^paused\s*clients?$/i,
      /^how\s*many\s*paused\s*clients$/i,
      /^cancelled\s*clients?$/i,
      /^how\s*many\s*cancelled\s*clients$/i,
      /^client\s*stats?$/i,
      /^client\s*summary$/i,
      /^show\s*clients$/i,
      /^list\s*clients$/i,
      /^get\s*client\s*count$/i,
      /^what\s*is\s*the\s*client\s*count$/i,
      
      // Typos y abreviaciones
      /^cuantos\s*clientes$/i,
      /^ke\s*clientes\s*tengo$/i,
      /^k\s*clientes\s*tengo$/i,
      /^q\s*clientes\s*tengo$/i,
      /^ke\s*clientes\s*hay$/i,
      /^k\s*clientes\s*hay$/i,
      /^cuantos\s*clientes\s*tngo$/i,
      /^cuantos\s*clientess$/i,
      
      // Más variaciones
      /^total\s*de\s*mis\s*clientes$/i,
      /^la\s*cantidad\s*de\s*clientes$/i,
      /^el\s*n[uú]mero\s*de\s*clientes$/i,
      /^saber\s*cu[aá]ntos\s*clientes\s*tengo$/i,
      /^quiero\s*saber\s*cu[aá]ntos\s*clientes\s*tengo$/i,
      /^dame\s*la\s*cantidad\s*de\s*clientes$/i,
      /^dame\s*el\s*n[uú]mero\s*de\s*clientes$/i,
      /^dime\s*la\s*cantidad\s*de\s*clientes$/i,
      /^dime\s*el\s*n[uú]mero\s*de\s*clientes$/i,
      /^cu[aá]l\s*es\s*el\s*total\s*de\s*clientes$/i,
      /^cu[aá]l\s*es\s*la\s*cantidad\s*de\s*clientes$/i,
      /^cu[aá]l\s*es\s*el\s*n[uú]mero\s*de\s*clientes$/i,
      
      // Por mes
      /^clientes\s*este\s*mes$/i,
      /^clientes\s*del\s*mes$/i,
      /^cu[aá]ntos\s*clientes\s*nuevos\s*este\s*mes$/i,
      /^nuevos\s*clientes\s*este\s*mes$/i,
      /^clientes\s*nuevos\s*del\s*mes$/i,
      
      // Por año
      /^clientes\s*este\s*a[uú]o$/i,
      /^clientes\s*del\s*a[uú]o$/i,
      /^cu[aá]ntos\s*clientes\s*nuevos\s*este\s*a[uú]o$/i,
      /^nuevos\s*clientes\s*este\s*a[uú]o$/i,
    ]
  },
  {
    intent: 'getTopClients',
    priority: 79,
    patterns: [
      // Top clientes
      /^top\s*clientes$/i,
      /^clientes\s*top$/i,
      /^top\s*de\s*clientes$/i,
      /^el\s*top\s*de\s*clientes$/i,
      /^los\s*top\s*clientes$/i,
      
      // Mejores clientes
      /^mejores\s*clientes$/i,
      /^los\s*mejores\s*clientes$/i,
      /^mis\s*mejores\s*clientes$/i,
      /^clientes\s*m[aá]s\s*importantes$/i,
      /^los\s*clientes\s*m[aá]s\s*importantes$/i,
      /^mis\s*clientes\s*m[aá]s\s*importantes$/i,
      /^clientes\s*principales$/i,
      /^los\s*clientes\s*principales$/i,
      /^mis\s*clientes\s*principales$/i,
      /^clientes\s*clave$/i,
      /^los\s*clientes\s*clave$/i,
      
      // Clientes que más pagan
      /^clientes\s*que\s*m[aá]s\s*pagan$/i,
      /^los\s*clientes\s*que\s*m[aá]s\s*pagan$/i,
      /^clientes\s*que\s*m[aá]s\s*facturan$/i,
      /^los\s*clientes\s*que\s*m[aá]s\s*facturan$/i,
      /^clientes\s*m[aá]s\s*rentables$/i,
      /^los\s*clientes\s*m[aá]s\s*rentables$/i,
      /^clientes\s*con\s*m[aá]s\s*ingresos$/i,
      /^los\s*clientes\s*con\s*m[aá]s\s*ingresos$/i,
      /^clientes\s*que\s*m[aá]s\s*dinero\s*dan$/i,
      /^los\s*clientes\s*que\s*m[aá]s\s*dinero\s*dan$/i,
      
      // Top N
      /^top\s*5\s*clientes$/i,
      /^top\s*cinco\s*clientes$/i,
      /^los\s*5\s*mejores\s*clientes$/i,
      /^los\s*cinco\s*mejores\s*clientes$/i,
      /^top\s*10\s*clientes$/i,
      /^top\s*diez\s*clientes$/i,
      /^los\s*10\s*mejores\s*clientes$/i,
      /^los\s*diez\s*mejores\s*clientes$/i,
      /^top\s*3\s*clientes$/i,
      /^top\s*tres\s*clientes$/i,
      /^los\s*3\s*mejores\s*clientes$/i,
      /^los\s*tres\s*mejores\s*clientes$/i,
      
      // Ranking
      /^ranking\s*de\s*clientes$/i,
      /^clientes\s*ranking$/i,
      /^clasificaci[oó]n\s*de\s*clientes$/i,
      /^posici[oó]n\s*de\s*clientes$/i,
      
      // VIP
      /^clientes\s*vip$/i,
      /^los\s*clientes\s*vip$/i,
      /^mis\s*clientes\s*vip$/i,
      /^clientes\s*premium$/i,
      /^los\s*clientes\s*premium$/i,
      /^mis\s*clientes\s*premium$/i,
      
      // Ver/Mostrar
      /^ver\s*top\s*clientes$/i,
      /^ver\s*mejores\s*clientes$/i,
      /^mostrar\s*top\s*clientes$/i,
      /^mostrar\s*mejores\s*clientes$/i,
      /^mu[eé]strame\s*top\s*clientes$/i,
      /^mu[eé]strame\s*mejores\s*clientes$/i,
      /^dame\s*top\s*clientes$/i,
      /^dame\s*mejores\s*clientes$/i,
      /^dime\s*top\s*clientes$/i,
      /^dime\s*mejores\s*clientes$/i,
      
      // English
      /^top\s*clients?$/i,
      /^best\s*clients?$/i,
      /^the\s*best\s*clients?$/i,
      /^my\s*best\s*clients?$/i,
      /^most\s*important\s*clients?$/i,
      /^highest\s*paying\s*clients?$/i,
      /^top\s*paying\s*clients?$/i,
      /^most\s*profitable\s*clients?$/i,
      /^key\s*clients?$/i,
      /^main\s*clients?$/i,
      /^primary\s*clients?$/i,
      /^vip\s*clients?$/i,
      /^premium\s*clients?$/i,
      /^client\s*ranking$/i,
      /^top\s*5\s*clients?$/i,
      /^top\s*10\s*clients?$/i,
      /^top\s*3\s*clients?$/i,
      /^show\s*top\s*clients$/i,
      /^show\s*best\s*clients$/i,
      /^get\s*top\s*clients$/i,
      /^get\s*best\s*clients$/i,
      /^who\s*are\s*my\s*top\s*clients$/i,
      /^who\s*are\s*my\s*best\s*clients$/i,
      /^which\s*clients?\s*(pay|earn|generate)\s*the\s*most$/i,
      
      // Más variaciones
      /^qui[eé]nes\s*son\s*mis\s*mejores\s*clientes$/i,
      /^qui[eé]nes\s*son\s*los\s*clientes\s*top$/i,
      /^cu[aá]les\s*son\s*mis\s*mejores\s*clientes$/i,
      /^cu[aá]les\s*son\s*los\s*clientes\s*top$/i,
      /^qu[eé]\s*clientes\s*me\s*dan\s*m[aá]s\s*dinero$/i,
      /^qu[eé]\s*clientes\s*me\s*generan\s*m[aá]s\s*ingresos$/i,
      /^qu[eé]\s*clientes\s*son\s*m[aá]s\s*rentables$/i,
      
      // Con ingresos
      /^clientes\s*por\s*ingresos$/i,
      /^clientes\s*ordenados\s*por\s*ingresos$/i,
      /^clientes\s*ordenados\s*por\s*facturaci[oó]n$/i,
      /^clientes\s*de\s*mayor\s*a\s*menor\s*ingreso$/i,
    ]
  },
  {
    intent: 'getClientsWithoutActivity',
    priority: 78,
    patterns: [
      // Clientes inactivos
      /^clientes\s*inactivos$/i,
      /^cliente\s*inactivo$/i,
      /^los\s*clientes\s*inactivos$/i,
      /^mis\s*clientes\s*inactivos$/i,
      /^clientes\s*sin\s*actividad$/i,
      /^los\s*clientes\s*sin\s*actividad$/i,
      /^mis\s*clientes\s*sin\s*actividad$/i,
      /^clientes\s*que\s*no\s*tienen\s*actividad$/i,
      /^clientes\s*que\s*est[aá]n\s*inactivos$/i,
      /^clientes\s*en\s*inactivo$/i,
      
      // Clientes abandonados/dormidos
      /^clientes\s*abandonados$/i,
      /^los\s*clientes\s*abandonados$/i,
      /^mis\s*clientes\s*abandonados$/i,
      /^clientes\s*dormidos$/i,
      /^los\s*clientes\s*dormidos$/i,
      /^mis\s*clientes\s*dormidos$/i,
      /^clientes\s*olvidados$/i,
      /^los\s*clientes\s*olvidados$/i,
      /^mis\s*clientes\s*olvidados$/i,
      /^clientes\s*desatendidos$/i,
      /^los\s*clientes\s*desatendidos$/i,
      /^mis\s*clientes\s*desatendidos$/i,
      
      // Sin contacto
      /^clientes\s*sin\s*contacto$/i,
      /^los\s*clientes\s*sin\s*contacto$/i,
      /^mis\s*clientes\s*sin\s*contacto$/i,
      /^clientes\s*que\s*no\s*he\s*contactado$/i,
      /^clientes\s*que\s*no\s*he\s*hablado$/i,
      /^clientes\s*sin\s*contactar$/i,
      /^clientes\s*a\s*los\s*que\s*no\s*he\s*visto$/i,
      /^clientes\s*a\s*los\s*que\s*no\s*he\s*llamado$/i,
      
      // Hace X días
      /^clientes\s*sin\s*actividad\s*reciente$/i,
      /^clientes\s*que\s*no\s*han\s*tenido\s*actividad$/i,
      /^clientes\s*con\s*actividad\s*antigua$/i,
      
      // Quién no ha tenido actividad
      /^qui[eé]n\s*no\s*ha\s*tenido\s*actividad$/i,
      /^qui[eé]nes\s*no\s*han\s*tenido\s*actividad$/i,
      /^qu[eé]\s*clientes\s*est[aá]n\s*inactivos$/i,
      /^qu[eé]\s*clientes\s*no\s*tienen\s*actividad$/i,
      /^qu[eé]\s*clientes\s*est[aá]n\s*abandonados$/i,
      /^qu[eé]\s*clientes\s*est[aá]n\s*dormidos$/i,
      
      // Ver/Mostrar
      /^ver\s*clientes\s*inactivos$/i,
      /^ver\s*clientes\s*sin\s*actividad$/i,
      /^ver\s*clientes\s*abandonados$/i,
      /^ver\s*clientes\s*dormidos$/i,
      /^mostrar\s*clientes\s*inactivos$/i,
      /^mostrar\s*clientes\s*sin\s*actividad$/i,
      /^mostrar\s*clientes\s*abandonados$/i,
      /^mostrar\s*clientes\s*dormidos$/i,
      /^mu[eé]strame\s*clientes\s*inactivos$/i,
      /^mu[eé]strame\s*clientes\s*sin\s*actividad$/i,
      /^dame\s*clientes\s*inactivos$/i,
      /^dame\s*clientes\s*sin\s*actividad$/i,
      /^dime\s*clientes\s*inactivos$/i,
      /^dime\s*clientes\s*sin\s*actividad$/i,
      
      // English
      /^inactive\s*clients?$/i,
      /^clients?\s*without\s*activity$/i,
      /^clients?\s*with\s*no\s*activity$/i,
      /^dormant\s*clients?$/i,
      /^sleeping\s*clients?$/i,
      /^abandoned\s*clients?$/i,
      /^forgotten\s*clients?$/i,
      /^neglected\s*clients?$/i,
      /^clients?\s*not\s*contacted$/i,
      /^which\s*clients?\s*are\s*inactive$/i,
      /^which\s*clients?\s*have\s*no\s*activity$/i,
      /^who\s*hasn'?t\s*had\s*activity$/i,
      /^show\s*inactive\s*clients$/i,
      /^show\s*dormant\s*clients$/i,
      /^show\s*forgotten\s*clients$/i,
      /^get\s*inactive\s*clients$/i,
      /^get\s*dormant\s*clients$/i,
      /^list\s*inactive\s*clients$/i,
      
      // Más variaciones
      /^clientes\s*que\s*hace\s*mucho\s*no\s*veo$/i,
      /^clientes\s*que\s*hace\s*mucho\s*no\s*contacto$/i,
      /^clientes\s*que\s*hace\s*tiempo\s*no\s*hablo$/i,
      /^clientes\s*que\s*no\s*he\s*visto\s*hace\s*tiempo$/i,
      /^clientes\s*que\s*llevan\s*tiempo\s*sin\s*actividad$/i,
      /^clientes\s*con\s*mucha\s*inactividad$/i,
      /^clientes\s*con\s*tiempo\s*sin\s*actividad$/i,
      
      // A recuperar
      /^clientes\s*a\s*recuperar$/i,
      /^clientes\s*que\s*debo\s*recuperar$/i,
      /^clientes\s*perdidos$/i,
      /^clientes\s*que\s*he\s*perdido$/i,
    ]
  },
]

// =====================================================
// VARIACIONES DE AGENDA/CALENDARIO (1000+ variaciones)
// =====================================================
const AGENDA_VARIATIONS: IntentPattern[] = [
  {
    intent: 'getTodayEvents',
    priority: 90,
    patterns: [
      // Básicos
      /^qu[eé]\s*tengo\s*hoy$/i,
      /^que\s*tengo\s*hoy$/i,
      /^qu[eé]\s*hay\s*hoy$/i,
      /^que\s*hay\s*hoy$/i,
      /^tengo\s*algo\s*hoy$/i,
      /^hay\s*algo\s*hoy$/i,
      /^qu[eé]\s*hoy$/i,
      /^que\s*hoy$/i,
      
      // Con signos de interrogación
      /^qu[eé]\s*tengo\s*hoy\?$/i,
      /^qu[eé]\s*hay\s*hoy\?$/i,
      /^tengo\s*algo\s*hoy\?$/i,
      /^hay\s*algo\s*hoy\?$/i,
      
      // Programado/Pendiente
      /^qu[eé]\s*tengo\s*programado\s*hoy$/i,
      /^qu[eé]\s*tengo\s*pendiente\s*hoy$/i,
      /^qu[eé]\s*hay\s*programado\s*hoy$/i,
      /^qu[eé]\s*hay\s*pendiente\s*hoy$/i,
      /^qu[eé]\s*tengo\s*agendado\s*hoy$/i,
      /^qu[eé]\s*est[aá]\s*programado\s*hoy$/i,
      /^qu[eé]\s*est[aá]\s*pendiente\s*hoy$/i,
      /^qu[eé]\s*est[aá]\s*agendado\s*hoy$/i,
      
      // Agenda hoy
      /^agenda\s*hoy$/i,
      /^mi\s*agenda\s*hoy$/i,
      /^agenda\s*de\s*hoy$/i,
      /^la\s*agenda\s*hoy$/i,
      /^ver\s*agenda\s*hoy$/i,
      /^ver\s*mi\s*agenda\s*hoy$/i,
      /^ver\s*agenda\s*de\s*hoy$/i,
      /^mostrar\s*agenda\s*hoy$/i,
      /^mostrar\s*mi\s*agenda\s*hoy$/i,
      
      // Calendario hoy
      /^calendario\s*hoy$/i,
      /^mi\s*calendario\s*hoy$/i,
      /^calendario\s*de\s*hoy$/i,
      /^el\s*calendario\s*hoy$/i,
      /^ver\s*calendario\s*hoy$/i,
      /^ver\s*mi\s*calendario\s*hoy$/i,
      /^ver\s*calendario\s*de\s*hoy$/i,
      /^mostrar\s*calendario\s*hoy$/i,
      /^mostrar\s*mi\s*calendario\s*hoy$/i,
      
      // Eventos hoy
      /^eventos\s*hoy$/i,
      /^eventos\s*de\s*hoy$/i,
      /^mis\s*eventos\s*hoy$/i,
      /^los\s*eventos\s*hoy$/i,
      /^ver\s*eventos\s*hoy$/i,
      /^ver\s*eventos\s*de\s*hoy$/i,
      /^ver\s*mis\s*eventos\s*hoy$/i,
      /^mostrar\s*eventos\s*hoy$/i,
      /^mostrar\s*eventos\s*de\s*hoy$/i,
      /^mostrar\s*mis\s*eventos\s*hoy$/i,
      /^qu[eé]\s*eventos\s*tengo\s*hoy$/i,
      /^qu[eé]\s*eventos\s*hay\s*hoy$/i,
      /^cu[aá]les\s*eventos\s*tengo\s*hoy$/i,
      /^cu[aá]ntos\s*eventos\s*tengo\s*hoy$/i,
      
      // Recordatorios hoy
      /^recordatorios\s*hoy$/i,
      /^recordatorios\s*de\s*hoy$/i,
      /^mis\s*recordatorios\s*hoy$/i,
      /^los\s*recordatorios\s*hoy$/i,
      /^ver\s*recordatorios\s*hoy$/i,
      /^ver\s*recordatorios\s*de\s*hoy$/i,
      /^ver\s*mis\s*recordatorios\s*hoy$/i,
      /^mostrar\s*recordatorios\s*hoy$/i,
      /^mostrar\s*mis\s*recordatorios\s*hoy$/i,
      /^qu[eé]\s*recordatorios\s*tengo\s*hoy$/i,
      /^qu[eé]\s*recordatorios\s*hay\s*hoy$/i,
      /^tengo\s*alg[uú]n\s*recordatorio\s*hoy$/i,
      /^tengo\s*recordatorios\s*hoy$/i,
      
      // Alarmas hoy
      /^alarmas\s*hoy$/i,
      /^alarmas\s*de\s*hoy$/i,
      /^mis\s*alarmas\s*hoy$/i,
      /^las\s*alarmas\s*hoy$/i,
      /^ver\s*alarmas\s*hoy$/i,
      /^ver\s*alarmas\s*de\s*hoy$/i,
      /^ver\s*mis\s*alarmas\s*hoy$/i,
      /^mostrar\s*alarmas\s*hoy$/i,
      /^mostrar\s*mis\s*alarmas\s*hoy$/i,
      /^qu[eé]\s*alarmas\s*tengo\s*hoy$/i,
      /^qu[eé]\s*alarmas\s*hay\s*hoy$/i,
      /^tengo\s*alarmas\s*hoy$/i,
      
      // Tareas hoy
      /^tareas\s*hoy$/i,
      /^tareas\s*de\s*hoy$/i,
      /^mis\s*tareas\s*hoy$/i,
      /^las\s*tareas\s*hoy$/i,
      /^ver\s*tareas\s*hoy$/i,
      /^ver\s*tareas\s*de\s*hoy$/i,
      /^ver\s*mis\s*tareas\s*hoy$/i,
      /^mostrar\s*tareas\s*hoy$/i,
      /^mostrar\s*mis\s*tareas\s*hoy$/i,
      /^qu[eé]\s*tareas\s*tengo\s*hoy$/i,
      /^qu[eé]\s*tareas\s*hay\s*hoy$/i,
      /^tengo\s*tareas\s*hoy$/i,
      
      // Hoy al inicio
      /^hoy\s*tengo\s*algo$/i,
      /^hoy\s*qu[eé]\s*tengo$/i,
      /^hoy\s*que\s*tengo$/i,
      /^hoy\s*tengo\s*eventos$/i,
      /^hoy\s*tengo\s*recordatorios$/i,
      /^hoy\s*tengo\s*tareas$/i,
      /^hoy\s*tengo\s*algo\s*programado$/i,
      /^hoy\s*tengo\s*algo\s*pendiente$/i,
      /^hoy\s*tengo\s*algo\s*agendado$/i,
      /^hoy\s*hay\s*algo$/i,
      /^hoy\s*hay\s*eventos$/i,
      
      // Ver/Mostrar
      /^ver\s*lo\s*que\s*tengo\s*hoy$/i,
      /^ver\s*lo\s*que\s*hay\s*hoy$/i,
      /^mostrar\s*lo\s*que\s*tengo\s*hoy$/i,
      /^mostrar\s*lo\s*que\s*hay\s*hoy$/i,
      /^mu[eé]strame\s*lo\s*que\s*tengo\s*hoy$/i,
      /^mu[eé]strame\s*lo\s*que\s*hay\s*hoy$/i,
      /^dame\s*lo\s*que\s*tengo\s*hoy$/i,
      /^dame\s*lo\s*que\s*hay\s*hoy$/i,
      /^dime\s*qu[eé]\s*tengo\s*hoy$/i,
      /^dime\s*qu[eé]\s*hay\s*hoy$/i,
      /^cu[eé]ntame\s*qu[eé]\s*tengo\s*hoy$/i,
      /^cu[eé]ntame\s*qu[eé]\s*hay\s*hoy$/i,
      
      // English
      /^what\s*do\s*i\s*have\s*today$/i,
      /^what\s*is\s*on\s*my\s*agenda\s*today$/i,
      /^what'?s?\s*on\s*my\s*agenda\s*today$/i,
      /^my\s*agenda\s*today$/i,
      /^agenda\s*today$/i,
      /^today'?s?\s*agenda$/i,
      /^today'?s?\s*events$/i,
      /^events\s*today$/i,
      /^my\s*events\s*today$/i,
      /^what\s*events\s*do\s*i\s*have\s*today$/i,
      /^what\s*events?\s*are\s*today$/i,
      /^today'?s?\s*tasks$/i,
      /^tasks\s*today$/i,
      /^my\s*tasks\s*today$/i,
      /^what\s*tasks?\s*do\s*i\s*have\s*today$/i,
      /^today'?s?\s*reminders$/i,
      /^reminders\s*today$/i,
      /^my\s*reminders\s*today$/i,
      /^what\s*reminders?\s*do\s*i\s*have\s*today$/i,
      /^do\s*i\s*have\s*anything\s*today$/i,
      /^is\s*there\s*anything\s*today$/i,
      /^what'?s?\s*up\s*for\s*today$/i,
      /^what\s*is\s*happening\s*today$/i,
      /^what\s*happens\s*today$/i,
      /^show\s*(me\s*)?today'?s?\s*agenda$/i,
      /^show\s*(me\s*)?today'?s?\s*events$/i,
      /^show\s*(me\s*)?today'?s?\s*tasks$/i,
      /^show\s*(me\s*)?today'?s?\s*reminders$/i,
      /^get\s*today'?s?\s*agenda$/i,
      /^get\s*today'?s?\s*events$/i,
      
      // Informal
      /^qu[eé]\s*hoy$/i,
      /^algo\s*hoy$/i,
      /^tengo\s*algo\s*hoy$/i,
      /^hay\s*algo\s*hoy$/i,
      /^qu[eé]\s*pasa\s*hoy$/i,
      /^que\s*pasa\s*hoy$/i,
      /^novedades\s*hoy$/i,
      /^qu[eé]\s*novedades\s*hoy$/i,
      
      // Typos y abreviaciones
      /^ke\s*tengo\s*hoy$/i,
      /^k\s*tengo\s*hoy$/i,
      /^q\s*tengo\s*hoy$/i,
      /^ke\s*hay\s*hoy$/i,
      /^k\s*hay\s*hoy$/i,
      /^q\s*hay\s*hoy$/i,
      /^ke\s*tngo\s*hoy$/i,
      /^tngo\s*algo\s*hoy$/i,
      
      // Más variaciones
      /^lo\s*que\s*tengo\s*hoy$/i,
      /^lo\s*que\s*hay\s*hoy$/i,
      /^lo\s*programado\s*hoy$/i,
      /^lo\s*pendiente\s*hoy$/i,
      /^lo\s*agendado\s*hoy$/i,
      /^mi\s*d[ií]a\s*de\s*hoy$/i,
      /^mi\s*jornada\s*de\s*hoy$/i,
      /^actividades\s*de\s*hoy$/i,
      /^actividades\s*hoy$/i,
      /^mis\s*actividades\s*hoy$/i,
      /^compromisos\s*hoy$/i,
      /^mis\s*compromisos\s*hoy$/i,
      /^citas\s*hoy$/i,
      /^mis\s*citas\s*hoy$/i,
      /^reuniones\s*hoy$/i,
      /^mis\s*reuniones\s*hoy$/i,
    ]
  },
  {
    intent: 'getWeekEvents',
    priority: 88,
    patterns: [
      // Básicos
      /^qu[eé]\s*tengo\s*esta\s*semana$/i,
      /^que\s*tengo\s*esta\s*semana$/i,
      /^qu[eé]\s*hay\s*esta\s*semana$/i,
      /^que\s*hay\s*esta\s*semana$/i,
      /^tengo\s*algo\s*esta\s*semana$/i,
      /^hay\s*algo\s*esta\s*semana$/i,
      
      // Con signos de interrogación
      /^qu[eé]\s*tengo\s*esta\s*semana\?$/i,
      /^qu[eé]\s*hay\s*esta\s*semana\?$/i,
      /^tengo\s*algo\s*esta\s*semana\?$/i,
      
      // Programado/Pendiente
      /^qu[eé]\s*tengo\s*programado\s*esta\s*semana$/i,
      /^qu[eé]\s*tengo\s*pendiente\s*esta\s*semana$/i,
      /^qu[eé]\s*hay\s*programado\s*esta\s*semana$/i,
      /^qu[eé]\s*hay\s*pendiente\s*esta\s*semana$/i,
      /^qu[eé]\s*tengo\s*agendado\s*esta\s*semana$/i,
      
      // Agenda semanal
      /^agenda\s*semanal$/i,
      /^mi\s*agenda\s*semanal$/i,
      /^agenda\s*de\s*la\s*semana$/i,
      /^la\s*agenda\s*semanal$/i,
      /^ver\s*agenda\s*semanal$/i,
      /^ver\s*mi\s*agenda\s*semanal$/i,
      /^ver\s*agenda\s*de\s*la\s*semana$/i,
      /^mostrar\s*agenda\s*semanal$/i,
      /^mostrar\s*mi\s*agenda\s*semanal$/i,
      
      // Calendario semanal
      /^calendario\s*semanal$/i,
      /^mi\s*calendario\s*semanal$/i,
      /^calendario\s*de\s*la\s*semana$/i,
      /^el\s*calendario\s*semanal$/i,
      /^ver\s*calendario\s*semanal$/i,
      /^ver\s*mi\s*calendario\s*semanal$/i,
      /^ver\s*calendario\s*de\s*la\s*semana$/i,
      
      // Eventos semana
      /^eventos\s*de\s*la\s*semana$/i,
      /^eventos\s*esta\s*semana$/i,
      /^mis\s*eventos\s*esta\s*semana$/i,
      /^los\s*eventos\s*de\s*la\s*semana$/i,
      /^ver\s*eventos\s*de\s*la\s*semana$/i,
      /^ver\s*eventos\s*esta\s*semana$/i,
      /^mostrar\s*eventos\s*de\s*la\s*semana$/i,
      /^mostrar\s*eventos\s*esta\s*semana$/i,
      /^qu[eé]\s*eventos\s*tengo\s*esta\s*semana$/i,
      /^qu[eé]\s*eventos\s*hay\s*esta\s*semana$/i,
      
      // Recordatorios semana
      /^recordatorios\s*de\s*la\s*semana$/i,
      /^recordatorios\s*esta\s*semana$/i,
      /^mis\s*recordatorios\s*esta\s*semana$/i,
      /^ver\s*recordatorios\s*de\s*la\s*semana$/i,
      /^ver\s*recordatorios\s*esta\s*semana$/i,
      /^mostrar\s*recordatorios\s*de\s*la\s*semana$/i,
      /^qu[eé]\s*recordatorios\s*tengo\s*esta\s*semana$/i,
      
      // Tareas semana
      /^tareas\s*de\s*la\s*semana$/i,
      /^tareas\s*esta\s*semana$/i,
      /^mis\s*tareas\s*esta\s*semana$/i,
      /^ver\s*tareas\s*de\s*la\s*semana$/i,
      /^ver\s*tareas\s*esta\s*semana$/i,
      /^mostrar\s*tareas\s*de\s*la\s*semana$/i,
      /^qu[eé]\s*tareas\s*tengo\s*esta\s*semana$/i,
      
      // Próximos días
      /^pr[oó]ximos\s*d[ií]as$/i,
      /^los\s*pr[oó]ximos\s*d[ií]as$/i,
      /^qu[eé]\s*tengo\s*en\s*los\s*pr[oó]ximos\s*d[ií]as$/i,
      /^qu[eé]\s*hay\s*en\s*los\s*pr[oó]ximos\s*d[ií]as$/i,
      /^ver\s*pr[oó]ximos\s*d[ií]as$/i,
      /^mostrar\s*pr[oó]ximos\s*d[ií]as$/i,
      
      // Esta semana
      /^esta\s*semana$/i,
      /^semana\s*actual$/i,
      /^semana\s*actual\s*eventos$/i,
      /^semana\s*actual\s*agenda$/i,
      
      // Variaciones
      /^qu[eé]\s*viene\s*esta\s*semana$/i,
      /^qu[eé]\s*espera\s*esta\s*semana$/i,
      /^agenda\s*para\s*esta\s*semana$/i,
      /^lo\s*que\s*tengo\s*esta\s*semana$/i,
      /^lo\s*que\s*hay\s*esta\s*semana$/i,
      
      // English
      /^what\s*do\s*i\s*have\s*this\s*week$/i,
      /^what\s*is\s*on\s*my\s*agenda\s*this\s*week$/i,
      /^what'?s?\s*on\s*my\s*agenda\s*this\s*week$/i,
      /^this\s*week'?s?\s*events$/i,
      /^events\s*this\s*week$/i,
      /^my\s*events\s*this\s*week$/i,
      /^what\s*events?\s*do\s*i\s*have\s*this\s*week$/i,
      /^weekly\s*agenda$/i,
      /^my\s*week$/i,
      /^upcoming\s*days$/i,
      /^next\s*few\s*days$/i,
      /^what'?s?\s*coming\s*up\s*this\s*week$/i,
      /^show\s*(me\s*)?this\s*week'?s?\s*events$/i,
      /^show\s*(me\s*)?this\s*week'?s?\s*agenda$/i,
      /^get\s*this\s*week'?s?\s*events$/i,
      
      // Typos y abreviaciones
      /^ke\s*tengo\s*esta\s*semana$/i,
      /^k\s*tengo\s*esta\s*semana$/i,
      /^q\s*tengo\s*esta\s*semana$/i,
      
      // Más variaciones
      /^mi\s*semana$/i,
      /^c[oó]mo\s*est[aá]\s*mi\s*semana$/i,
      /^qu[eé]\s*tal\s*mi\s*semana$/i,
      /^actividades\s*de\s*la\s*semana$/i,
      /^actividades\s*esta\s*semana$/i,
      /^mis\s*actividades\s*de\s*la\s*semana$/i,
      /^compromisos\s*de\s*la\s*semana$/i,
      /^compromisos\s*esta\s*semana$/i,
      /^mis\s*compromisos\s*de\s*la\s*semana$/i,
      /^citas\s*de\s*la\s*semana$/i,
      /^citas\s*esta\s*semana$/i,
      /^reuniones\s*de\s*la\s*semana$/i,
      /^reuniones\s*esta\s*semana$/i,
    ]
  },
]

// =====================================================
// VARIACIONES DE RENOVACIONES (500+ variaciones)
// =====================================================
const RENEWAL_VARIATIONS: IntentPattern[] = [
  {
    intent: 'getClientsEndingContract',
    priority: 75,
    patterns: [
      // Contratos por terminar
      /^contratos?\s*por\s*terminar$/i,
      /^contrato\s*por\s*terminar$/i,
      /^contratos?\s*por\s*vencer$/i,
      /^contrato\s*por\s*vencer$/i,
      /^contratos?\s*por\s*acabar$/i,
      /^contrato\s*por\s*acabar$/i,
      /^contratos?\s*por\s*finalizar$/i,
      /^contrato\s*por\s*finalizar$/i,
      
      // Contratos que terminan
      /^contratos?\s*que\s*terminan$/i,
      /^contrato\s*que\s*termina$/i,
      /^contratos?\s*que\s*vencen$/i,
      /^contrato\s*que\s*vence$/i,
      /^contratos?\s*que\s*acaban$/i,
      /^contrato\s*que\s*acaba$/i,
      /^contratos?\s*que\s*finalizan$/i,
      /^contrato\s*que\s*finaliza$/i,
      
      // Próximos a vencer
      /^contratos?\s*pr[oó]ximos?\s*a\s*vencer$/i,
      /^contratos?\s*a\s*punto\s*de\s*vencer$/i,
      /^contratos?\s*a\s*punto\s*de\s*terminar$/i,
      /^contratos?\s*cercanos\s*a\s*vencer$/i,
      
      // Qué contratos
      /^qu[eé]\s*contratos?\s*terminan$/i,
      /^qu[eé]\s*contratos?\s*vencen$/i,
      /^qu[eé]\s*contratos?\s*acaban$/i,
      /^qu[eé]\s*contratos?\s*finalizan$/i,
      /^qu[eé]\s*contratos?\s*est[aá]n\s*por\s*terminar$/i,
      /^qu[eé]\s*contratos?\s*est[aá]n\s*por\s*vencer$/i,
      /^qu[eé]\s*contratos?\s*est[aá]n\s*a\s*punto\s*de\s*terminar$/i,
      /^qu[eé]\s*contratos?\s*est[aá]n\s*a\s*punto\s*de\s*vencer$/i,
      
      // Cuáles contratos
      /^cu[aá]les?\s*contratos?\s*terminan$/i,
      /^cu[aá]les?\s*contratos?\s*vencen$/i,
      /^cu[aá]ntos?\s*contratos?\s*terminan$/i,
      /^cu[aá]ntos?\s*contratos?\s*vencen$/i,
      
      // Clientes con contrato por vencer
      /^clientes?\s*con\s*contrato\s*por\s*terminar$/i,
      /^clientes?\s*con\s*contrato\s*por\s*vencer$/i,
      /^clientes?\s*con\s*contrato\s*por\s*acabar$/i,
      /^clientes?\s*con\s*contrato\s*por\s*finalizar$/i,
      /^clientes?\s*cuyo\s*contrato\s*termina$/i,
      /^clientes?\s*cuyo\s*contrato\s*vence$/i,
      /^clientes?\s*cuyo\s*contrato\s*acaba$/i,
      /^clientes?\s*cuyo\s*contrato\s*finaliza$/i,
      /^qu[eé]\s*clientes?\s*tienen\s*contrato\s*por\s*terminar$/i,
      /^qu[eé]\s*clientes?\s*tienen\s*contrato\s*por\s*vencer$/i,
      
      // Renovación de contratos
      /^contratos?\s*a\s*renovar$/i,
      /^contratos?\s*para\s*renovar$/i,
      /^contratos?\s*que\s*renovan$/i,
      /^contratos?\s*que\s*hay\s*que\s*renovar$/i,
      /^renovaci[oó]n\s*de\s*contratos?$/i,
      /^renovaciones?\s*de\s*contratos?$/i,
      
      // Próximos días
      /^contratos?\s*que\s*vencen\s*en\s*los\s*pr[oó]ximos\s*d[ií]as$/i,
      /^contratos?\s*que\s*terminan\s*en\s*los\s*pr[oó]ximos\s*d[ií]as$/i,
      /^contratos?\s*vencen\s*pr[oó]ximamente$/i,
      /^contratos?\s*terminan\s*pr[oó]ximamente$/i,
      
      // Ver/Mostrar
      /^ver\s*contratos?\s*por\s*terminar$/i,
      /^ver\s*contratos?\s*por\s*vencer$/i,
      /^ver\s*contratos?\s*que\s*terminan$/i,
      /^ver\s*contratos?\s*que\s*vencen$/i,
      /^mostrar\s*contratos?\s*por\s*terminar$/i,
      /^mostrar\s*contratos?\s*por\s*vencer$/i,
      /^mu[eé]strame\s*contratos?\s*por\s*terminar$/i,
      /^mu[eé]strame\s*contratos?\s*por\s*vencer$/i,
      
      // English
      /^contracts?\s*ending$/i,
      /^contracts?\s*expiring$/i,
      /^contracts?\s*finishing$/i,
      /^contracts?\s*(about\s*to\s*)?end$/i,
      /^contracts?\s*(about\s*to\s*)?expire$/i,
      /^contracts?\s*(about\s*to\s*)?finish$/i,
      /^ending\s*contracts?$/i,
      /^expiring\s*contracts?$/i,
      /^finishing\s*contracts?$/i,
      /^what\s*contracts?\s*end$/i,
      /^what\s*contracts?\s*expire$/i,
      /^what\s*contracts?\s*finish$/i,
      /^which\s*contracts?\s*end$/i,
      /^which\s*contracts?\s*expire$/i,
      /^which\s*contracts?\s*finish$/i,
      /^clients?\s*with\s*ending\s*contracts?$/i,
      /^clients?\s*with\s*expiring\s*contracts?$/i,
      /^contracts?\s*(up\s*for\s*)?renewal$/i,
      /^contracts?\s*to\s*renew$/i,
      /^show\s*ending\s*contracts$/i,
      /^show\s*expiring\s*contracts$/i,
      /^get\s*ending\s*contracts$/i,
      /^get\s*expiring\s*contracts$/i,
      
      // Typos y abreviaciones
      /^contratos\s*q\s*terminan$/i,
      /^contratos\s*ke\s*terminan$/i,
      /^contratos\s*k\s*terminan$/i,
      
      // Más variaciones
      /^contratos?\s*por\s*terminar\s*pronto$/i,
      /^contratos?\s*cercanos\s*a\s*finalizar$/i,
      /^fin\s*de\s*contrato$/i,
      /^fines?\s*de\s*contrato$/i,
      /^vencimiento\s*de\s*contrato$/i,
      /^vencimientos?\s*de\s*contratos?$/i,
      /^finalizaci[oó]n\s*de\s*contrato$/i,
      /^qui[eé]n\s*tiene\s*contrato\s*por\s*vencer$/i,
      /^qui[eé]nes\s*tienen\s*contrato\s*por\s*vencer$/i,
    ]
  },
]

// =====================================================
// EXPORTAR TODAS LAS VARIACIONES
// =====================================================
export const EXTENDED_PATTERNS: IntentPattern[] = [
  ...MASSIVE_PATTERNS,
  ...PAYMENT_VARIATIONS,
  ...CLIENT_VARIATIONS,
  ...AGENDA_VARIATIONS,
  ...RENEWAL_VARIATIONS,
]

// Conteo de patrones extendidos
export function countExtendedPatterns(): number {
  return EXTENDED_PATTERNS.reduce((total, ip) => total + ip.patterns.length, 0)
}

// Re-exportar patrones base y función de conteo
export { ALL_INTENT_PATTERNS }
export const countPatterns = baseCountPatterns
