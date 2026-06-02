# 🎬 PropFlow AI - Interactive Demo Guide

Welcome to **PropFlow AI** - Your Complete Property Management Solution! Here's what you'll experience when you run the application.

---

## 🚀 **Quick Start to Run Locally**

### Prerequisites:
1. **PostgreSQL** installed and running (or use Neon.tech for cloud database)
2. **Node.js v22+**
3. **npm** (already installed)

### Setup Steps:

```bash
# 1. Install dependencies (already done)
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 3. Set up local PostgreSQL (if not using Neon)
# Install PostgreSQL and create database:
createdb propflow_db

# 4. Update .env with your credentials:
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/propflow_db?schema=public"

# 5. Run Prisma migrations
npm run prisma:migrate

# 6. Seed database (optional)
npm run prisma:seed

# 7. Start both servers
npm run dev
```

**Access Points:**
- 🌐 **Frontend**: http://localhost:3000
- 🔌 **API**: http://localhost:4000

---

## 📋 **Complete Demo Walkthrough**

### **Step 1: Authentication (Login/Register)**

#### Landing Page
- Clean, modern authentication interface
- Support for multi-organization access
- JWT-based authentication with HTTP-only cookies

**Two Demo Roles Available:**

#### 👨‍💼 **Property Owner/Manager Login**
```
Email: owner@propflow.com
Password: SecurePass123!
```
**What you get:**
- Full property portfolio access
- Analytics & insights
- AI features (lease analysis, property health)
- Complete reporting

#### 🏠 **Tenant Login**
```
Email: tenant@propflow.com
Password: SecurePass123!
```
**What you get:**
- Personal dashboard with rent due
- Maintenance request submission
- Payment tracking
- Lease document access

---

## 🎯 **Feature Demo - Owner/Manager Dashboard**

### **1. Main Dashboard** (`/dashboard`)

**Key Components You'll See:**

#### 📊 **KPI Cards**
- **Total Properties**: Shows portfolio size
- **Total Units**: Sum of all units across properties
- **Occupancy Rate**: % of units rented (Visual: 78%)
- **Monthly Revenue**: Total rent collected
- **Overdue Rent**: Outstanding payments
- **Open Maintenance**: Service tickets pending

#### 📈 **Revenue Trend Chart**
- 12-month line graph showing revenue patterns
- X-axis: Months (Jan - Dec)
- Y-axis: Revenue in ₹ (currency units)
- Interactive tooltips on hover

#### 🔧 **Maintenance Breakdown (Pie Chart)**
- Visual breakdown by ticket status
- OPEN: 35% (Red)
- IN_PROGRESS: 40% (Orange)
- RESOLVED: 25% (Green)

#### 🏢 **Portfolio Overview**
- Quick access to top 5 properties
- Status indicators (ACTIVE/INACTIVE)
- Click to drill down

#### 💰 **Recent Overdue Payments**
- List of unpaid rent records
- Days overdue indicator
- One-click payment action

#### 📅 **Upcoming Lease Expirations**
- Leases expiring in next 30 days
- Renewal prompts
- Risk assessment

#### 🎯 **Recent Activity Log**
- User actions across the platform
- Timestamps and detailed descriptions
- Audit trail for compliance

#### 🏥 **Property Health Score** (AI Powered)
- Dropdown to select property
- Score 0-100 based on:
  - Appliance age
  - Maintenance ticket volume
  - Safety compliance
  - Cash flow stability
- Color-coded visualization (Red → Yellow → Green)

---

### **2. Properties Module** (`/properties`)

**Functionality:**
- ✅ **View all properties** in table format
- ✅ **Create new property** with address details
- ✅ **Edit property** information
- ✅ **Delete property** (soft delete, archive)
- ✅ **Filter by status** (ACTIVE, INACTIVE, UNDER_MAINTENANCE)

**Property Form Fields:**
```
- Property Name (e.g., "Downtown Apartments")
- Property Code (e.g., "PROP-001")
- Type (APARTMENT, VILLA, COMMERCIAL, HOSTEL, MIXED_USE)
- Address (Line 1, Line 2, City, State, Postal Code)
- Description
- Total Floors & Units
- Year Built
- Manager Name
- Images (Cloudinary integration)
```

**Property Card Display:**
- Property image (Cloudinary CDN)
- Name, type, address
- Total units & occupancy
- Status badge
- Quick actions (Edit, View, Delete)

---

### **3. Units Module** (`/units`)

**Features:**
- 📋 List all units across properties
- ➕ Add single or bulk units
- ✏️ Edit unit details
- 🗑️ Delete units

**Bulk Upload Feature:**
```
CSV Format:
propertyId,unitNumber,unitType,bedrooms,bathrooms,floorNumber,status
PROP-001,101,1BHK,1,1,1,AVAILABLE
PROP-001,102,2BHK,2,2,1,OCCUPIED
```

**Unit Status Options:**
- AVAILABLE (Vacant)
- OCCUPIED (Rented)
- MAINTENANCE (Under repair)
- LOCKED (Not available)

**Unit Types:**
- 1BHK, 2BHK, 3BHK
- STUDIO
- SHOP, OFFICE
- Custom types supported

---

### **4. Tenants Module** (`/tenants`)

**Capabilities:**
- 👥 View all tenants
- ➕ Add new tenant with documents
- 📄 Manage tenant documents (ID, Address proof, etc.)
- 📍 Move-out tracking
- 🏠 Unit assignment

**Tenant Profile:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+91-9876543210",
  "occupation": "Software Engineer",
  "documents": [
    {
      "type": "AADHAR",
      "url": "cloudinary-link"
    }
  ],
  "unitId": "unit-uuid",
  "moveInDate": "2024-01-15",
  "moveOutDate": null
}
```

---

### **5. Leases Module** (`/leases`)

**Features:**
- 📜 Create lease contracts
- 📄 Upload lease PDF (stored on Cloudinary)
- 🤖 AI-powered lease parsing (extracts key terms)
- 🔄 Lease renewal workflows
- 📋 Lease term tracking

**Lease Details Form:**
```
- Tenant & Unit selection
- Start & End Dates
- Monthly Rent Amount
- Security Deposit
- Late Fee Terms
- Special Clauses
- Document Upload
```

**AI Lease Intelligence** (When PDF uploaded):
```json
{
  "monthlyRent": 25000,
  "securityDeposit": 75000,
  "startDate": "2024-01-01",
  "endDate": "2025-12-31",
  "lateFeeTerm": "1% per day after 5 days",
  "maintenanceResponsibility": "Landlord",
  "utilityResponsibility": "Tenant",
  "noticePeriod": "60 days",
  "renewalTerms": "Auto-renew with 10% increase"
}
```

---

### **6. Payments Module** (`/payments`)

**Payment Tracking System:**

#### 💳 **Generate Rent Records**
- Auto-generate for all occupied units
- Recurring monthly
- Bulk generation option

#### 📊 **Payment Status**
- PENDING (Not paid)
- PARTIAL (Partial payment)
- PAID (Full payment)
- OVERDUE (Late payment)

#### 📈 **Payment Analytics**
```
- Expected Monthly Rent: ₹500,000
- Collected Rent: ₹425,000
- Overdue Amount: ₹75,000
- Collection Rate: 85%
```

#### 🔔 **Overdue Tracking**
- Automatic overdue detection
- Days overdue calculation
- Late fee accumulation
- Tenant notification system

**Payment Flow:**
1. System generates monthly rent records
2. Marks due date (usually 5th of month)
3. Tracks payments (manual entry or gateway integration)
4. Auto-flags as overdue after 5 days
5. Sends notifications to tenant

---

### **7. Maintenance Module** (`/maintenance`)

**Complete Service Ticket System:**

#### 🔧 **Create Maintenance Request**
```json
{
  "category": "Plumbing",
  "description": "Leaking faucet in bathroom",
  "priority": "MEDIUM",
  "propertyId": "...",
  "unitId": "...",
  "attachments": ["image-url"]
}
```

#### 📋 **Ticket Status Flow**
- OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED

#### 👨‍🔧 **Technician Management**
- Register technicians
- Assign specializations
- Assign tickets to technicians
- Track completion

#### 🎯 **Priority Levels**
- LOW: Non-urgent repairs
- MEDIUM: Standard maintenance
- HIGH: Important issues affecting tenancy
- CRITICAL: Safety hazards

#### 📊 **Maintenance Analytics Dashboard**
```
- Total Service Requests: 45
- Resolved Tickets: 32
- Open Active Tickets: 13
- Avg Resolution Time: 2.5 days
- Critical Issues: 2
```

#### 📈 **Ticket Category Breakdown** (Chart)
- Plumbing: 25%
- Electrical: 20%
- General Maintenance: 30%
- Safety: 10%
- Other: 15%

---

### **8. Analytics Module** (`/analytics`)

**4 Main Analytics Dashboards:**

#### 💰 **Revenue Analytics**
```
- Total Expected Rent (All units)
- Total Collected Rent
- Revenue by Property
- Monthly trend (Line chart)
- Collection efficiency %
```

#### 🏠 **Occupancy Analytics**
```
- Total Units Count
- Occupied Units
- Vacant Units
- Occupancy Rate %
- Vacancy by Property
```

#### 📄 **Leases Analytics**
```
- Active Leases Count
- Expiring Soon (30 days)
- Renewed Leases
- Renewal Rate %
- Lease Timeline Chart
```

#### 🔧 **Maintenance Analytics** (Detailed)
```
- Open Service Requests
- Resolved Tickets
- Avg Dispatch Time (hours)
- Avg Resolution Time (days)
- Critical Issues Count
- Ticket Category Distribution
```

#### 🏥 **Property Health Score Analytics**
```
For each property:
- Overall Health (0-100)
- Appliance Age Score
- Maintenance Load
- Safety Compliance
- Cash Flow Stability
- Trend over time
```

---

### **9. Reports Module** (`/reports`)

**Monthly Report Features:**

#### 📊 **Report Sections**

1. **Executive Summary**
   - Month overview
   - Key metrics
   - Performance vs. target

2. **Occupancy Section**
   - Total Units
   - Occupied Units
   - Occupancy Rate %
   - Vacancy Analysis

3. **Financial Metrics**
   - Expected Rent
   - Collected Rent
   - Overdue Amount
   - Collection Rate %
   - Revenue Trend

4. **Maintenance Operations**
   - Total Tickets
   - Resolved Count
   - Open Tickets
   - Category Breakdown

5. **Detailed Tables**
   - Property-wise breakdown
   - Unit-wise occupancy
   - Payment status details

#### 📥 **Export Options**
- **PDF Export**: Professional formatted report
- **Excel Export**: Full data with pivot tables
- **CSV Export**: Raw data for analysis

**Export Content Includes:**
```
PROPFLOW AI - MONTHLY PERFORMANCE REPORT
Organization: Owner's Company Name
Report Period: June 2026
Date Generated: June 2, 2026

