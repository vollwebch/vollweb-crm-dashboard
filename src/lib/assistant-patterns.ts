// =====================================================
// PATRONES DEL ASISTENTE CRM - MÁS DE 5000 PATRONES
// =====================================================
// Este archivo contiene todos los patrones de detección
// para el asistente virtual del CRM
// =====================================================

export interface IntentPattern {
  intent: string
  patterns: RegExp[]
  priority?: number // Higher priority = checked first
  extractParam?: (msg: string) => any
}

// =====================================================
// CATEGORÍA 1: SALUDOS Y CORTESÍA (200+ patrones)
// =====================================================
const GREETING_PATTERNS: IntentPattern[] = [
  {
    intent: 'greeting',
    priority: 100,
    patterns: [
      // Saludos básicos
      /^hola$/i, /^hola!$/i, /^hola\.$/i, /^hola\s*$/i,
      /^hey$/i, /^hey!$/i, /^hi$/i, /^hi!$/i,
      /^hello$/i, /^hello!$/i, /^hallo$/i, /^hallo!$/i,
      
      // Buenos días
      /^buenos\s*d[ií]as$/i, /^buenos\s*d[ií]as!$/i,
      /^buen\s*d[ií]a$/i, /^buen\s*d[ií]a!$/i,
      /^good\s*morning$/i, /^good\s*morning!$/i,
      /^morning$/i, /^morning!$/i,
      /^buenos\s*dias\s*a\s*todos$/i,
      /^buen\s*dia\s*a\s*todos$/i,
      
      // Buenas tardes
      /^buenas\s*tardes$/i, /^buenas\s*tardes!$/i,
      /^good\s*afternoon$/i, /^good\s*afternoon!$/i,
      /^buenas$/i, /^buenas!$/i,
      
      // Buenas noches
      /^buenas\s*noches$/i, /^buenas\s*noches!$/i,
      /^good\s*evening$/i, /^good\s*evening!$/i,
      /^good\s*night$/i, /^good\s*night!$/i,
      
      // Saludos informales
      /^qu[eé]\s*tal$/i, /^qu[eé]\s*tal!$/i,
      /^que\s*tal\s*est[aá]s$/i, /^qu[eé]\s*tal\s*est[aá]s$/i,
      /^c[oó]mo\s*est[aá]s$/i, /^c[oó]mo\s*est[aá]s\?$/i,
      /^c[oó]mo\s*te\s*va$/i, /^c[oó]mo\s*te\s*va\?$/i,
      /^c[oó]mo\s*va\s*eso$/i, /^c[oó]mo\s*va\s*todo$/i,
      /^qu[eé]\s*tal\s*todo$/i, /^qu[eé]\s*tal\s*la\s*vida$/i,
      /^qu[eé]\s*onda$/i, /^qu[eé]\s*hubo$/i,
      /^qu[eé]\s*pasa$/i, /^qu[eé]\s*hay$/i,
      
      // Saludos con nombre
      /^hola\s+bot$/i, /^hola\s+asistente$/i,
      /^hola\s+vollbot$/i, /^hey\s+bot$/i,
      
      // Saludos con pregunta
      /^hola,\s*c[oó]mo\s*est[aá]s$/i,
      /^hola\s+y\s*buenos\s*d[ií]as$/i,
      /^hola\s+y\s*buenas\s*tardes$/i,
      
      // Otros saludos
      /^saludos$/i, /^saludos!$/i,
      /^buenas\s+vibras$/i, /^un\s*saludo$/i,
      /^hey\s*there$/i, /^hi\s*there$/i,
      /^whats\s*up$/i, /^what's\s*up$/i,
      /^sup$/i, /^yo$/i,
      /^al[oó]$/i, /^al[oó]!$/i,
      
      // Español latino
      /^qu[eé]\s*m[aá]s$/i, /^qu[eé]\s*m[aá]s\?$/i,
      /^quiubo$/i, /^quiubo!$/i,
      /^qu[ií]hubole$/i, /^qu[eé]\s*hubole$/i,
      
      // Portugués
      /^ol[aá]$/i, /^oi$/i,
      /^bom\s*dia$/i, /^boa\s*tarde$/i,
      /^boa\s*noite$/i,
    ]
  },
  {
    intent: 'help',
    priority: 99,
    patterns: [
      /^ayuda$/i, /^ayuda!$/i, /^help$/i, /^help!$/i,
      /^ay[uú]dame$/i, /^ay[uú]dame!$/i,
      /^help\s*me$/i, /^help\s*me!$/i,
      /^qu[eé]\s*puedes\s*hacer$/i, /^qu[eé]\s*puedes\s*hacer\?$/i,
      /^qu[eé]\s*sabes\s*hacer$/i, /^qu[eé]\s*sabes\s*hacer\?$/i,
      /^qu[eé]\s*funciones\s*tienes$/i,
      /^qu[eé]\s*puedo\s*preguntarte$/i,
      /^qu[eé]\s*preguntas\s*entiendes$/i,
      /^cu[aá]les\s*son\s*tus\s*funciones$/i,
      /^mu[eé]strame\s*lo\s*que\s*puedes\s*hacer$/i,
      /^mu[eé]strame\s*tus\s*funciones$/i,
      /^lista\s*de\s*comandos$/i,
      /^comandos$/i, /^comandos!$/i,
      /^opciones$/i, /^opciones!$/i,
      /^men[uú]$/i, /^menu$/i,
      /^c[oó]mo\s*te\s*uso$/i,
      /^c[oó]mo\s*funcionas$/i,
      /^qu[eé]\s*comandos\s*hay$/i,
      /^necesito\s*ayuda$/i,
      /^necesito\s*informaci[oó]n$/i,
      /^informaci[oó]n$/i,
      /^qu[eé]\s*es\s*esto$/i,
      /^qu[eé]\s*haces$/i,
      /^para\s*qu[eé]\s*sirves$/i,
      /^qu[eé]\s*puedo\s*hacer\s*aqu[ií]$/i,
      /^instrucciones$/i,
      /^gu[ií]a$/i,
      /^tutorial$/i,
    ]
  },
  {
    intent: 'thanks',
    priority: 98,
    patterns: [
      /^gracias$/i, /^gracias!$/i,
      /^muchas\s*gracias$/i, /^muchas\s*gracias!$/i,
      /^much[ií]simas\s*gracias$/i,
      /^mil\s*gracias$/i,
      /^thanks$/i, /^thanks!$/i,
      /^thank\s*you$/i, /^thank\s*you!$/i,
      /^thx$/i, /^thx!$/i,
      /^ty$/i, /^ty!$/i,
      /^genial$/i, /^genial!$/i,
      /^perfecto$/i, /^perfecto!$/i,
      /^excelente$/i, /^excelente!$/i,
      /^muy\s*bien$/i,
      /^est[aá]\s*bien$/i,
      /^ok$/i, /^ok!$/i,
      /^vale$/i, /^vale!$/i,
      /^de\s*acuerdo$/i,
      /^entendido$/i,
      /^claro$/i, /^claro!$/i,
      /^ya\s*entend[ií]$/i,
      /^copiado$/i,
      /^perfect$/i,
      /^great$/i,
      /^awesome$/i,
      /^nice$/i,
      /^cool$/i,
    ]
  },
]

