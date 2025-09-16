import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getUserFromToken } from '@/lib/auth';

// اتصال به دیتابیس
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm_system',
    charset: 'utf8mb4'
};

// دریافت آمار اسناد
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        if (!user) {
            return NextResponse.json({ error: 'غیر مجاز' }, { status: 401 });
        }

        const connection = await mysql.createConnection(dbConfig);

        // آمار کلی اسناد (ستون document_type در جدول وجود ندارد، از mime_type/extension استفاده می‌کنیم)
        const [stats] = await connection.execute(`
            SELECT 
                COALESCE(file_extension, SUBSTRING_INDEX(mime_type, '/', 1)) AS doc_group,
                status,
                COUNT(*) as document_count,
                ROUND(SUM(file_size) / 1024 / 1024, 2) as total_size_mb,
                ROUND(AVG(file_size) / 1024 / 1024, 2) as avg_size_mb
            FROM documents 
            WHERE status != 'archived'
            GROUP BY doc_group, status
            ORDER BY doc_group, status
        `);

        // آمار بر اساس نوع محتوا (ستون content_type نداریم؛ از mime_type استفاده می‌کنیم)
        const [contentStats] = await connection.execute(`
            SELECT 
                mime_type,
                COUNT(*) as count,
                ROUND(SUM(file_size) / 1024 / 1024, 2) as total_size_mb
            FROM documents 
            WHERE status != 'archived'
            GROUP BY mime_type
            ORDER BY count DESC
        `);

        // آمار بر اساس سطح دسترسی
        const [accessStats] = await connection.execute(`
            SELECT 
                access_level,
                COUNT(*) as count
            FROM documents 
            WHERE status != 'archived'
            GROUP BY access_level
            ORDER BY count DESC
        `);

        // آمار اسناد اخیر (30 روز گذشته)
        const [recentStats] = await connection.execute(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM documents 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `);

        await connection.end();

        return NextResponse.json({
            stats,
            contentStats,
            accessStats,
            recentStats
        });

    } catch (error) {
        console.error('خطا در دریافت آمار اسناد:', error);
        return NextResponse.json({ error: 'خطا در دریافت آمار اسناد' }, { status: 500 });
    }
}