1. OCCUPANCY METRICS
   - Total Units: 25
   - Occupied Units: 20
   - Occupancy Rate: 80%

2. FINANCIAL METRICS
   - Expected Rent: ₹625,000
   - Collected Rent: ₹525,000
   - Overdue Rent: ₹100,000
   - Collection Rate: 84%

3. MAINTENANCE OPERATIONS
   - Total Tickets: 12
   - Resolved: 10
   - Open: 2
```

---

### **10. AI Assistant Module** (`/ai-assistant`)

**Conversational Property Assistant:**

#### 🤖 **Features**
- Ask questions in natural language
- Get insights about properties, tenants, payments
- Semantic search across your data
- Pre-built query templates

#### 📝 **Example Queries You Can Ask:**
```
1. "What's my occupancy rate this month?"
2. "Show me properties with open maintenance issues"
3. "Which tenants have overdue payments?"
4. "Analyze my revenue trend for the past 6 months"
5. "What's the health score of my downtown property?"
6. "How many maintenance tickets are critical?"
7. "List tenants moving out in next 30 days"
8. "What's my rent collection rate?"
```

#### 🔄 **How It Works**
1. User inputs question
2. AI (Gemini API) understands intent
3. Generates database query
4. Returns structured results
5. Explains findings in business language

#### 🎯 **Intent Recognition**
- OCCUPANCY_SUMMARY
- PROPERTY_DETAILS
- MAINTENANCE_STATUS
- FINANCIAL_ANALYSIS
- LEASE_DETAILS
- TENANT_SEARCH
- PAYMENT_ANALYSIS
- HEALTH_SCORE

---

### **11. Activity Log Module** (`/activity-log`)

**Comprehensive Audit Trail:**

**Tracked Events:**
```
- User login/logout
- Property created/updated/deleted
- Unit operations
- Tenant additions/removals
- Lease creation/renewal
- Payment records
- Maintenance ticket changes
- Report generation
- AI operations
```

**Log Entry Format:**
```json
{
  "action": "PROPERTY_CREATED",
  "userId": "user-uuid",
  "userName": "John Owner",
  "resourceType": "Property",
  "resourceId": "prop-uuid",
  "changes": {
    "name": "Downtown Apartments",
    "address": "123 Main St"
  },
  "timestamp": "2024-06-02T13:45:00Z",
  "ipAddress": "192.168.1.1"
}
```

**Filterable by:**
- Date range
- User
- Action type
- Resource type

---

## 🏠 **Tenant Portal Demo**

When logged in as a **TENANT**, you get a simplified dashboard:

### **Tenant Dashboard Features:**
1. **Rent Status Card**
   - Next due date
   - Amount due
   - Payment status

2. **Payment History**
   - All payments made
   - Download receipts

3. **Maintenance Requests**
   - Create new ticket
   - View your tickets
   - Track status

4. **Lease Information**
   - View your lease
   - Download document
   - Important dates

5. **Messages**
   - Landlord communications
   - Notifications

---

## 🔐 **Security & Multi-Tenancy Demo**

### **Role-Based Access Control:**

| Action | Super Admin | Owner | Manager | Tenant |
|--------|-----------|-------|---------|--------|
| Manage Organizations | ✅ | ❌ | ❌ | ❌ |
| View Own Properties | ✅ | ✅ | ✅ | ❌ |
| Manage Tenants | ✅ | ✅ | ✅ | ❌ |
| Create Leases | ✅ | ✅ | ✅ | ❌ |
| Track Payments | ✅ | ✅ | ✅ | ✅ |
| Request Maintenance | ✅ | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ✅ | ❌ |
| Use AI Assistant | ✅ | ✅ | ✅ | ❌ |

### **Data Isolation:**
- Each organization's data is completely isolated
- Row-level security at database level
- JWT tokens enforce organization boundaries

---

## 🎨 **UI/UX Highlights**

### **Design System:**
- **Color Scheme**: Dark theme (Slate + Indigo)
- **Typography**: Modern, clean, readable
- **Icons**: Lucide React icons throughout
- **Charts**: Recharts for data visualization
- **Styling**: Tailwind CSS + custom utilities

### **Responsive Design:**
- Mobile-first approach
- Fully responsive layouts
- Touch-friendly interactions
- Optimized for all screen sizes

### **Loading & Error States:**
- Skeleton loaders for data
- Helpful error messages
- Retry mechanisms
- User-friendly fallbacks

---

## 🚀 **Performance Features**

✅ **Server-Side Rendering (Next.js 15)**
✅ **API Route Handlers**
✅ **Real-time Updates (WebSockets ready)**
✅ **Optimized Database Queries (Prisma)**
✅ **Image Optimization (Cloudinary CDN)**
✅ **JWT-based Session Management**
✅ **Request Rate Limiting (Ready)**

---

## 📱 **Mobile Demo Tips**

1. Open `http://localhost:3000` on your mobile device
2. Test responsive layouts
3. Try touch interactions
4. Check loading states
5. Test form submissions