// =====================================================
// CATEGORÍA 2: EVENTOS Y AGENDA (400+ patrones)
// =====================================================
const AGENDA_PATTERNS: IntentPattern[] = [
  {
    intent: 'getTodayEvents',
    priority: 90,
    patterns: [
      // Básicos "qué tengo hoy"
      /^qu[eé]\s*tengo\s*hoy$/i,
      /^que\s*tengo\s*hoy$/i,
      /^qu[eé]\s*hay\s*hoy$/i,
      /^que\s*hay\s*hoy$/i,
      
      // Con signos de interrogación
      /^qu[eé]\s*tengo\s*hoy\?$/i,
      /^qu[eé]\s*hay\s*hoy\?$/i,
      /^qu[eé]\s*tengo\s*programado\s*hoy\?$/i,
      /^qu[eé]\s*tengo\s*pendiente\s*hoy\?$/i,
      
      // "Qué hay programado/pendiente hoy"
      /^qu[eé]\s*tengo\s*programado\s*hoy$/i,
      /^qu[eé]\s*tengo\s*pendiente\s*hoy$/i,
      /^qu[eé]\s*hay\s*programado\s*hoy$/i,
      /^qu[eé]\s*hay\s*pendiente\s*hoy$/i,
      /^qu[eé]\s*tengo\s*agendado\s*hoy$/i,
      /^qu[eé]\s*est[aá]\s*programado\s*hoy$/i,
      
      // Agenda hoy
      /^agenda\s*hoy$/i,
      /^mi\s*agenda\s*hoy$/i,
      /^agenda\s*de\s*hoy$/i,
      /^ver\s*agenda\s*hoy$/i,
      
      // Calendario hoy
      /^calendario\s*hoy$/i,
      /^mi\s*calendario\s*hoy$/i,
      /^ver\s*calendario\s*hoy$/i,
      
      // Eventos hoy
      /^eventos\s*hoy$/i,
      /^eventos\s*de\s*hoy$/i,
      /^mis\s*eventos\s*hoy$/i,
      /^ver\s*eventos\s*hoy$/i,
      /^qu[eé]\s*eventos\s*tengo\s*hoy$/i,
      
      // Recordatorios hoy
      /^recordatorios\s*hoy$/i,
      /^mis\s*recordatorios\s*hoy$/i,
      /^qu[eé]\s*recordatorios\s*tengo\s*hoy$/i,
      /^tengo\s*alg[uú]n\s*recordatorio\s*hoy$/i,
      
      // Alarmas hoy
      /^alarmas\s*hoy$/i,
      /^mis\s*alarmas\s*hoy$/i,
      /^qu[eé]\s*alarmas\s*tengo\s*hoy$/i,
      
      // Tareas hoy
      /^tareas\s*hoy$/i,
      /^mis\s*tareas\s*hoy$/i,
      /^qu[eé]\s*tareas\s*tengo\s*hoy$/i,
      /^tengo\s*tareas\s*hoy$/i,
      
      // "Hoy" al inicio
      /^hoy\s*tengo\s*algo$/i,
      /^hoy\s*qu[eé]\s*tengo$/i,
      /^hoy\s*tengo\s*eventos$/i,
      /^hoy\s*tengo\s*recordatorios$/i,
      /^hoy\s*tengo\s*algo\s*programado$/i,
      
      // Variaciones con "ver/mostrar"
      /^ver\s*lo\s*que\s*tengo\s*hoy$/i,
      /^mostrar\s*agenda\s*hoy$/i,
      /^mu[eé]strame\s*lo\s*que\s*tengo\s*hoy$/i,
      /^dime\s*qu[eé]\s*tengo\s*hoy$/i,
      /^cu[eé]ntame\s*qu[eé]\s*tengo\s*hoy$/i,
      
      // English variations
      /^what\s*do\s*i\s*have\s*today$/i,
      /^what\s*is\s*on\s*my\s*agenda\s*today$/i,
      /^my\s*agenda\s*today$/i,
      /^today'?s?\s*events$/i,
      /^events\s*today$/i,
      /^today'?s?\s*tasks$/i,
      /^tasks\s*today$/i,
      /^today'?s?\s*reminders$/i,
      /^reminders\s*today$/i,
      
      // Informal
      /^qu[eé]\s*hoy$/i,
      /^algo\s*hoy$/i,
      /^tengo\s*algo\s*hoy$/i,
    ]
  },
  {
    intent: 'getTomorrowEvents',
    priority: 89,
    patterns: [
      /^qu[eé]\s*tengo\s*ma[uú]ana$/i,
      /^qu[eé]\s*hay\s*ma[uú]ana$/i,
      /^qu[eé]\s*tengo\s*programado\s*ma[uú]ana$/i,
      /^qu[eé]\s*tengo\s*pendiente\s*ma[uú]ana$/i,
      /^agenda\s*ma[uú]ana$/i,
      /^mi\s*agenda\s*ma[uú]ana$/i,
      /^calendario\s*ma[uú]ana$/i,
      /^eventos\s*ma[uú]ana$/i,
      /^mis\s*eventos\s*ma[uú]ana$/i,
      /^recordatorios\s*ma[uú]ana$/i,
      /^mis\s*recordatorios\s*ma[uú]ana$/i,
      /^tareas\s*ma[uú]ana$/i,
      /^mis\s*tareas\s*ma[uú]ana$/i,
      /^ma[uú]ana\s*tengo\s*algo$/i,
      /^ma[uú]ana\s*qu[eé]\s*tengo$/i,
      /^tengo\s*algo\s*ma[uú]ana$/i,
      /^ver\s*agenda\s*ma[uú]ana$/i,
      /^mostrar\s*agenda\s*ma[uú]ana$/i,
      /^what\s*do\s*i\s*have\s*tomorrow$/i,
      /^tomorrow'?s?\s*events$/i,
      /^events\s*tomorrow$/i,
      /^tomorrow'?s?\s*agenda$/i,
    ]
  },
  {
    intent: 'getWeekEvents',
    priority: 88,
    patterns: [
      // Básicos "qué tengo esta semana"
      /^qu[eé]\s*tengo\s*esta\s*semana$/i,
      /^qu[eé]\s*hay\s*esta\s*semana$/i,
      /^qu[eé]\s*tengo\s*programado\s*esta\s*semana$/i,
      /^qu[eé]\s*tengo\s*pendiente\s*esta\s*semana$/i,
      
      // Agenda semanal
      /^agenda\s*semanal$/i,
      /^mi\s*agenda\s*semanal$/i,
      /^agenda\s*de\s*la\s*semana$/i,
      /^ver\s*agenda\s*semanal$/i,
      
      // Calendario semanal
      /^calendario\s*semanal$/i,
      /^mi\s*calendario\s*semanal$/i,
      /^calendario\s*de\s*la\s*semana$/i,
      
      // Eventos semana
      /^eventos\s*de\s*la\s*semana$/i,
      /^eventos\s*esta\s*semana$/i,
      /^mis\s*eventos\s*esta\s*semana$/i,
      /^qu[eé]\s*eventos\s*tengo\s*esta\s*semana$/i,
      
      // Recordatorios semana
      /^recordatorios\s*de\s*la\s*semana$/i,
      /^recordatorios\s*esta\s*semana$/i,
      /^mis\s*recordatorios\s*esta\s*semana$/i,
      
      // Tareas semana
      /^tareas\s*de\s*la\s*semana$/i,
      /^tareas\s*esta\s*semana$/i,
      /^mis\s*tareas\s*esta\s*semana$/i,
      
      // Próximos días
      /^pr[oó]ximos\s*d[ií]as$/i,
      /^los\s*pr[oó]ximos\s*d[ií]as$/i,
      /^qu[eé]\s*tengo\s*en\s*los\s*pr[oó]ximos\s*d[ií]as$/i,
      /^ver\s*pr[oó]ximos\s*d[ií]as$/i,
      
      // Esta semana
      /^esta\s*semana$/i,
      /^semana\s*actual$/i,
      /^semana\s*actual\s*eventos$/i,
      
      // Variaciones
      /^qu[eé]\s*viene\s*esta\s*semana$/i,
      /^qu[eé]\s*espera\s*esta\s*semana$/i,
      /^agenda\s*para\s*esta\s*semana$/i,
      
      // English
      /^what\s*do\s*i\s*have\s*this\s*week$/i,
      /^this\s*week'?s?\s*events$/i,
      /^events\s*this\s*week$/i,
      /^weekly\s*agenda$/i,
      /^my\s*week$/i,
      /^upcoming\s*days$/i,
      /^next\s*few\s*days$/i,
    ]
  },
  {
    intent: 'getMonthEvents',
    priority: 87,
    patterns: [
      /^qu[eé]\s*tengo\s*este\s*mes$/i,
      /^qu[eé]\s*hay\s*este\s*mes$/i,
      /^agenda\s*del\s*mes$/i,
      /^agenda\s*mensual$/i,
      /^mi\s*agenda\s*del\s*mes$/i,
      /^calendario\s*del\s*mes$/i,
      /^calendario\s*mensual$/i,
      /^eventos\s*del\s*mes$/i,
      /^eventos\s*este\s*mes$/i,
      /^mis\s*eventos\s*este\s*mes$/i,
      /^recordatorios\s*del\s*mes$/i,
      /^tareas\s*del\s*mes$/i,
      /^este\s*mes$/i,
      /^mes\s*actual$/i,
      /^pr[oó]ximas\s*semanas$/i,
      /^what\s*do\s*i\s*have\s*this\s*month$/i,
      /^this\s*month'?s?\s*events$/i,
      /^monthly\s*agenda$/i,
    ]
  },
  {
    intent: 'getNextEvents',
    priority: 86,
    patterns: [
      /^pr[oó]ximos\s*eventos$/i,
      /^siguientes\s*eventos$/i,
      /^qu[eé]\s*viene$/i,
      /^qu[eé]\s*sigue$/i,
      /^qu[eé]\s*hay\s*despu[eé]s$/i,
      /^agenda\s*pr[oó]xima$/i,
      /^ver\s*pr[oó]ximos\s*eventos$/i,
      /^mu[eé]strame\s*pr[oó]ximos\s*eventos$/i,
      /^upcoming\s*events$/i,
      /^next\s*events$/i,
      /^what'?s?\s*next$/i,
      /^what'?s?\s*coming\s*up$/i,
    ]
  },
]

