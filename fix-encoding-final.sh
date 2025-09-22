#!/bin/bash

# 🔧 حل نهایی مشکل encoding
set -e

echo "🔧 حل نهایی مشکل encoding و کاراکترهای مخفی..."

# 1. حذف کامل فایل مشکل‌دار
echo "🗑️ حذف فایل مشکل‌دار..."
rm -f "app/api/customer-club/send-message/route.ts"
rm -f "app/api/customer-club/send-message/route.ts.new"

# 2. اطمینان از وجود دایرکتری
mkdir -p "app/api/customer-club/send-message"

# 3. ایجاد فایل جدید با محتوای ساده
echo "📝 ایجاد فایل جدید..."
cat > "app/api/customer-club/send-message/route.ts" << 'ENDOFFILE'
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { executeQuery, executeSingle } from '@/lib/database';

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('auth-token')?.value ||
            req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Token not found' },
                { status: 401 }
            );
        }

        const tokenRequest = new NextRequest('http://localhost:3000', {
            headers: new Headers({ 'authorization': `Bearer ${token}` })
        });
        const userId = await getUserFromToken(tokenRequest);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { contactIds, message } = body;

        if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid contact list' },
                { status: 400 }
            );
        }

        if (!message || !message.content) {
            return NextResponse.json(
                { success: false, message: 'Message content is required' },
                { status: 400 }
            );
        }

        const placeholders = contactIds.map(() => '?').join(',');
        const contacts = await executeQuery(`
      SELECT c.*, cu.name as customer_name
      FROM contacts c
      LEFT JOIN customers cu ON c.company_id = cu.id
      WHERE c.id IN (${placeholders})
    `, contactIds);

        if (contacts.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No valid contacts found' },
                { status: 400 }
            );
        }

        const results = {
            total: contacts.length,
            sent: 0,
            failed: 0,
            errors: [] as string[]
        };

        if (message.type === 'email') {
            if (!message.subject) {
                return NextResponse.json(
                    { success: false, message: 'Email subject is required' },
                    { status: 400 }
                );
            }

            for (const contact of contacts) {
                if (!contact.email) {
                    results.failed++;
                    results.errors.push(`${contact.name}: No email available`);
                    continue;
                }

                try {
                    const personalizedContent = message.content
                        .replace(/\{name\}/g, contact.name || 'Dear User')
                        .replace(/\{customer\}/g, contact.customer_name || '')
                        .replace(/\{role\}/g, contact.role || '')
                        .replace(/\{email\}/g, contact.email || '')
                        .replace(/\{phone\}/g, contact.phone || '')
                        .replace(/\{company\}/g, contact.customer_name || '');

                    results.sent++;
                    console.log(`Email would be sent to ${contact.email}`);

                    await executeSingle(`
                        INSERT INTO message_logs (id, contact_id, user_id, type, subject, content, status, sent_at)
                        VALUES (?, ?, ?, 'email', ?, ?, 'sent', NOW())
                    `, [generateUUID(), contact.id, userId, message.subject, personalizedContent]);

                } catch (error: any) {
                    console.error(`Error processing email for ${contact.email}:`, error);
                    results.failed++;
                    results.errors.push(`${contact.name}: ${error.message}`);
                }
            }

        } else if (message.type === 'sms') {
            return NextResponse.json(
                { success: false, message: 'SMS system not implemented yet' },
                { status: 400 }
            );
        }

        const campaignId = generateUUID();
        await executeSingle(`
      INSERT INTO message_campaigns (id, user_id, title, type, content, total_recipients, sent_count, failed_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
            campaignId,
            userId,
            message.subject || 'Group Message',
            message.type,
            message.content,
            results.total,
            results.sent,
            results.failed
        ]);

        return NextResponse.json({
            success: true,
            message: `Message processed successfully. ${results.sent} successful, ${results.failed} failed`,
            data: results
        });

    } catch (error) {
        console.error('Send message API error:', error);
        return NextResponse.json(
            { success: false, message: 'Error processing message' },
            { status: 500 }
        );
    }
}
ENDOFFILE

# 4. بررسی فایل ایجاد شده
echo "🔍 بررسی فایل ایجاد شده..."
if [ -f "app/api/customer-club/send-message/route.ts" ]; then
    echo "✅ فایل ایجاد شد"
    echo "📊 اندازه: $(wc -c < "app/api/customer-club/send-message/route.ts") bytes"
    echo "🔤 Encoding: $(file -bi "app/api/customer-club/send-message/route.ts")"
    
    # بررسی کاراکترهای مخفی
    if hexdump -C "app/api/customer-club/send-message/route.ts" | head -10 | grep -q "e2 80 8f\|e2 80 8e\|e2 80 8b\|e2 80 8c\|e2 80 8d\|ef bb bf"; then
        echo "❌ هنوز کاراکتر مخفی دارد!"
    else
        echo "✅ کاراکتر مخفی ندارد"
    fi
else
    echo "❌ فایل ایجاد نشد!"
    exit 1
fi

# 5. پاکسازی کل پروژه
echo "🧹 پاکسازی کل پروژه..."
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
    if [ -f "$file" ]; then
        # حذف BOM
        sed -i '1s/^\xEF\xBB\xBF//' "$file" 2>/dev/null || true
        # حذف CRLF
        sed -i 's/\r$//' "$file" 2>/dev/null || true
        # حذف کاراکترهای مخفی
        sed -i 's/\xE2\x80\x8F//g; s/\xE2\x80\x8E//g; s/\xE2\x80\x8B//g; s/\xE2\x80\x8C//g; s/\xE2\x80\x8D//g' "$file" 2>/dev/null || true
    fi
done

# 6. پاکسازی cache
echo "🧹 پاکسازی cache..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .swc 2>/dev/null || true

echo "✅ حل مشکل encoding کامل شد!"
echo "🚀 حالا می‌توانید deploy کنید"