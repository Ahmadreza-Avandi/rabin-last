/**
 * Tenant Database Connection Manager
 * 
 * این ماژول برای مدیریت اتصالات به دیتابیس‌های tenant استفاده می‌شود
 * هر tenant یک connection pool اختصاصی دارد که cache می‌شود
 */

import mysql from 'mysql2/promise';
import { getTenantByKey, Tenant } from './master-database';
import { decryptPassword } from './encryption';

// Cache برای connection pools
const connectionPools = new Map<string, mysql.Pool>();

// Cache برای tenant configs
const tenantConfigCache = new Map<string, TenantConfig>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface TenantConfig {
  db_name: string;
  db_host: string;
  db_port: number;
  db_user: string;
  db_password: string; // Decrypted
  tenant_id: number;
  cached_at: number;
}

/**
 * دریافت Connection Pool برای یک tenant
 */
export async function getTenantConnection(tenantKey: string): Promise<mysql.Pool> {
  // بررسی cache
  if (connectionPools.has(tenantKey)) {
    return connectionPools.get(tenantKey)!;
  }

  // دریافت config از cache یا database
  const config = await getTenantConfig(tenantKey);

  if (!config) {
    throw new Error(`Tenant ${tenantKey} not found`);
  }

  // ایجاد connection pool جدید
  const pool = mysql.createPool({
    host: config.db_host,
    port: config.db_port,
    user: config.db_user,
    password: config.db_password,
    database: config.db_name,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+00:00',
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  // Cache کردن pool
  connectionPools.set(tenantKey, pool);

  console.log(`✅ Created connection pool for tenant: ${tenantKey}`);

  return pool;
}

/**
 * دریافت config tenant از cache یا database
 */
async function getTenantConfig(tenantKey: string): Promise<TenantConfig | null> {
  // بررسی cache
  const cached = tenantConfigCache.get(tenantKey);
  if (cached && Date.now() - cached.cached_at < CACHE_TTL) {
    return cached;
  }

  // دریافت از database
  const tenant = await getTenantByKey(tenantKey);

  if (!tenant) {
    return null;
  }

  // Decrypt password with fallback
  let decryptedPassword: string;
  let actualUser = tenant.db_user;

  try {
    decryptedPassword = decryptPassword(tenant.db_password);
    console.log(`✅ Successfully decrypted password for tenant ${tenantKey}`);
  } catch (error) {
    console.warn(`⚠️ Failed to decrypt password for tenant ${tenantKey}, using fallback`);
    // Fallback: برای rabin از root با پسورد خالی استفاده کن
    if (tenantKey === 'rabin' && tenant.db_name === 'crm_system') {
      decryptedPassword = '';
      actualUser = 'root';
      console.log(`   Using fallback: root with empty password for ${tenantKey}`);
    } else {
      throw error;
    }
  }

  const config: TenantConfig = {
    db_name: tenant.db_name,
    db_host: tenant.db_host,
    db_port: tenant.db_port,
    db_user: actualUser,
    db_password: decryptedPassword,
    tenant_id: tenant.id,
    cached_at: Date.now()
  };

  // Cache کردن
  tenantConfigCache.set(tenantKey, config);

  return config;
}

/**
 * اجرای query روی دیتابیس tenant
 */
export async function queryTenant<T = any>(
  tenantKey: string,
  sql: string,
  params?: any[]
): Promise<T> {
  const pool = await getTenantConnection(tenantKey);
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
export async function queryTenantWithRetry<T = any>(
  tenantKey: string,
  sql: string,
  params?: any[],
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryTenant<T>(tenantKey, sql, params);
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Query failed for tenant ${tenantKey} (attempt ${attempt}/${maxRetries}):`, error);

      if (attempt < maxRetries) {
        // منتظر می‌مانیم قبل از تلاش مجدد
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * بستن connection pool برای یک tenant
 */
export async function closeTenantConnection(tenantKey: string): Promise<void> {
  const pool = connectionPools.get(tenantKey);
  if (pool) {
    await pool.end();
    connectionPools.delete(tenantKey);
    tenantConfigCache.delete(tenantKey);
    console.log(`🔌 Closed connection pool for tenant: ${tenantKey}`);
  }
}

/**
 * بستن تمام connection pools
 */
export async function closeAllTenantConnections(): Promise<void> {
  const promises: Promise<void>[] = [];

  for (const [tenantKey, pool] of connectionPools.entries()) {
    promises.push(
      pool.end().then(() => {
        console.log(`🔌 Closed connection pool for tenant: ${tenantKey}`);
      })
    );
  }

  await Promise.all(promises);

  connectionPools.clear();
  tenantConfigCache.clear();

  console.log('🔌 All tenant connection pools closed');
}

/**
 * Invalidate کردن cache برای یک tenant
 */
export function invalidateTenantCache(tenantKey: string): void {
  tenantConfigCache.delete(tenantKey);
  console.log(`🗑️ Invalidated cache for tenant: ${tenantKey}`);
}

/**
 * دریافت آمار connection pools
 */
export function getConnectionPoolStats() {
  return {
    active_pools: connectionPools.size,
    cached_configs: tenantConfigCache.size,
    tenant_keys: Array.from(connectionPools.keys())
  };
}

/**
 * تست اتصال به دیتابیس tenant
 */
export async function testTenantConnection(tenantKey: string): Promise<boolean> {
  try {
    const pool = await getTenantConnection(tenantKey);
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log(`✅ Tenant ${tenantKey} connection successful`);
    return true;
  } catch (error) {
    console.error(`❌ Tenant ${tenantKey} connection failed:`, error);
    return false;
  }
}

/**
 * Helper: دریافت tenant_key از headers
 */
export function getTenantKeyFromHeaders(headers: Headers): string | null {
  return headers.get('X-Tenant-Key') || headers.get('x-tenant-key');
}

/**
 * Helper: دریافت tenant_id از headers
 */
export function getTenantIdFromHeaders(headers: Headers): number | null {
  const tenantId = headers.get('X-Tenant-ID') || headers.get('x-tenant-id');
  return tenantId ? parseInt(tenantId) : null;
}
