import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from './db'
import { cookies } from 'next/headers'

const CLIENT_JWT_SECRET = process.env.JWT_SECRET || 'vollweb-secret-key-change-in-production'

export interface ClientJWTPayload {
  clientUserId: string
  email: string
  clientId: string
  companyId: string
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token for client
export function generateClientToken(payload: ClientJWTPayload): string {
  return jwt.sign(payload, CLIENT_JWT_SECRET, { expiresIn: '30d' })
}

// Verify JWT token
export function verifyClientToken(token: string): ClientJWTPayload | null {
  try {
    return jwt.verify(token, CLIENT_JWT_SECRET) as ClientJWTPayload
  } catch {
    return null
  }
}

// Get current client user from cookie
export async function getCurrentClientUser(): Promise<{
  id: string
  email: string
  name: string
  phone: string | null
  clientId: string
  client: {
    id: string
    name: string
    company: string
    email: string
    companyId: string
  }
} | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('client-token')?.value
    
    if (!token) return null
    
    const payload = verifyClientToken(token)
    if (!payload) return null
    
    const clientUser = await db.clientUser.findUnique({
      where: { id: payload.clientUserId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            companyId: true
          }
        }
      }
    })
    
    if (!clientUser || !clientUser.active) return null
    
    return {
      id: clientUser.id,
      email: clientUser.email,
      name: clientUser.name,
      phone: clientUser.phone,
      clientId: clientUser.clientId,
      client: clientUser.client
    }
  } catch {
    return null
  }
}

// Set client auth cookie
export async function setClientCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('client-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })
}

// Clear client auth cookie
export async function clearClientCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('client-token')
}
