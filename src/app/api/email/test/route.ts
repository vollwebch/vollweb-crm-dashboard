import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { testSmtpConnection, sendEmail, EmailConfig } from '@/lib/email'
import { db } from '@/lib/db'

// POST /api/email/test - Test SMTP connection
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { testSend, testEmail } = body

    // Get SMTP config
    const config = await db.systemConfig.findUnique({
      where: { companyId: currentUser.companyId },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassword: true,
        emailFrom: true,
        emailFromName: true,
      }
    })

    if (!config || !config.smtpHost) {
      return NextResponse.json({ 
        success: false, 
        error: 'Configuración SMTP no encontrada. Configura los ajustes de email primero.' 
      }, { status: 400 })
    }

    const emailConfig: EmailConfig = {
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort || 587,
      smtpUser: config.smtpUser || '',
      smtpPassword: config.smtpPassword || '',
      emailFrom: config.emailFrom || config.smtpUser || '',
      emailFromName: config.emailFromName || 'CRM',
    }

    // Test connection
    const testResult = await testSmtpConnection(emailConfig)
    
    if (!testResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: testResult.error || 'Error al conectar con el servidor SMTP' 
      })
    }

    // If testSend is true, also send a test email
    if (testSend && testEmail) {
      const sendResult = await sendEmail(currentUser.companyId, {
        to: testEmail,
        subject: '✅ Test de configuración SMTP',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .success { background: #ecfdf5; border: 2px solid #10b981; padding: 30px; border-radius: 10px; text-align: center; }
              .checkmark { font-size: 48px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">
                <p class="checkmark">✅</p>
                <h1>¡Configuración SMTP Exitosa!</h1>
                <p>Este email confirma que tu configuración SMTP está funcionando correctamente.</p>
                <p style="color: #6b7280; font-size: 12px;">Enviado desde ${emailConfig.emailFromName}</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: '✅ ¡Configuración SMTP Exitosa!\n\nEste email confirma que tu configuración SMTP está funcionando correctamente.'
      })

      if (!sendResult.success) {
        return NextResponse.json({ 
          success: false, 
          error: sendResult.error || 'Error al enviar email de prueba' 
        })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Conexión SMTP exitosa y email de prueba enviado',
        messageId: sendResult.messageId
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Conexión SMTP exitosa' 
    })
  } catch (error: any) {
    console.error('Error testing SMTP:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Error al probar configuración SMTP' 
    }, { status: 500 })
  }
}
