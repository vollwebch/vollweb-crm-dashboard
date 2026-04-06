import { PrismaClient, ClientStatus, ServiceType, ServiceStatus, DomainStatus, ReminderType, ReminderStatus, AlarmType, AlarmPriority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Limpiar base de datos existente
  await prisma.reminder.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.clientAlarm.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.hosting.deleteMany();
  await prisma.clientService.deleteMany();
  await prisma.notificationConfig.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.client.deleteMany();

  console.log('Base de datos limpiada');

  // Crear configuración del sistema
  await prisma.systemConfig.create({
    data: {
      companyName: 'Vollweb',
      primaryColor: '#7c3aed',
      currency: 'EUR',
      timezone: 'Europe/Madrid',
    },
  });

  // Crear configuración de notificaciones
  await prisma.notificationConfig.create({
    data: {
      serviceRenewalEnabled: true,
      serviceRenewalDays: '30,14,7,1',
      domainExpiryEnabled: true,
      domainExpiryDays: '30,14,7,1',
      hostingRenewalEnabled: true,
      hostingRenewalDays: '30,14,7,1',
      contractEndEnabled: true,
      contractEndDays: '90,60,30,14',
      anniversaryEnabled: true,
      anniversaryYears: '1,2,3,4,5,10',
      inactiveClientEnabled: true,
      inactiveClientDays: 90,
      customAlarmsEnabled: true,
      emailNotifications: false,
      pushNotifications: true,
    },
  });

  console.log('Configuración creada');

  // Crear clientes de ejemplo
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Carlos García',
        company: 'Restaurante La Tasca',
        email: 'carlos@lataasca.com',
        phone: '+34 612 345 678',
        status: ClientStatus.ACTIVE,
        notes: 'Cliente desde 2020. Siempre puntual con los pagos.',
        contractStart: new Date('2020-03-15'),
        contractEnd: new Date('2024-03-15'),
        contractYears: 4,
        city: 'Madrid',
      },
    }),
    prisma.client.create({
      data: {
        name: 'María López',
        company: 'Boutique Elegancia',
        email: 'maria@boutiqueelegancia.es',
        phone: '+34 623 456 789',
        status: ClientStatus.ACTIVE,
        notes: 'Tienda online de moda. Requiere mantenimiento mensual.',
        contractStart: new Date('2021-06-01'),
        contractEnd: new Date('2025-06-01'),
        contractYears: 4,
        city: 'Barcelona',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Juan Martínez',
        company: 'Autoescuela Martínez',
        email: 'info@autoescuelamartinez.com',
        phone: '+34 634 567 890',
        status: ClientStatus.ACTIVE,
        notes: 'Web informativa con formulario de inscripción.',
        contractStart: new Date('2022-01-10'),
        city: 'Valencia',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Ana Fernández',
        company: 'Clínica Dental Sonrisas',
        email: 'ana@clinica-sonrisas.es',
        phone: '+34 645 678 901',
        status: ClientStatus.ACTIVE,
        notes: 'Cliente premium. SEO activo y mantenimiento.',
        contractStart: new Date('2019-11-20'),
        contractEnd: new Date('2024-11-20'),
        contractYears: 5,
        city: 'Sevilla',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Pedro Sánchez',
        company: 'Fontanería San Pedro',
        email: 'pedro@fontaneriasanpedro.com',
        phone: '+34 656 789 012',
        status: ClientStatus.PAUSED,
        notes: 'Servicios pausados temporalmente por vacaciones.',
        city: 'Zaragoza',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Laura Ruiz',
        company: 'Academia Brillante',
        email: 'laura@academiabrillante.es',
        phone: '+34 667 890 123',
        status: ClientStatus.ACTIVE,
        notes: 'Academia de idiomas. Web con inscripción online.',
        contractStart: new Date('2020-09-01'),
        contractYears: 4,
        city: 'Málaga',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Miguel Torres',
        company: 'Torres Abogados',
        email: 'miguel@torresabogados.com',
        phone: '+34 678 901 234',
        status: ClientStatus.ACTIVE,
        notes: 'Despacho de abogados. Web corporativa elegante.',
        contractStart: new Date('2021-03-15'),
        contractEnd: new Date('2025-03-15'),
        contractYears: 4,
        city: 'Madrid',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Sofía Navarro',
        company: 'Peluquería Estilo',
        email: 'sofia@peluqueriaestilo.es',
        phone: '+34 689 012 345',
        status: ClientStatus.ACTIVE,
        notes: 'Sistema de reservas online integrado.',
        city: 'Bilbao',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Roberto Díaz',
        company: 'Díaz Construcciones',
        email: 'roberto@diazconstrucciones.com',
        phone: '+34 690 123 456',
        status: ClientStatus.CANCELLED,
        notes: 'Cliente cancelado. Empresa cerrada.',
        city: 'Murcia',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Elena Moreno',
        company: 'Pastelería Dulce',
        email: 'elena@pasteleriadulce.es',
        phone: '+34 701 234 567',
        status: ClientStatus.ACTIVE,
        notes: 'Tienda online de pastelería con pasarela de pago.',
        contractStart: new Date('2022-05-01'),
        contractYears: 3,
        city: 'Alicante',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Fernando Jiménez',
        company: 'Gimnasio Fitness Plus',
        email: 'fernando@gimnasiofitnessplus.com',
        phone: '+34 712 345 678',
        status: ClientStatus.ACTIVE,
        notes: 'Web con reservas de clases y pagos online.',
        contractStart: new Date('2021-08-10'),
        contractEnd: new Date('2024-08-10'),
        contractYears: 3,
        city: 'Valencia',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Carmen Vega',
        company: 'Jardinería Verde',
        email: 'carmen@jardineriaverde.es',
        phone: '+34 723 456 789',
        status: ClientStatus.ACTIVE,
        notes: 'Web corporativa con galería de proyectos.',
        city: 'Granada',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Antonio Herrera',
        company: 'Herrera Inmobiliaria',
        email: 'antonio@herrera-inmobiliaria.com',
        phone: '+34 734 567 890',
        status: ClientStatus.ACTIVE,
        notes: 'Portal inmobiliario con búsqueda avanzada.',
        contractStart: new Date('2020-02-15'),
        contractEnd: new Date('2024-02-15'),
        contractYears: 4,
        city: 'Madrid',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Isabel Castillo',
        company: 'Veterinaria Amigos',
        email: 'isabel@veterinariaamigos.es',
        phone: '+34 745 678 901',
        status: ClientStatus.PAUSED,
        notes: 'Servicios pausados por reformas en la clínica.',
        city: 'Salamanca',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Diego Molina',
        company: 'Molina Electricidad',
        email: 'diego@molinaelectricidad.com',
        phone: '+34 756 789 012',
        status: ClientStatus.ACTIVE,
        notes: 'Web simple de presentación de servicios.',
        city: 'Toledo',
      },
    }),
  ]);

  console.log(`Creados ${clients.length} clientes`);

  // Función para obtener fechas relativas
  const getDate = (daysOffset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date;
  };

  const getPastDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  // Crear servicios para cada cliente
  const servicesData = [
    // Carlos García - Restaurante La Tasca
    { clientId: clients[0].id, serviceType: ServiceType.WEB, description: 'Web restaurante con carta digital', monthlyPrice: 150, startDate: getPastDate(365), renewalDate: getDate(30) },
    { clientId: clients[0].id, serviceType: ServiceType.HOSTING, description: 'Hosting Premium', monthlyPrice: 25, startDate: getPastDate(365), renewalDate: getDate(30) },
    { clientId: clients[0].id, serviceType: ServiceType.MAINTENANCE, description: 'Mantenimiento mensual', monthlyPrice: 50, startDate: getPastDate(180), renewalDate: getDate(15) },
    
    // María López - Boutique Elegancia
    { clientId: clients[1].id, serviceType: ServiceType.WEB, description: 'Tienda online completa', monthlyPrice: 300, startDate: getPastDate(500), renewalDate: getDate(-10) },
    { clientId: clients[1].id, serviceType: ServiceType.SEO, description: 'SEO avanzado', monthlyPrice: 200, startDate: getPastDate(300), renewalDate: getDate(45) },
    { clientId: clients[1].id, serviceType: ServiceType.MAINTENANCE, description: 'Mantenimiento tienda', monthlyPrice: 75, startDate: getPastDate(200), renewalDate: getDate(20) },
    
    // Juan Martínez - Autoescuela Martínez
    { clientId: clients[2].id, serviceType: ServiceType.WEB, description: 'Web informativa', monthlyPrice: 100, startDate: getPastDate(200), renewalDate: getDate(60) },
    { clientId: clients[2].id, serviceType: ServiceType.HOSTING, description: 'Hosting Básico', monthlyPrice: 10, startDate: getPastDate(200), renewalDate: getDate(60) },
    
    // Ana Fernández - Clínica Dental Sonrisas
    { clientId: clients[3].id, serviceType: ServiceType.WEB, description: 'Web corporativa premium', monthlyPrice: 250, startDate: getPastDate(800), renewalDate: getDate(5) },
    { clientId: clients[3].id, serviceType: ServiceType.SEO, description: 'SEO local', monthlyPrice: 150, startDate: getPastDate(400), renewalDate: getDate(12) },
    { clientId: clients[3].id, serviceType: ServiceType.MAINTENANCE, description: 'Mantenimiento premium', monthlyPrice: 100, startDate: getPastDate(400), renewalDate: getDate(12) },
    { clientId: clients[3].id, serviceType: ServiceType.EMAIL, description: 'Emails corporativos (5 cuentas)', monthlyPrice: 15, startDate: getPastDate(400), renewalDate: getDate(12) },
    
    // Pedro Sánchez - Fontanería San Pedro (PAUSED)
    { clientId: clients[4].id, serviceType: ServiceType.WEB, description: 'Web servicios', monthlyPrice: 100, startDate: getPastDate(150), renewalDate: getDate(90), status: ServiceStatus.PAUSED },
    
    // Laura Ruiz - Academia Brillante
    { clientId: clients[5].id, serviceType: ServiceType.WEB, description: 'Web academia con inscripciones', monthlyPrice: 180, startDate: getPastDate(600), renewalDate: getDate(25) },
    { clientId: clients[5].id, serviceType: ServiceType.HOSTING, description: 'Hosting Estándar', monthlyPrice: 15, startDate: getPastDate(600), renewalDate: getDate(25) },
    { clientId: clients[5].id, serviceType: ServiceType.MAINTENANCE, description: 'Mantenimiento mensual', monthlyPrice: 60, startDate: getPastDate(300), renewalDate: getDate(8) },
    
    // Miguel Torres - Torres Abogados
    { clientId: clients[6].id, serviceType: ServiceType.WEB, description: 'Web corporativa abogados', monthlyPrice: 200, startDate: getPastDate(450), renewalDate: getDate(40) },
    { clientId: clients[6].id, serviceType: ServiceType.SEO, description: 'SEO corporativo', monthlyPrice: 180, startDate: getPastDate(200), renewalDate: getDate(55) },
    
    // Sofía Navarro - Peluquería Estilo
    { clientId: clients[7].id, serviceType: ServiceType.WEB, description: 'Web con reservas', monthlyPrice: 120, startDate: getPastDate(350), renewalDate: getDate(7) },
    { clientId: clients[7].id, serviceType: ServiceType.MAINTENANCE, description: 'Soporte reservas', monthlyPrice: 40, startDate: getPastDate(350), renewalDate: getDate(7) },
    
    // Roberto Díaz - Díaz Construcciones (CANCELLED)
    { clientId: clients[8].id, serviceType: ServiceType.WEB, description: 'Web corporativa', monthlyPrice: 150, startDate: getPastDate(500), renewalDate: getPastDate(100), status: ServiceStatus.CANCELLED },
    
    // Elena Moreno - Pastelería Dulce
    { clientId: clients[9].id, serviceType: ServiceType.WEB, description: 'Tienda online pastelería', monthlyPrice: 280, startDate: getPastDate(280), renewalDate: getDate(18) },
    { clientId: clients[9].id, serviceType: ServiceType.HOSTING, description: 'Hosting E-commerce', monthlyPrice: 35, startDate: getPastDate(280), renewalDate: getDate(18) },
    { clientId: clients[9].id, serviceType: ServiceType.MAINTENANCE, description: 'Mantenimiento tienda', monthlyPrice: 80, startDate: getPastDate(150), renewalDate: getDate(3) },
    
    // Fernando Jiménez - Gimnasio Fitness Plus
    { clientId: clients[10].id, serviceType: ServiceType.WEB, description: 'Web gimnasio con reservas', monthlyPrice: 220, startDate: getPastDate(400), renewalDate: getDate(50) },
    { clientId: clients[10].id, serviceType: ServiceType.MAINTENANCE, description: 'Gestión reservas', monthlyPrice: 90, startDate: getPastDate(400), renewalDate: getDate(50) },
    
    // Carmen Vega - Jardinería Verde
    { clientId: clients[11].id, serviceType: ServiceType.WEB, description: 'Web portfolio', monthlyPrice: 130, startDate: getPastDate(250), renewalDate: getDate(35) },
    { clientId: clients[11].id, serviceType: ServiceType.HOSTING, description: 'Hosting Básico', monthlyPrice: 10, startDate: getPastDate(250), renewalDate: getDate(35) },
    
    // Antonio Herrera - Herrera Inmobiliaria
    { clientId: clients[12].id, serviceType: ServiceType.WEB, description: 'Portal inmobiliario', monthlyPrice: 400, startDate: getPastDate(700), renewalDate: getDate(-5) },
    { clientId: clients[12].id, serviceType: ServiceType.HOSTING, description: 'VPS Dedicado', monthlyPrice: 60, startDate: getPastDate(700), renewalDate: getDate(-5) },
    { clientId: clients[12].id, serviceType: ServiceType.MAINTENANCE, description: 'Mantenimiento portal', monthlyPrice: 150, startDate: getPastDate(350), renewalDate: getDate(22) },
    { clientId: clients[12].id, serviceType: ServiceType.SEO, description: 'SEO inmobiliario', monthlyPrice: 250, startDate: getPastDate(300), renewalDate: getDate(22) },
    
    // Isabel Castillo - Veterinaria Amigos (PAUSED)
    { clientId: clients[13].id, serviceType: ServiceType.WEB, description: 'Web veterinaria', monthlyPrice: 140, startDate: getPastDate(320), renewalDate: getDate(80), status: ServiceStatus.PAUSED },
    
    // Diego Molina - Molina Electricidad
    { clientId: clients[14].id, serviceType: ServiceType.WEB, description: 'Web servicios básica', monthlyPrice: 80, startDate: getPastDate(180), renewalDate: getDate(65) },
    { clientId: clients[14].id, serviceType: ServiceType.HOSTING, description: 'Hosting Básico', monthlyPrice: 10, startDate: getPastDate(180), renewalDate: getDate(65) },
  ];

  const services = await Promise.all(
    servicesData.map((service) =>
      prisma.clientService.create({
        data: {
          ...service,
          status: service.status || ServiceStatus.ACTIVE,
        },
      })
    )
  );

  console.log(`Creados ${services.length} servicios`);

  // Crear hosting para clientes
  const hostingData = [
    { clientId: clients[0].id, provider: 'SiteGround', plan: 'GrowBig', username: 'lataasca_admin', panelUrl: 'https://eu.siteground.net', monthlyCost: 25, renewalDate: getDate(30) },
    { clientId: clients[1].id, provider: 'Cloudways', plan: 'DigitalOcean 2GB', username: 'boutique_user', panelUrl: 'https://dashboard.cloudways.com', monthlyCost: 35, renewalDate: getDate(45) },
    { clientId: clients[2].id, provider: 'Ionos', plan: 'Hosting Básico', username: 'autoescuela', panelUrl: 'https://admin.ionos.es', monthlyCost: 10, renewalDate: getDate(60) },
    { clientId: clients[3].id, provider: 'WP Engine', plan: 'Professional', username: 'clinicasonrisas', panelUrl: 'https://my.wpengine.com', monthlyCost: 45, renewalDate: getDate(5) },
    { clientId: clients[5].id, provider: 'SiteGround', plan: 'StartUp', username: 'academia_brillante', panelUrl: 'https://eu.siteground.net', monthlyCost: 15, renewalDate: getDate(25) },
    { clientId: clients[6].id, provider: 'Cloudways', plan: 'Vultr 2GB', username: 'torres_abogados', panelUrl: 'https://dashboard.cloudways.com', monthlyCost: 30, renewalDate: getDate(40) },
    { clientId: clients[9].id, provider: 'Cloudways', plan: 'DigitalOcean 4GB', username: 'pasteleria_dulce', panelUrl: 'https://dashboard.cloudways.com', monthlyCost: 55, renewalDate: getDate(18) },
    { clientId: clients[10].id, provider: 'WP Engine', plan: 'Startup', username: 'gimnasio_fitness', panelUrl: 'https://my.wpengine.com', monthlyCost: 30, renewalDate: getDate(50) },
    { clientId: clients[11].id, provider: 'Ionos', plan: 'Hosting Básico', username: 'jardineria_verde', panelUrl: 'https://admin.ionos.es', monthlyCost: 10, renewalDate: getDate(35) },
    { clientId: clients[12].id, provider: 'Vultr', plan: 'VPS 4GB', username: 'herrera_inmo', panelUrl: 'https://my.vultr.com', monthlyCost: 60, renewalDate: getDate(-5) },
    { clientId: clients[14].id, provider: 'Ionos', plan: 'Hosting Básico', username: 'molina_elec', panelUrl: 'https://admin.ionos.es', monthlyCost: 10, renewalDate: getDate(65) },
  ];

  const hostings = await Promise.all(
    hostingData.map((hosting) =>
      prisma.hosting.create({
        data: hosting,
      })
    )
  );

  console.log(`Creados ${hostings.length} hosting`);

  // Crear dominios para clientes
  const domainsData = [
    { clientId: clients[0].id, domainName: 'lataasca.com', registrar: 'GoDaddy', registrationDate: getPastDate(365), renewalDate: getDate(30), cost: 15, status: DomainStatus.ACTIVE },
    { clientId: clients[1].id, domainName: 'boutiqueelegancia.es', registrar: 'Namecheap', registrationDate: getPastDate(500), renewalDate: getDate(-10), cost: 12, status: DomainStatus.PENDING },
    { clientId: clients[1].id, domainName: 'boutiqueelegancia.com', registrar: 'Namecheap', registrationDate: getPastDate(500), renewalDate: getDate(55), cost: 14, status: DomainStatus.ACTIVE },
    { clientId: clients[2].id, domainName: 'autoescuelamartinez.com', registrar: 'Ionos', registrationDate: getPastDate(200), renewalDate: getDate(60), cost: 10, status: DomainStatus.ACTIVE },
    { clientId: clients[3].id, domainName: 'clinica-sonrisas.es', registrar: 'GoDaddy', registrationDate: getPastDate(800), renewalDate: getDate(5), cost: 15, status: DomainStatus.ACTIVE },
    { clientId: clients[4].id, domainName: 'fontaneriasanpedro.com', registrar: 'Namecheap', registrationDate: getPastDate(150), renewalDate: getDate(90), cost: 12, status: DomainStatus.ACTIVE },
    { clientId: clients[5].id, domainName: 'academiabrillante.es', registrar: 'Ionos', registrationDate: getPastDate(600), renewalDate: getDate(25), cost: 10, status: DomainStatus.ACTIVE },
    { clientId: clients[6].id, domainName: 'torresabogados.com', registrar: 'GoDaddy', registrationDate: getPastDate(450), renewalDate: getDate(40), cost: 15, status: DomainStatus.ACTIVE },
    { clientId: clients[7].id, domainName: 'peluqueriaestilo.es', registrar: 'Namecheap', registrationDate: getPastDate(350), renewalDate: getDate(7), cost: 12, status: DomainStatus.ACTIVE },
    { clientId: clients[8].id, domainName: 'diazconstrucciones.com', registrar: 'Ionos', registrationDate: getPastDate(500), renewalDate: getPastDate(100), cost: 10, status: DomainStatus.EXPIRED },
    { clientId: clients[9].id, domainName: 'pasteleriadulce.es', registrar: 'GoDaddy', registrationDate: getPastDate(280), renewalDate: getDate(18), cost: 15, status: DomainStatus.ACTIVE },
    { clientId: clients[10].id, domainName: 'gimnasiofitnessplus.com', registrar: 'Namecheap', registrationDate: getPastDate(400), renewalDate: getDate(50), cost: 12, status: DomainStatus.ACTIVE },
    { clientId: clients[11].id, domainName: 'jardineriaverde.es', registrar: 'Ionos', registrationDate: getPastDate(250), renewalDate: getDate(35), cost: 10, status: DomainStatus.ACTIVE },
    { clientId: clients[12].id, domainName: 'herrera-inmobiliaria.com', registrar: 'GoDaddy', registrationDate: getPastDate(700), renewalDate: getDate(-5), cost: 15, status: DomainStatus.PENDING },
    { clientId: clients[13].id, domainName: 'veterinariaamigos.es', registrar: 'Namecheap', registrationDate: getPastDate(320), renewalDate: getDate(80), cost: 12, status: DomainStatus.ACTIVE },
    { clientId: clients[14].id, domainName: 'molinaelectricidad.com', registrar: 'Ionos', registrationDate: getPastDate(180), renewalDate: getDate(65), cost: 10, status: DomainStatus.ACTIVE },
  ];

  const domains = await Promise.all(
    domainsData.map((domain) =>
      prisma.domain.create({
        data: domain,
      })
    )
  );

  console.log(`Creados ${domains.length} dominios`);

  // Crear alarmas personalizadas
  const alarmsData = [
    // Alarma de fin de contrato
    { clientId: clients[0].id, type: AlarmType.CONTRACT_END, title: 'Fin de contrato 4 años', description: 'Contrato de 4 años finaliza. Renovar o contactar cliente.', alarmDate: new Date('2024-03-15'), priority: AlarmPriority.HIGH, daysBefore: 90 },
    { clientId: clients[1].id, type: AlarmType.CONTRACT_END, title: 'Fin de contrato', description: 'Contrato de 4 años finaliza en junio 2025.', alarmDate: new Date('2025-06-01'), priority: AlarmPriority.MEDIUM, daysBefore: 60 },
    { clientId: clients[3].id, type: AlarmType.CONTRACT_END, title: 'Fin de contrato 5 años', description: 'Cliente premium - Contrato de 5 años finaliza.', alarmDate: new Date('2024-11-20'), priority: AlarmPriority.URGENT, daysBefore: 90 },
    { clientId: clients[6].id, type: AlarmType.CONTRACT_END, title: 'Renovación contrato abogados', description: 'Renovación de contrato con Torres Abogados.', alarmDate: new Date('2025-03-15'), priority: AlarmPriority.HIGH, daysBefore: 60 },
    
    // Alarmas de aniversario
    { clientId: clients[3].id, type: AlarmType.ANNIVERSARY, title: '5 años como cliente', description: 'Clínica Dental Sonrisas cumple 5 años con nosotros. Enviar regalo o descuento especial.', alarmDate: new Date('2024-11-20'), priority: AlarmPriority.MEDIUM, daysBefore: 7, isRecurring: false },
    { clientId: clients[0].id, type: AlarmType.ANNIVERSARY, title: '4 años como cliente', description: 'Restaurante La Tasca cumple 4 años.', alarmDate: new Date('2024-03-15'), priority: AlarmPriority.LOW, daysBefore: 7 },
    
    // Alarmas de seguimiento
    { clientId: clients[4].id, type: AlarmType.FOLLOW_UP, title: 'Reactivar cliente', description: 'Cliente pausado. Contactar para reactivar servicios.', alarmDate: getDate(14), priority: AlarmPriority.MEDIUM, daysBefore: 3 },
    { clientId: clients[13].id, type: AlarmType.FOLLOW_UP, title: 'Estado de reformas', description: 'Veterinaria en reformas. Verificar fecha de reanudación.', alarmDate: getDate(30), priority: AlarmPriority.LOW, daysBefore: 7 },
    
    // Alarmas personalizadas
    { clientId: clients[1].id, type: AlarmType.CUSTOM, title: 'Revisión SEO trimestral', description: 'Revisión de resultados SEO con cliente.', alarmDate: getDate(7), priority: AlarmPriority.MEDIUM, daysBefore: 3 },
    { clientId: clients[12].id, type: AlarmType.CUSTOM, title: 'Upselling VPS', description: 'Ofrecer upgrade de VPS antes de renovación.', alarmDate: getDate(20), priority: AlarmPriority.HIGH, daysBefore: 7 },
  ];

  const alarms = await Promise.all(
    alarmsData.map((alarm) =>
      prisma.clientAlarm.create({
        data: alarm,
      })
    )
  );

  console.log(`Creadas ${alarms.length} alarmas`);

  // Crear recordatorios
  const remindersData = [
    // Recordatorios de servicios próximos a renovar
    { type: ReminderType.SERVICE_RENEWAL, entityType: 'service', entityId: services[0].id, reminderDate: getDate(7), message: 'Servicio Web para Restaurante La Tasca vence en 7 días', serviceId: services[0].id, clientId: clients[0].id },
    { type: ReminderType.SERVICE_RENEWAL, entityType: 'service', entityId: services[9].id, reminderDate: getDate(5), message: 'Servicio Web corporativa premium para Clínica Dental Sonrisas vence en 5 días', serviceId: services[9].id, clientId: clients[3].id },
    { type: ReminderType.SERVICE_RENEWAL, entityType: 'service', entityId: services[20].id, reminderDate: getDate(3), message: 'Mantenimiento tienda para Pastelería Dulce vence en 3 días', serviceId: services[20].id, clientId: clients[9].id },
    
    // Recordatorios de dominios próximos a caducar
    { type: ReminderType.DOMAIN_EXPIRY, entityType: 'domain', entityId: domains[0].id, reminderDate: getDate(7), message: 'Dominio lataasca.com vence en 7 días', domainId: domains[0].id, clientId: clients[0].id },
    { type: ReminderType.DOMAIN_EXPIRY, entityType: 'domain', entityId: domains[3].id, reminderDate: getDate(5), message: 'Dominio clinica-sonrisas.es vence en 5 días', domainId: domains[3].id, clientId: clients[3].id },
    { type: ReminderType.DOMAIN_EXPIRY, entityType: 'domain', entityId: domains[8].id, reminderDate: getDate(3), message: 'Dominio peluqueriaestilo.es vence en 3 días', domainId: domains[8].id, clientId: clients[7].id },
    
    // Recordatorios de hosting
    { type: ReminderType.HOSTING_RENEWAL, entityType: 'hosting', entityId: hostings[3].id, reminderDate: getDate(5), message: 'Hosting WP Engine para Clínica Dental Sonrisas vence en 5 días', hostingId: hostings[3].id, clientId: clients[3].id },
    
    // Recordatorios de alarmas
    { type: ReminderType.CUSTOM_ALARM, entityType: 'alarm', entityId: alarms[0].id, reminderDate: getDate(-60), message: 'ATENCIÓN: Contrato de Restaurante La Tasca finaliza en 90 días', alarmId: alarms[0].id, clientId: clients[0].id },
    { type: ReminderType.CONTRACT_END, entityType: 'alarm', entityId: alarms[2].id, reminderDate: getDate(-30), message: 'URGENTE: Contrato de Clínica Dental Sonrisas (cliente premium) finaliza pronto', alarmId: alarms[2].id, clientId: clients[3].id },
  ];

  const reminders = await Promise.all(
    remindersData.map((reminder) =>
      prisma.reminder.create({
        data: reminder,
      })
    )
  );

  console.log(`Creados ${reminders.length} recordatorios`);

  // Crear logs de actividad
  const activityLogsData = [
    { clientId: clients[0].id, action: 'Cliente creado', description: 'Cliente añadido al sistema' },
    { clientId: clients[0].id, action: 'Servicio añadido', description: 'Servicio Web añadido al cliente' },
    { clientId: clients[0].id, action: 'Hosting configurado', description: 'Hosting SiteGround configurado' },
    { clientId: clients[0].id, action: 'Contrato firmado', description: 'Contrato de 4 años firmado' },
    { clientId: clients[1].id, action: 'Cliente creado', description: 'Cliente añadido al sistema' },
    { clientId: clients[1].id, action: 'Servicio añadido', description: 'Servicio SEO añadido al cliente' },
    { clientId: clients[3].id, action: 'Cliente creado', description: 'Cliente añadido al sistema' },
    { clientId: clients[3].id, action: 'Nota añadida', description: 'Se añadió nota: Cliente premium' },
    { clientId: clients[3].id, action: 'Contrato firmado', description: 'Contrato de 5 años firmado - Cliente Premium' },
    { clientId: clients[9].id, action: 'Servicio actualizado', description: 'Precio de mantenimiento actualizado' },
    { clientId: clients[12].id, action: 'Dominio añadido', description: 'Dominio herrera-inmobiliaria.com registrado' },
    { clientId: clients[12].id, action: 'Hosting migrado', description: 'Hosting migrado a VPS Vultr' },
    { clientId: clients[4].id, action: 'Estado cambiado', description: 'Cliente pausado temporalmente' },
    { clientId: clients[8].id, action: 'Cliente cancelado', description: 'Cliente cancelado - Empresa cerrada' },
  ];

  const activityLogs = await Promise.all(
    activityLogsData.map((log) =>
      prisma.activityLog.create({
        data: log,
      })
    )
  );

  console.log(`Creados ${activityLogs.length} logs de actividad`);

  console.log('\n✅ Seed completado con éxito!');
  console.log(`📊 Resumen:`);
  console.log(`   - ${clients.length} clientes`);
  console.log(`   - ${services.length} servicios`);
  console.log(`   - ${hostings.length} hosting`);
  console.log(`   - ${domains.length} dominios`);
  console.log(`   - ${alarms.length} alarmas personalizadas`);
  console.log(`   - ${reminders.length} recordatorios`);
  console.log(`   - ${activityLogs.length} logs de actividad`);
  console.log(`   - Configuración del sistema`);
  console.log(`   - Configuración de notificaciones`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
