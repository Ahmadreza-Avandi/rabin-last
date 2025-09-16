import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { hasPermission } from '@/lib/auth';
import { getAuthUser } from '@/lib/auth-helper';
import { createSaleNotification } from '@/lib/notification-utils';
import { v4 as uuidv4 } from 'uuid';

// Import notification services (with try-catch for safety)
let notificationService: any = null;
let internalNotificationSystem: any = null;

try {
    notificationService = require('@/lib/notification-service.js');
} catch (error: any) {
    console.warn('⚠️ notification-service.js not available:', error.message);
}

try {
    internalNotificationSystem = require('@/lib/notification-system.js');
} catch (error: any) {
    console.warn('⚠️ notification-system.js not available:', error.message);
}

// GET /api/sales - Get all sales records
export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'لطفا وارد حساب کاربری خود شوید'
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // Get total count
        const [countResult] = await executeQuery(`
            SELECT COUNT(*) as total
            FROM sales s
            WHERE s.sales_person_id = ?
        `, [user.id]);

        // Get sales records
        const sales = await executeQuery(`
            SELECT 
                s.*,
                p.name as product_name
            FROM sales s
            LEFT JOIN products p ON s.product_id = p.id
            WHERE s.sales_person_id = ?
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        `, [user.id, limit, offset]);

        return NextResponse.json({
            success: true,
            data: {
                sales,
                pagination: {
                    page,
                    limit,
                    total: countResult.total,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get sales API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت فروش‌ها' },
            { status: 500 }
        );
    }
}

// POST /api/sales - Create new sale record
export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'لطفا وارد حساب کاربری خود شوید'
            }, { status: 401 });
        }

        const [currentUser] = await executeQuery('SELECT name FROM users WHERE id = ?', [user.id]);
        const userName = currentUser?.name || 'نامشخص';

        const body = await req.json();
        const {
            productId,
            amount,
            quantity = 1,
            description,
            saleDate = new Date().toISOString().slice(0, 19).replace('T', ' ')
        } = body;

        // Validate required fields
        if (!productId || !amount || amount <= 0) {
            return NextResponse.json(
                { success: false, message: 'لطفاً تمام فیلدهای الزامی را پر کنید' },
                { status: 400 }
            );
        }

        // Generate sale ID
        const saleId = uuidv4();

        // Create sale record
        await executeQuery(`
            INSERT INTO sales (
                id,
                product_id,
                sales_person_id,
                quantity,
                amount,
                description,
                sale_date,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            saleId,
            productId,
            user.id,
            quantity,
            amount,
            description || null,
            saleDate
        ]);

        // Get product details
        const [product] = await executeQuery('SELECT name FROM products WHERE id = ?', [productId]);

        // Send notifications if available
        if (notificationService?.sendSaleNotification) {
            try {
                await notificationService.sendSaleNotification({
                    saleId,
                    amount,
                    productName: product?.name,
                    salesPersonName: userName
                });
            } catch (error) {
                console.error('Notification error:', error);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'فروش با موفقیت ثبت شد',
            data: {
                id: saleId,
                product_name: product?.name,
                amount,
                quantity,
                sales_person_name: userName,
                sale_date: saleDate
            }
        });

    } catch (error) {
        console.error('Create sale API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ثبت فروش' },
            { status: 500 }
        );
    }
}
