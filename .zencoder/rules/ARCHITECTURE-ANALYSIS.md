# 📊 تحلیل معماری جامع پروژه RABIN CRM

**تاریخ تحلیل:** 2024
**وضعیت:** تحت بررسی

---

## 🏗️ معماری کلی

```
┌─────────────────────────────────────────────────────────────────┐
│                    RABIN CRM System                              │
└─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────┐
  │              SaaS Layer (Master Database)                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  Database: saas_master                               │  │
  │  │  ├─ tenants (شرکت‌های مشتری)                       │  │
  │  │  ├─ super_admins (ادمین‌های سیستم SaaS)           │  │
  │  │  └─ plans, billing, subscriptions                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────┘
                           ↓
  ┌──────────────────────────────────────────────────────────────┐
  │         Middleware Layer (Tenant Detection)                  │
  │         ↓                                                    │
  │  Extract: tenant_key من URL → /rabin/dashboard             │
  │  Validate: tenant_key format (3-50 chars, lowercase)        │
  │  Check: Tenant status, subscription, active/inactive        │
  │  Route: X-Tenant-Key, X-Tenant-DB headers                  │
  └──────────────────────────────────────────────────────────────┘
                           ↓
  ┌──────────────────────────────────────────────────────────────┐
  │    Application Layer (Multi-Tenant Dashboard)               │
  │  ┌─────────────────┐    ┌──────────────────────────┐        │
  │  │ SaaS Panel      │    │ Tenant Dashboards        │        │
  │  │ /secret-zone-.. │    │ /{tenant_key}/dashboard  │        │
  │  │ ├─ Tenants      │    │ ├─ Activities            │        │
  │  │ ├─ Billing      │    │ ├─ Calendar              │        │
  │  │ ├─ Subscriptions│    │ ├─ Chat                  │        │
  │  │ └─ Plans        │    │ ├─ Contacts              │        │
  │  └─────────────────┘    │ ├─ Customers             │        │
  │                         │ ├─ Products              │        │
  │                         │ ├─ Sales                 │        │
  │                         │ ├─ Tasks                 │        │
  │                         │ ├─ Reports               │        │
  │                         │ └─ Settings              │        │
  │                         └──────────────────────────┘        │
  └──────────────────────────────────────────────────────────────┘
                           ↓
  ┌──────────────────────────────────────────────────────────────┐
  │          API Layer (Backend Services)                        │
  │  ├─ /api/admin/* (SaaS Admin APIs)                          │
  │  ├─ /api/tenant/* (Tenant-Specific APIs)                    │
  │  ├─ /api/auth/* (Authentication)                            │
  │  ├─ /api/customers/* (Customer Management)                  │
  │  ├─ /api/dashboard/* (Dashboard Stats)                      │
  │  └─ /api/... (Other Resources)                              │
  └──────────────────────────────────────────────────────────────┘
                           ↓
  ┌──────────────────────────────────────────────────────────────┐
  │          Database Layer                                      │
  │  ├─ saas_master (Master Database)                            │
  │  ├─ tenant_db_1 (Tenant-1 Database)                          │
  │  ├─ tenant_db_2 (Tenant-2 Database)                          │
  │  └─ tenant_db_n (Tenant-N Database)                          │
  └──────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Architecture

### Master Database (saas_master)

#### جدول: `tenants`
```
├─ id (AUTO_INCREMENT)
├─ tenant_key (UNIQUE) → شناسه شرکت (rabin, irankhodro, etc)
├─ company_name → نام شرکت
├─ db_name → نام دیتابیس اختصاصی
├─ db_host, db_port, db_user, db_password → اطلاعات Connection
├─ admin_name, admin_email, admin_phone → اطلاعات تماس ادمین
├─ subscription_status (active/expired/suspended/trial)
├─ subscription_plan (basic/professional/enterprise/custom)
├─ subscription_start, subscription_end → تاریخ اشتراک
├─ max_users, max_customers, max_storage_mb → محدودیت‌ها
├─ features (JSON) → ویژگی‌های فعال
├─ settings (JSON) → تنظیمات اختصاصی
├─ is_active, is_deleted
└─ created_at, updated_at, deleted_at
```

#### جدول: `super_admins`
```
├─ id (AUTO_INCREMENT)
├─ username (UNIQUE)
├─ email (UNIQUE)
├─ password_hash (bcrypt)
├─ full_name, phone
├─ role (super_admin/admin/support)
├─ permissions (JSON)
├─ is_active
├─ last_login
└─ created_at, updated_at
```

### Tenant Database Template

هر tenant یک دیتابیس جداگانه دارد با ساختار یکسان:

```
tenant_db_rabin/
├─ users (کاربران)
├─ customers (مشتریان)
├─ contacts (تماس‌ها)
├─ companies (شرکت‌ها)
├─ products (محصولات)
├─ sales (فروش‌ها)
├─ sale_items (آیتم‌های فروش)
├─ activities (فعالیت‌ها)
├─ tasks (وظایف)
├─ task_assignees (انتساب وظایف)
├─ events (رویدادها)
├─ deals (معاملات)
├─ deals_history (تاریخچه معاملات)
├─ deals_contact_note (یادداشت‌های معامله)
├─ feedback (بازخورد)
├─ feedback_forms (فرم‌های بازخورد)
├─ documents (اسناد)
├─ document_categories (دسته‌بندی اسناد)
├─ modules (ماژول‌های سیستم)
├─ permissions (دسترسی‌ها)
├─ user_permissions (دسترسی‌های کاربر)
├─ user_module_permissions (دسترسی کاربر به ماژول‌ها)
├─ activity_log (لاگ فعالیت‌ها)
├─ alerts (هشدارها)
├─ notifications (اطلاعیات)
└─ ... (91+ جداول دیگر)
```

---

## 🛣️ Routing Architecture

### 1. SaaS Admin Routes

#### URL Pattern: `/secret-zone-789/admin-panel`

```
/secret-zone-789/
├─ login
│  └─ /page.tsx → فرم لاگین ادمین SaaS
└─ admin-panel
   ├─ /page.tsx → داشبورد اصلی ادمین
   ├─ /components/
   │  ├─ Sidebar
   │  ├─ Header
   │  ├─ DashboardStats
   │  ├─ CustomerTable (نمایش Tenants)
   │  ├─ SubscriptionManagement
   │  ├─ BillingInterface
   │  ├─ AddTenantModal
   │  └─ PlanFormModal
   └─ /tenants
      └─ مدیریت Tenants
