import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { getUserFromToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        // Get the file path from URL parameters
        const filePath = params.path.join('/');

        if (!filePath) {
            return NextResponse.json({ error: 'File path is required' }, { status: 400 });
        }

        // Security check - prevent directory traversal
        if (filePath.includes('..') || filePath.includes('\\')) {
            return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
        }

        // Build the full file path
        const fullPath = join(process.cwd(), 'uploads', filePath);

        try {
            // Check if file exists
            const fileStats = await stat(fullPath);

            if (!fileStats.isFile()) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }

            // For documents, check access permissions
            if (filePath.startsWith('documents/')) {
                const user = await getUserFromToken(request);

                if (!user) {
                    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
                }

                // Get document info from database
                const fileName = filePath.split('/').pop();
                const [document] = await executeQuery(`
          SELECT id, access_level, uploaded_by, status 
          FROM documents 
          WHERE stored_filename = ? AND status != 'deleted'
        `, [fileName]);

                if (!document) {
                    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
                }

                // Check access permissions
                const canAccess =
                    document.access_level === 'public' ||
                    document.uploaded_by === user.id ||
                    user.role === 'ceo' ||
                    user.role === 'admin';

                if (!canAccess) {
                    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
                }

                // Update download count
                try {
                    await executeQuery(`
            UPDATE documents 
            SET download_count = download_count + 1 
            WHERE id = ?
          `, [document.id]);
                } catch (error) {
                    console.error('Error updating download count:', error);
                    // Continue serving the file even if count update fails
                }
            }

            // Read the file
            const fileBuffer = await readFile(fullPath);

            // Determine content type based on file extension
            const ext = filePath.split('.').pop()?.toLowerCase();
            let contentType = 'application/octet-stream';

            switch (ext) {
                case 'pdf':
                    contentType = 'application/pdf';
                    break;
                case 'jpg':
                case 'jpeg':
                    contentType = 'image/jpeg';
                    break;
                case 'png':
                    contentType = 'image/png';
                    break;
                case 'gif':
                    contentType = 'image/gif';
                    break;
                case 'txt':
                    contentType = 'text/plain';
                    break;
                case 'doc':
                    contentType = 'application/msword';
                    break;
                case 'docx':
                    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    break;
                case 'xls':
                    contentType = 'application/vnd.ms-excel';
                    break;
                case 'xlsx':
                    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    break;
            }

            // Create response with proper headers
            const response = new NextResponse(fileBuffer);
            response.headers.set('Content-Type', contentType);
            response.headers.set('Content-Length', fileStats.size.toString());
            response.headers.set('Cache-Control', 'public, max-age=86400'); // 1 day cache

            // Security headers
            response.headers.set('X-Content-Type-Options', 'nosniff');
            response.headers.set('X-Frame-Options', 'DENY');

            return response;

        } catch (fileError) {
            console.error('File access error:', fileError);
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

    } catch (error) {
        console.error('Upload serve error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}