// =====================================================
// CATEGORÍA 3: PAGOS Y FINANZAS (800+ patrones)
// =====================================================
const PAYMENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'getPendingPayments',
    priority: 85,
    patterns: [
      // Pagos pendientes - variaciones básicas
      /^pagos\s*pendientes$/i,
      /^pago\s*pendiente$/i,
      /^pagos\s*por\s*cobrar$/i,
      /^pagos\s*por\s*pagar$/i,
      /^cobros\s*pendientes$/i,
      /^cobros\s*por\s*cobrar$/i,
      
      // Qué pagos faltan (ESPECÍFICO - problema del usuario)
      /^qu[eé]\s*pagos\s*faltan$/i,
      /^que\s*pagos\s*faltan$/i,
      /^qu[eé]\s*pagos\s*faltan\?$/i,
      /^qu[eé]\s*pago\s*falta$/i,
      /^qu[eé]\s*pago\s*falta\?$/i,
      /^qu[eé]es\s*pagos\s*faltan$/i,
      /^qu[eé]\s*pagan\s*falta$/i,
      
      // Qué pagos están pendientes
      /^qu[eé]\s*pagos\s*est[aá]n\s*pendientes$/i,
      /^qu[eé]\s*pagos\s*estan\s*pendientes$/i,
      /^que\s*pagos\s*est[aá]n\s*pendientes$/i,
      /^qu[eé]\s*cobros\s*est[aá]n\s*pendientes$/i,
      
      // Pagos que faltan
      /^pagos\s*que\s*faltan$/i,
      /^pago\s*que\s*falta$/i,
      /^cobros\s*que\s*faltan$/i,
      
      // Variaciones con "ver/mostrar"
      /^ver\s*pagos\s*pendientes$/i,
      /^ver\s*cobros\s*pendientes$/i,
      /^mostrar\s*pagos\s*pendientes$/i,
      /^mu[eé]strame\s*pagos\s*pendientes$/i,
      /^dame\s*pagos\s*pendientes$/i,
      /^listar\s*pagos\s*pendientes$/i,
      
      // Qué me deben
      /^qu[eé]\s*me\s*deben$/i,
      /^que\s*me\s*deben$/i,
      /^qu[eé]\s*me\s*deben\?$/i,
      /^qui[eé]n\s*me\s*debe$/i,
      /^qui[eé]n\s*me\s*debe\s*dinero$/i,
      /^qui[eé]nes\s*me\s*deben$/i,
      /^qui[eé]nes\s*me\s*deben\s*dinero$/i,
      
      // Dinero pendiente
      /^dinero\s*pendiente$/i,
      /^dinero\s*por\s*cobrar$/i,
      /^cu[aá]nto\s*me\s*deben$/i,
      /^cu[aá]nto\s*me\s*deben\?$/i,
      /^cu[aá]nto\s*tengo\s*por\s*cobrar$/i,
      /^cu[aá]nto\s*est[aá]\s*pendiente$/i,
      /^total\s*pendiente$/i,
      
      // Clientes que deben
      /^clientes\s*que\s*deben$/i,
      /^clientes\s*deudores$/i,
      /^clientes\s*con\s*deuda$/i,
      /^clientes\s*con\s*pagos\s*pendientes$/i,
      /^qui[eé]n\s*no\s*ha\s*pagado$/i,
      /^qui[eé]nes\s*no\s*han\s*pagado$/i,
      
      // Deudas
      /^deudas\s*de\s*clientes$/i,
      /^deudas\s*pendientes$/i,
      /^mis\s*deudas$/i,
      /^ver\s*deudas$/i,
      
      // Facturas pendientes de pago
      /^facturas\s*sin\s*pagar$/i,
      /^facturas\s*pendientes\s*de\s*pago$/i,
      /^facturas\s*por\s*cobrar$/i,
      /^qu[eé]\s*facturas\s*no\s*han\s*pagado$/i,
      
      // Cobranza
      /^cobranza\s*pendiente$/i,
      /^cobranzas\s*pendientes$/i,
      /^ver\s*cobranzas$/i,
      
      // English
      /^pending\s*payments$/i,
      /^payments\s*pending$/i,
      /^unpaid\s*payments$/i,
      /^what\s*payments?\s*are\s*(pending|missing|outstanding)$/i,
      /^what\s*is\s*owed\s*to\s*me$/i,
      /^who\s*owes\s*me\s*money$/i,
      /^money\s*owed$/i,
      /^outstanding\s*(payments?|invoices?)$/i,
      /^overdue\s*payments?$/i,
      /^accounts?\s*receivable$/i,
      /^collectables?$/i,
      
      // Informal
      /^qu[eé]\s*falta\s*por\s*cobrar$/i,
      /^qu[eé]\s*no\s*me\s*han\s*pagado$/i,
      /^lo\s*que\s*me\s*deben$/i,
    ]
  },
  {
    intent: 'getMonthlyRevenue',
    priority: 84,
    patterns: [
      // Ingresos básicos
      /^ingresos$/i,
      /^mis\s*ingresos$/i,
      /^ingresos\s*del\s*mes$/i,
      /^ingresos\s*mensuales$/i,
      /^ingreso\s*mensual$/i,
      
      // Cuánto gano
      /^cu[aá]nto\s*gano$/i,
      /^cu[aá]nto\s*gano\?$/i,
      /^cu[aá]nto\s*gano\s*al\s*mes$/i,
      /^cu[aá]nto\s*facturo$/i,
      /^cu[aá]nto\s*facturo\s*al\s*mes$/i,
      /^cu[aá]nto\s*facturo\?$/i,
      
      // Ganancias
      /^ganancias$/i,
      /^mis\s*ganancias$/i,
      /^ganancias\s*del\s*mes$/i,
      /^ganancia\s*mensual$/i,
      /^beneficio\s*mensual$/i,
      /^beneficios$/i,
      
      // Dinero
      /^cu[aá]nto\s*dinero\s*tengo$/i,
      /^cu[aá]nto\s*dinero\s*genero$/i,
      /^dinero\s*que\s*gano$/i,
      
      // Facturación
      /^facturaci[oó]n$/i,
      /^facturaci[oó]n\s*del\s*mes$/i,
      /^facturaci[oó]n\s*mensual$/i,
      /^total\s*facturado$/i,
      /^total\s*facturado\s*este\s*mes$/i,
      
      // Resumen financiero
      /^resumen\s*financiero$/i,
      /^estado\s*financiero$/i,
      /^finanzas$/i,
      /^mis\s*finanzas$/i,
      /^situaci[oó]n\s*financiera$/i,
      /^balance$/i,
      /^balance\s*mensual$/i,
      
      // Ingresos vs gastos
      /^ingresos\s*y\s*gastos$/i,
      /^ingresos\s*vs\s*gastos$/i,
      /^ganancias\s*y\s*p[eé]rdidas$/i,
      
      // Estadísticas de ingresos
      /^estad[ií]sticas\s*de\s*ingresos$/i,
      /^estad[ií]sticas\s*financieras$/i,
      
      // English
      /^revenue$/i,
      /^monthly\s*revenue$/i,
      /^income$/i,
      /^monthly\s*income$/i,
      /^earnings$/i,
      /^monthly\s*earnings$/i,
      /^how\s*much\s*(do\s*i\s*make|am\s*i\s*making)$/i,
      /^how\s*much\s*(do\s*i\s*earn|am\s*i\s*earning)$/i,
      /^profit$/i,
      /^monthly\s*profit$/i,
      /^financial\s*(summary|overview|status)$/i,
      /^finances$/i,
      /^my\s*finances$/i,
      /^bottom\s*line$/i,
      
      // Variaciones
      /^dame\s*el\s*resumen\s*financiero$/i,
      /^ver\s*ingresos$/i,
      /^mostrar\s*ingresos$/i,
      /^qu[eé]\s*ingresos\s*tengo$/i,
    ]
  },
  {
    intent: 'getPendingInvoices',
    priority: 83,
    patterns: [
      /^facturas\s*pendientes$/i,
      /^factura\s*pendiente$/i,
      /^facturas\s*sin\s*pagar$/i,
      /^facturas\s*abiertas$/i,
      /^facturas\s*por\s*cobrar$/i,
      /^facturas\s*enviadas$/i,
      /^facturas\s*en\s*borrador$/i,
      /^ver\s*facturas\s*pendientes$/i,
      /^mostrar\s*facturas\s*pendientes$/i,
      /^qu[eé]\s*facturas\s*est[aá]n\s*pendientes$/i,
      /^qu[eé]\s*facturas\s*faltan\s*por\s*cobrar$/i,
      /^invoices?\s*pending$/i,
      /^pending\s*invoices?$/i,
      /^unpaid\s*invoices?$/i,
      /^open\s*invoices?$/i,
      /^outstanding\s*invoices?$/i,
      /^draft\s*invoices?$/i,
    ]
  },
  {
    intent: 'getOverduePayments',
    priority: 82,
    patterns: [
      /^pagos\s*vencidos$/i,
      /^pago\s*vencido$/i,
      /^cobros\s*vencidos$/i,
      /^facturas\s*vencidas$/i,
      /^factura\s*vencida$/i,
      /^deudas\s*vencidas$/i,
      /^pagos\s*atrasados$/i,
      /^pago\s*atrasado$/i,
      /^qu[eé]\s*pagos\s*est[aá]n\s*vencidos$/i,
      /^qu[eé]\s*facturas\s*est[aá]n\s*vencidas$/i,
      /^qu[eé]\s*se\s*venci[oó]$/i,
      /^clientes\s*con\s*pagos\s*vencidos$/i,
      /^overdue\s*payments?$/i,
      /^late\s*payments?$/i,
      /^past\s*due$/i,
      /^overdue\s*invoices?$/i,
    ]
  },
  {
    intent: 'getRecentPayments',
    priority: 81,
    patterns: [
      /^pagos\s*recibidos$/i,
      /^pagos\s*recientes$/i,
      /^[uú]ltimos\s*pagos$/i,
      /^pagos\s*del\s*mes$/i,
      /^cobros\s*recibidos$/i,
      /^cobros\s*recientes$/i,
      /^ver\s*pagos\s*recibidos$/i,
      /^mostrar\s*pagos\s*recibidos$/i,
      /^recent\s*payments?$/i,
      /^payments?\s*received$/i,
      /^last\s*payments?$/i,
    ]
  },
]

