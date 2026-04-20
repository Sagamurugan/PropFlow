# PropFlow Backend API Testing Guide

## Purpose

Use this guide to validate the PropFlow backend in Postman before frontend integration.

Base URL:

`http://localhost:3001/api`

## Seeded Demo Accounts

- Owner: `owner@propflow.app` / `owner12345`
- Manager: `manager@propflow.app` / `manager12345`
- Tenant: `tenant@propflow.app` / `tenant12345`
- Technician: `technician@propflow.app` / `tech12345`

## Postman Setup

Create these collection variables:

- `baseUrl` = `http://localhost:3001/api`
- `accessToken` = empty initially
- `propertyId` = empty initially
- `unitId` = empty initially
- `tenantId` = empty initially
- `leaseId` = empty initially
- `paymentId` = empty initially
- `maintenanceId` = empty initially

For protected routes add this header:

- `Authorization: Bearer {{accessToken}}`

## Safe Test Order

1. Health check
2. Owner login
3. Auth me
4. Users list
5. Properties flow
6. Units flow
7. Tenants flow
8. Leases flow
9. Payments flow
10. Maintenance flow
11. Analytics summary

## 1. Health Check

### `GET {{baseUrl}}/ai/health`

Expected:

```json
{
  "service": "ai-engine",
  "status": "placeholder-ready"
}
```

## 2. Owner Login

### `POST {{baseUrl}}/auth/login`

Body:

```json
{
  "email": "owner@propflow.app",
  "password": "owner12345"
}
```

Expected:

- Returns `accessToken`
- Returns owner user object

Store the returned token in `{{accessToken}}`.

## 3. Current User

### `GET {{baseUrl}}/auth/me`

Headers:

- `Authorization: Bearer {{accessToken}}`

Expected:

- Returns current logged-in owner

## 4. Users

### `GET {{baseUrl}}/users`

Expected:

- Returns seeded users
- Should include owner, manager, tenant, technician

### `POST {{baseUrl}}/users`

Body:

```json
{
  "email": "newmanager@propflow.app",
  "password": "manager12345",
  "firstName": "New",
  "lastName": "Manager",
  "phone": "9876543211",
  "role": "MANAGER"
}
```

## 5. Properties

### `GET {{baseUrl}}/properties`

Expected:

- Returns seeded property `Palm Residency`

### `POST {{baseUrl}}/properties`

Body:

```json
{
  "ownerId": "{{ownerUserId}}",
  "name": "Green Heights",
  "code": "PF-DEMO-002",
  "type": "APARTMENT",
  "addressLine1": "Indiranagar Main Road",
  "city": "Bengaluru",
  "state": "Karnataka",
  "postalCode": "560038"
}
```

Expected:

- Save returned `id` as `{{propertyId}}`

### `PATCH {{baseUrl}}/properties/{{propertyId}}`

Body:

```json
{
  "name": "Green Heights Residency",
  "description": "Updated from Postman test"
}
```

### `GET {{baseUrl}}/properties/{{propertyId}}`

### `DELETE {{baseUrl}}/properties/{{propertyId}}`

Only delete a fresh test property, not the seeded one.

## 6. Units

### `GET {{baseUrl}}/units`

Expected:

- Returns seeded units `A-101` and `A-102`

### `POST {{baseUrl}}/units`

Body:

```json
{
  "propertyId": "{{propertyId}}",
  "unitNumber": "B-201",
  "floor": "2",
  "monthlyRent": 22000,
  "securityDeposit": 44000
}
```

Expected:

- Save returned `id` as `{{unitId}}`

### `PATCH {{baseUrl}}/units/{{unitId}}`

Body:

```json
{
  "floor": "3",
  "monthlyRent": 23000,
  "status": "VACANT"
}
```

### `GET {{baseUrl}}/units/{{unitId}}`

### `DELETE {{baseUrl}}/units/{{unitId}}`

Use only for test units without leases or maintenance requests.

## 7. Tenants

### `GET {{baseUrl}}/tenants`

Expected:

- Returns seeded tenant profile

### `POST {{baseUrl}}/tenants`

Before this request, create a new user with role `TENANT` using `POST /users`.

Body:

```json
{
  "userId": "{{tenantUserId}}",
  "emergencyContactName": "Parent Name",
  "emergencyContactPhone": "9988776654",
  "kycIdType": "Aadhaar",
  "kycIdNumber": "888877776666"
}
```

Expected:

- Save returned `id` as `{{tenantId}}`

