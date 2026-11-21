# Meru Lead Manager

A full-stack CRM Lead Manager application built as part of the **Meru Technosoft Pvt. Ltd. Full Stack Developer Screening Assignment**.

> Built with **React 18 + Vite** (frontend), **Node.js + Express** (backend), and **SQLite** via Node.js built-in `node:sqlite` (`DatabaseSync`).

---

## Features

### Core (Required by Assignment)
- ✅ **Add leads** with: `name`, `email`, `phone`, `company`, `source` (dropdown), and `status` (`New` / `Contacted` / `Qualified` / `Lost`).
- ✅ **Display leads in a structured table** with status badges clearly displayed.
- ✅ **Edit existing leads** via a responsive modal form.
- ✅ **Delete leads** with a confirmation modal to prevent accidental data loss.
- ✅ **Search and filter** leads by name, email, company, or status.
- ✅ **Comprehensive validation** on frontend (immediate inline feedback) and backend (**Zod** schema with field-level error messages).
- ✅ **Persistent database storage** in SQLite.

### Bonus Features & UI/UX Redesign
- ✅ **Linear & Attio Inspired Application Shell**: Refined left sidebar navigation, brand identity, pipeline stage counters, and top header bar.
- ✅ **Interactive Dashboard Visualizations**:
  - SVG Donut Chart for status distribution with interactive hover state, center counter, and status legend.
  - Ranked acquisition channel progress bars with proportional percentages and channel badges.
  - Recent Leads activity section showing latest leads with direct navigation to table and edit modals.
- ✅ **Advanced Data Management Toolbar**: Fast search input, segmented status filter pills with live counts, and page size selector.
- ✅ **Slide-Over Modal Form**: High-density modal with contact & company grouping, inline field validation, and keyboard shortcuts (`N` to create, `Esc` to close).
- ✅ **Demonstration Data Seed Script**: `npm run seed` populates 11 realistic leads across all 4 statuses and 6 sources for immediate evaluation.
- ✅ **Sorting & Pagination** on the leads table with configurable page size (10, 25, 50).
- ✅ **Automated API test suite** using **Jest** and **Supertest** (18 tests, 100% passing).
- ✅ **Toast notifications** for all CRUD operations.

---

## Technology Stack

| Layer      | Technology | Notes |
|------------|------------|-------|
| Frontend   | React 18, Vite 5 | Modular components, custom hooks (`useLeads`, `useToast`) |
| Styling    | Plain CSS (Custom Design System) | Clean, minimal SaaS aesthetic with responsive layouts |
| Backend    | Node.js (Express 4) | Layered architecture: routes, controllers, validators, middleware |
| Database   | SQLite (via `node:sqlite`) | Built-in Node.js `DatabaseSync` — zero external native C++ build dependencies |
| Validation | Zod 3.22 (backend), Custom JS (frontend) | Synchronized schema validation with field-level error mapping |
| Testing    | Jest 29 + Supertest 7 | 18 automated tests covering CRUD, validations, pagination, and stats |
| Language   | JavaScript | ES modules on client, CommonJS on server |

---

## Project Structure