```

**دسترسی:** تنها super_admins

### 2. Tenant Dashboard Routes

#### URL Pattern: `/{tenant_key}/dashboard/{module}`

```
/{tenant_key}/
├─ login
│  └─ /page.tsx → فرم لاگین کاربر
└─ dashboard
   ├─ /page.tsx → صفحه‌ی اصلی داشبورد
   ├─ /activities → فعالیت‌ها
   ├─ /calendar → تقویم
   ├─ /chat → چت (میان کاربران)
   ├─ /contacts → تماس‌ها
   ├─ /coworkers → همکاران
   ├─ /customer-club → باشگاه مشتریان
   ├─ /customers → مشتریان
   ├─ /documents → اسناد
   ├─ /feedback → بازخورد
   ├─ /insights → بینش‌ها
   ├─ /products → محصولات
   ├─ /profile → پروفایل کاربر
   ├─ /reports → گزارشات
   ├─ /sales → فروش‌ها
   ├─ /search → جستجو
   ├─ /settings → تنظیمات
   └─ /tasks → وظایف
```

**دسترسی:** کاربران Tenant با دسترسی مناسب

---

## 🔐 Authentication & Authorization

### 1. Token Management

```
رنگ‌های Token:
├─ auth-token → کاربران معمولی
├─ tenant_token → کاربران Tenant
└─ admin_token → ادمین SaaS
```

### 2. Permission System

```
Role Hierarchy:
├─ super_admin (SaaS Admin)
│  └─ دسترسی کامل به تمام Tenants
├─ CEO (رئیس اجرایی)
│  └─ دسترسی کامل به تمام ماژول‌های Tenant
├─ sales_manager (مدیر فروش)
│  └─ دسترسی به Sales, Reports, Insights
├─ manager (مدیر)
│  └─ دسترسی محدود
├─ employee (کارمند)
│  └─ دسترسی بسیار محدود
└─ user (کاربر معمولی)
   └─ دسترسی تنها به داده‌های شخصی
```

### 3. Permission Checking Flow

```
Request → Middleware
   ↓
