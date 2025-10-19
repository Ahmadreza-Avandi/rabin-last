# 🏗️ Architecture Diagram - معماری سیستم

---

## 📊 **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          🌍 INTERNET / USERS                            │
└────────────────────────────────────────┬────────────────────────────────┘
                                         │
                                    ▼▼▼▼▼▼
                    ╔═══════════════════════════════╗
                    ║    🔒 SSL/HTTPS (Port 443)    ║
                    ║   SSL Certificates Ready      ║
                    ╚═════════════┬═════════════════╝
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Nginx Reverse Proxy     │
                    │  (crm-nginx:80,443)      │
                    └───────┬────────┬─────────┘
                            │        │
            ┌───────────────┘        └────────────────┐
            │                                         │
            ▼                                         ▼
   ┌─────────────────────┐              ┌──────────────────────┐
   │ rabin-voice:3001    │              │ nextjs:3000          │
   │ (/rabin-voice/)     │              │ (/ root)             │
   │                     │              │                      │
   │ Express API +       │              │ Next.js App          │
   │ Next.js Static      │              │ API Routes           │
   └────────┬────────────┘              └──────────┬───────────┘
            │                                      │
            └──────────────┬───────────────────────┘
                           │
                           ▼
              ┌─────────────────────────────┐
              │   MySQL Database            │
              │   (crm-mysql:3306)          │
              │                             │
              │  ✓ crm_system               │
              │  ✓ saas_master              │
              └─────────────────────────────┘
