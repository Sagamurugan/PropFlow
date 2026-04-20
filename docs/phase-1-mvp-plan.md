# PropFlow Phase 1 MVP Plan

## Goal

Build a production-shaped MVP that proves the core PropFlow value:

`owners and managers can manage properties, tenants, rent, and maintenance from one system with less manual work`

Phase 1 should prioritize reliable CRUD flows, role-based access, and a clean end-to-end demo over advanced AI.

## Phase 1 Scope

### In Scope

- Authentication and role-based access
- Property, building, and unit management
- Tenant management
- Lease tracking
- Rent tracking and payment records
- Maintenance ticket creation and assignment
- Basic dashboard summary
- Manual notifications placeholders
- Foundational API and database setup

### Out of Scope for Phase 1

- Real AI predictions in production
- Vacancy prediction
- Predictive maintenance models
- AI assistant chatbot
- Vendor marketplace
- Full payment gateway integration
- Complex automation engine
- Multi-language support

## Success Criteria

Phase 1 is successful if a demo user can:

1. Sign in as an owner or manager
2. Create a property and units
3. Add a tenant and assign a lease
4. Record rent due and payment status
5. Raise and manage a maintenance request
6. View a summary dashboard of occupancy, rent, and issues

## User Roles for MVP

### Owner

- Manage properties, units, tenants, leases
- View payments and maintenance
- View dashboard summary

### Manager

- Manage operations on assigned properties
- Create and update tenants, leases, payments, maintenance

### Tenant

- View lease details
- View payment status
- Raise maintenance requests

### Technician

- View assigned maintenance tickets
- Update maintenance status

## MVP Modules

### 1. Auth

Features:

- Email and password login
- JWT-based authentication
- Role-based access control

Deliverables:

- Login endpoint
- Current user endpoint
- Auth guards and role guards

### 2. Users

Features:

- User profiles
- Role assignment
- Owner, manager, tenant, technician identity mapping

Deliverables:

- User entity
- User CRUD for admin/owner context

### 3. Properties and Units

Features:

- Add property
- Add building metadata if needed
- Add units under property
- Track occupancy status

Deliverables:

- Properties CRUD
- Units CRUD
- Occupancy summary fields

### 4. Tenants

Features:

- Tenant profile
- Contact details
- KYC placeholder fields
- Link tenant to unit and lease

Deliverables:

- Tenants CRUD
- Tenant history placeholder

### 5. Leases

Features:

- Lease start and end date
- Monthly rent amount
- Security deposit
- Lease status

Deliverables:

- Lease CRUD
- Active and expired lease filtering

### 6. Payments

Features:

- Monthly rent due tracking
- Manual payment entry
- Payment status: pending, paid, late, partial
- UPI/manual reference placeholder

Deliverables:

- Payment records CRUD
- Rent status dashboard metrics

### 7. Maintenance

Features:

- Tenant creates issue
- Manager assigns technician
- Technician updates progress
- Priority and status tracking

Deliverables:

- Maintenance request CRUD
- Assignment and status update flows

### 8. Dashboard

Features:

- Total properties
- Occupied vs vacant units
- Rent collected vs pending
- Open maintenance tickets

Deliverables:

- Summary API
- Owner/manager dashboard UI

## Suggested Database Design for Phase 1

### Core Tables

- `users`
- `properties`
- `units`
- `tenants`
- `leases`
- `payments`
- `maintenance_requests`

### Supporting Tables

- `user_property_assignments`
- `documents` optional placeholder
- `notifications` optional placeholder

### Recommended Relations

- One owner can have many properties
- One property can have many units
- One unit can have many leases over time
- One tenant can have many leases over time
- One lease belongs to one tenant and one unit
- One lease can have many payments
- One maintenance request belongs to one unit and can optionally reference a tenant

## Backend Plan

### Stack

- NestJS
- Prisma
- PostgreSQL
- Redis reserved for later background jobs

### Phase 1 Backend Deliverables

- Project bootstrap
- Prisma schema for MVP tables
- Auth module with JWT
- Modules:
  - `auth`
  - `users`
  - `properties`
  - `units`
  - `tenants`
  - `leases`
  - `payments`
  - `maintenance`
  - `analytics` for basic summary only
- Validation DTOs
- Global error handling
- Seed data for demo accounts and properties