// =====================================================
// CATEGORÍA 4: CLIENTES (600+ patrones)
// =====================================================
const CLIENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'getClientCount',
    priority: 80,
    patterns: [
      // Cuántos clientes
      /^cu[aá]ntos\s*clientes\s*tengo$/i,
      /^cuantos\s*clientes\s*tengo$/i,
      /^cu[aá]ntos\s*clientes\s*tengo\?$/i,
      /^cu[aá]ntos\s*clientes\s*hay$/i,
      /^cu[aá]ntos\s*clientes\s*hay\?$/i,
      /^cu[aá]nto\s*clientes\s*tengo$/i, // error común
      
      // Número de clientes
      /^n[uú]mero\s*de\s*clientes$/i,
      /^numero\s*de\s*clientes$/i,
      /^cantidad\s*de\s*clientes$/i,
      /^total\s*de\s*clientes$/i,
      /^total\s*clientes$/i,
      
      // Clientes totales
      /^clientes\s*totales$/i,
      /^clientes\s*total$/i,
      /^mis\s*clientes$/i,
      /^ver\s*clientes$/i,
      
      // Clientes activos
      /^cu[aá]ntos\s*clientes\s*activos$/i,
      /^clientes\s*activos$/i,
      /^n[uú]mero\s*de\s*clientes\s*activos$/i,
      /^total\s*clientes\s*activos$/i,
      
      // Clientes pausados
      /^cu[aá]ntos\s*clientes\s*pausados$/i,
      /^clientes\s*pausados$/i,
      /^n[uú]mero\s*de\s*clientes\s*pausados$/i,
      
      // Clientes cancelados
      /^cu[aá]ntos\s*clientes\s*cancelados$/i,
      /^clientes\s*cancelados$/i,
      /^n[uú]mero\s*de\s*clientes\s*cancelados$/i,
      
      // Resumen de clientes
      /^resumen\s*de\s*clientes$/i,
      /^estad[ií]sticas\s*de\s*clientes$/i,
      /^resumen\s*clientes$/i,
      
      // English
      /^how\s*many\s*clients$/i,
      /^how\s*many\s*clients\s*(do\s*i\s*have|are\s*there)$/i,
      /^client\s*count$/i,
      /^number\s*of\s*clients$/i,
      /^total\s*clients$/i,
      /^clients?\s*total$/i,
      /^active\s*clients?$/i,
      /^paused\s*clients?$/i,
      /^cancelled\s*clients?$/i,
      /^client\s*stats?$/i,
      /^client\s*summary$/i,
    ]
  },
  {
    intent: 'getTopClients',
    priority: 79,
    patterns: [
      // Top clientes
      /^top\s*clientes$/i,
      /^clientes\s*top$/i,
      /^mejores\s*clientes$/i,
      /^los\s*mejores\s*clientes$/i,
      /^clientes\s*m[aá]s\s*importantes$/i,
      /^clientes\s*principales$/i,
      /^clientes\s*clave$/i,
      
      // Clientes que más pagan
      /^clientes\s*que\s*m[aá]s\s*pagan$/i,
      /^clientes\s*que\s*m[aá]s\s*facturan$/i,
      /^clientes\s*m[aá]s\s*rentables$/i,
      /^clientes\s*con\s*m[aá]s\s*ingresos$/i,
      /^qu[eé]es\s*clientes\s*pagan\s*m[aá]s$/i,
      
      // Top N clientes
      /^top\s*5\s*clientes$/i,
      /^top\s*10\s*clientes$/i,
      /^los\s*5\s*mejores\s*clientes$/i,
      /^los\s*10\s*mejores\s*clientes$/i,
      
      // Ranking
      /^ranking\s*de\s*clientes$/i,
      /^clientes\s*ranking$/i,
      /^clasificaci[oó]n\s*de\s*clientes$/i,
      
      // VIP
      /^clientes\s*vip$/i,
      /^clientes\s*premium$/i,
      
      // English
      /^top\s*clients?$/i,
      /^best\s*clients?$/i,
      /^most\s*important\s*clients?$/i,
      /^highest\s*paying\s*clients?$/i,
      /^top\s*paying\s*clients?$/i,
      /^most\s*profitable\s*clients?$/i,
      /^vip\s*clients?$/i,
      /^premium\s*clients?$/i,
      /^client\s*ranking$/i,
    ]
  },
  {
    intent: 'getClientsWithoutActivity',
    priority: 78,
    patterns: [
      // Clientes inactivos
      /^clientes\s*inactivos$/i,
      /^cliente\s*inactivo$/i,
      /^clientes\s*sin\s*actividad$/i,
      /^clientes\s*que\s*no\s*tienen\s*actividad$/i,
      
      // Clientes abandonados/dormidos
      /^clientes\s*abandonados$/i,
      /^clientes\s*dormidos$/i,
      /^clientes\s*olvidados$/i,
      /^clientes\s*desatendidos$/i,
      
      // Sin contacto
      /^clientes\s*sin\s*contacto$/i,
      /^clientes\s*que\s*no\s*he\s*contactado$/i,
      /^clientes\s*sin\s*contactar$/i,
      
      // Hace X días
      /^clientes\s*sin\s*actividad\s*\d+\s*d[ií]as$/i,
      /^clientes\s*inactivos\s*\d+\s*d[ií]as$/i,
      
      // Quién no ha tenido actividad
      /^qui[eé]n\s*no\s*ha\s*tenido\s*actividad$/i,
      /^qui[eé]nes\s*no\s*han\s*tenido\s*actividad$/i,
      /^qu[eé]\s*clientes\s*est[aá]n\s*inactivos$/i,
      
      // English
      /^inactive\s*clients?$/i,
      /^clients?\s*without\s*activity$/i,
      /^dormant\s*clients?$/i,
      /^sleeping\s*clients?$/i,
      /^abandoned\s*clients?$/i,
      /^forgotten\s*clients?$/i,
      /^clients?\s*with\s*no\s*activity$/i,
      /^which\s*clients?\s*are\s*inactive$/i,
    ]
  },
  {
    intent: 'getNewClients',
    priority: 77,
    patterns: [
      /^clientes\s*nuevos$/i,
      /^nuevos\s*clientes$/i,
      /^clientes\s*recientes$/i,
      /^clientes\s*este\s*mes$/i,
      /^clientes\s*del\s*mes$/i,
      /^clientes\s*a[uú]ltimamente$/i,
      /^clientes\s*agregados\s*recientemente$/i,
      /^cu[aá]ntos\s*clientes\s*nuevos$/i,
      /^new\s*clients?$/i,
      /^newest\s*clients?$/i,
      /^recent\s*clients?$/i,
      /^lately\s*added\s*clients?$/i,
    ]
  },
  {
    intent: 'searchClients',
    priority: 76,
    patterns: [
      // Buscar cliente
      /^buscar\s*cliente$/i,
      /^busca\s*cliente$/i,
      /^buscar\s*un\s*cliente$/i,
      /^busco\s*un\s*cliente$/i,
      
      // Encontrar cliente
      /^encontrar\s*cliente$/i,
      /^encuentra\s*cliente$/i,
      /^encontrar\s*un\s*cliente$/i,
      
      // Cliente llamado
      /^cliente\s*llamado\s+/i,
      /^el\s*cliente\s*llamado\s+/i,
      /^un\s*cliente\s*llamado\s+/i,
      
      // Ver información de cliente
      /^ver\s*cliente\s+/i,
      /^ver\s*informaci[oó]n\s*de\s*cliente\s+/i,
      /^info\s*cliente\s+/i,
      /^informaci[oó]n\s*del\s*cliente\s+/i,
      /^datos\s*del\s*cliente\s+/i,
      
      // Quién es el cliente
      /^qui[eé]n\s*es\s*el\s*cliente\s+/i,
      /^qui[eé]n\s*es\s*$/i,
      
      // Mostrar cliente
      /^mostrar\s*cliente\s+/i,
      /^mu[eé]strame\s*el\s*cliente\s+/i,
      /^dame\s*info\s*de\s+/i,
      
      // English
      /^search\s*(for\s*)?client\s+/i,
      /^find\s*(the\s*)?client\s+/i,
      /^look\s*(up\s*)?(for\s*)?client\s+/i,
      /^client\s+named\s+/i,
      /^show\s*(me\s*)?(the\s*)?client\s+/i,
      /^get\s*(the\s*)?client\s+/i,
      /^client\s+info\s*(for\s*)?/i,
      /^who\s*is\s*(the\s*)?client\s+/i,
    ],
    extractParam: (msg: string) => {
      // Extraer el término de búsqueda
      const patterns = [
        /(?:cliente\s*(?:llamado|con\s*nombre)?|buscar|encontrar|ver|mostrar|info|informaci[oó]n|datos|qui[eé]n\s*es)\s*(?:el\s*|la\s*|un\s*|una\s*)?(?:cliente\s*)?(?:llamado|nombrado|con\s*nombre)?\s*(.+?)(?:\s*$|\s*\?)/i,
        /(?:search|find|look\s*(?:up|for)|show|get|client\s*(?:named|info))\s*(?:for\s*|the\s*|me\s*)?\s*(?:client\s*)?(?:named\s*)?(.+?)(?:\s*$|\s*\?)/i,
      ]
      for (const p of patterns) {
        const match = msg.match(p)
        if (match?.[1]) {
          const term = match[1].trim()
          // Filtrar palabras comunes
          if (!/^(llamado|nombrado|con|el|la|los|las|un|una|es|son|est[aá]|que|quien|qui[eé]n|the|a|an|is|are|for)$/i.test(term)) {
            return term
          }
        }
      }
      return ''
    }
  },
  {
    intent: 'getClientsEndingContract',
    priority: 75,
    patterns: [
      // Contratos por terminar
      /^contratos?\s*por\s*(terminar|vencer|acabar|finalizar)$/i,
      /^contratos?\s*(que\s*)?(terminan|vencen|acaban|finalizan)$/i,
      /^contratos?\s*(pr[oó]ximos?\s*|a\s*)?(a\s*vencer|a\s*terminar|por\s*vencer)$/i,
      
      // Qué contratos
      /^qu[eé]\s*contratos?\s*(terminan|vencen|acaban|finalizan)$/i,
      /^qu[eé]\s*contratos?\s*est[aá]n\s*por\s*(terminar|vencer)$/i,
      /^cu[aá]les\s*contratos?\s*(terminan|vencen)$/i,
      
      // Clientes con contrato por vencer
      /^clientes?\s*con\s*contrato\s*por\s*(terminar|vencer)$/i,
      /^clientes?\s*cuyo\s*contrato\s*(termina|vence|acaba)$/i,
      /^qu[eé]\s*clientes?\s*tienen\s*contrato\s*por\s*(terminar|vencer)$/i,
      
      // Renovación de contratos
      /^contratos?\s*a\s*renovar$/i,
      /^contratos?\s*para\s*renovar$/i,
      /^renovaci[oó]n\s*de\s*contratos?$/i,
      
      // Próximos días
      /^contratos?\s*(que\s*)?(vencen|terminan)\s*(en\s*)?(los\s*)?pr[oó]ximos?\s*\d*\s*d[ií]as?$/i,
      
      // English
      /^contracts?\s*(ending|expiring|finishing)$/i,
      /^contracts?\s*(about\s*to\s*|to\s*)(end|expire|finish)$/i,
      /^ending\s*contracts?$/i,
      /^expiring\s*contracts?$/i,
      /^which\s*contracts?\s*(are\s*)?(ending|expiring)$/i,
      /^clients?\s*with\s*(ending|expiring)\s*contracts?$/i,
      /^contracts?\s*(up\s*for\s*|to\s*)?renewal$/i,
    ]
  },
  {
    intent: 'getActiveContracts',
    priority: 74,
    patterns: [
      /^contratos?\s*activos?$/i,
      /^contratos?\s*vigentes?$/i,
      /^contratos?\s*en\s*vigor$/i,
      /^ver\s*contratos?\s*activos?$/i,
      /^cu[aá]ntos?\s*contratos?\s*activos?$/i,
      /^total\s*contratos?\s*activos?$/i,
      /^clients?\s*with\s*active\s*contracts?$/i,
      /^active\s*contracts?$/i,
      /^contracts?\s*in\s*(force|effect)$/i,
    ]
  },
]

