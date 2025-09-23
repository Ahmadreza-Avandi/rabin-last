const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'crm_system',
    charset: 'utf8mb4',
};

async function fixDatabaseIssues() {
    let connection;
    try {
        console.log('🔧 Starting database repair...');
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // 1. Check and fix documents table structure
        console.log('\n📄 Checking documents table...');
        
        try {
            const [documentsColumns] = await connection.execute(`
                SHOW COLUMNS FROM documents
            `);
            console.log('Documents table columns:', documentsColumns.map(col => col.Field));
            
            // Check if all required columns exist
            const requiredColumns = [
                'id', 'title', 'description', 'original_filename', 'stored_filename',
                'file_path', 'file_size', 'mime_type', 'file_extension', 'access_level',
                'status', 'version', 'tags', 'persian_date', 'uploaded_by', 'created_at', 'updated_at'
            ];
            
            const existingColumns = documentsColumns.map(col => col.Field);
            const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
            
            if (missingColumns.length > 0) {
                console.log('❌ Missing columns in documents table:', missingColumns);
            } else {
                console.log('✅ All required columns exist in documents table');
            }
            
        } catch (error) {
            console.error('❌ Error checking documents table:', error.message);
        }

        // 2. Check and fix activities table structure
        console.log('\n📋 Checking activities table...');
        
        try {
            const [activitiesColumns] = await connection.execute(`
                SHOW COLUMNS FROM activities
            `);
            console.log('Activities table columns:', activitiesColumns.map(col => col.Field));
            
            // Check if all required columns exist
            const requiredActivityColumns = [
                'id', 'customer_id', 'deal_id', 'type', 'title', 'description',
                'start_time', 'end_time', 'duration', 'performed_by', 'outcome',
                'location', 'notes', 'created_at', 'updated_at'
            ];
            
            const existingActivityColumns = activitiesColumns.map(col => col.Field);
            const missingActivityColumns = requiredActivityColumns.filter(col => !existingActivityColumns.includes(col));
            
            if (missingActivityColumns.length > 0) {
                console.log('❌ Missing columns in activities table:', missingActivityColumns);
            } else {
                console.log('✅ All required columns exist in activities table');
            }
            
        } catch (error) {
            console.error('❌ Error checking activities table:', error.message);
        }

        // 3. Check user permissions for documents module
        console.log('\n👥 Checking user permissions...');
        
        try {
            // Check if modules table exists and has documents module
            const [modules] = await connection.execute(`
                SELECT * FROM modules WHERE name = 'documents'
            `);
            
            if (modules.length === 0) {
                console.log('📝 Creating documents module...');
                await connection.execute(`
                    INSERT INTO modules (id, name, display_name, description, is_active)
                    VALUES (UUID(), 'documents', 'مدیریت اسناد', 'ماژول مدیریت و آپلود اسناد', 1)
                `);
                console.log('✅ Documents module created');
            } else {
                console.log('✅ Documents module exists');
            }
            
            // Check user permissions for CEO
            const [ceoUser] = await connection.execute(`
                SELECT id FROM users WHERE role = 'ceo' LIMIT 1
            `);
            
            if (ceoUser.length > 0) {
                const ceoId = ceoUser[0].id;
                
                // Get documents module ID
                const [docModule] = await connection.execute(`
                    SELECT id FROM modules WHERE name = 'documents'
                `);
                
                if (docModule.length > 0) {
                    const moduleId = docModule[0].id;
                    
                    // Check if permission exists
                    const [permission] = await connection.execute(`
                        SELECT * FROM user_modules WHERE user_id = ? AND module_id = ?
                    `, [ceoId, moduleId]);
                    
                    if (permission.length === 0) {
                        console.log('📝 Granting documents permission to CEO...');
                        await connection.execute(`
                            INSERT INTO user_modules (id, user_id, module_id, granted)
                            VALUES (UUID(), ?, ?, 1)
                        `, [ceoId, moduleId]);
                        console.log('✅ Documents permission granted to CEO');
                    } else {
                        console.log('✅ CEO already has documents permission');
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Error checking permissions:', error.message);
        }

        // 4. Test sample queries
        console.log('\n🧪 Testing sample queries...');
        
        try {
            // Test documents query
            const [testDocs] = await connection.execute(`
                SELECT COUNT(*) as count FROM documents WHERE status != 'deleted'
            `);
            console.log('✅ Active documents count:', testDocs[0].count);
            
            // Test activities query
            const [testActivities] = await connection.execute(`
                SELECT 
                    a.id, a.title, a.type,
                    c.name as customer_name,
                    u.name as performed_by_name
                FROM activities a
                LEFT JOIN customers c ON a.customer_id = c.id
                LEFT JOIN users u ON a.performed_by = u.id
                LIMIT 3
            `);
            console.log('✅ Sample activities query successful, found:', testActivities.length, 'records');
            
        } catch (error) {
            console.error('❌ Error in sample queries:', error.message);
        }

        console.log('\n🎉 Database repair completed!');
        
    } catch (error) {
        console.error('❌ Database repair failed:', error.message);
        console.error('Full error:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixDatabaseIssues();