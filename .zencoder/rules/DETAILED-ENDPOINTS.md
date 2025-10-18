# 📋 لیست کامل API Endpoints و Routes

**تعداد کل API Categories:** 45+
**تعداد کل Routes:** 150+
**آخرین بروزرسانی:** 2024

---

## 📑 فهرست

1. [Authentication APIs](#authentication-apis)
2. [SaaS Admin APIs](#saas-admin-apis)
3. [Tenant APIs](#tenant-apis)
4. [Customer Management](#customer-management)
5. [Product Management](#product-management)
6. [Contact Management](#contact-management)
7. [Sales Management](#sales-management)
8. [Task Management](#task-management)
9. [Deal Management](#deal-management)
10. [Activity Management](#activity-management)
11. [Document Management](#document-management)
12. [Feedback System](#feedback-system)
13. [Communication](#communication)
14. [Reports & Analytics](#reports--analytics)
15. [Settings & Configuration](#settings--configuration)

---

## 🔐 Authentication APIs

### Base Routes: `/api/auth/`

```
┌─ Regular User Authentication
├─ POST   /api/auth/login
│         Request: { email, password }
│         Response: { success, token, user, message }
│         Cookies: auth-token (httpOnly=false, 7 days)
│
├─ POST   /api/auth/logout
│         Clear auth-token cookie
│         Response: { success }
│
├─ GET    /api/auth/me
│         Get current authenticated user
│         Headers: Authorization: Bearer {token}
│         Response: { success, user }
│
└─ GET    /api/auth/permissions
          Get current user permissions
          Response: { success, permissions: [...] }

┌─ Tenant User Authentication
├─ POST   /api/tenant/auth/login
│         Request: { tenant_key, email, password }
│         Response: { success, token, user }
│         Cookies: tenant_token
│
├─ POST   /api/tenant/auth/logout
│         Clear tenant_token cookie
│
└─ GET    /api/tenant/auth/verify
          Verify tenant token validity
          Response: { valid, user }

┌─ SaaS Admin Authentication
├─ POST   /api/admin/auth/login
│         Request: { username, password }
│         Response: { success, token, admin }
│         Cookies: admin_token
│
├─ POST   /api/admin/auth/logout
│         Clear admin_token cookie
│
└─ GET    /api/admin/auth/verify
          Verify admin token validity
          Response: { valid, admin }
```

---

## 👑 SaaS Admin APIs

### Base Routes: `/api/admin/`

```
┌─ SaaS Dashboard
├─ GET    /api/admin/stats
│         SaaS dashboard statistics
│         Response: {
│           total_tenants,
│           active_tenants,
│           total_revenue,
│           subscriptions_expiring,
│           new_signups_today,
│           system_health
│         }
│
├─ GET    /api/admin/plans
│         Get all subscription plans
│         Response: { plans: [...] }
│
├─ POST   /api/admin/plans
│         Create new plan
│         Request: { name, features, price, duration }
│         Response: { success, plan }
│
├─ GET    /api/admin/plans/{id}
│         Get plan details
│         Response: { plan }
│
└─ PUT    /api/admin/plans/{id}
          Update plan
          Request: { name, features, price, duration }
          Response: { success, plan }

┌─ Tenant Management
├─ GET    /api/admin/tenants
│         List all tenants with pagination/filters
│         Query: ?page=1&limit=20&status=active&search=rabin
│         Response: { 
│           tenants: [...],
│           total,
│           page,
│           limit
│         }
│
├─ POST   /api/admin/tenants
│         Create new tenant
│         Request: {
│           company_name,
│           tenant_key,
│           admin_name,
│           admin_email,
│           admin_phone,
│           subscription_plan
│         }
│         Response: { success, tenant }
│
├─ GET    /api/admin/tenants/{id}
│         Get tenant details
│         Response: { tenant }
│
├─ PUT    /api/admin/tenants/{id}
│         Update tenant
│         Request: { company_name, admin_email, max_users, etc }
│         Response: { success, tenant }
│
├─ DELETE /api/admin/tenants/{id}
│         Delete/deactivate tenant
│         Response: { success }
│
├─ PATCH  /api/admin/tenants/{id}/subscription
│         Update subscription status
│         Request: { status, plan, end_date }
│         Response: { success, tenant }
│
└─ POST   /api/admin/tenants/{id}/features
          Toggle tenant features
          Request: { feature_name, enabled }
          Response: { success, features }
```

---

## 🏢 Tenant APIs

### Base Routes: `/api/tenant/`

```
┌─ Tenant Info & Setup
├─ GET    /api/tenant/info
│         Get tenant information
│         Headers: X-Tenant-Key: rabin
│         Response: {
│           id,
│           tenant_key,
│           company_name,
│           subscription_status,
│           subscription_plan,
│           max_users,
│           current_users,
│           features
│         }
│
├─ POST   /api/tenant/setup
│         Initialize tenant database
│         Request: { tenant_key, company_name }
│         Response: { success, database_created }
│
├─ PUT    /api/tenant/settings
│         Update tenant settings
│         Request: { settings: {...} }
│         Response: { success, settings }
│
└─ GET    /api/tenant/usage
          Get current usage statistics
          Response: { users_count, customers_count, storage_used }

┌─ Tenant Dashboard
├─ GET    /api/tenant/dashboard
│         Get dashboard data
│         Response: {
│           stats: { ... },
│           recent_activities: [...],
│           pending_tasks: [...],
│           upcoming_events: [...],
│           performance_metrics: { ... }
│         }
│
└─ GET    /api/tenant/dashboard/widgets
          Get dashboard widgets data
          Response: { widgets: {...} }

┌─ Tenant Users
├─ GET    /api/tenant/users
│         List tenant users
│         Query: ?role=CEO&status=active&search=john
│         Response: { users: [...], total }
│
├─ POST   /api/tenant/users
│         Create new user
│         Request: {
│           name,
│           email,
│           phone,
│           role,
│           permissions: [...]
│         }
│         Response: { success, user }
│
├─ GET    /api/tenant/users/{id}
│         Get user details
│         Response: { user }
│
├─ PUT    /api/tenant/users/{id}
│         Update user
│         Request: { name, phone, role, status }
│         Response: { success, user }
│
├─ DELETE /api/tenant/users/{id}
│         Delete user
│         Response: { success }
│
└─ POST   /api/tenant/users/{id}/permissions
          Update user permissions
          Request: { modules: [...] }
          Response: { success, permissions }

┌─ Tenant Activities
├─ GET    /api/tenant/activities
│         List activities
│         Query: ?type=call&customer_id=123&sort=-date
│         Response: { activities: [...], total }
│
└─ POST   /api/tenant/activities
          Create activity
          Request: { customer_id, type, title, description, date }
          Response: { success, activity }

┌─ Tenant Customers
├─ GET    /api/tenant/customers
│         List customers
│         Query: ?page=1&limit=20&status=active
│         Response: { customers: [...], total }
│
├─ POST   /api/tenant/customers
│         Create customer
│         Request: { name, email, phone, type }
│         Response: { success, customer }
│
├─ GET    /api/tenant/customers/{id}
│         Get customer details
│         Response: { customer, activities, deals, contacts }
│
└─ PUT    /api/tenant/customers/{id}
          Update customer
          Request: { name, email, phone, status }
          Response: { success, customer }

┌─ Tenant Contacts
├─ GET    /api/tenant/contacts
│         List contacts
│         Response: { contacts: [...], total }
│
├─ POST   /api/tenant/contacts
│         Create contact
│         Request: { customer_id, name, email, phone, role }
│         Response: { success, contact }
│
└─ GET    /api/tenant/contacts/{id}
          Get contact details
          Response: { contact }

┌─ Tenant Products
├─ GET    /api/tenant/products
│         List products
│         Response: { products: [...], total }
│
├─ POST   /api/tenant/products
│         Create product
│         Request: { name, description, price, quantity }
│         Response: { success, product }
│
└─ GET    /api/tenant/products/{id}
          Get product details
          Response: { product }

┌─ Tenant Deals
├─ GET    /api/tenant/deals
│         List deals
│         Query: ?status=open&sort=-value
│         Response: { deals: [...], total }
│
├─ POST   /api/tenant/deals
│         Create deal
│         Request: { customer_id, title, value, stage }
│         Response: { success, deal }
│
└─ GET    /api/tenant/deals/{id}
          Get deal details
          Response: { deal, history, contacts }

┌─ Tenant Tasks
├─ GET    /api/tenant/tasks
│         List tasks
│         Query: ?assignee_id=123&status=pending
│         Response: { tasks: [...], total }
│
├─ POST   /api/tenant/tasks
│         Create task
│         Request: { title, description, assignee_id, due_date }
│         Response: { success, task }
│
└─ POST   /api/tenant/tasks/upload
          Upload task files
          Form: multipart/form-data with files
          Response: { success, files }

┌─ Tenant Feedback
├─ GET    /api/tenant/feedback
│         List feedback forms
│         Response: { forms: [...], total }
│
└─ POST   /api/tenant/feedback
          Create feedback form
          Request: { title, questions, recipients }
          Response: { success, form }
```

---

## 👥 Customer Management

### Base Routes: `/api/customers/`

```
┌─ Customer CRUD
├─ GET    /api/customers
│         List customers with advanced filters
│         Query: ?page=1&limit=20&status=active&type=B2B
│                 &city=tehran&sort=-created_at&search=rabin
│         Response: { customers: [...], total, filters }
│
├─ POST   /api/customers
│         Create new customer
│         Request: {
│           name,
│           email,
│           phone,
│           type (B2B/B2C),
│           company,
│           city,
│           address,
│           status,
│           tags: [...]
│         }
│         Response: { success, customer }
│
├─ GET    /api/customers/{id}
│         Get customer details with all relations
│         Response: {
│           customer,
│           contacts: [...],
│           activities: [...],
│           deals: [...],
│           documents: [...],
│           interactions: {...}
│         }
│
├─ PUT    /api/customers/{id}
│         Update customer
│         Request: { name, email, status, etc }
│         Response: { success, customer }
│
├─ DELETE /api/customers/{id}
│         Delete customer
│         Response: { success }
│
├─ PATCH  /api/customers/{id}/status
│         Update customer status
│         Request: { status: "active/inactive/prospect" }
│         Response: { success, customer }
│
└─ GET    /api/customers/{id}/simple
          Get customer basic info (lightweight)
          Response: { id, name, email, phone }

┌─ Customer Relationships
├─ GET    /api/customers/{id}/pipeline
│         Get customer's sales pipeline
│         Response: {
│           stages: [...],
│           current_stage,
│           progress,
│           deals: [...]
│         }
│
├─ GET    /api/customers/{id}/sales-stage
│         Get detailed sales stage information
│         Response: { stage, deals, timeline, forecast }
│
├─ POST   /api/customers/{id}/contacts
│         Add contact to customer
│         Request: { name, email, phone, role }
│         Response: { success, contact }
│
├─ POST   /api/customers/{id}/activities
│         Add activity to customer
│         Request: { type, title, description, date }
│         Response: { success, activity }
│
└─ POST   /api/customers/{id}/deals
          Create deal for customer
          Request: { title, value, stage, end_date }
          Response: { success, deal }

┌─ Customer Analytics
├─ GET    /api/customers/filter-options
│         Get available filters
│         Response: { types: [...], cities: [...], statuses: [...] }
│
├─ GET    /api/customers/stats
│         Get customer statistics
│         Response: {
│           total_customers,
│           active_customers,
│           new_this_month,
│           churn_rate,
│           avg_lifetime_value,
│           by_type: {...},
│           by_city: {...}
│         }
│
└─ POST   /api/customers/filter-options
          Update and save filter preferences
          Request: { filters: {...} }
          Response: { success }
```

---

## 📦 Product Management

### Base Routes: `/api/products/`

```
┌─ Product CRUD
├─ GET    /api/products
│         List products with filters
│         Query: ?category=software&price_min=0&price_max=1000
│                 &in_stock=true&search=app
│         Response: { products: [...], total }
│
├─ POST   /api/products
│         Create new product
│         Request: {
│           name,
│           description,
│           category,
│           price,
│           cost,
│           quantity,
│           sku,
│           supplier
│         }
│         Response: { success, product }
│
├─ GET    /api/products/{id}
│         Get product details
│         Response: {
│           product,
│           sales_history: [...],
│           customer_interests: [...],
│           performance: {...}
│         }
│
├─ PUT    /api/products/{id}
│         Update product
│         Request: { name, description, price, quantity, etc }
│         Response: { success, product }
│
├─ DELETE /api/products/{id}
│         Delete product
│         Response: { success }
│
└─ PATCH  /api/products/{id}/stock
          Update product stock
          Request: { quantity, operation: "set/add/subtract" }
          Response: { success, new_quantity }

┌─ Product Analytics
├─ GET    /api/products/stats
│         Get product statistics
│         Response: {
│           total_products,
│           total_value,
│           categories: {...},
│           top_sellers: [...],
│           low_stock: [...]
│         }
│
└─ GET    /api/customer-product-interests
          Get customer interests for products
          Response: { interests: [...] }
```

---

## 👤 Contact Management

### Base Routes: `/api/contacts/`

```
┌─ Contact CRUD
├─ GET    /api/contacts
│         List all contacts with filters
│         Query: ?customer_id=123&role=manager
│         Response: { contacts: [...], total }
│
├─ POST   /api/contacts
│         Create new contact
│         Request: {
│           customer_id,
│           name,
│           email,
│           phone,
│           role,
│           position,
│           department
│         }
│         Response: { success, contact }
│
├─ GET    /api/contacts/{id}
│         Get contact details
│         Response: {
│           contact,
│           customer: {...},
│           activities: [...]
│         }
│
├─ PUT    /api/contacts/{id}
│         Update contact
│         Request: { name, email, phone, role, status }
│         Response: { success, contact }
│
├─ DELETE /api/contacts/{id}
│         Delete contact
│         Response: { success }
│
└─ GET    /api/contacts/{id}/activities
          Get contact's activities
          Response: { activities: [...], total }
```

---

## 💰 Sales Management

### Base Routes: `/api/sales/`

```
┌─ Sales CRUD
├─ GET    /api/sales
│         List sales transactions
│         Query: ?status=completed&date_from=2024-01-01
│                 &amount_min=0&amount_max=100000
│         Response: { sales: [...], total }
│
├─ POST   /api/sales
│         Create new sale
│         Request: {
│           customer_id,
│           products: [{product_id, quantity, price}],
│           total_amount,
│           status,
│           payment_method,
│           notes
│         }
│         Response: { success, sale }
│
├─ GET    /api/sales/{id}
│         Get sale details
│         Response: {
│           sale,
│           items: [...],
│           customer: {...},
│           payment_history: [...]
│         }
│
├─ PUT    /api/sales/{id}
│         Update sale
│         Request: { status, payment_method, notes }
│         Response: { success, sale }
│
└─ DELETE /api/sales/{id}
          Delete sale
          Response: { success }

┌─ Sales Analytics
├─ GET    /api/sales/analyze
│         Get sales analysis
│         Query: ?period=month&year=2024&month=3
│         Response: {
│           total_sales,
│           total_revenue,
│           avg_transaction_value,
│           by_product: {...},
│           by_customer: {...},
│           by_salesperson: {...},
│           trends: {...},
│           forecast: {...}
│         }
│
└─ GET    /api/reports/today
          Get today's sales report
          Response: {
            today_sales,
            today_revenue,
            daily_target_progress
          }
```

---

## ✅ Task Management

### Base Routes: `/api/tasks/`

```
┌─ Task CRUD
├─ GET    /api/tasks
│         List tasks with filters
│         Query: ?assignee_id=123&status=pending
│                 &priority=high&due_date=2024-01-31
│         Response: { tasks: [...], total }
│
├─ POST   /api/tasks
│         Create new task
│         Request: {
│           title,
│           description,
│           assignee_id,
│           due_date,
│           priority,
│           customer_id,
│           related_to
│         }
│         Response: { success, task }
│
├─ GET    /api/tasks/{id}
│         Get task details
│         Response: {
│           task,
│           assignees: [...],
│           attachments: [...],
│           comments: [...]
│         }
│
├─ PUT    /api/tasks/{id}
│         Update task
│         Request: { title, status, priority, due_date }
│         Response: { success, task }
│
├─ PATCH  /api/tasks/{id}/status
│         Update task status
│         Request: { status: "pending/in_progress/completed/cancelled" }
│         Response: { success, task }
│
├─ DELETE /api/tasks/{id}
│         Delete task
│         Response: { success }
│
└─ POST   /api/tasks/upload
          Upload task attachments
          Form: multipart/form-data
          Response: { success, files }

┌─ Task User Assignment
├─ GET    /api/tasks/users
│         Get task assignments for users
│         Query: ?user_id=123
│         Response: { assignments: [...] }
│
└─ POST   /api/tasks/users
          Assign task to user
          Request: { task_id, user_id, role }
          Response: { success, assignment }
```

---

## 🤝 Deal Management

### Base Routes: `/api/deals/`

```
┌─ Deal CRUD
├─ GET    /api/deals
│         List deals with filters
│         Query: ?status=open&stage=negotiation&owner_id=123
│         Response: { deals: [...], total }
│
├─ POST   /api/deals
│         Create new deal
│         Request: {
│           customer_id,
│           title,
│           value,
│           stage,
│           owner_id,
│           end_date,
│           probability
│         }
│         Response: { success, deal }
│
├─ GET    /api/deals/{id}
│         Get deal details
│         Response: {
│           deal,
│           customer: {...},
│           history: [...],
│           contacts: [...],
│           products: [...]
│         }
│
├─ PUT    /api/deals/{id}
│         Update deal
│         Request: { title, value, stage, probability }
│         Response: { success, deal }
│
└─ DELETE /api/deals/{id}
          Delete deal
          Response: { success }
```

---

## 📊 Activity Management

### Base Routes: `/api/activities/`

```
┌─ Activity CRUD
├─ GET    /api/activities
│         List activities with filters
│         Query: ?type=call&customer_id=123&date_from=2024-01-01
│         Response: { activities: [...], total }
│
├─ POST   /api/activities
│         Create new activity
│         Request: {
│           customer_id,
│           deal_id,
│           type: "call/email/meeting/other",
│           title,
│           description,
│           start_time,
│           end_time,
│           duration,
│           outcome,
│           notes
│         }
│         Response: { success, activity }
│
├─ GET    /api/activities/{id}
│         Get activity details
│         Response: { activity }
│
└─ PUT    /api/activities/{id}
          Update activity
          Request: { type, outcome, notes, etc }
          Response: { success, activity }
```

---

## 📄 Document Management

### Base Routes: `/api/documents/`

```
┌─ Document CRUD
├─ GET    /api/documents
│         List documents
│         Query: ?category_id=1&owner_id=123&type=pdf
│         Response: { documents: [...], total }
│
├─ POST   /api/documents
│         Upload new document
│         Form: multipart/form-data
│         Response: { success, document }
│
├─ GET    /api/documents/{id}
│         Get document details
│         Response: { document, shared_with: [...] }
│
├─ PUT    /api/documents/{id}
│         Update document metadata
│         Request: { name, category, tags }
│         Response: { success, document }
│
├─ GET    /api/documents/{id}/download
│         Download document
│         Response: File (binary)
│
├─ DELETE /api/documents/{id}
│         Delete document
│         Response: { success }
│
└─ POST   /api/documents/{id}/send-email
          Send document via email
          Request: { to, subject, message }
          Response: { success }

┌─ Document Sharing & Access
├─ POST   /api/documents/{id}/share
│         Share document with users/groups
│         Request: { recipients: [...], permission: "view/edit" }
│         Response: { success, share_tokens: [...] }
│
├─ GET    /api/documents/shared
│         Get shared documents
│         Response: { documents: [...] }
│
├─ GET    /api/documents/shared/{token}
│         Access shared document (public)
│         Response: { document, content_url }
│
├─ GET    /api/documents/view/{token}
│         View shared document
│         Response: Document viewer
│
└─ GET    /api/documents/stats
          Get document statistics
          Response: {
            total_documents,
            total_size,
            by_category: {...},
            most_shared: [...]
          }

┌─ Document Categories
├─ GET    /api/documents/categories
│         List document categories
│         Response: { categories: [...] }
│
├─ POST   /api/documents/categories
│         Create new category
│         Request: { name, description }
│         Response: { success, category }
│
└─ PUT    /api/document-categories/{id}
          Update category
          Request: { name, description }
          Response: { success, category }
```

---

## 💬 Feedback System

### Base Routes: `/api/feedback/`

```
┌─ Feedback Forms
├─ GET    /api/feedback/forms
│         List feedback forms
│         Response: { forms: [...], total }
│
├─ POST   /api/feedback/forms
│         Create new feedback form
│         Request: {
│           title,
│           description,
│           questions: [...],
│           recipients: [...]
│         }
│         Response: { success, form, token }
│
├─ GET    /api/feedback/forms/{id}
│         Get form details
│         Response: { form, submissions: [...] }
│
├─ GET    /api/feedback/forms/{id}
│         Update form
│         Request: { title, questions, recipients }
│         Response: { success, form }
│
└─ POST   /api/feedback/forms/send
          Send form to recipients
          Request: { form_id, recipients: [...] }
          Response: { success }

┌─ Feedback Submission (Public)
├─ GET    /api/feedback/form/{token}
│         Get feedback form (Public)
│         Response: { form, questions }
│
├─ POST   /api/feedback/submit
│         Submit feedback (Public)
│         Request: { token, answers: [...] }
│         Response: { success }
│
└─ GET    /api/feedback/analyze
          Analyze feedback responses
          Response: {
            total_responses,
            response_rate,
            sentiment_analysis: {},
            insights: [...]
          }

┌─ Feedback Management
├─ GET    /api/feedback
│         List feedback responses
│         Response: { feedback: [...], total }
│
└─ POST   /api/feedback
          Create feedback manually
          Request: { form_id, customer_id, responses }
          Response: { success, feedback }
```

---

## 📧 Communication

### Email APIs

```
POST   /api/email/send
       Send single email
       Request: {
         to,
         subject,
         html/text,
         attachments: [...]
       }
       Response: { success, message_id }

POST   /api/email/bulk
       Send bulk emails
       Request: {
         recipients: [...],
         subject,
         template,
         variables: {},
         schedule_at (optional)
       }
       Response: { success, campaign_id }

GET    /api/email/templates
       Get email templates
       Response: { templates: [...] }

POST   /api/email/preview
       Preview email
       Request: { template, variables }
       Response: { html, text }

POST   /api/email/test
       Send test email
       Request: { to, template }
       Response: { success }

POST   /api/email/test-connection
       Test email configuration
       Response: { success, message }

POST   /api/email/test-oauth
       Test OAuth configuration
       Response: { success, message }

GET    /api/Gmail
       Gmail integration endpoint
       Response: { authorized }
```

### SMS APIs

```
POST   /api/sms/send
       Send SMS
       Request: { to, message }
       Response: { success, message_id }

POST   /api/sms/test-connection
       Test SMS service connection
       Response: { success, message }
```

---

## 📊 Reports & Analytics

### Base Routes: `/api/reports/`

```
┌─ Reports
├─ GET    /api/reports
│         List reports
│         Query: ?type=sales&date_range=month
│         Response: { reports: [...], total }
│
├─ POST   /api/reports
│         Generate custom report
│         Request: {
│           type: "sales/customer/activity/etc",
│           date_from,
│           date_to,
│           groupby: "day/week/month",
│           filters: {}
│         }
│         Response: { report_id, data: {...} }
│
├─ GET    /api/reports/{id}
│         Get report details
│         Response: { report, data, charts }
│
├─ POST   /api/reports/analyze
│         Analyze report data
│         Request: { report_id, analysis_type }
│         Response: { analysis: {...}, insights: [...] }
│
└─ GET    /api/reports/today
          Get today's report
          Response: {
            sales_today,
            revenue_today,
            activities_today,
            tasks_completed
          }

┌─ Analytics
├─ GET    /api/reports-analysis
│         Get detailed analytics
│         Query: ?metric=revenue&period=3months
│         Response: {
│           data: [...],
│           trends: {...},
│           forecast: {...},
│           comparisons: {...}
│         }
│
├─ POST   /api/reports/analyze/sales
│         Sales analysis
│         Response: {
│           total_sales,
│           by_product: {},
│           by_customer: {},
│           by_salesperson: {},
│           trends: {},
│           forecast: {}
│         }
│
└─ GET    /api/reports-analysis
          Comprehensive analysis dashboard
          Response: {
            dashboards: [...],
            widgets: [...],
            metrics: {...}
          }
```

---

## ⚙️ Settings & Configuration

### Base Routes: `/api/settings/`

```
┌─ System Settings
├─ GET    /api/settings/status
│         Get system status
│         Response: {
│           database_status,
│           email_status,
│           storage_status,
│           sms_status
│         }
│
├─ GET    /api/settings/system-stats
│         Get system statistics
│         Response: {
│           total_users,
│           total_customers,
│           storage_used,
│           active_sessions
│         }
│
└─ POST   /api/settings/system-stats
          Update system statistics cache
          Response: { success }

┌─ Email Configuration
├─ GET    /api/settings/email
│         Get email settings
│         Response: { provider, configured }
│
├─ POST   /api/settings/email/configure
│         Configure email
│         Request: { provider, credentials }
│         Response: { success }
│
└─ POST   /api/settings/email/test
          Test email configuration
          Response: { success, message }

┌─ Backup Management
├─ GET    /api/settings/backup/history
│         Get backup history
│         Response: { backups: [...] }
│
├─ POST   /api/settings/backup/init
│         Initialize backup system
│         Response: { success }
│
├─ POST   /api/settings/backup/manual
│         Create manual backup
│         Response: { success, backup_id }
│
├─ POST   /api/settings/backup/test
│         Test backup system
│         Response: { success, message }
│
├─ POST   /api/settings/backup/configure
│         Configure backup
│         Request: { schedule, retention }
│         Response: { success }
│
├─ POST   /api/settings/backup/create
│         Create backup now
│         Response: { success, backup_id }
│
├─ POST   /api/settings/backup/quick-send
│         Quick backup and send
│         Request: { email }
│         Response: { success }
│
└─ GET    /api/settings/backup/download
          Download backup file
          Response: File (binary)
```

---

## 🎛️ Permission & Configuration

### Base Routes: `/api/permissions/`

```
┌─ Permission Management
├─ GET    /api/permissions
│         Get all permissions
│         Response: { permissions: [...] }
│
├─ GET    /api/permissions/check?moduleName=customers
│         Check user permission
│         Response: { has_permission, module }
│
├─ POST   /api/permissions/user-modules
│         Grant/revoke module permission
│         Request: { user_id, module_id, granted: true/false }
│         Response: { success }
│
├─ GET    /api/permissions/modules
│         Get all modules
│         Response: { modules: [...] }
│
├─ GET    /api/permissions/types
│         Get permission types
│         Response: { types: [...] }
│
└─ GET    /api/permissions/user/{userId}
          Get user specific permissions
          Response: { modules: [...], roles: [...] }

┌─ Profile & User Settings
├─ GET    /api/profile
│         Get user profile
│         Response: { user }
│
├─ PUT    /api/profile
│         Update user profile
│         Request: { name, phone, preferences }
│         Response: { success, user }
│
├─ POST   /api/profile/avatar
│         Upload avatar
│         Form: multipart/form-data
│         Response: { success, avatar_url }
│
└─ GET    /api/users/coworkers
          Get list of coworkers
          Response: { users: [...] }
```

---

## 🔔 Notifications & Search

### Base Routes: `/api/notifications/` & `/api/search/`

```
┌─ Notifications
├─ GET    /api/notifications
│         Get user notifications
│         Query: ?unread=true&limit=20
│         Response: { notifications: [...], total_unread }
│
├─ POST   /api/notifications/mark-read
│         Mark notification as read
│         Request: { notification_id }
│         Response: { success }
│
└─ PUT    /api/notifications/{id}
          Update notification
          Request: { read: true/false }
          Response: { success }

┌─ Global Search
├─ GET    /api/search
│         Global search across all resources
│         Query: ?q=rabin&type=customers
│         Response: {
│           customers: [...],
│           contacts: [...],
│           products: [...],
│           documents: [...],
│           total: 0
│         }
│
└─ POST   /api/search
          Advanced search
          Request: {
            query,
            filters: {...},
            sort
          }
          Response: { results: [...], total }

┌─ System Monitoring
├─ GET    /api/system/monitoring
│         Get system monitoring data
│         Response: {
│           cpu_usage,
│           memory_usage,
│           disk_usage,
│           database_health,
│           api_health
│         }
│
└─ GET    /api/system/stats
          Get system statistics
          Response: {
            uptime,
            requests_per_second,
            error_rate,
            response_time
          }
```

---

## 🔗 Internal & Utility APIs

```
GET    /api/internal/tenant-info?tenant_key=rabin
       Get tenant info (Middleware use)
       Response: { tenant: {...} }

GET    /api/health
       Health check endpoint
       Response: { status: "ok", version }

POST   /api/cleanup-duplicates
       Clean duplicate customers
       Response: { success, removed_count }

POST   /api/import/customers
       Import customers from file
       Request: multipart/form-data (CSV/Excel)
       Response: { success, imported_count }

POST   /api/import/contacts
       Import contacts from file
       Request: multipart/form-data (CSV/Excel)
       Response: { success, imported_count }

GET    /api/uploads/{...path}
       Get uploaded file (public access)
       Response: File (binary)
```

---

## 📍 Sidebar Menu Routes

```
Frontend Route                 API Used              Permission Required
─────────────────────────────────────────────────────────────────────────
/dashboard                     /api/dashboard        Any authenticated user
/dashboard/activities          /api/activities       activities module
/dashboard/calendar            /api/events           calendar module
/dashboard/chat                /api/chat             chat module
/dashboard/contacts            /api/contacts         contacts module
/dashboard/coworkers           /api/coworkers        view users permission
/dashboard/customer-club       /api/customer-club    customer_club module
/dashboard/customers           /api/customers        customers module
/dashboard/documents           /api/documents        documents module
/dashboard/email               /api/email            email module
/dashboard/feedback            /api/feedback         feedback module
/dashboard/insights            /api/reports-analysis insights module
/dashboard/notifications       /api/notifications    notifications module
/dashboard/products            /api/products         products module
/dashboard/profile             /api/profile          Any authenticated user
/dashboard/reports             /api/reports          reports module
/dashboard/sales               /api/sales            sales module
/dashboard/search              /api/search           Any authenticated user
/dashboard/settings            /api/settings         admin permission
/dashboard/system-monitoring   /api/system           admin permission
/dashboard/tasks               /api/tasks            tasks module
/dashboard/surveys             /api/feedback/forms   survey module
```

---

## 📊 Response Format Standards

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error code",
  "message": "Error description",
  "status": 400
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1234,
    "pages": 62
  }
}
```

---

**Total Endpoints:** 150+
**Last Updated:** 2024
**Version:** 1.0