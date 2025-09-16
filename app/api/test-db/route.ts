import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'crm_system',
    charset: 'utf8mb4'
};

export async function GET() {
    try {
        console.log('تست اتصال دیتابیس با تنظیمات:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database,
            hasPassword: !!dbConfig.password
        });

        const connection = await mysql.createConnection(dbConfig);

        const [result] = await connection.execute('SELECT COUNT(*) as count FROM users');

        await connection.end();

        return NextResponse.json({
            success: true,
            message: 'اتصال دیتابیس موفق',
            userCount: (result as any[])[0].count,
            config: {
                host: dbConfig.host,
                user: dbConfig.user,
                database: dbConfig.database
            }
        });

    } catch (error) {
        console.error('خطا در اتصال دیتابیس:', error);
        return NextResponse.json({
            success: false,
            message: 'خطا در اتصال دیتابیس',
            error: error instanceof Error ? error.message : 'خطای نامشخص',
            config: {
                host: dbConfig.host,
                user: dbConfig.user,
                database: dbConfig.database
            }
        }, { status: 500 });
    }
}