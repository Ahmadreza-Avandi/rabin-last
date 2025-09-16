import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getUserSidebarMenu } from '@/lib/permissions';

// GET /api/auth/permissions - Get user's permissions and sidebar menu
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'غیر مجاز' }, { status: 401 });
    }

    const menuItems = await getUserSidebarMenu(user.id);

    return NextResponse.json({
      success: true,
      data: menuItems,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Get permissions API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت دسترسی‌ها' },
      { status: 500 }
    );
  }
}