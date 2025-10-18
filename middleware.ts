import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple JWT decoder for middleware (Edge Runtime compatible)
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

    // Check expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * استخراج tenant_key از URL path
 * مثال: /rabin/dashboard -> rabin
 */
function extractTenantKey(pathname: string): string | null {
  // Skip admin panel and static routes
  const excludedPrefixes = ['secret-zone-789', 'api', '_next', 'static', 'public', 'favicon.ico'];

  const match = pathname.match(/^\/([^\/]+)/);
  if (!match) return null;

  const firstSegment = match[1];

  // Check if it's an excluded route
  if (excludedPrefixes.includes(firstSegment)) {
    return null;
  }

  // Check if it's a valid tenant_key format
  if (isValidTenantKey(firstSegment)) {
    return firstSegment;
  }

  return null;
}

/**
 * اعتبارسنجی فرمت tenant_key
 * فقط حروف انگلیسی کوچک، اعداد و خط تیره مجاز است
 */
function isValidTenantKey(key: string): boolean {
  // Exclude error page routes
  const excludedKeys = ['tenant-not-found', 'account-inactive', 'subscription-expired', 'account-suspended'];
  if (excludedKeys.includes(key)) {
    return false;
  }

  return /^[a-z0-9-]+$/.test(key) && key.length >= 3 && key.length <= 50;
}

/**
 * دریافت اطلاعات tenant از Master Database
 * نوت: در Edge Runtime نمی‌توانیم مستقیم به دیتابیس متصل شویم
 * پس از API استفاده می‌کنیم
 */