```
meru-lead-manager/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── leadsApi.js   # Fetch API wrapper for backend endpoints
│   │   ├── components/
│   │   │   ├── App.jsx           # Root layout and state orchestration
│   │   │   ├── Dashboard.jsx     # Pipeline stats and status/source breakdown
│   │   │   ├── LeadsTable.jsx    # Sortable data table
│   │   │   ├── LeadForm.jsx      # Create/edit modal with validation
│   │   │   ├── ConfirmDialog.jsx # Confirmation dialog for lead deletion
│   │   │   ├── Pagination.jsx    # Page navigation controls
│   │   │   ├── StatusBadge.jsx   # Status badges (New, Contacted, Qualified, Lost)
│   │   │   └── Toast.jsx         # Toast notification system
│   │   ├── hooks/
│   │   │   ├── useLeads.js       # Custom hook for leads state and queries
│   │   │   └── useToast.js       # Custom hook for toast alerts
│   │   ├── styles/
│   │   │   └── globals.css       # Complete SaaS design system
│   │   ├── utils.js              # Shared constants and form validation
│   │   └── main.jsx              # React application entry point
│   ├── index.html
│   ├── vite.config.js        # Vite config with /api reverse proxy to port 5001
│   └── package.json
│
├── server/                   # Node.js + Express backend
│   ├── src/
│   │   ├── index.js              # Server entry point (Port 5001)
│   │   ├── app.js                # Express app setup and middleware
│   │   ├── database.js           # SQLite connection & schema via node:sqlite
│   │   ├── routes/
│   │   │   └── leads.js          # REST API route declarations
│   │   ├── controllers/
│   │   │   └── leadsController.js# Query building, CRUD handlers, stats
│   │   ├── middleware/
│   │   │   ├── validate.js       # Zod validation middleware
│   │   │   └── errorHandler.js   # Global centralized error handler
│   │   └── validators/
│   │       └── leadValidator.js  # Zod validation schemas
│   ├── __tests__/
│   │   └── leads.test.js         # 18 automated tests (Jest + Supertest)
│   ├── data/                     # SQLite database directory (gitignored)
│   ├── .env                      # Environment config (gitignored)
│   ├── .env.example              # Safe environment template
│   └── package.json
│
├── .gitignore                # Excludes node_modules, .env, *.db, dist
├── .env.example
└── README.md
```

---

## Database Design

**Table: `leads`**

| Column      | Type    | Constraints | Description |
|-------------|---------|-------------|-------------|
| `id`        | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique lead identifier |
| `name`      | TEXT    | NOT NULL | Lead full name |
| `email`     | TEXT    | NOT NULL, UNIQUE | Lead email (unique constraint) |
| `phone`     | TEXT    | NOT NULL | Contact phone number |
| `company`   | TEXT    | NOT NULL | Company or organization name |
| `source`    | TEXT    | NOT NULL, CHECK constraint | One of 6 sources |
| `status`    | TEXT    | NOT NULL, DEFAULT 'New', CHECK constraint | One of 4 statuses |
| `notes`     | TEXT    | NULLABLE | Optional notes or remarks |
| `created_at`| TEXT    | NOT NULL, DEFAULT (datetime('now')) | ISO creation timestamp |
| `updated_at`| TEXT    | NOT NULL, DEFAULT (datetime('now')) | ISO updated timestamp |

**Allowed Sources:** `Website`, `Referral`, `Social Media`, `Email Campaign`, `Cold Call`, `Other`  
**Allowed Statuses:** `New`, `Contacted`, `Qualified`, `Lost`

---

## API Endpoints

Base URL: `http://localhost:5001/api`

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| `GET`  | `/leads` | List leads (paginated, sorted, filtered) | `search`, `status`, `sortBy`, `sortOrder`, `page`, `limit` |
| `GET`  | `/leads/stats` | Summary statistics and pipeline counts | — |
| `GET`  | `/leads/:id` | Fetch a single lead by ID | — |
| `POST` | `/leads` | Create a new lead | — |
| `PUT`  | `/leads/:id` | Update an existing lead | — |
| `DELETE` | `/leads/:id` | Delete a lead | — |
| `GET`  | `/health` | Server health check endpoint | — |

### Example — Create Lead Request
```http
POST /api/leads
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@acme.com",
  "phone": "+91 98765 43210",
  "company": "Acme Corp",
  "source": "Website",
  "status": "New",
  "notes": "Interested in enterprise CRM deployment"
}
```

### Example — List Leads Response
```json
{
  "data": [
    {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@acme.com",
      "phone": "+91 98765 43210",
      "company": "Acme Corp",
      "source": "Website",
      "status": "New",
      "notes": "Interested in enterprise CRM deployment",
      "created_at": "2026-11-22 01:00:00",
      "updated_at": "2026-11-22 01:00:00"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## Installation & Setup

### Prerequisites
- **Node.js**: **Node.js 22.5.0+** required for native `node:sqlite` (`DatabaseSync`). **Tested on Node.js 24.19.0**.
- **npm**: 9+
- **Git**

### 1. Clone the repository
```bash
git clone https://github.com/bhoomikabhatt05/meru-lead-manager.git
cd meru-lead-manager
```

### 2. Backend setup
```bash
cd server
cp .env.example .env     # Defaults work out of the box
npm install
```

### 3. Frontend setup
```bash
cd ../client
npm install
```

---

## Running the Application

### Start the Backend (Terminal 1)
```bash
cd server
npm run dev       # Development with nodemon auto-reload
# or
npm start         # Production mode

