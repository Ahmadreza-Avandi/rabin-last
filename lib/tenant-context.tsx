/**
 * Tenant Context Provider
 * 
 * این ماژول برای مدیریت tenant context در application استفاده می‌شود
 * به components اجازه می‌دهد به tenant_key و اطلاعات tenant دسترسی داشته باشند
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface TenantInfo {
  tenant_key: string;
  company_name: string;
  subscription_status: 'active' | 'expired' | 'suspended' | 'trial';
  subscription_plan: 'basic' | 'professional' | 'enterprise' | 'custom';
  features: Record<string, boolean>;
  max_users: number;
  max_customers: number;
  max_storage_mb: number;
}

interface TenantContextType {
  tenantKey: string | null;
  tenantInfo: TenantInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshTenantInfo: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * استخراج tenant_key از pathname
 */
function extractTenantKeyFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/([^\/]+)/);
  if (!match) return null;
  
  const firstSegment = match[1];
  
  // Skip admin panel and other routes
  const excludedPrefixes = ['secret-zone-789', 'api', '_next', 'static', 'public'];
  if (excludedPrefixes.includes(firstSegment)) {
    return null;
  }
  
  // Validate tenant_key format
  if (/^[a-z0-9-]+$/.test(firstSegment)) {
    return firstSegment;
  }
  
  return null;
}

/**
 * Tenant Context Provider Component
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [tenantKey, setTenantKey] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * دریافت اطلاعات tenant از API
   */
  const fetchTenantInfo = async (key: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tenant/info?tenant_key=${key}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tenant info');
      }
      
      const data = await response.json();
      
      if (data.success && data.tenant) {
        setTenantInfo(data.tenant);
      } else {
        throw new Error(data.message || 'Failed to fetch tenant info');
      }
    } catch (err) {
      console.error('Error fetching tenant info:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTenantInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh tenant info
   */
  const refreshTenantInfo = async () => {
    if (tenantKey) {
      await fetchTenantInfo(tenantKey);
    }
  };

  /**
   * استخراج tenant_key از pathname و دریافت اطلاعات
   */
  useEffect(() => {
    const key = extractTenantKeyFromPath(pathname);
    
    if (key !== tenantKey) {
      setTenantKey(key);
      
      if (key) {
        fetchTenantInfo(key);
      } else {
        setTenantInfo(null);
        setError(null);
      }
    }
  }, [pathname, tenantKey]);

  const value: TenantContextType = {
    tenantKey,
    tenantInfo,
    isLoading,
    error,
    refreshTenantInfo
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook برای استفاده از Tenant Context
 */
export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  
  return context;
}

/**
 * Hook برای دریافت tenant_key
 */
export function useTenantKey(): string | null {
  const { tenantKey } = useTenant();
  return tenantKey;
}

/**
 * Hook برای دریافت tenant info
 */
export function useTenantInfo(): TenantInfo | null {
  const { tenantInfo } = useTenant();
  return tenantInfo;
}

/**
 * Hook برای بررسی اینکه آیا tenant یک feature خاص را دارد
 */
export function useTenantFeature(featureName: string): boolean {
  const { tenantInfo } = useTenant();
  
  if (!tenantInfo || !tenantInfo.features) {
    return false;
  }
  
  return tenantInfo.features[featureName] === true;
}

/**
 * HOC برای محافظت از components بر اساس tenant feature
 */
export function withTenantFeature<P extends object>(
  Component: React.ComponentType<P>,
  featureName: string,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: P) {
    const hasFeature = useTenantFeature(featureName);
    
    if (!hasFeature) {
      return fallback || (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            این ویژگی در پلن فعلی شما فعال نیست.
          </p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}
