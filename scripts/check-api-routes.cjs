#!/usr/bin/env node

/**
 * API Routes Permission Check Script
 * یہ script تمام API routes کو چیک کرتا ہے کہ آیا وہ permissions میں session کو properly استعمال کر رہے ہیں
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiDir = path.join(__dirname, '../app/api');

console.log('\n📋 API Routes Permission Check\n');
console.log('='.repeat(80));

function findAllRoutes(dir, prefix = '') {
    const routes = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            const newPrefix = prefix ? `${prefix}/${item}` : `/${item}`;
            routes.push(...findAllRoutes(fullPath, newPrefix));
        } else if (item === 'route.ts' || item === 'route.js') {
            const routePath = prefix ? `${prefix}` : '/';
            routes.push({ path: routePath, file: fullPath });
        }
    }

    return routes;
}

function checkRoute(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    const issues = {
        missingSessionCheck: !content.includes('session') && !content.includes('X-Tenant-Key'),
        missingErrorHandling: !content.includes('try') || !content.includes('catch'),
        missingPermissionCheck: !content.includes('permission') && !content.includes('role') && !content.includes('auth'),
        usingOldAuthModule: content.includes("from '@/lib/auth'") && !content.includes('getTenantConnection')
    };

    return issues;
}

const routes = findAllRoutes(apiDir);

console.log(`\n🔍 Found ${routes.length} API routes\n`);
console.log('-'.repeat(80));

let problemCount = 0;
const problems = [];

for (const route of routes) {
    const issues = checkRoute(route.file);
    const hasIssues = Object.values(issues).some(v => v);

    if (hasIssues) {
        problemCount++;
        console.log(`\n❌ ${route.path}`);
        if (issues.missingSessionCheck) {
            console.log('   ⚠️  Missing session/tenant check');
            problems.push(`${route.path}: Missing session check`);
        }
        if (issues.missingErrorHandling) {
            console.log('   ⚠️  Missing try-catch error handling');
            problems.push(`${route.path}: Missing error handling`);
        }
        if (issues.missingPermissionCheck) {
            console.log('   ⚠️  Missing permission/role validation');
            problems.push(`${route.path}: Missing permission check`);
        }
        if (issues.usingOldAuthModule) {
            console.log('   ⚠️  Using old @/lib/auth (should use multi-tenant)');
            problems.push(`${route.path}: Using old auth module`);
        }
    } else {
        console.log(`✅ ${route.path}`);
    }
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Summary: ${routes.length - problemCount}/${routes.length} routes are properly configured\n`);

if (problemCount > 0) {
    console.log('🔴 Problem Routes:\n');
    for (const problem of problems) {
        console.log(`   - ${problem}`);
    }

    console.log('\n💡 Recommendations:\n');
    console.log('1. Ensure all routes extract session from middleware headers');
    console.log('2. Add try-catch for error handling');
    console.log('3. Validate permissions using session role/permissions');
    console.log('4. Use getTenantConnection() for multi-tenant isolation\n');
}

console.log('='.repeat(80) + '\n');