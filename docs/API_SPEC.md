# API Endpoints Specification - PropFlow AI

## 1. Authentication Layer (`/api/auth`)

### `POST /api/auth/register`
- Registers a new user and creates an organization (if Owner/Manager role).
- **Body**: `{ email, password, firstName, lastName, role, organizationName }`

### `POST /api/auth/login`
- Logs in a user, setting cookies.
- **Body**: `{ email, password }`
- **Response**: `{ user: { id, email, firstName, lastName, role, organizationId } }`

---

## 2. Property Module (`/api/properties`)

### `GET /api/properties`
- Lists properties belonging to the active organization.
- **Headers**: Authorization: Bearer JWT

### `POST /api/properties`
- Creates a new property resource.
- **Body**: `{ name, address, city, state, zipCode, imageUrl }`

---

## 3. AI Module (`/api/ai`)

### `POST /api/ai/lease-analyzer`
- Accepts a lease file URL, calls Gemini API to extract details.
- **Body**: `{ fileUrl }`
- **Response**: Extracted metadata JSON containing rents, late policies, dates.

### `POST /api/ai/property-health-score`
- Synthesizes metrics for a property.
- **Body**: `{ propertyId }`
- **Response**: 0-100 rating with breakdowns.
