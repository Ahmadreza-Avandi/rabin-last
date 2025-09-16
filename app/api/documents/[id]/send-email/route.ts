import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getUserFromToken, hasModulePermission } from '@/lib/auth';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm_system',
    charset: 'utf8mb4',
};

// Helper function to create email template
function createDocumentEmailTemplate(documentData: any, message?: string, includeAttachment?: boolean) {
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 بایت';
        const k = 1024;
        const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px; background: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📄 سند جدید برای شما ارسال شد</h1>
          </div>
          <div style="padding: 30px;">
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #10B981;">
              <p style="margin: 0 0 10px 0;"><strong>📋 نام سند:</strong> ${documentData.title}</p>
              <p style="margin: 0 0 10px 0;"><strong>📁 نام فایل:</strong> ${documentData.original_filename}</p>
              <p style="margin: 0 0 10px 0;"><strong>📊 حجم فایل:</strong> ${formatFileSize(documentData.file_size)}</p>
              <p style="margin: 0 0 10px 0;"><strong>📅 تاریخ آپلود:</strong> ${documentData.persian_date || new Date().toLocaleDateString('fa-IR')}</p>
              ${documentData.description ? `<p style="margin: 0;"><strong>📝 توضیحات:</strong> ${documentData.description}</p>` : ''}
            </div>
            ${message ? `
              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #3B82F6;">
                <p style="margin: 0;"><strong>💬 پیام:</strong></p>
                <p style="margin: 10px 0 0 0; color: #374151;">${message}</p>
              </div>
            ` : ''}
            ${includeAttachment ? `
              <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #166534;">📎 فایل سند به این ایمیل ضمیمه شده است</p>
              </div>
            ` : ''}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/documents" 
                 style="background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                 🔗 مشاهده در سیستم
              </a>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              این ایمیل از سیستم مدیریت اسناد ارسال شده است<br>
              تاریخ ارسال: ${new Date().toLocaleDateString('fa-IR')}
            </p>
          </div>
        </div>
      </div>
    `;
}

// ارسال سند از طریق ایمیل با استفاده از /api/Gmail و ضمیمه واقعی فایل
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromToken(request);
        if (!user) {
          return NextResponse.json({ error: 'غیر مجاز' }, { status: 401 });
        }

        // بررسی دسترسی ماژول اسناد
        const hasDocsAccess = await hasModulePermission(user.id, 'documents');
        if (!hasDocsAccess) {
          return NextResponse.json({ error: 'دسترسی به مدیریت اسناد ندارید' }, { status: 403 });
        }

        const { emails, subject, message, includeAttachment = true } = await request.json();

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({ error: 'ایمیل‌ها الزامی است' }, { status: 400 });
        }

        // Validate emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emails.filter((email: string) => !emailRegex.test(email));
        if (invalidEmails.length > 0) {
            return NextResponse.json({ error: `فرمت ایمیل‌های زیر نامعتبر است: ${invalidEmails.join(', ')}` }, { status: 400 });
        }

        const connection = await mysql.createConnection(dbConfig);

        try {
            // Fetch document
            const [documents] = await connection.execute('SELECT * FROM documents WHERE id = ? AND status = "active"', [params.id]);
            if ((documents as any[]).length === 0) {
                return NextResponse.json({ error: 'سند یافت نشد' }, { status: 404 });
            }
            const document = (documents as any[])[0];

            // Permission check
            if (user.role !== 'ceo' && document.uploaded_by !== user.id) {
                const [permissions] = await connection.execute(
                    `SELECT * FROM document_permissions 
           WHERE document_id = ? AND user_id = ? AND permission_type IN ('view', 'download', 'share', 'admin') AND is_active = 1`,
                    [params.id, user.id]
                );
                if ((permissions as any[]).length === 0) {
                    return NextResponse.json({ error: 'دسترسی به این سند ندارید' }, { status: 403 });
                }
            }

            // Build email content
            const emailContent = createDocumentEmailTemplate(document, message, includeAttachment);
            const emailSubject = subject || `📄 سند "${document.title}" برای شما ارسال شد`;

            // Try to resolve file path and build attachment
            let attachment: { filename: string; contentBase64: string } | null = null;
            if (includeAttachment) {
                // 1) Try DB first
                try {
                    const [fileRows] = await connection.execute(
                        'SELECT content FROM document_files WHERE document_id = ? LIMIT 1',
                        [params.id]
                    );
                    if ((fileRows as any[]).length > 0 && (fileRows as any[])[0].content) {
                        const buf = (fileRows as any[])[0].content as Buffer;
                        attachment = {
                            filename: document.original_filename,
                            contentBase64: Buffer.from(buf).toString('base64'),
                        };
                        console.log('✅ Attachment loaded from DB');
                    }
                } catch (e) {
                    console.warn('⚠️ Failed to load attachment from DB, will try disk:', e);
                }

                // 2) Fallback to disk if DB not found
                if (!attachment) {
                    const fs = require('fs').promises;
                    const path = require('path');
                    const possiblePaths = [
                        // Prefer stored_filename under uploads/documents (same as download route)
                        path.join(process.cwd(), 'uploads', 'documents', document.stored_filename),
                        path.join('./uploads', 'documents', document.stored_filename),
                        (process.env.UPLOAD_DIR ? path.join(process.env.UPLOAD_DIR, 'documents', document.stored_filename) : null),
                        // Legacy fallbacks using file_path if present
                        (document.file_path ? path.join(process.cwd(), 'uploads', document.file_path) : null),
                        (document.file_path ? path.join('./uploads', document.file_path) : null),
                        (document.file_path || null),
                    ].filter(Boolean);
                    for (const p of possiblePaths) {
                        try {
                            await fs.access(p as string);
                            const buf = await fs.readFile(p as string);
                            attachment = {
                                filename: document.original_filename,
                                contentBase64: Buffer.from(buf).toString('base64'),
                            };
                            console.log('✅ Attachment prepared from disk:', p);
                            break;
                        } catch { }
                    }
                }

                if (!attachment) {
                    console.log('⚠️ فایل برای ضمیمه یافت نشد. ارسال بدون پیوست انجام می‌شود.');
                }
            }

            const sentEmails: string[] = [];
            const failedEmails: string[] = [];

            for (const email of emails) {
                try {
                    const payload: any = {
                        to: email,
                        subject: emailSubject,
                        html: emailContent,
                        text: emailContent.replace(/<[^>]+>/g, ' '),
                    };
                    if (attachment) {
                        payload.attachments = [attachment];
                    }

                    const res = await fetch('http://localhost:3000/api/Gmail', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    const data = await res.json().catch(() => ({ ok: false }));

                    if (res.ok && data?.ok) {
                        sentEmails.push(email);
                    } else {
                        failedEmails.push(email);
                    }

                    // small delay
                    await new Promise((r) => setTimeout(r, 800));
                } catch (e) {
                    failedEmails.push(email);
                }
            }

            const success = sentEmails.length > 0;
            return NextResponse.json({
                success,
                message:
                    sentEmails.length === emails.length
                        ? 'سند با موفقیت به همه گیرندگان ارسال شد'
                        : failedEmails.length === emails.length
                            ? 'خطا در ارسال سند به همه گیرندگان'
                            : `سند به ${sentEmails.length} نفر ارسال شد، ${failedEmails.length} نفر ناموفق`,
                sentEmails,
                failedEmails,
            });
        } finally {
            await connection.end();
        }
    } catch (error) {
        console.error('❌ خطا در ارسال سند از طریق ایمیل:', error);
        return NextResponse.json({ error: 'خطا در ارسال ایمیل' }, { status: 500 });
    }
}