```

---

## 🔄 **Request Flow**

```
User → Browser
  │
  └─→ HTTPS://crm.robintejarat.com
        │
        └─→ Nginx (port 443) routes to:
              │
              ├─→ /rabin-voice/* → rabin-voice:3001
              │     │
              │     ├─→ Express API (/api/*)
              │     │   │
              │     │   └─→ Database
              │     │
              │     └─→ Next.js Static
              │
              └─→ /* → nextjs:3000
                    │
                    ├─→ Next.js Pages
                    │
                    ├─→ API Routes
                    │   │
                    │   └─→ Database
                    │
                    └─→ Static Assets
```

---

## 🐳 **Docker Container Structure**

```
┌────────────────────────────────────────────────────────────────┐
│                        Docker Network                           │
│                        (crm-network)                            │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │  mysql           │  │  rabin-voice     │  │   nextjs    │  │
│  │  3306            │  │   3001           │  │    3000     │  │
│  │                  │  │                  │  │             │  │
│  │ ✓ crm_system    │  │ ✓ Express API    │  │ ✓ App       │  │
│  │ ✓ saas_master   │  │ ✓ Next.js        │  │ ✓ API       │  │
│  │ ✓ crm_app_user │  │   Static Files   │  │             │  │
│  └──────────────────┘  └──────────────────┘  └─────────────┘  │
│         ▲                    ▲                      ▲           │
│         │                    │                      │           │
│         └─────connection─────┴──────connection──────┘           │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  nginx           │  │  phpmyadmin      │                    │
│  │  80, 443         │  │   80             │                    │
│  │                  │  │                  │                    │
│  │ ✓ Reverse Proxy  │  │ ✓ DB Admin       │                    │
│  │ ✓ SSL/HTTPS      │  │ ✓ Hidden URL     │                    │
│  └──────────────────┘  └──────────────────┘                    │
│         ▲                      ▲                                │
│         │                      │                                │
│    (external)          (connection)                             │
└────────┼──────────────────────┼────────────────────────────────┘
         │                      │
         ▼                      ▼
   Port 80, 443             mysql:3306
```

---

## 📦 **Rabin Voice Container - Inside**

### Build Process:
```
┌─ Builder Stage ─────────────────────────┐
│                                         │
│  1. npm install                         │
│     └─ Installs all dependencies       │
│                                         │
│  2. npm run build                       │
│     └─ Builds Next.js                  │
│        ├─ .next/standalone/            │
│        ├─ .next/static/                │
│        └─ Optimized output             │
│                                         │
│  3. api/ directory                      │
│     ├─ routes/ai.js                    │
│     ├─ routes/tts.js                   │
│     ├─ routes/database.js              │
│     ├─ services/database.js            │
│     └─ services/...                    │
│                                         │
│  4. node_modules/                      │
│     ├─ express                         │
│     ├─ mysql2                          │
│     ├─ cors                            │
│     └─ ... (all dependencies)          │
└─────────────────────────────────────────┘
         │ (Copy from builder)
         ▼
┌─ Runtime Stage ─────────────────────────┐
│                                         │
│  Final Container Image has:            │
│                                         │
│  ✓ .next/standalone/                   │
│  ✓ .next/static/                       │
│  ✓ api/                    ← CRITICAL! │
│  ✓ node_modules/           ← CRITICAL! │
│  ✓ public/                 │
│  ✓ logs/                   │
│  ✓ start.sh                │
│                                         │
│  When Container Runs:                  │
│  1. start.sh executes                  │
│  2. node api/index.js (Express)        │
│  3. node .next/standalone/server.js    │
│  4. Both run on port 3001              │
└─────────────────────────────────────────┘
```

---

## 🔌 **Database Connection Flow**

### From Rabin Voice:
```
rabin-voice Container
    ↓
start.sh
    ↓
Express API (api/index.js)
    ↓
require('./api/services/database.js')
    ↓
const pool = mysql.createPool({
    host: 'mysql'              ← Docker service name
    user: 'crm_app_user'
    password: process.env.DATABASE_PASSWORD
    database: 'crm_system'
})
    ↓
Docker Network resolves 'mysql' → crm-mysql container
    ↓
MySQL accepts connection ✅
    ↓
API Routes respond to requests
```

### From Next.js:
```
nextjs Container
    ↓
require('mysql2/promise')
    ↓
connection to DATABASE_HOST (mysql)
    ↓
MySQL ✅
```

---

## 🔐 **Environment Variables Flow**

```
┌─────────────────────────────────────────────────────┐
│  docker-compose.yml                                 │
│                                                     │
│  env_file:                                          │
│    - صدای رابین/.env                               │
│    - .env                                           │
│    - .env.server                                    │
└────────────────┬────────────────────────────────────┘
                 │ (Loads environment)
                 ▼
┌─────────────────────────────────────────────────────┐
│  Container Runtime Environment                      │
│                                                     │
│  DATABASE_PASSWORD=1234                             │
│  DATABASE_USER=crm_app_user                         │
│  DATABASE_NAME=crm_system                           │
│  OPENROUTER_API_KEY=...                             │
│  TTS_API_URL=...                                    │
│  ...                                                │
└────────────────┬────────────────────────────────────┘
                 │
                 ├─→ process.env.DATABASE_PASSWORD
                 ├─→ process.env.OPENROUTER_API_KEY
                 └─→ process.env.TTS_API_URL
```

---

## 🚀 **Startup Sequence**

```
1️⃣  docker-compose up
    ↓
2️⃣  MySQL starts
    ├─ Loads database/init.sql
    ├─ Creates crm_system database
    ├─ Creates crm_app_user
    └─ Imports crm_system.sql & saas_master.sql
    ↓
3️⃣  Rabin Voice starts
    ├─ docker-compose builds Dockerfile
    ├─ Copies api/ + node_modules (THE FIX!)
    ├─ Runs start.sh
    ├─ Starts Express API on :3001
    ├─ Starts Next.js on :3001
    └─ Health check passes
    ↓
4️⃣  Next.js starts
    ├─ Connects to MySQL
    ├─ Loads API routes
    └─ Health check passes
    ↓
5️⃣  Nginx starts
    ├─ Proxies /rabin-voice → rabin-voice:3001
    ├─ Proxies / → nextjs:3000
    ├─ SSL certificates configured
    └─ Ready to serve
    ↓
✅ System Ready!
```

---

## 📡 **Network Communication**

```
Container to Container (Same Docker Network):
═════════════════════════════════════════════════

rabin-voice → mysql
  curl http://mysql:3306
  ✅ Works (service name resolution)

rabin-voice → nextjs
  curl http://nextjs:3000
  ✅ Works (service name resolution)

nextjs → mysql
  curl http://mysql:3306
  ✅ Works (service name resolution)

nginx → rabin-voice
  proxy_pass http://rabin-voice:3001
  ✅ Works (service name resolution)

nginx → nextjs
  proxy_pass http://nextjs:3000
  ✅ Works (service name resolution)
```

---

## ⚡ **The Critical Fix Explained**

```
❌ BEFORE (Container Crashed):
───────────────────────────────

Dockerfile Builder Stage:
  ✓ npm install
  ✓ npm run build
  ✓ Creates api/ directory
  ✓ Creates node_modules/

Dockerfile Runner Stage (BROKEN):
  ✗ Only copies .next/
  ✗ api/ NOT copied
  ✗ node_modules NOT copied
  
Container Start:
  start.sh → node api/index.js
  ❌ File not found!
  ❌ Container exits
  ❌ Docker restarts
  ❌ Loop continues...


✅ AFTER (Working):
──────────────────

Dockerfile Builder Stage:
  ✓ npm install
  ✓ npm run build
  ✓ api/ directory ready
  ✓ node_modules ready

Dockerfile Runner Stage (FIXED):
  ✓ Copies .next/
  ✓ COPIES api/ directory ← NEW!
  ✓ COPIES node_modules ← NEW!
  
Container Start:
  start.sh → node api/index.js
  ✅ File found!
  ✅ Express API starts
  ✅ Next.js starts
  ✅ Container healthy
```

---

## 📊 **File Organization**

```
صدای رابین/ (Rabin Voice Container Root)
│
├── api/                          ← Express API Code
│   ├── index.js                  ← Main server entry
│   ├── routes/
│   │   ├── ai.js                 ← AI routes
│   │   ├── tts.js                ← Text-to-Speech
│   │   └── database.js           ← Database queries
│   ├── services/
│   │   ├── database.js           ← Connection pool
│   │   └── keywordDetector.js
│   └── utils/
│       └── logger.js
│
├── .next/                        ← Next.js Build
│   ├── standalone/
│   │   └── server.js             ← Next.js Server
│   └── static/
│       └── (static assets)
│
├── node_modules/                 ← Dependencies
│   ├── express/
│   ├── mysql2/
│   ├── next/
│   └── (1000+ packages)
│
├── public/                       ← Static files
│
├── logs/                         ← Container logs
│   └── api.log
│
└── start.sh                      ← Startup script

═════════════════════════════════════════════════════

The FIX ensures all critical dirs are in container:
✅ api/ → Express API
✅ node_modules → Dependencies
✅ .next/standalone/ → Next.js Server
✅ public/ → Static files
```

---

## 🎯 **Connection Test Points**

```
1. Browser → Nginx (Port 443)
   ✅ Test: curl https://crm.robintejarat.com/

2. Nginx → rabin-voice:3001
   ✅ Test: curl http://localhost:3001/rabin-voice/

3. rabin-voice → MySQL
   ✅ Test: docker exec crm-rabin-voice curl http://mysql:3306

4. Rabin Express API → MySQL
   ✅ Test: curl http://localhost:3001/rabin-voice/api/database?action=test-connection

5. Next.js → MySQL
   ✅ Test: curl http://localhost:3000/api/health

All 5 should work = ✅ System Healthy
```

---

**✨ Now you understand the complete architecture!**

All pieces fit together perfectly with the Dockerfile fix. 🚀
