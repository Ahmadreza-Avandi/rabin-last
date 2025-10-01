import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAuthUser } from '@/lib/auth-helper';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'غیر مجاز - لطفاً وارد شوید'
      }, { status: 401 });
    }

    // دریافت لیست کاربران (همکاران)
    const users = await executeQuery(
      `SELECT 
                id, 
                name, 
                email, 
                role, 
                avatar_url,
                status,
                phone,
                team,
                last_active,
                created_at
            FROM users 
            WHERE status = 'active' AND id != ?
            ORDER BY name ASC`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      users: users || []
    });

  } catch (error) {
    console.error('خطا در دریافت لیست کاربران:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در دریافت لیست کاربران'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'غیر مجاز - لطفاً وارد شوید'
      }, { status: 401 });
    }

    // Check if user has permission to add users (only CEO/admin)
    if (!['ceo', 'sales_manager'].includes(user.role)) {
      return NextResponse.json({
        success: false,
        message: 'عدم دسترسی - فقط مدیران می‌توانند کاربر جدید اضافه کنند'
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, team, phone } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json({
        success: false,
        message: 'تمام فیلدهای اجباری را پر کنید'
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'این ایمیل قبلاً ثبت شده است'
      }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate UUID for new user
    const userId = uuidv4();

    // Insert new user
    await executeQuery(
      `INSERT INTO users (id, name, email, password, role, team, phone, status, created_at, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW(), ?)`,
      [userId, name, email, hashedPassword, role, team || null, phone || null, user.id]
    );

    // Send welcome email to new colleague
    try {
      const NotificationService = require('@/lib/notification-service-v2');
      const notificationService = new NotificationService();
      await notificationService.initialize();
      await notificationService.sendNewColleagueWelcomeEmail(email, name, password);
    } catch (emailError) {
      console.error('خطا در ارسال ایمیل خوش‌آمدگویی:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'همکار جدید با موفقیت اضافه شد',
      data: { id: userId }
    });

  } catch (error) {
    console.error('خطا در افزودن کاربر:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در افزودن کاربر' },
      { status: 500 }
    );
  }
}