# (Optional) Seed realistic demonstration leads (11 records across all 4 statuses):
npm run seed
```
*Server starts on **http://localhost:5001** (using port 5001 avoids macOS AirPlay port 5000 collisions).*

### Start the Frontend (Terminal 2)
```bash
cd client
npm run dev
```
*Frontend starts on **http://localhost:5173** (Vite proxies all `/api` calls directly to `http://localhost:5001`).*

---

## Environment Configuration

**`server/.env`** (template available in `.env.example`):
```env
PORT=5001                         # Express server port (avoids macOS AirPlay port 5000 conflict)
NODE_ENV=development              # Environment mode
DB_PATH=./data/leads.db           # SQLite database file path
CLIENT_URL=http://localhost:5173  # Allowed CORS origin
```

The database directory and SQLite database file are initialized automatically when the server boots.

---

## Running Tests

```bash
cd server
npm test
```

### Verified Test Results
- **Test Framework**: Jest 29 + Supertest 7
- **Test Suite**: `server/__tests__/leads.test.js`
- **Result**: **18 passed, 18 total (100% passing)**
- **Execution Time**: ~0.35 seconds

**Covered Scenarios:**
1. Health check returns 200 OK.
2. Lead creation with valid fields and default status `New`.
3. Lead creation across all 4 valid assignment statuses: `New`, `Contacted`, `Qualified`, `Lost`.
4. Rejection of missing mandatory fields (Zod validation).
5. Rejection of invalid email formats.
6. Rejection of unsupported or legacy status values.
7. Rejection of duplicate email addresses (unique constraint).
8. List retrieval with pagination metadata.
9. Multi-column search filter (name, email, company).
10. Status filter (`status=Lost`).
11. Single lead retrieval by ID.
12. 404 response on non-existent lead ID.
13. Lead updates (PUT) with validation.
14. 404 response on update to non-existent ID.
15. Lead deletion (DELETE) with SQLite row removal.
16. 404 response on deletion of non-existent ID.
17. Dashboard stats aggregation across all 4 statuses.
18. Pagination offsets and limits.

---

## Production Build Verification

```bash
cd client
npm run build
```
Vite transforms and bundles all 42 modules into `client/dist/` without errors or warnings.

---

## Assumptions & Design Choices

1. **Email Uniqueness**: Each lead is required to have a unique email address to avoid duplicate records.
2. **Four Assignment Statuses**: The application adheres strictly to the four statuses specified in the assignment PDF: `New`, `Contacted`, `Qualified`, and `Lost`.
3. **Database Architecture**: Node.js's built-in `node:sqlite` (`DatabaseSync`) was used instead of third-party native addons like `better-sqlite3`, eliminating compilation issues and external toolchain requirements.
4. **Port 5001 Choice**: macOS Monterey and later reserve port 5000 for the AirPlay Receiver daemon. Setting the default backend port to 5001 ensures out-of-the-box compatibility without requiring users to disable system services.
5. **No Authentication**: The core assignment focuses on clean CRUD, API design, validation, and database reliability. Authentication was omitted in favor of keeping the core architecture solid and maintainable.

---

## What was Challenging or Interesting

The most interesting technical decision was choosing Node.js's built-in `node:sqlite` module over external database packages. On newer Node.js releases (v22.5.0+ and v24), legacy C++ compilation via `node-gyp` often encounters compiler header mismatches with Xcode Clang on macOS. Leveraging `node:sqlite` provided the exact same synchronous prepared-statement performance with zero external native build dependencies. Another rewarding aspect was building a dynamic SQL query builder in the controller that safely combines multi-column search, status filters, sorting, and pagination while strictly parameterizing user inputs to eliminate SQL injection risks.

---

*Assignment submitted by: Bhoomika Bhatt*  
*Role: Full Stack Developer Screening Assignment*  
*Organization: Meru Technosoft Pvt. Ltd.*
