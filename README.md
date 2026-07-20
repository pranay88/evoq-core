# EVOQ CORE — Realtech Operations Console

> **People. Places. Operations. Connected.**

EVOQ CORE is a production-ready, secure internal web application designed for **EVOQ Realtech**. It manages employees, onboarding invites, HR statutory document verifications, site attendance registries, company-issued assets, stockpiles, and visitor check-ins.

---

## 🛠️ Technology Stack & Architecture

- **Framework:** Next.js (App Router, Server Actions)
- **Database:** local SQLite via Prisma ORM (100% compatible with Supabase PostgreSQL)
- **Authentication:** Custom Cookie Session Manager signed with **HMAC-SHA256**
- **Security:** Edge-scoped role-based guard middleware (`src/middleware.ts`)
- **Styling:** Tailwind CSS (v4) with House of EVOQ design system tokens
- **Excel Services:** `exceljs` for sheet templates & bulk attendance imports
- **Audit Trails:** Append-only log stream tracing database actions and authorization events

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js (v18.x or higher)** and **NPM** installed on your system.

### 2. Clone & Environment Configuration
Copy the environment variables template file to create a local config:
```bash
cp .env.example .env
```

### 3. Install Dependencies
Run the package installation:
```bash
npm install
```

### 4. Database Setup & Sync
Generate the local Prisma Client and push the SQLite schema:
```bash
npx prisma generate
npx prisma db push
```

### 5. Pre-populate Seed Data
Seed the local database with office sites, departments, default roles, inventory categories, and employee registers:
```bash
node prisma/seed.js
```

### 6. Run the Dev Server
Launch the local Next.js development server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Test Credentials & Roles

The seed script registers the following default accounts. All accounts share the same default testing password:
👉 **Password:** `Password@123`

| User Email | Role | Assigned Site | Primary Actions |
| :--- | :--- | :--- | :--- |
| **`hr@evoqrealtech.com`** | **HR** | HQ (Bangalore) | Directory, Onboarding links, Approvals, Attendance, Reports, Users |
| **`admin@evoqrealtech.com`** | **ADMIN** | HQ (Bangalore) | Stock restocks, site-to-site transfers, damage records, asset allocation |
| **`noida@evoqrealtech.com`** | **FRONT_DESK** | Noida | Site visitor check-in, phone-number lookups, checkout exits |
| **`mumbai@evoqrealtech.com`** | **FRONT_DESK** | Mumbai | Site visitor check-in, phone-number lookups, checkout exits |
| **`bangalore@evoqrealtech.com`** | **FRONT_DESK** | HQ (Bangalore) | Site visitor check-in, phone-number lookups, checkout exits |
| **`hyderabad@evoqrealtech.com`** | **FRONT_DESK** | Hyderabad | Site visitor check-in, phone-number lookups, checkout exits |

---

## ☁️ Supabase Production Migration

To migrate this application from a local SQLite database to Supabase PostgreSQL:

1. **Update schema.prisma:**
   Change the database datasource provider and connection variable in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Retrieve Supabase URL & Keys:**
   Copy the connection string (with transaction pooling or session parameters) from your Supabase Dashboard under Project Settings > Database.
3. **Configure Environment Variables:**
   Update the `.env` file:
   ```env
   DATABASE_URL="postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres"
   ```
4. **Push Schema:**
   Generate client libraries and execute the schema deployment:
   ```bash
   npx prisma db push
   ```
   Now run the seed command `node prisma/seed.js` to pre-populate your live Supabase database!
