import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

// GET /api/users - دریافت لیست کاربران
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    console.log('Fetching users list...');

    // دریافت لیست کاربران با تمام فیلدهای مورد نیاز
    const users = await executeQuery(`
      SELECT 
        id,
        username,
        COALESCE(name, username) as name,
        email,
        phone,
        role,
        team as department,
        status,
        created_at,
        last_login
      FROM users
      ORDER BY created_at DESC
    `);

    console.log(`Found ${users?.length || 0} users`);

    return NextResponse.json({
      success: true,
      users: users || []
    });

  } catch (error) {
    console.error('خطا در دریافت کاربران:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت کاربران' },
      { status: 500 }
    );
  }
}