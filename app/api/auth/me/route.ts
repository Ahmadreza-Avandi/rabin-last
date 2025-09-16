import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'غیر مجاز - لطفاً وارد شوید'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Auth me API error:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت اطلاعات کاربر'
    }, { status: 500 });
  }
}