import nodemailer from 'nodemailer'
import { db } from './db'

export interface EmailConfig {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  emailFrom: string
  emailFromName: string
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

// Get email config for a company
export async function getEmailConfig(companyId: string): Promise<EmailConfig | null> {
  const config = await db.systemConfig.findUnique({
    where: { companyId },
    select: {
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpPassword: true,
      emailFrom: true,
      emailFromName: true,
    }
  })

  if (!config || !config.smtpHost || !config.smtpUser) {
    return null
  }

  return {
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort || 587,
    smtpUser: config.smtpUser,
    smtpPassword: config.smtpPassword || '',
    emailFrom: config.emailFrom || config.smtpUser,
    emailFromName: config.emailFromName || 'CRM',
  }
}

// Create transporter
export function createTransporter(config: EmailConfig) {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  })
}

// Send email
export async function sendEmail(
  companyId: string,
  options: EmailOptions
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const config = await getEmailConfig(companyId)
    
    if (!config) {
      return { success: false, error: 'Configuración de email no encontrada' }
    }

    const transporter = createTransporter(config)
    
    const info = await transporter.sendMail({
      from: `"${config.emailFromName}" <${config.emailFrom}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    })

    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message || 'Error al enviar email' }
  }
}

// Test SMTP connection
export async function testSmtpConnection(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter(config)
    await transporter.verify()
    return { success: true }
  } catch (error: any) {
    console.error('SMTP test failed:', error)
    return { success: false, error: error.message || 'Error de conexión SMTP' }
  }
}

// Email templates
export const emailTemplates = {
  // Service renewal reminder
  serviceRenewal: (data: {
    clientName: string
    serviceName: string
    renewalDate: string
    monthlyPrice: number
    currency: string
    companyName: string
  }) => ({
    subject: `Recordatorio de renovación - ${data.serviceName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed, #9333ea); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #7c3aed; }
          .price { font-size: 24px; font-weight: bold; color: #7c3aed; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Recordatorio de Renovación</h1>
          </div>
          <div class="content">
            <p>Hola ${data.clientName},</p>
            <p>Te recordamos que tu servicio está próximo a renovarse:</p>
            
            <div class="info-box">
              <h3 style="margin-top:0">${data.serviceName}</h3>
              <p><strong>Fecha de renovación:</strong> ${data.renewalDate}</p>
              <p><strong>Precio mensual:</strong> <span class="price">${data.monthlyPrice} ${data.currency}</span></p>
            </div>
            
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            
            <p>Saludos,<br>${data.companyName}</p>
          </div>
          <div class="footer">
            Este email fue enviado automáticamente. Por favor no respondas a este email.
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hola ${data.clientName},\n\nTe recordamos que tu servicio "${data.serviceName}" se renueva el ${data.renewalDate}.\n\nPrecio mensual: ${data.monthlyPrice} ${data.currency}\n\nSaludos,\n${data.companyName}`
  }),

  // Domain expiry reminder
  domainExpiry: (data: {
    clientName: string
    domainName: string
    expiryDate: string
    cost: number
    currency: string
    companyName: string
  }) => ({
    subject: `⚠️ Tu dominio ${data.domainName} está por expirar`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626; }
          .domain { font-size: 20px; font-weight: bold; color: #dc2626; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌐 Aviso de Dominio por Expirar</h1>
          </div>
          <div class="content">
            <p>Hola ${data.clientName},</p>
            <p>Tu dominio está próximo a expirar:</p>
            
            <div class="warning-box">
              <p class="domain">${data.domainName}</p>
              <p><strong>Fecha de expiración:</strong> ${data.expiryDate}</p>
              <p><strong>Costo de renovación:</strong> ${data.cost} ${data.currency}</p>
            </div>
            
            <p><strong>⚠️ Importante:</strong> Si no renuevas tu dominio antes de la fecha de expiración, podrías perderlo.</p>
            
            <p>Contacta con nosotros para proceder con la renovación.</p>
            
            <p>Saludos,<br>${data.companyName}</p>
          </div>
          <div class="footer">
            Este email fue enviado automáticamente.
          </div>
        </div>
      </body>
      </html>
    `,
    text: `¡ATENCIÓN ${data.clientName}!\n\nTu dominio ${data.domainName} expira el ${data.expiryDate}.\n\nCosto de renovación: ${data.cost} ${data.currency}\n\nContacta con nosotros para renovarlo.\n\nSaludos,\n${data.companyName}`
  }),

  // Invoice created
  invoiceCreated: (data: {
    clientName: string
    invoiceNumber: string
    total: number
    currency: string
    dueDate: string
    companyName: string
    invoiceUrl?: string
  }) => ({
    subject: `Factura #${data.invoiceNumber} - ${data.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed, #9333ea); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .invoice-box { background: white; padding: 25px; border-radius: 8px; margin: 15px 0; text-align: center; }
          .total { font-size: 32px; font-weight: bold; color: #7c3aed; }
          .btn { display: inline-block; padding: 12px 30px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Nueva Factura</h1>
          </div>
          <div class="content">
            <p>Hola ${data.clientName},</p>
            <p>Se ha generado una nueva factura a tu nombre:</p>
            
            <div class="invoice-box">
              <p style="margin:0;color:#6b7280">Factura #${data.invoiceNumber}</p>
              <p class="total">${data.total.toFixed(2)} ${data.currency}</p>
              <p style="color:#6b7280">Vence: ${data.dueDate}</p>
            </div>
            
            ${data.invoiceUrl ? `<a href="${data.invoiceUrl}" class="btn">Ver Factura</a>` : ''}
            
            <p>Si tienes alguna pregunta sobre esta factura, no dudes en contactarnos.</p>
            
            <p>Saludos,<br>${data.companyName}</p>
          </div>
          <div class="footer">
            Este email fue enviado desde ${data.companyName}
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hola ${data.clientName},\n\nSe ha generado la factura #${data.invoiceNumber} por un total de ${data.total.toFixed(2)} ${data.currency}.\n\nFecha de vencimiento: ${data.dueDate}\n\nSaludos,\n${data.companyName}`
  }),

  // Payment received
  paymentReceived: (data: {
    clientName: string
    amount: number
    currency: string
    date: string
    companyName: string
  }) => ({
    subject: `✅ Pago recibido - ${data.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #ecfdf5; padding: 25px; border-radius: 8px; margin: 15px 0; text-align: center; border: 2px solid #10b981; }
          .amount { font-size: 36px; font-weight: bold; color: #059669; }
          .checkmark { font-size: 48px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pago Recibido</h1>
          </div>
          <div class="content">
            <p>Hola ${data.clientName},</p>
            <p>Hemos recibido tu pago correctamente:</p>
            
            <div class="success-box">
              <p class="checkmark">✓</p>
              <p class="amount">${data.amount.toFixed(2)} ${data.currency}</p>
              <p style="color:#6b7280">Recibido el ${data.date}</p>
            </div>
            
            <p>¡Gracias por tu pago!</p>
            
            <p>Saludos,<br>${data.companyName}</p>
          </div>
          <div class="footer">
            Este email fue enviado desde ${data.companyName}
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hola ${data.clientName},\n\n✅ Hemos recibido tu pago de ${data.amount.toFixed(2)} ${data.currency} el ${data.date}.\n\n¡Gracias!\n\nSaludos,\n${data.companyName}`
  }),

  // Contract end reminder
  contractEnd: (data: {
    clientName: string
    contractEnd: string
    companyName: string
  }) => ({
    subject: `📋 Tu contrato está por finalizar`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Aviso de Fin de Contrato</h1>
          </div>
          <div class="content">
            <p>Hola ${data.clientName},</p>
            <p>Te informamos que tu contrato está próximo a finalizar:</p>
            
            <div class="info-box">
              <p><strong>Fecha de finalización:</strong> ${data.contractEnd}</p>
            </div>
            
            <p>Contacta con nosotros si deseas renovar tu contrato o tienes alguna pregunta.</p>
            
            <p>Saludos,<br>${data.companyName}</p>
          </div>
          <div class="footer">
            Este email fue enviado automáticamente.
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hola ${data.clientName},\n\nTu contrato finaliza el ${data.contractEnd}.\n\nContacta con nosotros para renovarlo.\n\nSaludos,\n${data.companyName}`
  }),

  // Welcome email for new employees
  welcomeEmployee: (data: {
    employeeName: string
    companyName: string
    loginUrl: string
    email: string
    password: string
  }) => ({
    subject: `¡Bienvenido a ${data.companyName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed, #9333ea); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
          .btn { display: inline-block; padding: 12px 30px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Bienvenido!</h1>
          </div>
          <div class="content">
            <p>Hola ${data.employeeName},</p>
            <p>¡Te han añadido al equipo de <strong>${data.companyName}</strong>!</p>
            
            <p>Tus credenciales de acceso son:</p>
            
            <div class="credentials">
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Contraseña:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${data.password}</code></p>
            </div>
            
            <p style="color:#dc2626;font-size:14px;">⚠️ Por seguridad, cambia tu contraseña después de iniciar sesión.</p>
            
            <a href="${data.loginUrl}" class="btn">Iniciar Sesión</a>
            
            <p>Saludos,<br>${data.companyName}</p>
          </div>
          <div class="footer">
            Este email fue enviado automáticamente.
          </div>
        </div>
      </body>
      </html>
    `,
    text: `¡Bienvenido ${data.employeeName}!\n\nTe han añadido al equipo de ${data.companyName}.\n\nTus credenciales:\nEmail: ${data.email}\nContraseña: ${data.password}\n\nAccede aquí: ${data.loginUrl}\n\nPor seguridad, cambia tu contraseña después de iniciar sesión.\n\nSaludos,\n${data.companyName}`
  })
}

// Send notification email
export async function sendNotificationEmail(
  companyId: string,
  to: string,
  type: keyof typeof emailTemplates,
  data: any
): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates[type](data)
  
  return sendEmail(companyId, {
    to,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}
