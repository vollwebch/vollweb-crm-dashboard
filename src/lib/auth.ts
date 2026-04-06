import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from './db'
import { cookies } from 'next/headers'
import { User } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'vollweb-secret-key-change-in-production'

export interface JWTPayload {
  userId: string
  email: string
  role: string
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

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// Get current user from cookie (for server components)
export async function getCurrentUser(): Promise<(User & { company: { id: string; name: string } }) | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) return null
    
    const payload = verifyToken(token)
    if (!payload) return null
    
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        company: {
          select: { id: true, name: true }
        }
      }
    })
    
    return user
  } catch {
    return null
  }
}

// Default permissions (all allowed)
export const DEFAULT_PERMISSIONS = {
  clients: true,
  services: true,
  hosting: true,
  domains: true,
  payments: true,
  invoices: true,
  alarms: true,
  reminders: true,
  trash: true,
  audit: true,
  stats: true,
  config: true
}

export type UserPermissions = typeof DEFAULT_PERMISSIONS

// Get current user for client components (returns safe data)
export async function getCurrentUserSafe(): Promise<{ 
  id: string; 
  name: string; 
  email: string; 
  role: string; 
  avatar: string | null;
  permissions: UserPermissions;
  companyId: string;
  company: { id: string; name: string } 
} | null> {
  const user = await getCurrentUser()
  if (!user) return null
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    permissions: (user.permissions as UserPermissions) || DEFAULT_PERMISSIONS,
    companyId: user.companyId,
    company: user.company
  }
}

// Get company ID from current user (helper for APIs)
export async function getCompanyId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.companyId || null
}

// Check if current user is admin
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN'
}