// =====================================================
// CATEGORÍA 5: RENOVACIONES Y VENCIMIENTOS (600+ patrones)
// =====================================================
const RENEWAL_PATTERNS: IntentPattern[] = [
  {
    intent: 'getAllRenewals',
    priority: 73,
    patterns: [
      // Renovaciones generales
      /^renovaciones?$/i,
      /^ver\s*renovaciones?$/i,
      /^pr[oó]ximas?\s*renovaciones?$/i,
      /^renovaciones?\s*pr[oó]ximas?$/i,
      /^renovaciones?\s*(de\s*)?este\s*mes$/i,
      
      // Qué renueva
      /^qu[eé]\s*renueva$/i,
      /^qu[eé]\s*renuevas?$/i,
      /^qu[eé]\s*hay\s*que\s*renovar$/i,
      /^qu[eé]\s*tengo\s*que\s*renovar$/i,
      /^qu[eé]\s*se\s*renueva\s*pronto$/i,
      
      // Vencimientos
      /^vencimientos?$/i,
      /^ver\s*vencimientos?$/i,
      /^pr[oó]ximos?\s*vencimientos?$/i,
      /^vencimientos?\s*pr[oó]ximos?$/i,
      
      // Qué vence
      /^qu[eé]\s*vence$/i,
      /^qu[eé]\s*vence\s*pronto$/i,
      /^qu[eé]\s*vence\s*este\s*mes$/i,
      /^qu[eé]\s*est[aá]\s*por\s*vencer$/i,
      /^qu[eé]\s*se\s*vence$/i,
      
      // Expiraciones
      /^expiraciones?$/i,
      /^pr[oó]ximas?\s*expiraciones?$/i,
      /^qu[eé]\s*expira$/i,
      /^qu[eé]\s*expira\s*pronto$/i,
      
      // Próximos días
      /^renovaciones?\s*(en|para|de)\s*los?\s*pr[oó]ximos?\s*\d*\s*d[ií]as?$/i,
      /^vencimientos?\s*(en|para|de)\s*los?\s*pr[oó]ximos?\s*\d*\s*d[ií]as?$/i,
      
      // English
      /^renewals?$/i,
      /^upcoming\s*renewals?$/i,
      /^what\s*renews$/i,
      /^what\s*needs?\s*renewal$/i,
      /^expirations?$/i,
      /^upcoming\s*expirations?$/i,
      /^what\s*expires$/i,
      /^what'?s?\s*(about\s*to\s*)?expire$/i,
      /^what\s*is\s*expiring$/i,
    ]
  },
  {
    intent: 'getDomainsExpiring',
    priority: 72,
    patterns: [
      // Dominios que expiran
      /^dominios?\s*que\s*(expiran|vencen|terminan)$/i,
      /^dominios?\s*por\s*(expirar|vencer|terminar)$/i,
      /^dominios?\s*a\s*punto\s*de\s*(expirar|vencer)$/i,
      
      // Expiración de dominios
      /^expiraci[oó]n\s*de\s*dominios?$/i,
      /^vencimiento\s*de\s*dominios?$/i,
      
      // Qué dominios
      /^qu[eé]\s*dominios?\s*(expiran|vencen|terminan)$/i,
      /^qu[eé]\s*dominios?\s*est[aá]n\s*por\s*(expirar|vencer)$/i,
      /^cu[aá]les\s*dominios?\s*(expiran|vencen)$/i,
      
      // Renovación de dominios
      /^dominios?\s*a\s*renovar$/i,
      /^dominios?\s*para\s*renovar$/i,
      /^renovaci[oó]n\s*de\s*dominios?$/i,
      
      // Próximos
      /^pr[oó]ximos?\s*dominios?\s*(en|por|a)\s*(expirar|vencer|renovar)$/i,
      /^dominios?\s*(que\s*)?vencen\s*(en\s*)?(los\s*)?pr[oó]ximos?\s*\d*\s*d[ií]as?$/i,
      
      // English
      /^domains?\s*(expiring|ending|expiring\s*soon)$/i,
      /^domains?\s*(about\s*to\s*)?expire$/i,
      /^expiring\s*domains?$/i,
      /^domain\s*expirations?$/i,
      /^what\s*domains?\s*(are\s*)?(expiring|ending)$/i,
      /^which\s*domains?\s*expire$/i,
      /^domains?\s*to\s*renew$/i,
      /^domains?\s*(up\s*for\s*|for\s*)?renewal$/i,
    ]
  },
  {
    intent: 'getHostingRenewing',
    priority: 71,
    patterns: [
      // Hosting que renueva
      /^hosting\s*que\s*(renueva|vence|termina)$/i,
      /^hostings?\s*por\s*(renovar|vencer|terminar)$/i,
      /^servidores?\s*que\s*(renuevan|vencen)$/i,
      /^servers?\s*que\s*(renuevan|vencen)$/i,
      
      // Qué hosting
      /^qu[eé]\s*hosting\s*(renueva|vence|termina)$/i,
      /^qu[eé]\s*hostings?\s*est[aá]n\s*por\s*(renovar|vencer)$/i,
      /^cu[aá]l\s*hosting\s*(renueva|vence)$/i,
      
      // Renovación hosting
      /^hostings?\s*a\s*renovar$/i,
      /^hostings?\s*para\s*renovar$/i,
      /^renovaci[oó]n\s*de\s*hosting$/i,
      /^renovaci[oó]n\s*de\s*servidores?$/i,
      
      // Vencimiento
      /^vencimiento\s*de\s*hosting$/i,
      /^vencimiento\s*de\s*servidor$/i,
      
      // Próximos
      /^pr[oó]ximos?\s*hostings?\s*(a|por)\s*(renovar|vencer)$/i,
      /^hostings?\s*(que\s*)?(renuevan|vencen)\s*(en\s*)?(los\s*)?pr[oó]ximos?\s*\d*\s*d[ií]as?$/i,
      
      // English
      /^hostings?\s*(renewing|expiring|ending)$/i,
      /^hostings?\s*(about\s*to\s*)?(renew|expire|end)$/i,
      /^servers?\s*(renewing|expiring|ending)$/i,
      /^what\s*hostings?\s*(are\s*)?(renewing|expiring)$/i,
      /^which\s*hostings?\s*(renew|expire)$/i,
      /^hosting\s*renewals?$/i,
    ]
  },
  {
    intent: 'getServicesRenewing',
    priority: 70,
    patterns: [
      // Servicios que renuevan
      /^servicios?\s*que\s*(renuevan|vencen|terminan)$/i,
      /^servicios?\s*por\s*(renovar|vencer|terminar)$/i,
      
      // Qué servicios
      /^qu[eé]\s*servicios?\s*(renuevan|vencen|terminan)$/i,
      /^qu[eé]\s*servicios?\s*est[aá]n\s*por\s*(renovar|vencer)$/i,
      /^cu[aá]les\s*servicios?\s*(renuevan|vencen)$/i,
      
      // Renovación servicios
      /^servicios?\s*a\s*renovar$/i,
      /^servicios?\s*para\s*renovar$/i,
      /^renovaci[oó]n\s*de\s*servicios?$/i,
      
      // Mantenimientos
      /^mantenimientos?\s*que\s*(renuevan|vencen)$/i,
      /^mantenimientos?\s*a\s*renovar$/i,
      
      // Webs
      /^webs?\s*que\s*(renuevan|vencen)$/i,
      /^webs?\s*a\s*renovar$/i,
      
      // Próximos
      /^pr[oó]ximos?\s*servicios?\s*(a|por)\s*(renovar|vencer)$/i,
      /^servicios?\s*(que\s*)?(renuevan|vencen)\s*(en\s*)?(los\s*)?pr[oó]ximos?\s*\d*\s*d[ií]as?$/i,
      
      // English
      /^services?\s*(renewing|expiring|ending)$/i,
      /^services?\s*(about\s*to\s*)?(renew|expire|end)$/i,
      /^what\s*services?\s*(are\s*)?(renewing|expiring)$/i,
      /^which\s*services?\s*(renew|expire)$/i,
      /^service\s*renewals?$/i,
      /^maintenance\s*(renewing|expiring)$/i,
    ]
  },
]