async function getTenantInfo(tenantKey: string, request: NextRequest) {
  try {
    // Call internal API to get tenant info
    const apiUrl = new URL('/api/internal/tenant-info', request.url);
    apiUrl.searchParams.set('tenant_key', tenantKey);

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'x-internal-api': 'true',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.tenant;
  } catch (error) {
    console.error('Error fetching tenant info:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for admin panel
  if (pathname.startsWith('/secret-zone-789')) {
    return NextResponse.next();
  }

  // Skip middleware for error pages (لطفا middleware apply نکن)
  if (
    pathname === '/tenant-not-found' ||
    pathname === '/account-inactive' ||
    pathname === '/subscription-expired' ||
    pathname === '/account-suspended'
  ) {
    return NextResponse.next();
  }

  // Skip middleware for these paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/tenant/auth') ||
    pathname.startsWith('/api/tenant/info') ||
    pathname.startsWith('/api/admin/auth') ||
    pathname.startsWith('/api/internal') ||
    pathname.startsWith('/api/test-email') ||
    pathname.startsWith('/api/Gmail') ||
    pathname.startsWith('/api/feedback/form/') ||
    pathname.startsWith('/api/feedback/submit') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/feedback/form/') ||
    pathname === '/login' ||
    pathname === '/email-test' ||
    pathname === '/favicon.ico' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Redirect old dashboard routes to tenant-specific routes
  if (pathname.startsWith('/dashboard') ||
    pathname.startsWith('/customers') ||
    pathname.startsWith('/contacts') ||
    pathname.startsWith('/coworkers') ||
    pathname.startsWith('/activities') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/deals') ||
    pathname.startsWith('/feedback') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/insights') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/profile')) {
    // Redirect to default tenant (rabin)
    return NextResponse.redirect(new URL(`/rabin${pathname}`, request.url));
  }

  // ============================================
  // Tenant Detection
  // ============================================
  const tenantKey = extractTenantKey(pathname);

  if (tenantKey) {
    // Skip tenant validation for error pages
    if (pathname.includes('/tenant-not-found') ||
      pathname.includes('/account-inactive') ||
      pathname.includes('/subscription-expired') ||
      pathname.includes('/account-suspended')) {
      return NextResponse.next();
    }

    // Get tenant info from master database
    const tenant = await getTenantInfo(tenantKey, request);

    if (!tenant) {
      // Tenant not found - only redirect if not already on error page
      if (!pathname.includes('/tenant-not-found')) {
        return NextResponse.redirect(new URL('/tenant-not-found', request.url));
      }
      return NextResponse.next();
    }

    if (!tenant.is_active) {
      // Tenant is inactive
      if (!pathname.includes('/account-inactive')) {
        return NextResponse.redirect(new URL(`/${tenantKey}/account-inactive`, request.url));
      }
      return NextResponse.next();
    }

    if (tenant.subscription_status === 'expired') {
      // Subscription expired
      if (!pathname.includes('/subscription-expired')) {
        return NextResponse.redirect(new URL(`/${tenantKey}/subscription-expired`, request.url));
      }
      return NextResponse.next();
    }

    if (tenant.subscription_status === 'suspended') {
      // Account suspended
      if (!pathname.includes('/account-suspended')) {
        return NextResponse.redirect(new URL(`/${tenantKey}/account-suspended`, request.url));
      }
      return NextResponse.next();
    }

    // Add tenant info to request headers
    const response = NextResponse.next();
    response.headers.set('X-Tenant-Key', tenantKey);
    response.headers.set('X-Tenant-DB', tenant.db_name);
    response.headers.set('X-Tenant-ID', tenant.id.toString());

    return response;
  }

  // For dashboard routes, check authentication and permissions
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify token
    try {
      const decoded = decodeJWT(token);
      if (!decoded) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Check permissions for specific routes (except basic ones)
      const publicRoutes = ['/dashboard', '/dashboard/profile'];
      const adminRoutes = ['/dashboard/coworkers', '/dashboard/settings', '/dashboard/system-monitoring'];
      const managerRoutes = ['/dashboard/reports', '/dashboard/daily-reports', '/dashboard/insights'];
      const documentsRoutes = ['/dashboard/documents'];

      const userRole = decoded.role;

      // Admin routes - فقط مدیر عامل و مدیر فروش
      if (adminRoutes.some(route => pathname.startsWith(route))) {
        if (userRole !== 'ceo' && userRole !== 'sales_manager') {
          return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url));
        }
      }

      // Manager routes - مدیران و بالاتر
      if (managerRoutes.some(route => pathname.startsWith(route))) {
        if (userRole !== 'ceo' && userRole !== 'sales_manager') {
          return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url));
        }
      }

      // Documents routes - همه کاربران فعال
      if (documentsRoutes.some(route => pathname.startsWith(route))) {
        // همه کاربران احراز هویت شده می‌توانند به اسناد دسترسی داشته باشند
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // For API routes (except auth and feedback), verify token and add user info to headers
  if (pathname.startsWith('/api') &&
    !pathname.startsWith('/api/auth') &&
    !pathname.startsWith('/api/tenant/auth') &&
    !pathname.startsWith('/api/admin/auth') &&
    !pathname.startsWith('/api/feedback/form/') &&
    !pathname.startsWith('/api/feedback/submit') &&
    !pathname.startsWith('/api/health')) {
    // Development bypass for specific voice-analysis endpoints when allowed
    const allowDev = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_FALLBACK === '1';
    if (allowDev && (
      pathname.startsWith('/api/voice-analysis/sahab-speech-recognition') ||
      pathname.startsWith('/api/voice-analysis/sahab-tts-v2') ||
      pathname.startsWith('/api/voice-analysis/sahab-tts') ||
      pathname.startsWith('/api/voice-analysis/debug-sahab')
    )) {
      return NextResponse.next();
    }

    // برای tenant API ها از tenant_token استفاده کن
    let token;
    if (pathname.startsWith('/api/tenant/')) {
      token = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.cookies.get('tenant_token')?.value;
    } else if (pathname.startsWith('/api/admin/')) {
      token = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.cookies.get('admin_token')?.value;
    } else {
      token = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.cookies.get('auth-token')?.value;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'غیر مجاز - لطفاً وارد شوید' },
        { status: 401 }
      );
    }

    try {
      const decoded = decodeJWT(token);
      if (!decoded) {
        return NextResponse.json(
          { success: false, message: 'توکن نامعتبر' },
          { status: 401 }
        );
      }

      // Add user info to request headers (support tokens with userId or id)
      const requestHeaders = new Headers(request.headers);
      const userId = (decoded as any).id || (decoded as any).userId;
      const role = (decoded as any).role || '';
      const email = (decoded as any).email || '';

      if (userId) {
        requestHeaders.set('x-user-id', String(userId));
      }
      if (role) {
        requestHeaders.set('x-user-role', String(role));
      }
      if (email) {
        requestHeaders.set('x-user-email', String(email));
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'خطا در تأیید هویت' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};