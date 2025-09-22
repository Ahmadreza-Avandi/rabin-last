import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only allow admin/ceo to access system stats
        if (user.role !== 'ceo' && user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Get system statistics
        const stats = {
            // Database stats
            database: {
                status: 'connected',
                tables: 0,
                size: '0 MB'
            },
            
            // User stats
            users: {
                total: 0,
                active: 0,
                inactive: 0
            },
            
            // Customer stats
            customers: {
                total: 0,
                active: 0,
                prospects: 0
            },
            
            // Document stats
            documents: {
                total: 0,
                size: '0 MB'
            },
            
            // System info
            system: {
                uptime: process.uptime(),
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
                },
                node_version: process.version,
                platform: process.platform
            }
        };

        try {
            // Get user count
            const userCount = await executeQuery('SELECT COUNT(*) as count FROM users');
            stats.users.total = userCount[0]?.count || 0;

            const activeUsers = await executeQuery('SELECT COUNT(*) as count FROM users WHERE status = "active"');
            stats.users.active = activeUsers[0]?.count || 0;
            stats.users.inactive = stats.users.total - stats.users.active;

            // Get customer count
            const customerCount = await executeQuery('SELECT COUNT(*) as count FROM customers');
            stats.customers.total = customerCount[0]?.count || 0;

            const activeCustomers = await executeQuery('SELECT COUNT(*) as count FROM customers WHERE status = "active"');
            stats.customers.active = activeCustomers[0]?.count || 0;

            const prospects = await executeQuery('SELECT COUNT(*) as count FROM customers WHERE status = "prospect"');
            stats.customers.prospects = prospects[0]?.count || 0;

            // Get document stats
            const documentCount = await executeQuery('SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size FROM documents WHERE status != "deleted"');
            stats.documents.total = documentCount[0]?.count || 0;
            stats.documents.size = Math.round((documentCount[0]?.total_size || 0) / 1024 / 1024) + ' MB';

            // Get table count
            const tableCount = await executeQuery('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()');
            stats.database.tables = tableCount[0]?.count || 0;

        } catch (dbError) {
            console.error('Database query error:', dbError);
            stats.database.status = 'error';
        }

        return NextResponse.json(stats);

    } catch (error) {
        console.error('System stats error:', error);
        return NextResponse.json({ 
            error: 'Failed to get system stats',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}