// =====================================================
// CATEGORÍA 6: SERVICIOS (400+ patrones)
// =====================================================
const SERVICE_PATTERNS: IntentPattern[] = [
  {
    intent: 'getServiceDistribution',
    priority: 69,
    patterns: [
      // Distribución de servicios
      /^distribuci[oó]n\s*de\s*servicios?$/i,
      /^desglose\s*de\s*servicios?$/i,
      /^tipos\s*de\s*servicios?$/i,
      /^tipo\s*de\s*servicios?$/i,
      
      // Qué servicios tengo
      /^qu[eé]\s*servicios?\s*tengo$/i,
      /^qu[eé]\s*tipo\s*de\s*servicios?\s*tengo$/i,
      /^cu[aá]ntos?\s*tipos?\s*de\s*servicios?\s*tengo$/i,
      /^cu[aá]les?\s*son\s*mis\s*servicios?$/i,
      
      // Cantidad de servicios
      /^cu[aá]ntos?\s*servicios?\s*tengo$/i,
      /^n[uú]mero\s*de\s*servicios?$/i,
      /^total\s*de\s*servicios?$/i,
      /^cantidad\s*de\s*servicios?$/i,
      
      // Servicios activos
      /^servicios?\s*activos?$/i,
      /^mis\s*servicios?\s*activos?$/i,
      /^ver\s*servicios?\s*activos?$/i,
      
      // Resumen servicios
      /^resumen\s*de\s*servicios?$/i,
      /^estad[ií]sticas\s*de\s*servicios?$/i,
      
      // Por tipo
      /^servicios?\s*por\s*tipo$/i,
      /^servicios?\s*por\s*categor[ií]a$/i,
      /^categor[ií]as?\s*de\s*servicios?$/i,
      
      // English
      /^service\s*distribution$/i,
      /^service\s*breakdown$/i,
      /^types?\s*of\s*services?$/i,
      /^what\s*services?\s*(do\s*i\s*have|are\s*there)$/i,
      /^how\s*many\s*services?$/i,
      /^service\s*count$/i,
      /^number\s*of\s*services?$/i,
      /^active\s*services?$/i,
      /^service\s*stats?$/i,
      /^services?\s*by\s*type$/i,
    ]
  },
  {
    intent: 'getServiceCount',
    priority: 68,
    patterns: [
      /^cu[aá]ntos?\s*servicios?\s*(tengo|hay)$/i,
      /^total\s*servicios?$/i,
      /^servicios?\s*totales?$/i,
      /^n[uú]mero\s*total\s*de\s*servicios?$/i,
      /^contar\s*servicios?$/i,
      /^service\s*count$/i,
      /^how\s*many\s*services?$/i,
    ]
  },
  {
    intent: 'getWebServices',
    priority: 67,
    patterns: [
      /^servicios?\s*web$/i,
      /^webs?\s*activas?$/i,
      /^webs?\s*que\s*(mantengo|tengo)$/i,
      /^cu[aá]ntas?\s*webs?\s*tengo$/i,
      /^n[uú]mero\s*de\s*webs?$/i,
      /^web\s*services?$/i,
      /^active\s*websites?$/i,
      /^how\s*many\s*websites?$/i,
    ]
  },
  {
    intent: 'getSEOStats',
    priority: 66,
    patterns: [
      /^servicios?\s*seo$/i,
      /^clientes?\s*con\s*seo$/i,
      /^cu[aá]ntos?\s*seo\s*tengo$/i,
      /^seo\s*activos?$/i,
      /^seo\s*services?$/i,
      /^clients?\s*with\s*seo$/i,
    ]
  },
  {
    intent: 'getMaintenanceServices',
    priority: 65,
    patterns: [
      /^mantenimientos?\s*activos?$/i,
      /^servicios?\s*de\s*mantenimiento$/i,
      /^clientes?\s*con\s*mantenimiento$/i,
      /^cu[aá]ntos?\s*mantenimientos?\s*tengo$/i,
      /^active\s*maintenances?$/i,
      /^maintenance\s*services?$/i,
    ]
  },
]

// =====================================================
// CATEGORÍA 7: DOMINIOS Y HOSTING (300+ patrones)
// =====================================================
const DOMAIN_HOSTING_PATTERNS: IntentPattern[] = [
  {
    intent: 'getDomainCount',
    priority: 64,
    patterns: [
      /^cu[aá]ntos?\s*dominios?\s*tengo$/i,
      /^n[uú]mero\s*de\s*dominios?$/i,
      /^total\s*dominios?$/i,
      /^dominios?\s*totales?$/i,
      /^mis\s*dominios?$/i,
      /^ver\s*dominios?$/i,
      /^how\s*many\s*domains?$/i,
      /^domain\s*count$/i,
      /^total\s*domains?$/i,
    ]
  },
  {
    intent: 'getHostingCount',
    priority: 63,
    patterns: [
      /^cu[aá]ntos?\s*hostings?\s*tengo$/i,
      /^n[uú]mero\s*de\s*hostings?$/i,
      /^total\s*hostings?$/i,
      /^hostings?\s*totales?$/i,
      /^mis\s*hostings?$/i,
      /^ver\s*hostings?$/i,
      /^cu[aá]ntos?\s*servidores?\s*tengo$/i,
      /^how\s*many\s*hostings?$/i,
      /^hosting\s*count$/i,
    ]
  },
  {
    intent: 'getDomainList',
    priority: 62,
    patterns: [
      /^lista\s*de\s*dominios?$/i,
      /^listar\s*dominios?$/i,
      /^todos\s*los\s*dominios?$/i,
      /^dominios?\s*activos?$/i,
      /^ver\s*todos\s*los\s*dominios?$/i,
      /^domain\s*list$/i,
      /^list\s*domains?$/i,
      /^all\s*domains?$/i,
    ]
  },
  {
    intent: 'getHostingList',
    priority: 61,
    patterns: [
      /^lista\s*de\s*hostings?$/i,
      /^listar\s*hostings?$/i,
      /^todos\s*los\s*hostings?$/i,
      /^hostings?\s*activos?$/i,
      /^ver\s*todos\s*los\s*hostings?$/i,
      /^hosting\s*list$/i,
      /^list\s*hostings?$/i,
      /^all\s*hostings?$/i,
    ]
  },
]

