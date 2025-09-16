import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';
import { getUserFromToken, hasModulePermission } from '@/lib/auth';
import { convertToJalali } from '@/lib/persian-date';

// اتصال به دیتابیس
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm_system',
    charset: 'utf8mb4',
};

function mapAccessLevel(level?: string): 'public' | 'private' | 'restricted' | 'confidential' {
    switch ((level || '').toLowerCase()) {
        case 'public':
            return 'public';
        case 'restricted':
            return 'restricted';
        case 'confidential':
            return 'confidential';
        // مقدار قدیمی internal به private نگاشت می‌شود
        case 'internal':
        default:
            return 'private';
    }
}

// آپلود سند جدید
export async function POST(request: NextRequest) {
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

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = (formData.get('title') as string) || '';
        const description = (formData.get('description') as string) || '';
        const accessLevelRaw = (formData.get('accessLevel') as string) || 'private';
        const tagsRaw = (formData.get('tags') as string) || '';

        if (!file) {
            return NextResponse.json({ error: 'فایل انتخاب نشده' }, { status: 400 });
        }

        // بررسی نوع فایل مجاز
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'نوع فایل مجاز نیست' }, { status: 400 });
        }

        // حداکثر 50MB
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'حجم فایل بیش از حد مجاز است' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // تولید نام فایل ذخیره شده
        const fileExtension = (file.name.split('.').pop() || '').toLowerCase();
        const storedFilename = `${uuidv4()}.${fileExtension || 'bin'}`;
        const uploadDir = join(process.cwd(), 'uploads', 'documents');

        await mkdir(uploadDir, { recursive: true });
        const absFilePath = join(uploadDir, storedFilename);
        await writeFile(absFilePath, buffer);

        // ثبت در دیتابیس طبق ساختار جدید
        const connection = await mysql.createConnection(dbConfig);

        const documentId = uuidv4();
        const persianDate = convertToJalali(new Date());
        const accessLevel = mapAccessLevel(accessLevelRaw);

        // برچسب‌ها را به JSON تبدیل می‌کنیم (آرایه رشته‌ها)
        const tags = tagsRaw
            ? JSON.stringify(
                tagsRaw
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
            )
            : null;

        await connection.execute(
            `INSERT INTO documents (
        id,
        title,
        description,
        original_filename,
        stored_filename,
        file_path,
        file_size,
        mime_type,
        file_extension,
        access_level,
        status,
        version,
        tags,
        persian_date,
        uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                documentId,
                title || file.name,
                description || null,
                file.name,
                storedFilename,
                `/uploads/documents/${storedFilename}`,
                file.size,
                file.type,
                fileExtension,
                accessLevel,
                // وضعیت‌های قدیمی (draft/final/...) به active نگاشت می‌شوند
                'active',
                1,
                tags,
                persianDate,
                user.id,
            ],
        );

        // ثبت لاگ فعالیت اسناد
        await connection.execute(
            `INSERT INTO document_activity_log (id, document_id, user_id, action, details, ip_address)
       VALUES (UUID(), ?, ?, 'upload', ?, ?)`,
            [
                documentId,
                user.id,
                JSON.stringify({ title: title || file.name, size: file.size, mime: file.type }),
                (request as any).ip || 'unknown',
            ],
        );

        await connection.end();

        return NextResponse.json({
            success: true,
            document: {
                id: documentId,
                title: title || file.name,
                filename: file.name,
                size: file.size,
                type: file.type,
            },
        });
    } catch (error) {
        console.error('خطا در آپلود فایل:', error);
        return NextResponse.json({ error: 'خطا در آپلود فایل' }, { status: 500 });
    }
}

// دریافت لیست اسناد
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const search = searchParams.get('search') || '';
        const accessLevel = searchParams.get('accessLevel') || '';
        const dateFrom = searchParams.get('dateFrom') || '';
        const dateTo = searchParams.get('dateTo') || '';

        // فیلترهای documentType و contentType در ساختار جدید وجود ندارند؛ نادیده گرفته می‌شوند

        const connection = await mysql.createConnection(dbConfig);

        let whereClause = 'WHERE d.status != "deleted"';
        const queryParams: any[] = [];

        // دسترسی کاربر
        if (user.role !== 'ceo') {
            whereClause += ` AND (
        d.uploaded_by = ? OR 
        d.access_level = 'public' OR
        EXISTS (
          SELECT 1 FROM document_shares ds 
          WHERE ds.document_id = d.id AND ds.shared_with_user_id = ?
        )
      )`;
            queryParams.push(user.id, user.id);
        }

        if (search) {
            // استفاده از LIKE ساده برای سازگاری
            whereClause += ' AND (d.title LIKE ? OR d.description LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (accessLevel) {
            whereClause += ' AND d.access_level = ?';
            queryParams.push(mapAccessLevel(accessLevel));
        }

        if (dateFrom) {
            whereClause += ' AND DATE(d.created_at) >= ?';
            queryParams.push(dateFrom);
        }

        if (dateTo) {
            whereClause += ' AND DATE(d.created_at) <= ?';
            queryParams.push(dateTo);
        }

        const offset = (page - 1) * limit;

        const [documents] = await connection.execute(
            `SELECT 
        d.id,
        d.title,
        d.description,
        NULL as document_type,
        NULL as content_type,
        d.status,
        d.file_extension as format,
        d.stored_filename as file_name,
        d.original_filename as original_name,
        d.file_path,
        d.file_size,
        d.mime_type,
        CAST(d.version AS CHAR) as version,
        CASE WHEN d.access_level = 'public' THEN 1 ELSE 0 END as is_public,
        d.access_level,
        d.tags,
        d.download_count,
        IFNULL(d.persian_date, DATE_FORMAT(d.created_at, '%Y/%m/%d')) as persian_date,
        u.name as uploaded_by_name,
        d.created_at
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset],
        );

        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM documents d ${whereClause}`,
            queryParams,
        );

        await connection.end();

        return NextResponse.json({
            documents,
            pagination: {
                page,
                limit,
                total: (countResult as any)[0].total,
                totalPages: Math.ceil(((countResult as any)[0].total as number) / limit),
            },
        });
    } catch (error) {
        console.error('خطا در دریافت اسناد:', error);
        return NextResponse.json({ error: 'خطا در دریافت اسناد' }, { status: 500 });
    }
}