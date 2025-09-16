import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getAuthUser } from '@/lib/auth-helper';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const userId = searchParams.get('userId');

        // Get authenticated user
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'لطفا وارد حساب کاربری خود شوید'
            }, { status: 401 });
        }

        const currentUserId = user.id;

        // If userId is provided, get messages between current user and specified user
        if (userId) {
            const messages = await executeQuery(`
                SELECT 
                    m.*,
                    sender.name as sender_name,
                    sender.email as sender_email,
                    receiver.name as receiver_name,
                    receiver.email as receiver_email
                FROM chat_messages m
                JOIN users sender ON m.sender_id = sender.id
                LEFT JOIN users receiver ON m.receiver_id = receiver.id
                WHERE (m.sender_id = ? AND m.receiver_id = ?) 
                   OR (m.sender_id = ? AND m.receiver_id = ?)
                ORDER BY m.created_at ASC
            `, [currentUserId, userId, userId, currentUserId]);

            return NextResponse.json({
                success: true,
                data: messages || []
            });
        }

        // If no specific parameters, get recent messages for current user
        const recentMessages = await executeQuery(`
            SELECT 
                m.*,
                sender.name as sender_name,
                sender.email as sender_email,
                receiver.name as receiver_name,
                receiver.email as receiver_email
            FROM chat_messages m
            JOIN users sender ON m.sender_id = sender.id
            LEFT JOIN users receiver ON m.receiver_id = receiver.id
            WHERE m.sender_id = ? OR m.receiver_id = ?
            ORDER BY m.created_at DESC
            LIMIT 50
        `, [currentUserId, currentUserId]);

        return NextResponse.json({
            success: true,
            data: recentMessages || []
        });

    } catch (error) {
        console.error('Get messages API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت پیام‌ها' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        // Get authenticated user
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'لطفا وارد حساب کاربری خود شوید'
            }, { status: 401 });
        }

        const currentUserId = user.id;

        const {
            receiverId,
            message,
            messageType = 'text',
            fileUrl = null,
            fileName = null,
            fileSize = null,
            replyToId = null
        } = await req.json();

        if (!currentUserId || !receiverId) {
            return NextResponse.json(
                { success: false, message: 'پارامترهای ناقص' },
                { status: 400 }
            );
        }

        // Validate message content based on type
        if (messageType === 'text' && !message?.trim()) {
            return NextResponse.json(
                { success: false, message: 'متن پیام الزامی است' },
                { status: 400 }
            );
        }

        if ((messageType === 'file' || messageType === 'image') && !fileUrl) {
            return NextResponse.json(
                { success: false, message: 'فایل الزامی است' },
                { status: 400 }
            );
        }

        // Generate UUID for message
        const messageId = uuidv4();

        // Generate simple conversation ID based on user IDs
        const conversationId = `conv-${[currentUserId, receiverId].sort().join('-')}`;

        // Insert the message
        await executeQuery(`
            INSERT INTO chat_messages (
                id, conversation_id, sender_id, receiver_id, message, message_type,
                file_url, file_name, file_size, reply_to_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            messageId, conversationId, currentUserId, receiverId, message || '', messageType,
            fileUrl, fileName, fileSize, replyToId
        ]);

        // Get the created message with sender info
        const newMessageResult = await executeQuery(`
            SELECT 
                m.*,
                sender.name as sender_name,
                sender.email as sender_email,
                receiver.name as receiver_name,
                receiver.email as receiver_email
            FROM chat_messages m
            JOIN users sender ON m.sender_id = sender.id
            LEFT JOIN users receiver ON m.receiver_id = receiver.id
            WHERE m.id = ?
        `, [messageId]);

        const newMessage = newMessageResult[0];

        return NextResponse.json({
            success: true,
            data: newMessage,
            message: 'پیام ارسال شد'
        });

    } catch (error) {
        console.error('Send message API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ارسال پیام' },
            { status: 500 }
        );
    }
}