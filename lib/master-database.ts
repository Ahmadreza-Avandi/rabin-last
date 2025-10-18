/**
 * Master Database Connection Helper
 * 
 * این ماژول برای اتصال به دیتابیس saas_master استفاده می‌شود
 * که اطلاعات تمام tenants، super admins و subscription plans را نگهداری می‌کند
 */

import mysql from 'mysql2/promise';

// تنظیمات اتصال به Master Database
const MASTER_DB_CONFIG = {
  host: process.env.MASTER_DB_HOST || process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.MASTER_DB_PORT || process.env.DATABASE_PORT || '3306'),
  user: process.env.MASTER_DB_USER || process.env.DATABASE_USER || 'root',
  password: process.env.MASTER_DB_PASSWORD || process.env.DATABASE_PASSWORD,
  database: 'saas_master',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Connection Pool برای Master Database
let masterPool: mysql.Pool | null = null;

/**
 * دریافت Connection Pool برای Master Database
 */
export function getMasterDatabasePool(): mysql.Pool {
  if (!masterPool) {
    masterPool = mysql.createPool(MASTER_DB_CONFIG);
    console.log('✅ Master Database connection pool created');
  }
  return masterPool;
}

/**
 * دریافت یک connection از pool برای استفاده در API routes
 */
export async function getMasterConnection() {
  const pool = getMasterDatabasePool();
  return await pool.getConnection();
}

/**
 * تست اتصال به Master Database
 */
export async function testMasterConnection(): Promise<boolean> {
  try {
    const pool = getMasterDatabasePool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Master Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Master Database connection failed:', error);
    return false;
  }
}

/**
 * اجرای query روی Master Database
 */
export async function queryMaster<T = any>(
  sql: string,
  params?: any[]
): Promise<T> {
  const pool = getMasterDatabasePool();
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(sql, params);
    return rows as T;
  } finally {
    connection.release();
  }
}

/**
 * اجرای query با retry logic
 */
export async function queryMasterWithRetry<T = any>(
  sql: string,
  params?: any[],
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryMaster<T>(sql, params);
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Query failed (attempt ${attempt}/${maxRetries}):`, error);

      if (attempt < maxRetries) {
        // منتظر می‌مانیم قبل از تلاش مجدد
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * بستن Connection Pool
 */
export async function closeMasterPool(): Promise<void> {
  if (masterPool) {
    await masterPool.end();
    masterPool = null;
    console.log('🔌 Master Database connection pool closed');
  }
}

// Types برای جداول Master Database

export interface Tenant {
  id: number;
  tenant_key: string;
  company_name: string;
  db_name: string;
  db_host: string;
  db_port: number;
  db_user: string;
  db_password: string; // Encrypted
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  subscription_status: 'active' | 'expired' | 'suspended' | 'trial';
  subscription_plan: 'basic' | 'professional' | 'enterprise' | 'custom';
  subscription_start: Date;
  subscription_end: Date;
  max_users: number;
  max_customers: number;
  max_storage_mb: number;
  features: Record<string, boolean>;
  settings: Record<string, any>;
  is_active: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface SuperAdmin {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string;
  role: 'super_admin' | 'admin' | 'support';
  permissions: Record<string, boolean>;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionPlan {
  id: number;
  plan_key: string;
  plan_name: string;
  plan_name_en: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_customers: number;
  max_storage_mb: number;
  features: Record<string, boolean>;
  description: string;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionHistory {
  id: number;
  tenant_id: number;
  plan_key: string;
  subscription_type: 'monthly' | 'yearly' | 'custom';
  start_date: Date;
  end_date: Date;
  amount: number;
  status: 'active' | 'expired' | 'cancelled' | 'refunded';
  notes: string;
  created_at: Date;
  created_by: number | null;
}

export interface TenantActivityLog {
  id: number;
  tenant_id: number;
  activity_type: 'created' | 'activated' | 'suspended' | 'expired' | 'deleted' | 'updated' | 'login' | 'other';
  description: string;
  metadata: Record<string, any>;
  performed_by: number | null;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}

// Helper Functions

/**
 * دریافت اطلاعات tenant بر اساس tenant_key
 */
export async function getTenantByKey(tenantKey: string): Promise<Tenant | null> {
  const results = await queryMaster<Tenant[]>(
    `SELECT * FROM tenants 
     WHERE tenant_key = ? AND is_active = 1 AND is_deleted = 0`,
    [tenantKey]
  );

  return results.length > 0 ? results[0] : null;
}

/**
 * دریافت لیست تمام tenants فعال
 */
export async function getActiveTenants(): Promise<Tenant[]> {
  return await queryMaster<Tenant[]>(
    `SELECT * FROM tenants 
     WHERE is_active = 1 AND is_deleted = 0 
     ORDER BY created_at DESC`
  );
}

/**
 * دریافت اطلاعات super admin بر اساس username
 */
export async function getSuperAdminByUsername(username: string): Promise<SuperAdmin | null> {
  const results = await queryMaster<SuperAdmin[]>(
    `SELECT * FROM super_admins 
     WHERE username = ? AND is_active = 1`,
    [username]
  );

  return results.length > 0 ? results[0] : null;
}

/**
 * دریافت لیست تمام subscription plans فعال
 */
export async function getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return await queryMaster<SubscriptionPlan[]>(
    `SELECT * FROM subscription_plans 
     WHERE is_active = 1 
     ORDER BY display_order ASC`
  );
}

/**
 * ثبت لاگ فعالیت tenant
 */
export async function logTenantActivity(
  tenantId: number,
  activityType: TenantActivityLog['activity_type'],
  description: string,
  metadata?: Record<string, any>,
  performedBy?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await queryMaster(
    `INSERT INTO tenant_activity_logs 
     (tenant_id, activity_type, description, metadata, performed_by, ip_address, user_agent) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      activityType,
      description,
      metadata ? JSON.stringify(metadata) : null,
      performedBy || null,
      ipAddress || null,
      userAgent || null
    ]
  );
}
