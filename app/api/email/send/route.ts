import { NextRequest, NextResponse } from 'next/server';

// Unified email send via internal Gmail API route
export async function POST(request: NextRequest) {
    try {
        const requestData = await request.json();
        const { to, subject, message, template, type = 'simple', variables } = requestData || {};

        console.log('📧 Email API Request (Gmail route):', {
            to,
            subject,
            message: message ? 'Present' : 'Missing',
            template: template ? 'Present' : 'Missing',
            type,
            variables,
        });

        if (!to || !subject) {
            return NextResponse.json({ error: 'Missing required fields: to, subject' }, { status: 400 });
        }

        if (!message && !template) {
            return NextResponse.json({ error: 'Either message or template is required' }, { status: 400 });
        }

        // Build payload for /api/Gmail (templates are already HTML)
        const payload: any = {
            to,
            subject,
            html: message || template,
            text: message || template,
        };

        const res = await fetch('http://localhost:3000/api/Gmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({ ok: false, error: 'Invalid JSON from Gmail API' }));

        if (res.ok && data?.ok) {
            return NextResponse.json({ success: true, via: data.via || 'nodemailer/gmail', info: data.info, result: data.result });
        }

        return NextResponse.json(
            { success: false, error: data?.error || 'Failed to send via Gmail API' },
            { status: 500 }
        );
    } catch (error: any) {
        console.error('Email API error:', error);
        return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
    }
}