Extract Token (auth-token / tenant_token / admin_token)
   ↓
Verify JWT
   ↓
Check Role & Module Permissions
   ↓
Extract User Info → Headers (x-user-id, x-user-role, x-user-email)
   ↓
API Endpoint
   ↓
Check User Permissions
   ↓
Execute Business Logic
```

---

## 📡 API Endpoints

### 1. Authentication APIs

```
POST   /api/auth/login
       └─ Request: { email, password }
       └─ Response: { success, token, user }

POST   /api/auth/logout
       └─ Clear auth-token cookie

GET    /api/auth/me
       └─ Get current user info

GET    /api/auth/permissions
       └─ Get user permissions
```

### 2. SaaS Admin APIs

```
GET    /api/admin/stats
       └─ SaaS dashboard statistics
       └─ Tenants count, revenue, etc

GET    /api/admin/tenants
       └─ Get all tenants
       
POST   /api/admin/tenants
       └─ Create new tenant
       
GET    /api/admin/tenants/{id}
       └─ Get tenant details
       
PUT    /api/admin/tenants/{id}
       └─ Update tenant

POST   /api/admin/auth/login
       └─ SaaS admin login

GET    /api/admin/plans
       └─ Get subscription plans

POST   /api/admin/plans
       └─ Create new plan
```

### 3. Tenant-Specific APIs

```
GET    /api/tenant/info
       └─ Get tenant information
       
GET    /api/tenant/dashboard
       └─ Get tenant dashboard data

GET    /api/tenant/users
       └─ Get tenant users
       
POST   /api/tenant/users
       └─ Create new user

GET    /api/tenant/customers
       └─ Get customers
       
POST   /api/tenant/customers
       └─ Create customer
       
GET    /api/tenant/contacts
       └─ Get contacts
       
POST   /api/tenant/contacts
       └─ Create contact

GET    /api/tenant/tasks
       └─ Get tasks
       
POST   /api/tenant/tasks
       └─ Create task

GET    /api/tenant/products
       └─ Get products
       
POST   /api/tenant/products
       └─ Create product

GET    /api/tenant/deals
       └─ Get deals
       
POST   /api/tenant/deals
       └─ Create deal

GET    /api/tenant/feedback
       └─ Get feedback
       
POST   /api/tenant/feedback
       └─ Submit feedback

GET    /api/tenant/activities
       └─ Get activities
```

### 4. Public/Shared APIs

```
GET    /api/internal/tenant-info?tenant_key=rabin
       └─ Get tenant info (Middleware use)

GET    /api/feedback/form/{token}
       └─ Get feedback form (Public)

POST   /api/feedback/submit
       └─ Submit feedback form (Public)

GET    /api/health
       └─ Health check endpoint
```

### 5. Resource Management APIs

```
GET    /api/customers
       └─ Get customers (with filters)
       
GET    /api/customers/{id}
       └─ Get customer details
       
PUT    /api/customers/{id}
       └─ Update customer
       
GET    /api/customers/{id}/pipeline
       └─ Get customer pipeline

GET    /api/contacts
       └─ Get contacts
       
GET    /api/contacts/{id}
       └─ Get contact details
       
GET    /api/contacts/{id}/activities
       └─ Get contact activities

GET    /api/products
       └─ Get products
       
GET    /api/products/{id}
       └─ Get product details

GET    /api/sales
       └─ Get sales
       
GET    /api/sales/{id}
       └─ Get sale details
       
POST   /api/sales/analyze
       └─ Analyze sales data

GET    /api/deals
       └─ Get deals
       
POST   /api/deals
       └─ Create deal

GET    /api/tasks
       └─ Get tasks
       
POST   /api/tasks
       └─ Create task
       
POST   /api/tasks/upload
       └─ Upload task files

GET    /api/activities
       └─ Get activities

GET    /api/documents
       └─ Get documents
       
POST   /api/documents
       └─ Upload document
       
GET    /api/documents/{id}/download
       └─ Download document
       
POST   /api/documents/{id}/share
       └─ Share document
       
POST   /api/documents/{id}/send-email
       └─ Send document via email
```

### 6. Special APIs

```
POST   /api/email/send
       └─ Send email
       
POST   /api/email/bulk
       └─ Send bulk emails
       
GET    /api/email/templates
       └─ Get email templates

