import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

// Import notification services
const notificationService = require('@/lib/notification-service.js');
const internalNotificationSystem = require('@/lib/notification-system.js');

// GET activities
export async function GET(req: NextRequest) {
  try {
    const activities = await executeQuery(`
      SELECT a.*, c.name as customer_name 
      FROM activities a 
      LEFT JOIN customers c ON a.customer_id = c.id 
      ORDER BY a.created_at DESC 
      LIMIT 50
    `);

    return NextResponse.json({
      success: true,
      data: activities
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت فعالیت‌ها'
    }, { status: 500 });
  }
}

// POST - Create activity
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.customer_id || !body.title) {
      return NextResponse.json({
        success: false,
        message: 'مشتری و عنوان اجباری است'
      }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const userId = req.headers.get('x-user-id') || 'system';

    await executeSingle(`
      INSERT INTO activities (id, customer_id, type, title, description, outcome, performed_by, start_time, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      body.customer_id,
      body.type || 'call',
      body.title,
      body.description || null,
      body.outcome || 'successful',
      userId,
      now,
      now
    ]);

    // Send notification email to CEO (async, don't wait for it)
    try {
      // Get employee name and customer name
      const [employee] = await executeQuery('SELECT name FROM users WHERE id = ?', [userId]);
      const [customer] = await executeQuery('SELECT name FROM customers WHERE id = ?', [body.customer_id]);
      const [deal] = body.deal_id ? await executeQuery('SELECT title FROM deals WHERE id = ?', [body.deal_id]) : [null];

      if (employee) {
        const activityData = {
          id: id,
          type: body.type || 'call',
          title: body.title,
          description: body.description,
          employee_name: employee.name,
          customer_name: customer?.name || 'نامشخص',
          deal_title: deal?.title || null
        };

        try {
          // Send email notification to CEO using Gmail API
          const ceoUsers = await executeQuery(`
            SELECT email, name FROM users WHERE role = 'ceo' AND status = 'active'
          `);

          if (ceoUsers.length > 0) {
            const ceoUser = ceoUsers[0];
            const response = await fetch('http://localhost:3000/api/Gmail', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: ceoUser.email,
                subject: `🔔 فعالیت جدید: ${activityData.type} - ${activityData.title}`,
                html: `
                  <h2>فعالیت جدید در سیستم</h2>
                  <p>سلام ${ceoUser.name} عزیز،</p>
                  <p>یک فعالیت جدید در سیستم ثبت شده است:</p>
                  <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>نوع فعالیت:</strong> ${activityData.type}</p>
                    <p><strong>عنوان:</strong> ${activityData.title}</p>
                    <p><strong>توضیحات:</strong> ${activityData.description || '-'}</p>
                    <p><strong>کارمند:</strong> ${activityData.employee_name}</p>
                    <p><strong>مشتری:</strong> ${activityData.customer_name}</p>
                    ${activityData.deal_title ? `<p><strong>معامله مرتبط:</strong> ${activityData.deal_title}</p>` : ''}
                  </div>
                `
              })
            });
            const result = await response.json();
            if (result.ok) {
              console.log('✅ Activity notification email sent to CEO:', ceoUser.email);
            } else {
              console.log('⚠️ Activity notification email failed:', result.error);
            }
          }
        } catch (error) {
          console.error('❌ Activity notification email error:', error);
        }

        // Send internal notification to CEO
        const ceoUserId = process.env.CEO_USER_ID || 'ceo-001'; // This should be configured
        internalNotificationSystem.notifyActivityCompleted(activityData, ceoUserId)
          .then((notifResult: any) => {
            if (notifResult.success) {
              console.log('✅ Internal activity notification sent to CEO');
            } else {
              console.log('⚠️ Internal activity notification failed:', notifResult.error);
            }
          })
          .catch((error: any) => {
            console.error('❌ Internal activity notification error:', error);
          });
      }
    } catch (error) {
      console.error('❌ Error getting activity notification data:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'فعالیت ایجاد شد',
      id: id
    });

  } catch (error) {
    console.error('خطا:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در ایجاد فعالیت'
    }, { status: 500 });
  }
}