### `PATCH {{baseUrl}}/tenants/{{tenantId}}`

Body:

```json
{
  "employmentStatus": "Designer",
  "notes": "Created from Postman flow"
}
```

### `GET {{baseUrl}}/tenants/{{tenantId}}`

### `DELETE {{baseUrl}}/tenants/{{tenantId}}`

Only for a tenant without an active lease.

## 8. Leases

### `GET {{baseUrl}}/leases`

Expected:

- Returns seeded lease `LEASE-DEMO-001`

### `POST {{baseUrl}}/leases`

Body:

```json
{
  "unitId": "{{unitId}}",
  "tenantId": "{{tenantId}}",
  "startDate": "2026-05-01",
  "endDate": "2027-04-30",
  "monthlyRent": 23000,
  "securityDeposit": 46000,
  "rentDueDay": 5
}
```

Expected:

- Save returned `id` as `{{leaseId}}`
- Unit status should become `OCCUPIED`

### `PATCH {{baseUrl}}/leases/{{leaseId}}`

Body:

```json
{
  "monthlyRent": 23500,
  "status": "ACTIVE"
}
```

### `GET {{baseUrl}}/leases/{{leaseId}}`

### `DELETE {{baseUrl}}/leases/{{leaseId}}`

Expected:

- Unit status should move back to `VACANT` if no other active lease exists

## 9. Payments

### `GET {{baseUrl}}/payments`

Expected:

- Returns seeded April payment

### `POST {{baseUrl}}/payments`

Body:

```json
{
  "leaseId": "{{leaseId}}",
  "dueDate": "2026-06-05",
  "amountDue": 23500,
  "status": "PENDING",
  "paymentMethod": "UPI",
  "referenceNumber": "PAY-POSTMAN-001"
}
```

Expected:

- Save returned `id` as `{{paymentId}}`

### `PATCH {{baseUrl}}/payments/{{paymentId}}`

Body:

```json
{
  "amountPaid": 23500,
  "status": "PAID",
  "paymentMethod": "UPI",
  "referenceNumber": "PAY-POSTMAN-001"
}
```

### `GET {{baseUrl}}/payments/{{paymentId}}`

### `DELETE {{baseUrl}}/payments/{{paymentId}}`

## 10. Maintenance

### `GET {{baseUrl}}/maintenance`

Expected:

- Returns seeded maintenance request

### `POST {{baseUrl}}/maintenance`

Body:

```json
{
  "unitId": "{{unitId}}",
  "tenantId": "{{tenantId}}",
  "reportedByUserId": "{{tenantUserId}}",
  "title": "Fan not working",
  "description": "Bedroom ceiling fan stopped spinning",
  "priority": "MEDIUM"
}
```

Expected:

- Save returned `id` as `{{maintenanceId}}`

### `PATCH {{baseUrl}}/maintenance/{{maintenanceId}}`

Body:

```json
{
  "assignedTechnicianId": "{{technicianUserId}}",
  "status": "ASSIGNED",
  "category": "Electrical",
  "estimatedCost": 1200
}
```

### `PATCH {{baseUrl}}/maintenance/{{maintenanceId}}`

Body:

```json
{
  "status": "RESOLVED",
  "actualCost": 1000
}
```

### `GET {{baseUrl}}/maintenance/{{maintenanceId}}`

### `DELETE {{baseUrl}}/maintenance/{{maintenanceId}}`

## 11. Analytics

### `GET {{baseUrl}}/analytics/summary`

Expected:

- Returns summary counts
- Should include total properties, occupied units, vacant units, pending payments, open maintenance

## Useful IDs From Seed Data

Use the seeded login and list endpoints to discover IDs:

- `GET /users`
- `GET /properties`
- `GET /units`
- `GET /tenants`
- `GET /leases`
- `GET /payments`
- `GET /maintenance`

## Important Notes

- Start the backend before running this collection
- Use owner login first for admin-style testing
- Some delete operations should only be used on fresh Postman-created records
- Seeded records are better used for read and update checks
- Lease creation affects unit occupancy by design
- Protected routes require `Bearer` token auth

## Minimum Safe Validation Set

If you want a shorter pass before full Postman coverage, test these first:

1. `POST /auth/login`
2. `GET /auth/me`
3. `GET /properties`
4. `POST /units`
5. `POST /tenants`
6. `POST /leases`
7. `POST /payments`
8. `POST /maintenance`
9. `GET /analytics/summary`
