import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import mysql from 'mysql2/promise';
import { getCurrentUser, hasModulePermission } from '@/lib/auth';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm_system',
    charset: 'utf8mb4'
};

// دریافت جزئیات سند
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser(request);
        if (!user) {
          return NextResponse.json({ error: 'غیر مجاز' }, { status: 401 });
        }

        // بررسی دسترسی ماژول اسناد
        const hasDocsAccess = await hasModulePermission(user.id, 'documents');
        if (!hasDocsAccess) {
          return NextResponse.json({ error: 'دسترسی به مدیریت اسناد ندارید' }, { status: 403 });
        }

        const connection = await mysql.createConnection(dbConfig);

        const [documents] = await connection.execute(
            `SELECT 
        d.*,
        dc.name as category_name,
        dc.color as category_color,
        u.name as uploaded_by_name,
        u.avatar_url as uploaded_by_avatar
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = ? AND d.status = 'active'`,
            [params.id]
        );

        if ((documents as any[]).length === 0) {
            await connection.end();
            return NextResponse.json({ error: 'سند یافت نشد' }, { status: 404 });
        }

        const document = (documents as any[])[0];

        // بررسی دسترسی
        if (user.role !== 'ceo' && document.uploaded_by !== user.id && document.access_level === 'private') {
            const [permissions] = await connection.execute(
                `SELECT * FROM document_permissions 
         WHERE document_id = ? AND user_id = ? AND is_active = 1`,
                [params.id, user.id]
            );

            if ((permissions as any[]).length === 0) {
                await connection.end();
                return NextResponse.json({ error: 'دسترسی غیر مجاز' }, { status: 403 });
            }
        }

        // افزایش تعداد بازدید
        await connection.execute(
            'UPDATE documents SET view_count = view_count + 1 WHERE id = ?',
            [params.id]
        );

        // ثبت فعالیت مشاهده
        await connection.execute(
            `INSERT INTO document_activity_log (id, document_id, user_id, action, ip_address) 
       VALUES (UUID(), ?, ?, 'view', ?)`,
            [params.id, user.id, request.ip || 'unknown']
        );

        await connection.end();

        return NextResponse.json({ document });

    } catch (error) {
        console.error('خطا در دریافت سند:', error);
        return NextResponse.json({ error: 'خطا در دریافت سند' }, { status: 500 });
    }
}

// ویرایش سند
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser(request);
        if (!user) {
          return NextResponse.json({ error: 'غیر مجاز' }, { status: 401 });
        }

        // بررسی دسترسی ماژول اسناد
        const hasDocsAccess = await hasModulePermission(user.id, 'documents');
        if (!hasDocsAccess) {
          return NextResponse.json({ error: 'دسترسی به مدیریت اسناد ندارید' }, { status: 403 });
        }

        const { title, description, categoryId, accessLevel, tags } = await request.json();

        const connection = await mysql.createConnection(dbConfig);

        // بررسی وجود سند و دسترسی
        const [documents] = await connection.execute(
            'SELECT * FROM documents WHERE id = ? AND status = "active"',
            [params.id]
        );

        if ((documents as any[]).length === 0) {
            await connection.end();
            return NextResponse.json({ error: 'سند یافت نشد' }, { status: 404 });
        }

        const document = (documents as any[])[0];

        // بررسی دسترسی ویرایش
        if (user.role !== 'ceo' && document.uploaded_by !== user.id) {
            const [permissions] = await connection.execute(
                `SELECT * FROM document_permissions 
         WHERE document_id = ? AND user_id = ? AND permission_type IN ('edit', 'admin') AND is_active = 1`,
                [params.id, user.id]
            );

            if ((permissions as any[]).length === 0) {
                await connection.end();
                return NextResponse.json({ error: 'دسترسی ویرایش ندارید' }, { status: 403 });
            }
        }

        // ویرایش سند
        await connection.execute(
            `UPDATE documents SET 
        title = ?, description = ?, category_id = ?, 
        access_level = ?, tags = ?, updated_at = NOW()
       WHERE id = ?`,
            [
                title,
                description || null,
                categoryId || null,
                accessLevel,
                tags ? JSON.stringify(tags) : null,
                params.id
            ]
        );

        // ثبت فعالیت
        await connection.execute(
            `INSERT INTO document_activity_log (id, document_id, user_id, action, details, ip_address) 
       VALUES (UUID(), ?, ?, 'edit', ?, ?)`,
            [
                params.id,
                user.id,
                JSON.stringify({ title, description, categoryId, accessLevel }),
                request.ip || 'unknown'
            ]
        );

        await connection.end();

        return NextResponse.json({ success: true, message: 'سند با موفقیت ویرایش شد' });

    } catch (error) {
        console.error('خطا در ویرایش سند:', error);
        return NextResponse.json({ error: 'خطا در ویرایش سند' }, { status: 500 });
    }
}

// حذف سند
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser(request);
        if (!user) {
          return NextResponse.json({ error: 'غیر مجاز' }, { status: 401 });
        }

        // بررسی دسترسی ماژول اسناد
        const hasDocsAccess = await hasModulePermission(user.id, 'documents');
        if (!hasDocsAccess) {
          return NextResponse.json({ error: 'دسترسی به مدیریت اسناد ندارید' }, { status: 403 });
        }

        const connection = await mysql.createConnection(dbConfig);

        // بررسی وجود سند و دسترسی
        const [documents] = await connection.execute(
            'SELECT * FROM documents WHERE id = ? AND status = "active"',
            [params.id]
        );

        if ((documents as any[]).length === 0) {
            await connection.end();
            return NextResponse.json({ error: 'سند یافت نشد' }, { status: 404 });
        }

        const document = (documents as any[])[0];

        // بررسی دسترسی حذف
        if (user.role !== 'ceo' && document.uploaded_by !== user.id) {
            const [permissions] = await connection.execute(
                `SELECT * FROM document_permissions 
         WHERE document_id = ? AND user_id = ? AND permission_type IN ('delete', 'admin') AND is_active = 1`,
                [params.id, user.id]
            );

            if ((permissions as any[]).length === 0) {
                await connection.end();
                return NextResponse.json({ error: 'دسترسی حذف ندارید' }, { status: 403 });
            }
        }

        // حذف نرم (تغییر وضعیت به deleted)
        await connection.execute(
            'UPDATE documents SET status = "deleted", updated_at = NOW() WHERE id = ?',
            [params.id]
        );

        // ثبت فعالیت
        await connection.execute(
            `INSERT INTO document_activity_log (id, document_id, user_id, action, ip_address) 
       VALUES (UUID(), ?, ?, 'delete', ?)`,
            [params.id, user.id, request.ip || 'unknown']
        );

        await connection.end();

        return NextResponse.json({ success: true, message: 'سند با موفقیت حذف شد' });

    } catch (error) {
        console.error('خطا در حذف سند:', error);
        return NextResponse.json({ error: 'خطا در حذف سند' }, { status: 500 });
    }
}