# Database Specification - PropFlow AI

## 1. Schema & Relational Model
The schema maps multi-tenancy configurations, user records, lease specifications, billing details, maintenance requests, and AI analytics metrics using PostgreSQL.

```mermaid
erDiagram
  ORGANIZATION ||--o{ USER : contains
  ORGANIZATION ||--o{ PROPERTY : owns
  ORGANIZATION ||--o{ LEASE : manages
  
  USER ||--o{ PROPERTY_MANAGER_ASSIGNMENT : assigned
  PROPERTY ||--o{ PROPERTY_MANAGER_ASSIGNMENT : manages
  
  PROPERTY ||--o{ UNIT : contains
  PROPERTY ||--o{ PROPERTY_HEALTH_SCORE : rates
  
  UNIT ||--o{ LEASE : binds
  UNIT ||--o{ TENANT_PROFILE : contains
  UNIT ||--o{ MAINTENANCE_REQUEST : triggers
  
  USER ||--o{ TENANT_PROFILE : profiles
  TENANT_PROFILE ||--o{ LEASE : leases
  
  LEASE ||--o{ RENT_PAYMENT : generates
  LEASE ||--o{ AI_LEASE_ANALYSIS : analyzes
  
  USER ||--o{ MAINTENANCE_REQUEST : requests
  USER ||--o{ ANALYTICS_REPORT : generates
```

---

## 2. Critical Database Tables

### `User`
- Holds account state, secure hashes, and tenancy scope.
- **Indices**: Unique constraint on `email`, composite index on `(id, organizationId)`.

### `Property` & `Unit`
- Represent assets. Property belongs directly to an `organizationId`. 
- **Indices**: Composite index on `(id, organizationId)`.

### `Lease` & `RentPayment`
- Define tenancy duration and legal limits. Lease holds standard metadata plus the document URL of the digitized lease in Cloudinary.
- **Indices**: Composite indices on `(unitId, tenantProfileId)` and `(leaseId, status)`.

---

## 3. Query Optimization Strategies
1. **Foreign Key Indices**: Every relation key possesses an explicit single-field index.
2. **Partial Indices**: Indices are optimized on statuses (e.g., `status = 'PENDING'` for payments) to speed up ledger loading times.
3. **Prepared Statements**: Prisma automatically caches raw SQL query plans, reducing overall network roundtrips.
