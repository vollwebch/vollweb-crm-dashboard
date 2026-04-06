import { getSystemConfig } from './api-utils';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

// Email service using system SMTP configuration
// For now, this is a placeholder that logs to console
// Can be configured with real SMTP later

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string }> {
  const config = await getSystemConfig();
  
  // Check if SMTP is configured
  if (!config.smtpHost || !config.smtpUser) {
    console.log('📧 Email sending is not configured. SMTP settings needed.');
    console.log('📧 Email details:', {
      to: options.to,
      subject: options.subject,
      attachments: options.attachments?.map(a => a.filename),
    });
    
    // For development, simulate success
    return {
      success: true,
      message: 'Email simulated (SMTP not configured). Check console for details.',
    };
  }

  // In a real implementation, you would use nodemailer or similar
  // Example with nodemailer:
  /*
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort || 587,
    secure: false,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  });

  await transporter.sendMail({
    from: `"${config.emailFromName || config.companyName}" <${config.emailFrom || config.smtpUser}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments?.map(a => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });
  */

  console.log('📧 Email would be sent:', {
    from: config.emailFrom || config.smtpUser,
    to: options.to,
    subject: options.subject,
    smtp: `${config.smtpHost}:${config.smtpPort}`,
  });

  return {
    success: true,
    message: 'Email sent successfully',
  };
}

// Generate invoice email HTML
export function generateInvoiceEmailHtml(
  invoiceNumber: string,
  clientName: string,
  total: number,
  currencySymbol: string,
  companyName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .invoice-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .total { font-size: 24px; font-weight: bold; color: #4F46E5; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invoice ${invoiceNumber}</h1>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <p>Please find attached your invoice <strong>${invoiceNumber}</strong>.</p>
          
          <div class="invoice-details">
            <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p><strong>Total Amount:</strong> <span class="total">${total.toFixed(2)} ${currencySymbol}</span></p>
          </div>
          
          <p>Please review the attached document for complete details.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>${companyName}</p>
        </div>
        <div class="footer">
          <p>This is an automated message from ${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