POST   /api/sms/send
       └─ Send SMS

GET    /api/sidebar-menu
       └─ Get user sidebar menu based on permissions

GET    /api/dashboard/stats
       └─ Get dashboard statistics
       
GET    /api/reports
       └─ Get reports
       
POST   /api/reports/analyze
       └─ Analyze reports

GET    /api/search
       └─ Global search

GET    /api/notifications
       └─ Get notifications
       
POST   /api/notifications/mark-read
       └─ Mark notification as read

GET    /api/permissions/check?moduleName=customers
       └─ Check user permission

POST   /api/permissions/user-modules
       └─ Grant/revoke user permissions

POST   /api/backup/create
       └─ Create backup

POST   /api/backup/quick-send
       └─ Send backup quickly
```

---

## 📁 Project Structure

```
e:\rabin-last\
├─ app/
│  ├─ api/ (45+ API categories)
│  │  ├─ admin/ (SaaS Admin APIs)
│  │  ├─ auth/ (Authentication)
│  │  ├─ tenant/ (Tenant-Specific APIs)
│  │  ├─ customers/
│  │  ├─ products/
│  │  ├─ contacts/
│  │  ├─ tasks/
│  │  ├─ deals/
│  │  ├─ reports/
│  │  ├─ emails/
│  │  ├─ documents/
│  │  ├─ feedback/
│  │  ├─ chat/
│  │  └─ ... (20+ more)
│  ├─ dashboard/ (Old/Default Dashboard)
│  │  ├─ activities/
│  │  ├─ calendar/
│  │  ├─ chat/
│  │  ├─ contacts/
│  │  ├─ customers/
│  │  ├─ tasks/
│  │  ├─ sales/
│  │  ├─ reports/
│  │  └─ ...
│  ├─ [tenant_key]/ (Dynamic Tenant Routes)
│  │  ├─ login/
│  │  ├─ dashboard/
│  │  ├─ [slug]/
│  │  ├─ account-inactive/
│  │  ├─ subscription-expired/
│  │  └─ account-suspended/
│  ├─ secret-zone-789/ (SaaS Admin Panel)
│  │  ├─ login/
│  │  └─ admin-panel/
│  ├─ [tenant_key]/
│  │  └─ dashboard/
│  ├─ feedback/
│  │  └─ form/
│  │     └─ [token]/
│  ├─ login/
│  ├─ page.tsx (Home)
│  ├─ layout.tsx (Root Layout)
│  ├─ providers.tsx
│  ├─ globals.css
│  └─ types.ts
├─ components/ (React Components)
│  ├─ auth/
│  ├─ dashboard/
│  ├─ layout/
│  ├─ ui/ (UI Components)
│  ├─ documents/
│  ├─ email/
│  ├─ notifications/
│  ├─ permissions/
│  ├─ settings/
│  └─ ...
├─ lib/ (Utilities)
│  ├─ auth.ts (Authentication Logic)
│  ├─ tenant-auth.ts (Tenant Authentication)
│  ├─ admin-auth.ts (Admin Authentication)
│  ├─ database.ts (Database Connection)
│  ├─ tenant-database.ts (Tenant DB Manager)
│  ├─ master-database.ts (Master DB Manager)
│  ├─ permissions.ts (Permission Logic)
│  ├─ encryption.ts (Encryption/Decryption)
│  ├─ email.ts (Email Service)
│  ├─ sms-service.js (SMS Service)
│  ├─ tenant-context.tsx (Tenant Context)
│  └─ ...
├─ pages/
│  └─ api/
│     └─ voice/
├─ database/
│  ├─ crm_system.sql
│  ├─ saas-master-schema.sql
│  ├─ tenant-template.sql
│  ├─ init.sql
│  └─ migrations/
├─ scripts/ (Utility Scripts)
│  ├─ check-database-structure.cjs
│  ├─ complete-api-test.cjs
│  ├─ test-login-api.cjs
│  ├─ create-tenant-database.cjs
│  ├─ setup-master-database.cjs
│  └─ ... (50+ scripts)
├─ public/
├─ types/
├─ hooks/
├─ middleware.ts (Main Middleware)
├─ next.config.js
├─ tailwind.config.ts
├─ package.json
├─ docker-compose.yml
├─ Dockerfile
└─ .env
```

---

## 🔄 Request Flow Example

### مثال 1: Tenant User Login

```
1. User visits: http://localhost:3000/rabin/login
   ↓