### Recommended API Priority

1. Auth
2. Properties
3. Units
4. Tenants
5. Leases
6. Payments
7. Maintenance
8. Dashboard analytics

## Web Dashboard Plan

### MVP Screens

- Login
- Dashboard
- Properties list
- Property detail with units
- Tenants list
- Tenant detail
- Leases list
- Payments list
- Maintenance list
- Maintenance detail/update

### UI Priorities

- Clean and recruiter-friendly admin experience
- Responsive layout
- Reusable cards, tables, and status badges
- Quick metrics on dashboard

### Feature Buckets

- `features/dashboard`
- `features/properties`
- `features/tenants`
- `features/payments`
- `features/maintenance`

## Mobile App Plan

Phase 1 mobile should be intentionally minimal.

### MVP Screens

- Login
- Tenant dashboard
- My lease
- My payments
- Raise maintenance request
- My maintenance tickets

### Why Keep Mobile Small

The web dashboard is the stronger final-year demo surface. The mobile app should support the tenant journey without doubling development complexity too early.

## AI in Phase 1

Phase 1 should not depend on real ML for the main demo.

### Recommended Approach

- Add an `ai` module and FastAPI skeleton only
- Expose placeholder endpoints
- Return mock scores or simple rule-based responses

### Best Candidate for a Phase 1 AI Demo

`tenant risk score`

Reason:

- Easy to explain
- Easy to demo
- Can be rule-based first
- Can evolve into ML later

Example first version:

- Late payments increase risk
- Frequent complaints increase risk
- Lease violations increase risk

## Phase 1 Milestones

### Milestone 1: Foundation

- Monorepo setup
- Environment config
- Backend bootstrap
- Web dashboard bootstrap
- Mobile bootstrap
- Shared coding conventions

### Milestone 2: Backend Core

- Prisma schema
- Auth module
- Users, properties, units
- Tenants and leases

### Milestone 3: Business Flows

- Payments
- Maintenance requests
- Dashboard summary endpoints

### Milestone 4: Frontend Integration

- Connect dashboard to backend APIs
- Build key CRUD screens
- Add role-aware navigation

### Milestone 5: Tenant Mobile

- Auth
- Payment status
- Maintenance raise/view flow

### Milestone 6: Demo Readiness

- Seed sample data
- Add polished dashboard cards/charts
- Add mock AI score on tenant view
- Prepare final presentation flow

## Suggested 6-Week Execution Timeline

### Week 1

- Finalize schema and architecture
- Setup backend and frontend foundations

### Week 2

- Build auth, users, properties, units

### Week 3

- Build tenants, leases, and relationships

### Week 4

- Build payments and maintenance modules

### Week 5

- Build dashboard UI and connect APIs
- Add mobile tenant basics

### Week 6

- Seed data
- Add polishing
- Add mock AI scoring
- Testing and final demo prep

## Recommended Demo Story

1. Owner logs in
2. Creates a property and units
3. Adds a tenant and lease
4. Views rent due and payment status
5. Tenant raises a maintenance complaint
6. Manager assigns technician
7. Dashboard updates metrics
8. Tenant profile shows a basic AI risk score

## Technical Priorities

### Must Build Well

- Auth
- Data model
- Relationships
- Clean CRUD flows
- Clear dashboard summary

### Can Be Simplified

- Notifications can be in-app only
- Payment gateway can be mocked
- AI can be rule-based
- Redis jobs can be deferred

## Risks and Scope Control

### Major Risk

Trying to build Phase 2 and Phase 3 features before Phase 1 is stable.

### Rule

Do not start advanced AI or automation until these are complete:

- Auth works
- Property and tenant flows work
- Payments work
- Maintenance works
- Dashboard works

## Immediate Next Build Order

1. Create Prisma schema for MVP tables
2. Implement auth and role guards
3. Implement properties and units modules
4. Implement tenants and leases modules
5. Implement payments and maintenance modules
6. Build dashboard summary endpoints
7. Build web dashboard screens
8. Add tenant mobile basics

## Final Recommendation

For a final-year project, Phase 1 should be presented as:

`a working SaaS property management MVP with intelligent foundations`

That framing is stronger and more believable than trying to claim fully autonomous AI too early. Once the MVP is stable, Phase 2 can add real predictive intelligence on top of solid operational data.
