import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Monedas disponibles con sus configuraciones
export const AVAILABLE_CURRENCIES = [
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'es-ES' },
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', locale: 'en-US' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£', locale: 'en-GB' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$', locale: 'es-MX' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$', locale: 'es-AR' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$', locale: 'es-CO' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$', locale: 'es-CL' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/', locale: 'es-PE' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', locale: 'pt-BR' },
  { code: 'CAD', name: 'Dólar Canadiense', symbol: '$', locale: 'en-CA' },
  { code: 'JPY', name: 'Yen Japonés', symbol: '¥', locale: 'ja-JP' },
  { code: 'CNY', name: 'Yuan Chino', symbol: '¥', locale: 'zh-CN' },
  { code: 'CHF', name: 'Franco Suizo', symbol: 'CHF', locale: 'de-CH' },
  { code: 'AUD', name: 'Dólar Australiano', symbol: '$', locale: 'en-AU' },
  { code: 'INR', name: 'Rupia India', symbol: '₹', locale: 'en-IN' },
];

// Idiomas disponibles
export const AVAILABLE_LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

// GET /api/config/system - Obtener configuración del sistema
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let config = await db.systemConfig.findUnique({
      where: { companyId: currentUser.companyId }
    });
    
    if (!config) {
      // Get company name for default
      const company = await db.company.findUnique({
        where: { id: currentUser.companyId }
      });
      
      config = await db.systemConfig.create({
        data: {
          companyId: currentUser.companyId,
          companyName: company?.name || 'Mi Empresa',
          primaryColor: '#7c3aed',
          currency: 'EUR',
          language: 'es',
          timezone: 'Europe/Madrid',
          dateFormat: 'DD/MM/YYYY',
        },
      });
    }
    
    // Also return company info
    const company = await db.company.findUnique({
      where: { id: currentUser.companyId }
    });
    
    return NextResponse.json({
      ...config,
      companyName: company?.name || config.companyName,
      company,
      availableCurrencies: AVAILABLE_CURRENCIES,
      availableLanguages: AVAILABLE_LANGUAGES,
    });
  } catch (error) {
    console.error('Error fetching system config:', error);
    return NextResponse.json({ error: 'Error al obtener configuración del sistema' }, { status: 500 });
  }
}

// PATCH /api/config/system - Actualizar configuración del sistema
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { companyName, ...configData } = body;
    
    // Update company name if provided
    if (companyName) {
      await db.company.update({
        where: { id: currentUser.companyId },
        data: { name: companyName }
      });
    }
    
    let config = await db.systemConfig.findUnique({
      where: { companyId: currentUser.companyId }
    });
    
    if (!config) {
      config = await db.systemConfig.create({ 
        data: {
          ...configData,
          companyId: currentUser.companyId,
          companyName: companyName || 'Mi Empresa',
        } 
      });
    } else {
      config = await db.systemConfig.update({
        where: { id: config.id },
        data: configData,
      });
    }
    
    // Return updated company name
    const company = await db.company.findUnique({
      where: { id: currentUser.companyId }
    });
    
    return NextResponse.json({
      ...config,
      companyName: company?.name || config.companyName,
      company,
      availableCurrencies: AVAILABLE_CURRENCIES,
      availableLanguages: AVAILABLE_LANGUAGES,
    });
  } catch (error) {
    console.error('Error updating system config:', error);
    return NextResponse.json({ error: 'Error al actualizar configuración del sistema' }, { status: 500 });
  }
}
