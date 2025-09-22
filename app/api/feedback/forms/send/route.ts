import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { executeQuery, executeSingle } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'غیر مجاز' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { formId, customerId, customerEmail, customerName } = body;

        if (!formId || !customerId || !customerEmail) {
            return NextResponse.json(
                { success: false, message: 'اطلاعات ناکامل' },
                { status: 400 }
            );
        }

        // بررسی وجود فرم
        const [form] = await executeQuery(`
            SELECT * FROM feedback_forms WHERE id = ?
        `, [formId]);

        if (!form) {
            return NextResponse.json(
                { success: false, message: 'فرم یافت نشد' },
                { status: 404 }
            );
        }

        // ایجاد لینک منحصر به فرد برای پاسخ
        const responseId = uuidv4();
        const responseLink = `https://crm.robintejarat.com/feedback/respond/${responseId}`;

        // ذخیره درخواست پاسخ
        await executeSingle(`
            INSERT INTO feedback_responses (
                id, form_id, customer_id, customer_email, customer_name,
                response_link, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
        `, [responseId, formId, customerId, customerEmail, customerName, responseLink]);

        // شبیه‌سازی ارسال ایمیل (در آینده می‌توان ایمیل واقعی ارسال کرد)
        console.log(`Email would be sent to ${customerEmail} with link: ${responseLink}`);

        return NextResponse.json({
            success: true,
            message: 'فرم بازخورد ارسال شد',
            responseLink
        });

    } catch (error) {
        console.error('Error sending feedback form:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ارسال فرم' },
            { status: 500 }
        );
    }
}