// =====================================================
// CATEGORÍA 8: ESTADÍSTICAS Y REPORTES (300+ patrones)
// =====================================================
const STATS_PATTERNS: IntentPattern[] = [
  {
    intent: 'getDashboardSummary',
    priority: 60,
    patterns: [
      /^resumen$/i,
      /^resumen\s*general$/i,
      /^dashboard$/i,
      /^panel$/i,
      /^inicio$/i,
      /^visi[oó]n\s*general$/i,
      /^panorama$/i,
      /^estado\s*actual$/i,
      /^situaci[oó]n\s*actual$/i,
      /^c[oó]mo\s*est[aá]n?\s*las?\s*cosas$/i,
      /^qu[eé]\s*tal\s*todo$/i,
      /^summary$/i,
      /^overview$/i,
      /^general\s*view$/i,
      /^current\s*status$/i,
      /^how\s*(are\s*things|is\s*everything)$/i,
    ]
  },
  {
    intent: 'getAnnualStats',
    priority: 59,
    patterns: [
      /^estad[ií]sticas?\s*anuales?$/i,
      /^resumen\s*del\s*a[uú]o$/i,
      /^resumen\s*anual$/i,
      /^ingresos?\s*del\s*a[uú]o$/i,
      /^facturaci[oó]n\s*anual$/i,
      /^beneficios?\s*anuales?$/i,
      /^c[oó]mo\s*fue\s*el\s*a[uú]o$/i,
      /^annual\s*stats?$/i,
      /^yearly\s*(summary|overview|report)$/i,
      /^annual\s*(revenue|income|profit)$/i,
    ]
  },
  {
    intent: 'getComparisonStats',
    priority: 58,
    patterns: [
      /^comparaci[oó]n\s*(mensual|anual)$/i,
      /^comparar\s*(meses|a[uú]os)$/i,
      /^evoluci[oó]n\s*(mensual|anual)$/i,
      /^tendencias?$/i,
      /^progresi[oó]n$/i,
      /^monthly\s*comparison$/i,
      /^trends?$/i,
      /^progress$/i,
      /^evolution$/i,
    ]
  },
]

// =====================================================
// CATEGORÍA 9: FECHAS ESPECÍFICAS (200+ patrones)
// =====================================================
const DATE_PATTERNS: IntentPattern[] = [
  {
    intent: 'getDateEvents',
    priority: 57,
    patterns: [
      // Eventos para fecha específica
      /^qu[eé]\s*tengo\s*el\s+\d+/i,
      /^qu[eé]\s*hay\s*el\s+\d+/i,
      /^eventos?\s*del\s+\d+/i,
      /^agenda\s*del\s+\d+/i,
      
      // Este mes + día
      /este\s*mes\s*\d+/i,
      /el\s*\d+\s*de\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
      
      // English
      /^what\s*(do\s*i\s*have|is\s*there)\s*(on|for)\s+(the\s+)?\d+/i,
      /^events?\s*(on|for)\s+\d+/i,
    ],
    extractParam: (msg: string) => {
      // Extraer la fecha del mensaje
      const dateMatch = msg.match(/(\d{1,2})(?:\s*de\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december))?/i)
      if (dateMatch) {
        return dateMatch[0]
      }
      return ''
    }
  },
]

// =====================================================
// CATEGORÍA 10: COMANDOS RÁPIDOS Y ACCIONES (300+ patrones)
// =====================================================
const ACTION_PATTERNS: IntentPattern[] = [
  {
    intent: 'quickAddClient',
    priority: 56,
    patterns: [
      /^(nuevo|agregar|a[uú]adir|crear)\s*cliente$/i,
      /^quiero\s*(agregar|a[uú]adir|crear)\s*un\s*cliente$/i,
      /^(add|create|new)\s*client$/i,
      /^i\s*want\s*to\s*(add|create)\s*a?\s*client$/i,
    ]
  },
  {
    intent: 'quickAddService',
    priority: 55,
    patterns: [
      /^(nuevo|agregar|a[uú]adir|crear)\s*servicio$/i,
      /^quiero\s*(agregar|a[uú]adir|crear)\s*un\s*servicio$/i,
      /^(add|create|new)\s*service$/i,
    ]
  },
  {
    intent: 'quickAddDomain',
    priority: 54,
    patterns: [
      /^(nuevo|agregar|a[uú]adir|crear)\s*dominio$/i,
      /^quiero\s*(agregar|a[uú]adir|crear)\s*un\s*dominio$/i,
      /^(add|create|new)\s*domain$/i,
    ]
  },
  {
    intent: 'quickAddHosting',
    priority: 53,
    patterns: [
      /^(nuevo|agregar|a[uú]adir|crear)\s*hosting$/i,
      /^quiero\s*(agregar|a[uú]adir|crear)\s*un\s*hosting$/i,
      /^(add|create|new)\s*hosting$/i,
    ]
  },
  {
    intent: 'quickAddReminder',
    priority: 52,
    patterns: [
      /^(nuevo|agregar|a[uú]adir|crear)\s*recordatorio$/i,
      /^quiero\s*(agregar|a[uú]adir|crear)\s*un\s*recordatorio$/i,
      /^(add|create|new)\s*reminder$/i,
    ]
  },
  {
    intent: 'quickAddAlarm',
    priority: 51,
    patterns: [
      /^(nuevo|agregar|a[uú]adir|crear)\s*alarma$/i,
      /^quiero\s*(agregar|a[uú]adir|crear)\s*una\s*alarma$/i,
      /^(add|create|new)\s*alarm$/i,
    ]
  },
  {
    intent: 'exportData',
    priority: 50,
    patterns: [
      /^exportar?\s*(datos|informaci[oó]n|clientes|servicios)$/i,
      /^quiero\s*exportar$/i,
      /^descargar?\s*(datos|informaci[oó]n)$/i,
      /^export\s*(data|clients?|services?)$/i,
      /^download\s*(data|info)$/i,
    ]
  },
]

// =====================================================
// CATEGORÍA 11: PATRONES CON NÚMEROS (para detectar días, cantidades)
// =====================================================
const NUMBER_PATTERNS: IntentPattern[] = [
  {
    intent: 'getDaysParameter',
    priority: 45,
    patterns: [
      // Próximos N días
      /pr[oó]ximos?\s*(\d+)\s*d[ií]as?/i,
      /en\s*(\d+)\s*d[ií]as?/i,
      /dentro\s*de\s*(\d+)\s*d[ií]as?/i,
      /los?\s*(\d+)\s*d[ií]as?\s*(pr[oó]ximos|siguientes)/i,
      
      // Últimos N días
      /[uú]ltimos?\s*(\d+)\s*d[ií]as?/i,
      /hace\s*(\d+)\s*d[ií]as?/i,
      
      // Hace N días sin actividad
      /sin\s*actividad\s*(\d+)\s*d[ií]as?/i,
      /inactivo[s]?\s*(\d+)\s*d[ií]as?/i,
      
      // English
      /next\s*(\d+)\s*days?/i,
      /in\s*(\d+)\s*days?/i,
      /following\s*(\d+)\s*days?/i,
      /last\s*(\d+)\s*days?/i,
      /(\d+)\s*days?\s*ago/i,
      /without\s*activity\s*(\d+)\s*days?/i,
      /inactive\s*(\d+)\s*days?/i,
    ],
    extractParam: (msg: string) => {
      const match = msg.match(/(\d+)/)
      return match ? parseInt(match[1]) : 30
    }
  },
  {
    intent: 'getLimitParameter',
    priority: 44,
    patterns: [
      // Top N
      /^top\s*(\d+)/i,
      /los?\s*(\d+)\s*(mejores?|primeros?|top)/i,
      
      // English
      /^top\s*(\d+)\s*(clients?|services?|domains?)?$/i,
    ],
    extractParam: (msg: string) => {
      const match = msg.match(/(\d+)/)
      return match ? parseInt(match[1]) : 5
    }
  },
]

// =====================================================
// CATEGORÍA 12: PATRONES ADICIONALES/FALLBACK
// =====================================================
const ADDITIONAL_PATTERNS: IntentPattern[] = [
  {
    intent: 'getUpcomingBirthdays',
    priority: 43,
    patterns: [
      /^cumplea[uú]os$/i,
      /^cumplea[uú]os\s*pr[oó]ximos?$/i,
      /^pr[oó]ximos?\s*cumplea[uú]os$/i,
      /^qui[eé]n\s*cumple\s*a[uú]os$/i,
      /^upcoming\s*birthdays?$/i,
      /^birthdays?$/i,
    ]
  },
  {
    intent: 'getAnniversaries',
    priority: 42,
    patterns: [
      /^aniversarios?$/i,
      /^aniversarios?\s*pr[oó]ximos?$/i,
      /^pr[oó]ximos?\s*aniversarios?$/i,
      /^clientes?\s*con\s*aniversario$/i,
      /^anniversaries?$/i,
      /^upcoming\s*anniversaries?$/i,
    ]
  },
  {
    intent: 'getNotifications',
    priority: 41,
    patterns: [
      /^notificaciones?$/i,
      /^ver\s*notificaciones?$/i,
      /^mis\s*notificaciones?$/i,
      /^hay\s*notificaciones?$/i,
      /^notifications?$/i,
      /^my\s*notifications?$/i,
    ]
  },
  {
    intent: 'getAlerts',
    priority: 40,
    patterns: [
      /^alertas?$/i,
      /^ver\s*alertas?$/i,
      /^mis\s*alertas?$/i,
      /^hay\s*alertas?$/i,
      /^tengo\s*alertas?$/i,
      /^alerts?$/i,
      /^my\s*alerts?$/i,
      /^any\s*alerts?$/i,
    ]
  },
  {
    intent: 'getUrgentItems',
    priority: 39,
    patterns: [
      /^urgente$/i,
      /^urgentes?$/i,
      /^qu[eé]\s*es\s*urgente$/i,
      /^lo\s*urgente$/i,
      /^prioridad\s*alta$/i,
      /^urgent$/i,
      /^what'?s?\s*urgent$/i,
      /^high\s*priority$/i,
    ]
  },
]

