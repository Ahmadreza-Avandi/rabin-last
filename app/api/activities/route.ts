import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/activities - دریافت فعالیت‌ها با فیلتر
export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const type = searchParams.get('type');
        const outcome = searchParams.get('outcome');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const customerId = searchParams.get('customerId');

        let whereClause = 'WHERE 1=1';
        const params: any[] = [];

        if (type) {
            whereClause += ' AND a.type = ?';
            params.push(type);
        }

        if (outcome) {
            whereClause += ' AND a.outcome = ?';
            params.push(outcome);
        }

        if (dateFrom) {
            whereClause += ' AND DATE(a.start_time) >= ?';
            params.push(dateFrom);
        }

        if (dateTo) {
            whereClause += ' AND DATE(a.start_time) <= ?';
            params.push(dateTo);
        }

        if (customerId) {
            whereClause += ' AND a.customer_id = ?';
            params.push(customerId);

        }

        // محدود کردن دسترسی برای کاربران غیر CEO - فعلاً غیرفعال برای تست
        // if (user.role !== 'ceo') {
        //     whereClause += ' AND a.performed_by = ?';
        //     params.push(user.id);
        // }

        // دریافت فعالیت‌ها
        const offset = Math.max(0, (page - 1) * limit); // اطمینان از مثبت بودن offset
        console.log('Executing activities query with params:', [...params]);
        console.log('Where clause:', whereClause);
        console.log('Limit:', limit, 'Offset:', offset);
        
        const activities = await executeQuery(`
            SELECT 
                a.id,
                a.customer_id,
                a.deal_id,
                a.type,
                a.title,
                a.description,
                a.start_time,
                a.end_time,
                a.duration,
                a.performed_by,
                a.outcome,
                a.location,
                a.notes,
                a.created_at,
                a.updated_at,
                c.name as customer_name,
                u.name as performed_by_name
            FROM activities a
            LEFT JOIN customers c ON a.customer_id = c.id
            LEFT JOIN users u ON a.performed_by = u.id
            ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);
        
        // شمارش کل
        const countResult = await executeQuery(`
            SELECT COUNT(*) as total 
            FROM activities a 
            ${whereClause}
        `, params);

        const total = countResult && countResult.length > 0 ? countResult[0].total : 0;
        
        return NextResponse.json({
            success: true,
            data: activities,
            pagination: {
                page,
                limit,
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('خطا در دریافت فعالیت‌ها:', error);
        
        let errorMessage = 'خطا در دریافت فعالیت‌ها';
        
        if (error instanceof Error) {
            if (error.message.includes('ER_NO_SUCH_TABLE')) {
                errorMessage = 'جدول فعالیت‌ها در دیتابیس وجود ندارد';
            } else if (error.message.includes('ECONNREFUSED')) {
                errorMessage = 'خطا در اتصال به دیتابیس';
            } else {
                errorMessage = error.message;
            }
        }
        
        return NextResponse.json(
            { 
                success: false, 
                message: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
}

// POST /api/activities - ایجاد فعالیت جدید
export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            customer_id,
            deal_id,
            type,
            title,
            description,
            start_time,
            end_time,
            duration,
            outcome,
            location,
            notes
        } = body;

        if (!customer_id || !type || !title) {
            return NextResponse.json(
                { success: false, message: 'مشتری، نوع و عنوان الزامی است' },
                { status: 400 }
            );
        }

        const activityId = uuidv4();

        await executeSingle(`
            INSERT INTO activities (
                id, customer_id, deal_id, type, title, description,
                start_time, end_time, duration, performed_by, outcome,
                location, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            activityId,
            customer_id,
            deal_id || null,
            type,
            title,
            description || null,
            start_time || null,
            end_time || null,
            duration || null,
            user.id,
            outcome || 'completed',
            location || null,
            notes || null
        ]);

        return NextResponse.json({
            success: true,
            message: 'فعالیت با موفقیت ایجاد شد',
            data: { id: activityId }
        });

    } catch (error) {
        console.error('خطا در ایجاد فعالیت:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ایجاد فعالیت' },
            { status: 500 }
        );
    }
}

// DELETE /api/activities - حذف فعالیت
export async function DELETE(req: NextRequest) {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const activityId = searchParams.get('id');

        if (!activityId) {
            return NextResponse.json(
                { success: false, message: 'شناسه فعالیت الزامی است' },
                { status: 400 }
            );
        }

        // بررسی وجود فعالیت و مجوز حذف
        const [activity] = await executeQuery(`
            SELECT id, performed_by FROM activities WHERE id = ?
        `, [activityId]);

        if (!activity) {
            return NextResponse.json(
                { success: false, message: 'فعالیت یافت نشد' },
                { status: 404 }
            );
        }

        // بررسی مجوز (فقط سازنده یا CEO) - فعلاً غیرفعال برای تست
        // if (user.role !== 'ceo' && (activity as any).performed_by !== user.id) {
        //     return NextResponse.json(
        //         { success: false, message: 'مجوز حذف ندارید' },
        //         { status: 403 }
        //     );
        // }

        // حذف فعالیت
        await executeSingle(`DELETE FROM activities WHERE id = ?`, [activityId]);

        return NextResponse.json({
            success: true,
            message: 'فعالیت با موفقیت حذف شد'
        });

    } catch (error) {
        console.error('خطا در حذف فعالیت:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در حذف فعالیت' },
            { status: 500 }
        );
    }
}