2. Form submits to POST /api/tenant/auth/login
   Request: { email: "user@example.com", password: "***" }
   ↓
3. API Handler:
   - Validate input
   - Query tenant_db_rabin.users table
   - Hash password & compare
   ↓
4. Response: { success, token, user }
   ↓
5. Frontend sets cookie: tenant_token
   ↓
6. User redirected to /rabin/dashboard
   ↓
7. Middleware intercepts request:
   - Extract tenant_key: "rabin"
   - Validate tenant (check saas_master.tenants)
   - Check subscription status
   - Add headers: X-Tenant-Key, X-Tenant-DB
   ↓
8. Dashboard loads and requests /api/tenant/dashboard
   ↓
9. Middleware:
   - Extract tenant_token from cookie
   - Verify JWT
   - Extract userId from token
   - Add header: x-user-id
   ↓
10. API Handler:
    - Get connection pool for tenant using X-Tenant-DB header
    - Query tenant database
    - Get dashboard stats
    ↓
11. Response: { stats, charts, data }
```

### مثال 2: SaaS Admin Panel

```
1. Super Admin visits: http://localhost:3000/secret-zone-789/login
   ↓
2. Form submits to POST /api/admin/auth/login
   Request: { username: "admin", password: "***" }
   ↓
3. API Handler:
   - Query saas_master.super_admins table
   - Verify password
   ↓
4. Response: { success, token, admin }
   ↓
5. Frontend sets cookie: admin_token
   ↓
6. Admin redirected to /secret-zone-789/admin-panel
   ↓
7. Middleware skips (admin panel routes excluded)
   ↓
8. Panel loads and requests /api/admin/stats
   ↓
9. Middleware:
   - Extract admin_token from cookie
   - Verify JWT
   - Extract admin info
   - Add headers: x-user-id, x-user-role
   ↓
10. API Handler:
    - Get master database connection
    - Query saas_master.tenants
    - Calculate stats (active tenants, revenue, etc)
    ↓
11. Response: { tenants_count, revenue, subscriptions, etc }
```

---

## 🔌 Multi-Tenancy Implementation

### 1. Tenant Isolation

```
- تمام کاربران یک tenant تنها به دیتابیس خاص آن tenant دسترسی دارند
- Middleware بررسی می‌کند tenant_key صحیح است
- Connection pooling جداگانه برای هر tenant
- Cache TTL: 5 minutes برای tenant configs
```

### 2. Connection Pool Management

```typescript
// lib/tenant-database.ts
const connectionPools = new Map<string, mysql.Pool>();
const tenantConfigCache = new Map<string, TenantConfig>();

getTenantConnection(tenantKey):
  ├─ Check cache
  ├─ Get config from cache or master database
  ├─ Create connection pool
  └─ Cache for future use
```

### 3. Tenant Key Validation

```
Rules:
- 3 to 50 characters
- Only lowercase letters, numbers, and hyphens
- Examples: rabin, irankhodro, test-company-1

Excluded keys:
- tenant-not-found
- account-inactive
- subscription-expired
- account-suspended
- api
- secret-zone-789
```

---

## 🛡️ Security Measures

### 1. Authentication

```
✅ JWT Tokens with expiration (24 hours)
✅ Password hashing (bcrypt)
✅ Secure cookies (httpOnly, sameSite: lax)
✅ Token refresh mechanism
✅ Rate limiting on login (future)
```

### 2. Authorization

```
✅ Role-based access control (RBAC)
✅ Module-based permissions
✅ Middleware token validation
✅ User ID verification from headers
✅ Tenant isolation at database level
```

### 3. Data Protection

```
✅ Database password encryption
✅ SSL/TLS support
✅ CORS configuration
✅ XSS protection
✅ CSRF protection (next-csrf)
```

### 4. Audit Logging

```
✅ Activity logs per tenant
✅ User action tracking
✅ Change history for important records
✅ Failed login attempts logging
```

---

## 🎯 Sidebar Menu System

### Dynamic Menu Generation

```
GET /api/sidebar-menu
  ↓
1. Get user from token (x-user-id)
2. Get user permissions from database
3. Get active modules for user
4. Build menu items based on permissions
5. Return: { success, data: menuItems }

