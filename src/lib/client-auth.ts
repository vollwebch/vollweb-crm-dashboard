import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from './db'
import { cookies } from 'next/headers'
import { ClientUser } from '@prisma/client'

const CLIENT_JWT_SECRET = process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET || 'client-portal-secret-key'

export interface ClientJWTPayload {
  clientUserId: string
  email: string
  clientId: string
}

// Hash password
export async function hashClientPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Compare password  
export async function compareClientPassword(password: string, hashedPassword: string): Promise<boolean> {
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
export async function getCurrentClientUser(): Promise<(ClientUser & { client: { id: string; name: string; email: string; company: string } }) | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('client-auth-token')?.value
    
    if (!token) return null
    
    const payload = verifyClientToken(token)
    if (!payload) return null
    
    const clientUser = await db.clientUser.findUnique({
      where: { id: payload.clientUserId },
      include: {
        client: {
          select: { id: true, name: true, email: true, company: true }
        }
      }
    })
    
    if (!clientUser || !clientUser.active) return null
    
    return clientUser
  } catch {
    return null
  }
}

// Get current client user safe data
export async function getCurrentClientUserSafe(): Promise<{ 
  id: string
  email: string
  name: string
  phone: string | null
  clientId: string
  client: { id: string; name: string; email: string; company: string }
} | null> {
  const clientUser = await getCurrentClientUser()
  if (!clientUser) return null
  
  return {
    id: clientUser.id,
    email: clientUser.email,
    name: clientUser.name,
    phone: clientUser.phone,
    clientId: clientUser.clientId,
    client: clientUser.client
  }
}
