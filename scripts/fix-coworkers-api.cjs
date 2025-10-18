const fs = require('fs');

const filePath = 'app/[tenant_key]/dashboard/coworkers/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 در حال اصلاح API calls...\n');

// 1. اضافه کردن useParams
if (!content.includes('useParams')) {
  content = content.replace(
    "} from 'lucide-react';",
    "} from 'lucide-react';\nimport { useParams } from 'next/navigation';"
  );
  console.log('✅ useParams اضافه شد');
}

// 2. اضافه کردن getTenantToken
if (!content.includes('getTenantToken')) {
  content = content.replace(
    "} from 'lucide-react';",
    "} from 'lucide-react';\n\n// Helper to get tenant token\nconst getTenantToken = () => {\n  return document.cookie\n    .split('; ')\n    .find(row => row.startsWith('tenant_token='))\n    ?.split('=')[1];\n};"
  );
  console.log('✅ getTenantToken اضافه شد');
}

// 3. تبدیل /api/users به /api/tenant/users
content = content.replace(/fetch\(['"`]\/api\/users/g, "fetch('/api/tenant/users");
console.log('✅ API path تبدیل شد');

// 4. تبدیل /api/auth/permissions به /api/tenant/users (برای لیست کاربران)
content = content.replace(/fetch\(['"`]\/api\/auth\/permissions/g, "fetch('/api/tenant/users");

// 5. اضافه کردن tenantKey از useParams
content = content.replace(
  /export default function CoworkersManagement\(\) {/,
  `export default function CoworkersManagement() {\n  const params = useParams();\n  const tenantKey = params?.tenant_key as string;`
);
console.log('✅ useParams و tenantKey اضافه شد');

// 6. تبدیل getAuthToken به getTenantToken
content = content.replace(/getAuthToken\(\)/g, 'getTenantToken()');
console.log('✅ getAuthToken به getTenantToken تبدیل شد');

// 7. اضافه کردن X-Tenant-Key به headers
content = content.replace(
  /headers:\s*{\s*'Content-Type':\s*'application\/json',\s*'Authorization':/g,
  "headers: {\n          'Content-Type': 'application/json',\n          'X-Tenant-Key': tenantKey,\n          'Authorization':"
);
console.log('✅ X-Tenant-Key به headers اضافه شد');

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ فایل با موفقیت اصلاح شد!');
