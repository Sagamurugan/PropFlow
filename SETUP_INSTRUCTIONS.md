# 🔧 PropFlow AI - pgAdmin Setup Instructions

Since you have **pgAdmin** open, follow these steps to set up the database:

## Step 1: Connect to PostgreSQL Server in pgAdmin

1. In pgAdmin, expand **Servers** in the left panel
2. Right-click and select **Register → Server**
3. Fill in:
   - **Name**: `LocalPostgres`
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Username**: `postgres`
   - **Password**: `postgres` (default)
4. Click **Save**

## Step 2: Create `propflow_db` Database

1. Right-click on **Databases** under your server
2. Select **Create → Database**
3. Name it: `propflow_db`
4. Click **Save**

## Step 3: Update .env with Correct Credentials

Edit `/Users/saisanthosh/Desktop/PropFlow/.env`:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/propflow_db?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/propflow_db?schema=public"
```

**Note**: Replace `postgres` password if your local PostgreSQL has a different password.

## Step 4: Run Prisma Migrations

```bash
cd /Users/saisanthosh/Desktop/PropFlow

# Run migrations
npx prisma migrate dev --name init
```

This will:
- Create all tables based on schema.prisma
- Create migration files
- Generate Prisma Client

## Step 5: Seed Demo Data (Optional)

```bash
# If seed.ts exists and has seeding logic:
npx prisma db seed
```

## Step 6: Start Development Servers

**Terminal 1 - API Server:**
```bash
npm run dev:api
```

**Terminal 2 - Web Server:**
```bash
npm run dev:web
```

## Step 7: Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000

---

## 🔍 **Troubleshooting**

### Connection Error: "Authentication failed"
- Check PostgreSQL is running
- Verify password in `.env` matches your local PostgreSQL
- In macOS: default password is often empty or `postgres`

### `propflow_db` doesn't exist
- Create it via pgAdmin (Step 2) or:
```bash
createdb propflow_db -U postgres
```

### Port 5432 in use
- PostgreSQL is already running (good!)
- Or another service is using that port

### Can't find migration files
- Migrations are in `prisma/migrations/`
- They're created when you run `prisma migrate dev`

---

## 📊 **View Schema in pgAdmin**

After migrations run:

1. Navigate to `propflow_db` → **Schemas** → **public** → **Tables**
2. You should see:
   - `Organization`
   - `User`
   - `Property`
   - `Unit`
   - `Tenant`
   - `Lease`
   - `MaintenanceRequest`
   - `Payment`
   - etc.

---

**Good luck! Once complete, you'll have a fully functional PropFlow AI demo! 🚀**
