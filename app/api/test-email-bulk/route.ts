import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { expressEmailService } from '@/lib/express-email-service';

// Test bulk email sending
export async function POST(request: NextRequest) {
    try {
        // برای تست، authentication رو موقتاً غیرفعال می‌کنیم
        // const user = await getUserFromToken(request);
        // if (!user) {
        //     return NextResponse.json({ error: 'غیر مجاز' }, { status: 401 });
        // }

        const { emails, subject, content } = await request.json();

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({ error: 'لیست ایمیل‌ها الزامی است' }, { status: 400 });
        }

        console.log('🔧 Testing bulk email sending...');
        console.log('Emails to send:', emails);
        console.log('Subject:', subject);
        console.log('Content length:', content?.length || 0);

        // Test Express email service availability
        const serviceTest = await expressEmailService.testConnection();
        if (!serviceTest) {
            return NextResponse.json({
                success: false,
                error: 'Express email service not available - please start the Express email service on port 3001'
            }, { status: 500 });
        }

        // Prepare emails for bulk sending
        const emailsToSend = emails.map((email: any) => ({
            to: email.to || email,
            subject: email.subject || subject || 'تست ارسال ایمیل از سیستم CRM',
            html: email.message || content || `
                <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px;">
                    <h2>تست سیستم ایمیل</h2>
                    <p>این یک ایمیل تست از سیستم CRM است.</p>
                    <p>اگر این ایمیل را دریافت کردید، سیستم به درستی کار می‌کند.</p>
                    <p>تاریخ ارسال: ${new Date().toLocaleDateString('fa-IR')}</p>
                    <p>ساعت ارسال: ${new Date().toLocaleTimeString('fa-IR')}</p>
                </div>
            `,
            variables: email.variables || {}
        }));

        // Send bulk emails using Express service
        const results = await expressEmailService.sendBulkEmails(emailsToSend);

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        console.log(`📊 Bulk email results: ${successCount} success, ${failCount} failed`);

        return NextResponse.json({
            success: true,
            message: `ارسال انجام شد: ${successCount} موفق، ${failCount} ناموفق`,
            results,
            summary: {
                total: results.length,
                success: successCount,
                failed: failCount
            }
        });

    } catch (error) {
        console.error('❌ Bulk email test error:', error);
        return NextResponse.json({
            error: 'خطا در تست ارسال ایمیل',
            details: error.message
        }, { status: 500 });
    }
}

// Get email service status
export async function GET(request: NextRequest) {
    try {
        // برای تست، authentication رو موقتاً غیرفعال می‌کنیم
        // const user = await getUserFromToken(request);
        // if (!user) {
        //     return NextResponse.json({ error: 'غیر مجاز' }, { status: 401 });
        // }

        console.log('🔧 Checking Express email service status...');

        // Test Express email service connection
        const connectionTest = await expressEmailService.testConnection();

        return NextResponse.json({
            success: true,
            emailService: {
                type: 'Express Email Service',
                configured: connectionTest,
                connectionTest,
                serviceUrl: process.env.EXPRESS_EMAIL_SERVICE_URL || 'http://localhost:3001',
                status: connectionTest ? 'Connected' : 'Disconnected'
            }
        });

    } catch (error) {
        console.error('❌ Email service status error:', error);
        return NextResponse.json({
            error: 'خطا در بررسی وضعیت سرویس ایمیل',
            details: error.message
        }, { status: 500 });
    }
}