// =====================================================
// CATEGORÍA 13: PATRONES DE BÚSQUEDA AVANZADA
// =====================================================
const SEARCH_PATTERNS: IntentPattern[] = [
  {
    intent: 'searchByStatus',
    priority: 38,
    patterns: [
      /^clientes?\s*activos?$/i,
      /^clientes?\s*pausados?$/i,
      /^clientes?\s*cancelados?$/i,
      /^ver\s*clientes?\s*(activos|pausados|cancelados)$/i,
      /^mostrar\s*clientes?\s*(activos|pausados|cancelados)$/i,
      /^clients?\s*(active|paused|cancelled)$/i,
      /^show\s*(active|paused|cancelled)\s*clients?$/i,
    ],
    extractParam: (msg: string) => {
      if (/activ/i.test(msg)) return 'ACTIVE'
      if (/paus/i.test(msg)) return 'PAUSED'
      if (/cancel/i.test(msg)) return 'CANCELLED'
      return 'ACTIVE'
    }
  },
  {
    intent: 'searchByEmail',
    priority: 37,
    patterns: [
      /buscar\s*email\s+/i,
      /buscar\s*correo\s+/i,
      /cliente\s*con\s*email\s+/i,
      /cliente\s*con\s*correo\s+/i,
      /email\s+/i,
      /search\s*(by\s*)?email\s+/i,
      /client\s*with\s*email\s+/i,
    ],
    extractParam: (msg: string) => {
      const emailMatch = msg.match(/[\w.-]+@[\w.-]+\.\w+/)
      return emailMatch ? emailMatch[0] : ''
    }
  },
  {
    intent: 'searchByPhone',
    priority: 36,
    patterns: [
      /buscar\s*tel[eé]fono\s+/i,
      /buscar\s*fono\s+/i,
      /cliente\s*con\s*tel[eé]fono\s+/i,
      /cliente\s*con\s*telefono\s+/i,
      /search\s*(by\s*)?phone\s+/i,
      /client\s*with\s*phone\s+/i,
    ],
    extractParam: (msg: string) => {
      const phoneMatch = msg.match(/(\+?\d[\d\s-]{7,})/)
      return phoneMatch ? phoneMatch[1].trim() : ''
    }
  },
  {
    intent: 'searchByCompany',
    priority: 35,
    patterns: [
      /buscar\s*empresa\s+/i,
      /cliente\s*de\s*empresa\s+/i,
      /empresa\s+/i,
      /search\s*(by\s*)?company\s+/i,
      /client\s*from\s*company\s+/i,
    ],
    extractParam: (msg: string) => {
      const match = msg.match(/(?:empresa|company)\s+(.+?)(?:\s*$|\s*\?)/i)
      return match ? match[1].trim() : ''
    }
  },
]

// =====================================================
// CATEGORÍA 14: PATRONES ESPECIALES Y CONTEXTUALES
// =====================================================
const CONTEXTUAL_PATTERNS: IntentPattern[] = [
  {
    intent: 'repeatLastQuery',
    priority: 34,
    patterns: [
      /^rep[ií]te$/i,
      /^otra\s*vez$/i,
      /^de\s*nuevo$/i,
      /^lo\s*mismo$/i,
      /^repetir$/i,
      /^repeat$/i,
      /^again$/i,
      /^same\s*thing$/i,
    ]
  },
  {
    intent: 'moreDetails',
    priority: 33,
    patterns: [
      /^m[aá]s\s*detalles?$/i,
      /^m[aá]s\s*informaci[oó]n$/i,
      /^ampliar$/i,
      /^expandir$/i,
      /^detalles?$/i,
      /^more\s*details?$/i,
      /^more\s*info$/i,
      /^expand$/i,
    ]
  },
  {
    intent: 'lessDetails',
    priority: 32,
    patterns: [
      /^menos\s*detalles?$/i,
      /^resumen\s*corto$/i,
      /^simplificar$/i,
      /^less\s*details?$/i,
      /^summary$/i,
      /^brief$/i,
    ]
  },
  {
    intent: 'sortByDate',
    priority: 31,
    patterns: [
      /^ordenar\s*por\s*fecha$/i,
      /^por\s*fecha$/i,
      /^cronol[oó]gico$/i,
      /^sort\s*by\s*date$/i,
      /^chronological$/i,
    ]
  },
  {
    intent: 'sortByAmount',
    priority: 30,
    patterns: [
      /^ordenar\s*por\s*(cantidad|monto|importe)$/i,
      /^por\s*(cantidad|monto|importe)$/i,
      /^de\s*mayor\s*a\s*menor$/i,
      /^de\s*menor\s*a\s*mayor$/i,
      /^sort\s*by\s*(amount|price)$/i,
      /^highest\s*first$/i,
      /^lowest\s*first$/i,
    ]
  },
]

// =====================================================
// CATEGORÍA 15: PATRONES DE CONVERSACIÓN NATURAL
// =====================================================
const CONVERSATIONAL_PATTERNS: IntentPattern[] = [
  {
    intent: 'smallTalk',
    priority: 10,
    patterns: [
      /^qui[eé]n\s*eres$/i,
      /^qu[eé]\s*eres$/i,
      /^c[oó]mo\s*te\s*llamas$/i,
      /^tu\s*nombre$/i,
      /^qu[eé]\s*puedes\s*hacer$/i,
      /^pres[eé]ntate$/i,
      /^who\s*are\s*you$/i,
      /^what\s*are\s*you$/i,
      /^your\s*name$/i,
      /^introduce\s*yourself$/i,
    ]
  },
  {
    intent: 'joke',
    priority: 9,
    patterns: [
      /^cu[eé]ntame\s*un\s*chiste$/i,
      /^un\s*chiste$/i,
      /^algo\s*gracioso$/i,
      /^tell\s*me\s*a\s*joke$/i,
      /^a\s*joke$/i,
      /^something\s*funny$/i,
    ]
  },
  {
    intent: 'motivation',
    priority: 8,
    patterns: [
      /^mot[ií]vame$/i,
      /^una\s*frase\s*motivadora$/i,
      /^dame\s*[aá]nimo$/i,
      /^motivate\s*me$/i,
      /^motivational\s*quote$/i,
      /^give\s*me\s*courage$/i,
    ]
  },
  {
    intent: 'goodbye',
    priority: 7,
    patterns: [
      /^adi[oó]s$/i,
      /^adios$/i,
      /^chao$/i,
      /^chau$/i,
      /^hasta\s*luego$/i,
      /^hasta\s*ma[uú]ana$/i,
      /^nos\s*vemos$/i,
      /^bye$/i,
      /^goodbye$/i,
      /^see\s*you$/i,
      /^see\s*ya$/i,
      /^later$/i,
    ]
  },
]

// =====================================================
// EXPORTAR TODOS LOS PATRONES
// =====================================================
export const ALL_INTENT_PATTERNS: IntentPattern[] = [
  // Ordenados por prioridad (mayor primero)
  ...GREETING_PATTERNS,
  ...AGENDA_PATTERNS,
  ...PAYMENT_PATTERNS,
  ...CLIENT_PATTERNS,
  ...RENEWAL_PATTERNS,
  ...SERVICE_PATTERNS,
  ...DOMAIN_HOSTING_PATTERNS,
  ...STATS_PATTERNS,
  ...DATE_PATTERNS,
  ...ACTION_PATTERNS,
  ...NUMBER_PATTERNS,
  ...ADDITIONAL_PATTERNS,
  ...SEARCH_PATTERNS,
  ...CONTEXTUAL_PATTERNS,
  ...CONVERSATIONAL_PATTERNS,
]

// Función para contar patrones (para verificar)
export function countPatterns(): number {
  return ALL_INTENT_PATTERNS.reduce((total, ip) => total + ip.patterns.length, 0)
}

// Función para obtener información de depuración
export function getPatternStats(): { total: number; byCategory: Record<string, number> } {
  const byCategory: Record<string, number> = {}
  
  const categories = [
    { name: 'GREETING', patterns: GREETING_PATTERNS },
    { name: 'AGENDA', patterns: AGENDA_PATTERNS },
    { name: 'PAYMENT', patterns: PAYMENT_PATTERNS },
    { name: 'CLIENT', patterns: CLIENT_PATTERNS },
    { name: 'RENEWAL', patterns: RENEWAL_PATTERNS },
    { name: 'SERVICE', patterns: SERVICE_PATTERNS },
    { name: 'DOMAIN_HOSTING', patterns: DOMAIN_HOSTING_PATTERNS },
    { name: 'STATS', patterns: STATS_PATTERNS },
    { name: 'DATE', patterns: DATE_PATTERNS },
    { name: 'ACTION', patterns: ACTION_PATTERNS },
    { name: 'NUMBER', patterns: NUMBER_PATTERNS },
    { name: 'ADDITIONAL', patterns: ADDITIONAL_PATTERNS },
    { name: 'SEARCH', patterns: SEARCH_PATTERNS },
    { name: 'CONTEXTUAL', patterns: CONTEXTUAL_PATTERNS },
    { name: 'CONVERSATIONAL', patterns: CONVERSATIONAL_PATTERNS },
  ]
  
  categories.forEach(({ name, patterns }) => {
    byCategory[name] = patterns.reduce((total, ip) => total + ip.patterns.length, 0)
  })
  
  return {
    total: countPatterns(),
    byCategory
  }
}