Response Structure:
{
  success: true,
  data: [
    {
      name: "Customers",
      icon: "users",
      route: "/dashboard/customers",
      enabled: true,
      submenu: [...]
    },
    {
      name: "Sales",
      icon: "trending-up",
      route: "/dashboard/sales",
      enabled: true,
      submenu: [...]
    },
    ...
  ]
}
```

### Menu Visibility Rules

```
Based on:
├─ User role (ceo, sales_manager, manager, employee, user)
├─ Module permissions (user_module_permissions table)
├─ Tenant features (features JSON in tenants table)
└─ User status (active/inactive)

Examples:
├─ CEO: Sees all modules
├─ Sales Manager: Sees Sales, Reports, Insights
├─ Manager: Sees Customers, Contacts, Tasks
├─ Employee: Sees only assigned tasks and activities
└─ User: Sees only personal data
```

---

## 📊 Database Statistics

- **Total Tables:** 91+ per tenant database
- **Master Database Tables:** tenants, super_admins, plans, subscriptions
- **Connection Pools:** 1 per active tenant
- **Cache:** 5-minute TTL for tenant configs
- **Supported Tenants:** Unlimited (horizontal scaling)

---

## 🚀 Key Features

### 1. Multi-Tenancy ✅
- Complete data isolation
- Per-tenant database
- Separate connection pools

### 2. Dynamic Routing ✅
- tenant_key-based URL routing
- Automatic tenant detection
- Error page routing for inactive tenants

### 3. Role-Based Access ✅
- Multiple roles (CEO, Manager, Employee, etc)
- Module-level permissions
- Dynamic sidebar menu

### 4. SaaS Admin Panel ✅
- Tenant management
- Subscription management
- Billing interface

### 5. API First Design ✅
- 45+ API categories
- RESTful endpoints
- Consistent response format

### 6. Security ✅
- JWT authentication
- Password hashing (bcrypt)
- Tenant isolation
- Middleware validation

---

## ⚙️ Configuration

### Environment Variables (Root)

```env
# Database
DB_HOST=localhost
DB_NAME=crm_system
DB_USER=root
DB_PASSWORD=***

# JWT
JWT_SECRET=your-secret-key

# Email
GMAIL_APP_PASSWORD=***
OPENROUTER_API_KEY=***

# TTS
TTS_API_URL=https://api.example.com/text-to-speech
```

### Tenant Configuration

```json
{
  "tenant_key": "rabin",
  "company_name": "Rabin Company",
  "db_name": "rabin_db",
  "db_host": "mysql",
  "db_port": 3306,
  "db_user": "rabin_user",
  "db_password": "encrypted_password",
  "subscription_status": "active",
  "subscription_plan": "professional",
  "max_users": 50,
  "max_customers": 5000,
  "features": {
    "voice_assistant": true,
    "advanced_reports": true,
    "custom_fields": true
  }
}
```

---

## 📝 Notes & Observations

### Strengths ✅
1. Well-structured multi-tenancy
2. Comprehensive permission system
3. Extensive API coverage
4. Middleware-based tenant isolation
5. Connection pooling & caching
6. Dynamic routing & menu

### Areas for Improvement 🚧
1. Missing unique constraints on some tables
2. Collation issues in some databases
3. Rate limiting not implemented
4. Caching layer (Redis) not implemented
5. Some duplicate code in API handlers
6. Documentation could be more detailed
7. Test coverage could be improved
8. Performance optimization needed for large datasets

### Known Issues ⚠️
1. Database migration inconsistencies
2. Collation mismatches (utf8mb4_unicode_ci vs utf8mb4_general_ci)
3. Some API endpoints timeout on large datasets
4. Email service integration needs review
5. TTS service connection issues

---

## 🔗 Related Files

- `middleware.ts` - Main routing middleware
- `lib/tenant-auth.ts` - Tenant authentication logic
- `lib/tenant-database.ts` - Tenant DB manager
- `lib/permissions.ts` - Permission logic
- `database/saas-master-schema.sql` - Master schema
- `database/tenant-template.sql` - Tenant template
- `app/secret-zone-789/admin-panel/page.tsx` - SaaS panel
- `app/[tenant_key]/dashboard/page.tsx` - Tenant dashboard

---

**Generated by Analysis Tool**
**Last Updated: 2024**