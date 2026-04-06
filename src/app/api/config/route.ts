import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { 
  apiResponse, 
  apiError, 
  ensureMockUser,
  createAuditLog 
} from '@/lib/api-utils';

// GET /api/config - Get system configuration
export async function GET() {
  try {
    await ensureMockUser();

    let config = await db.systemConfig.findFirst();

    if (!config) {
      // Create default configuration
      config = await db.systemConfig.create({
        data: {
          companyName: 'Mi Empresa',
          companyCountry: 'España',
          invoicePrefix: 'FAC',
          invoiceStartingNumber: 1,
          invoiceDefaultTaxRate: 21,
          invoiceDefaultDueDays: 30,
          currency: 'EUR',
          currencySymbol: '€',
        },
      });
    }

    // Remove sensitive data for response
    const safeConfig = {
      ...config,
      smtpPassword: config.smtpPassword ? '••••••••' : null,
    };

    return apiResponse({ config: safeConfig });
  } catch (error) {
    console.error('Get config error:', error);
    return apiError('Failed to get system configuration', 500, error);
  }
}

// PATCH /api/config - Update system configuration
export async function PATCH(request: NextRequest) {
  try {
    await ensureMockUser();

    const body = await request.json();

    // Get existing config or create default
    let config = await db.systemConfig.findFirst();

    if (!config) {
      config = await db.systemConfig.create({
        data: {
          companyName: body.companyName || 'Mi Empresa',
          companyTaxId: body.companyTaxId,
          companyAddress: body.companyAddress,
          companyCity: body.companyCity,
          companyPostalCode: body.companyPostalCode,
          companyCountry: body.companyCountry || 'España',
          companyPhone: body.companyPhone,
          companyEmail: body.companyEmail,
          companyWebsite: body.companyWebsite,
          companyLogo: body.companyLogo,
          invoicePrefix: body.invoicePrefix || 'FAC',
          invoiceStartingNumber: body.invoiceStartingNumber || 1,
          invoiceDefaultTaxRate: body.invoiceDefaultTaxRate ?? 21,
          invoiceDefaultDueDays: body.invoiceDefaultDueDays ?? 30,
          invoiceTerms: body.invoiceTerms,
          invoiceNotes: body.invoiceNotes,
          currency: body.currency || 'EUR',
          currencySymbol: body.currencySymbol || '€',
          smtpHost: body.smtpHost,
          smtpPort: body.smtpPort,
          smtpUser: body.smtpUser,
          smtpPassword: body.smtpPassword,
          emailFrom: body.emailFrom,
          emailFromName: body.emailFromName,
        },
      });
    } else {
      // Update existing config
      const updateData: Record<string, unknown> = {};

      // Company details
      if (body.companyName !== undefined) updateData.companyName = body.companyName;
      if (body.companyTaxId !== undefined) updateData.companyTaxId = body.companyTaxId;
      if (body.companyAddress !== undefined) updateData.companyAddress = body.companyAddress;
      if (body.companyCity !== undefined) updateData.companyCity = body.companyCity;
      if (body.companyPostalCode !== undefined) updateData.companyPostalCode = body.companyPostalCode;
      if (body.companyCountry !== undefined) updateData.companyCountry = body.companyCountry;
      if (body.companyPhone !== undefined) updateData.companyPhone = body.companyPhone;
      if (body.companyEmail !== undefined) updateData.companyEmail = body.companyEmail;
      if (body.companyWebsite !== undefined) updateData.companyWebsite = body.companyWebsite;
      if (body.companyLogo !== undefined) updateData.companyLogo = body.companyLogo;

      // Invoice settings
      if (body.invoicePrefix !== undefined) updateData.invoicePrefix = body.invoicePrefix;
      if (body.invoiceStartingNumber !== undefined) updateData.invoiceStartingNumber = body.invoiceStartingNumber;
      if (body.invoiceDefaultTaxRate !== undefined) updateData.invoiceDefaultTaxRate = body.invoiceDefaultTaxRate;
      if (body.invoiceDefaultDueDays !== undefined) updateData.invoiceDefaultDueDays = body.invoiceDefaultDueDays;
      if (body.invoiceTerms !== undefined) updateData.invoiceTerms = body.invoiceTerms;
      if (body.invoiceNotes !== undefined) updateData.invoiceNotes = body.invoiceNotes;

      // Currency
      if (body.currency !== undefined) updateData.currency = body.currency;
      if (body.currencySymbol !== undefined) updateData.currencySymbol = body.currencySymbol;

      // Email settings
      if (body.smtpHost !== undefined) updateData.smtpHost = body.smtpHost;
      if (body.smtpPort !== undefined) updateData.smtpPort = body.smtpPort;
      if (body.smtpUser !== undefined) updateData.smtpUser = body.smtpUser;
      if (body.smtpPassword !== undefined) updateData.smtpPassword = body.smtpPassword;
      if (body.emailFrom !== undefined) updateData.emailFrom = body.emailFrom;
      if (body.emailFromName !== undefined) updateData.emailFromName = body.emailFromName;

      config = await db.systemConfig.update({
        where: { id: config.id },
        data: updateData,
      });
    }

    await createAuditLog('UPDATE', 'SystemConfig', config.id, 'Configuration updated');

    // Remove sensitive data for response
    const safeConfig = {
      ...config,
      smtpPassword: config.smtpPassword ? '••••••••' : null,
    };

    return apiResponse({ config: safeConfig });
  } catch (error) {
    console.error('Update config error:', error);
    return apiError('Failed to update system configuration', 500, error);
  }
}
