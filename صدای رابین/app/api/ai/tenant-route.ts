/**
 * نسخه Tenant-Aware از Rabin Voice API
 * این فایل نمونه‌ای است برای نشان دادن چگونگی اضافه کردن tenant context
 * 
 * برای استفاده کامل، باید:
 * 1. این کد را در route.ts اصلی ادغام کنید
 * 2. processUserText را برای استفاده از tenant database به‌روزرسانی کنید
 * 3. logging را برای شامل tenant_key به‌روزرسانی کنید
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantConnection } from '@/lib/tenant-database';
import { getMasterConnection } from '@/lib/master-database';

/**
 * بررسی دسترسی tenant به ویژگی voice_assistant
 */
async function checkVoiceAssistantAccess(tenantKey: string): Promise<boolean> {
  let connection;
  
  try {
    connection = await getMasterConnection();
    
    const [tenants] = await connection.query(
      'SELECT features FROM tenants WHERE tenant_key = ? AND is_deleted = false',
      [tenantKey]
    ) as any[];

    if (tenants.length === 0) {
      return false;
    }

    const features = JSON.parse(tenants[0].features || '{}');
    return features.voice_assistant === true;

  } catch (error) {
    console.error('❌ خطا در بررسی دسترسی:', error);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Handler اصلی با tenant context
 */
export async function POST(request: NextRequest) {
  try {
    // دریافت tenant_key از header یا query parameter
    const tenantKey = request.headers.get('X-Tenant-Key') || 
                      new URL(request.url).searchParams.get('tenant_key');

    if (!tenantKey) {
      return NextResponse.json(
        { error: 'Tenant key الزامی است' },
        { status: 400 }
      );
    }

    // بررسی دسترسی به ویژگی voice_assistant
    const hasAccess = await checkVoiceAssistantAccess(tenantKey);

    if (!hasAccess) {
      return NextResponse.json(
        { 
          error: 'دسترسی به دستیار صوتی در پلن فعلی شما وجود ندارد',
          message: 'برای استفاده از این ویژگی، لطفا پلن خود را ارتقا دهید'
        },
        { status: 403 }
      );
    }

    const { userMessage, history = [] } = await request.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'پیام کاربر الزامی است' }, { status: 400 });
    }

    console.log(`🎯 [${tenantKey}] AI Request received:`, userMessage);

    // اتصال به دیتابیس tenant
    let connection;
    try {
      connection = await getTenantConnection(tenantKey);
      console.log(`✅ [${tenantKey}] Connected to tenant database`);

      // TODO: پردازش keyword detection با استفاده از tenant database
      // این بخش باید processUserText را با connection tenant فراخوانی کند

      // فعلا یک پاسخ ساده برمی‌گردانیم
      return NextResponse.json({
        response: `سلام! من رابین هستم، دستیار هوشمند شما در tenant ${tenantKey}. این یک نسخه نمونه است.`,
        intent: null,
        actionExecuted: false,
        hasSystemData: false,
        tenant_key: tenantKey,
        processingInfo: {
          message: 'این یک پیاده‌سازی نمونه است. برای استفاده کامل، کد اصلی را ادغام کنید.'
        }
      });

    } finally {
      if (connection) {
        await connection.end();
      }
    }

  } catch (error) {
    console.error('❌ خطا در پردازش درخواست AI:', error);
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
