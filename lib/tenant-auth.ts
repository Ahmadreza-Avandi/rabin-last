import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getTenantConnection } from './tenant-database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = '24h';

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_key: string;
}

export interface TenantSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  tenant_key: string;
  iat: number;
  exp: number;
}

/**
 * ایجاد session برای tenant
 */
export function createTenantSession(user: TenantUser): string {
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant_key: user.tenant_key
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );

  return token;
}

/**
 * اعتبارسنجی session tenant
 */
export function verifyTenantSession(token: string, expectedTenantKey: string): TenantSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // اگر token دارای tenant_key باشد، بررسی کنید
    if (decoded.tenant_key && decoded.tenant_key !== expectedTenantKey) {
      console.warn(`⚠️ Tenant key mismatch: ${decoded.tenant_key} !== ${expectedTenantKey}`);
      return null;
    }

    // اگر tenant_key در token نباشد (مثل tokens از loginUser)
    // آن را از expectedTenantKey تکمیل کنید
    return {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      name: decoded.name || 'Unknown',
      role: decoded.role || 'user',
      tenant_key: decoded.tenant_key || expectedTenantKey,
      iat: decoded.iat,
      exp: decoded.exp
    } as TenantSession;
  } catch (error) {
    console.error('❌ خطا در اعتبارسنجی token:', error);
    return null;
  }
}

/**
 * دریافت session از request
 */
export function getTenantSessionFromRequest(request: NextRequest, tenantKey: string): TenantSession | null {
  try {
    // Try auth-token cookie first (for browser)
    let token = request.cookies.get('auth-token')?.value;

    // Try tenant_token cookie as fallback
    if (!token) {
      token = request.cookies.get('tenant_token')?.value;
    }

    // If not in cookie, try Authorization header (for API calls)
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    return verifyTenantSession(token, tenantKey);
  } catch (error) {
    return null;
  }
}

/**
 * احراز هویت کاربر tenant
 */
export async function authenticateTenantUser(
  tenantKey: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: TenantUser; message?: string }> {
  const mysql = require('mysql2/promise');
  let connection;

  try {
    // اتصال به crm_system
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: 'crm_system'
    });

    // جستجوی کاربر با tenant_key
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ? AND tenant_key = ? AND status = ?',
      [email, tenantKey, 'active']
    ) as any[];

    if (users.length === 0) {
      return { success: false, message: 'ایمیل یا رمز عبور اشتباه است' };
    }

    const user = users[0];

    // بررسی رمز عبور
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, message: 'ایمیل یا رمز عبور اشتباه است' };
    }

    // به‌روزرسانی last_login
    await connection.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant_key: tenantKey
      }
    };

  } catch (error) {
    console.error('❌ خطا در احراز هویت:', error);
    return { success: false, message: 'خطای سرور' };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Middleware helper برای محافظت از tenant routes
 */
export function requireTenantAuth(
  handler: (request: NextRequest, session: TenantSession) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const tenantKey = request.headers.get('X-Tenant-Key');

    if (!tenantKey) {
      return NextResponse.json(
        { success: false, message: 'Tenant key یافت نشد' },
        { status: 400 }
      );
    }

    const session = getTenantSessionFromRequest(request, tenantKey);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز' },
        { status: 401 }
      );
    }

    return handler(request, session);
  };
}