---

## 🎓 **Learning More**

### Documentation Files:
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design
- **[API_SPEC.md](docs/API_SPEC.md)** - API endpoints
- **[DATABASE.md](docs/DATABASE.md)** - Schema details
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide
- **[PRD.md](docs/PRD.md)** - Product requirements

### Tech Stack Details:
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: NestJS 10, TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Google Gemini API
- **Storage**: Cloudinary CDN
- **Auth**: JWT + HTTP-only cookies

---

## ⚠️ **Demo Limitations**

⚠️ **Database Required**: Application needs PostgreSQL to run
⚠️ **API Keys Required**: Gemini API needed for AI features
⚠️ **Cloudinary**: Image uploads require Cloudinary account
⚠️ **Mock Data**: Use seed script to populate demo data

---

## 🎬 **Next Steps**

1. **Set up PostgreSQL** locally or use Neon.tech
2. **Configure `.env`** with your credentials
3. **Run migrations**: `npm run prisma:migrate`
4. **Seed database**: `npm run prisma:seed`
5. **Start servers**: `npm run dev`
6. **Login** with demo credentials
7. **Explore** all modules and features!

---

## 💡 **Tips for Demo**

✨ Try the **AI Assistant** - Ask it about your properties
✨ Export a **Monthly Report** to PDF/Excel
✨ Create maintenance tickets and assign to technicians
✨ Use the **Property Health Score** to identify issues
✨ Check **Payment Analytics** for financial insights
✨ Monitor **Activity Log** for compliance

---

## 📞 **Support**

For issues or questions:
- Check the documentation files
- Review error messages carefully
- Check browser console for details
- Ensure all environment variables are set

---

**Enjoy exploring PropFlow AI! 🚀**
