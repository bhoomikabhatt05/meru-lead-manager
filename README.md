# Meru Lead Manager

A full-stack CRM Lead Manager application built as part of the **Meru Technosoft Pvt. Ltd. Full Stack Developer Screening Assignment**.

> Built with React + Vite (frontend), Node.js + Express (backend), and SQLite (database).

---

## Features

### Core (Mandatory)
- ✅ Add leads with name, email, phone, company, source and status
- ✅ Display all leads in a structured, sortable table
- ✅ Edit existing leads via modal form
- ✅ Delete leads with a confirmation dialog
- ✅ Search leads by name, email or company
- ✅ Filter leads by status
- ✅ Input validation on both frontend (immediate feedback) and backend (Zod schemas)
- ✅ Persistent data storage in SQLite

### Bonus
- ✅ Dashboard with total leads, status-wise counts, source breakdown, win rate
- ✅ Sortable columns (click any header to sort ascending/descending)
- ✅ Pagination with configurable page size (10 / 25 / 50)
- ✅ Automated API tests (Jest + Supertest) — 20+ test cases
- ✅ Toast notifications for all CRUD actions
- ✅ Responsive design for desktop and mobile

---

## Technology Stack

| Layer     | Technology                     |
|-----------|-------------------------------|
| Frontend  | React 18, Vite 5               |
| Styling   | Plain CSS (custom design system, no UI library) |
| Backend   | Node.js 18+, Express 4         |
| Database  | SQLite (via better-sqlite3)    |
| Validation| Zod (backend), custom JS (frontend) |
| Testing   | Jest + Supertest               |
| Language  | JavaScript (ES modules on client, CommonJS on server) |

---

## Project Structure

```
meru-lead-manager/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── leadsApi.js   # Fetch wrapper for all API calls
│   │   ├── components/
│   │   │   ├── App.jsx           # Root component, state management
│   │   │   ├── Dashboard.jsx     # Stats + pipeline overview
│   │   │   ├── LeadsTable.jsx    # Sortable data table
│   │   │   ├── LeadForm.jsx      # Create/edit modal form
│   │   │   ├── ConfirmDialog.jsx # Delete confirmation
│   │   │   ├── Pagination.jsx    # Page controls
│   │   │   ├── StatusBadge.jsx   # Coloured status pill
│   │   │   └── Toast.jsx         # Notification toasts
│   │   ├── hooks/
│   │   │   ├── useLeads.js       # Leads state + CRUD logic
│   │   │   └── useToast.js       # Toast notification hook
│   │   ├── styles/
│   │   │   └── globals.css       # Complete design system
│   │   ├── utils.js              # Shared constants + validation
│   │   └── main.jsx              # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                   # Node.js + Express backend
│   ├── src/
│   │   ├── index.js              # Server entry point
│   │   ├── app.js                # Express app setup
│   │   ├── database.js           # SQLite connection + schema
│   │   ├── routes/
│   │   │   └── leads.js          # Route definitions
│   │   ├── controllers/
│   │   │   └── leadsController.js # Request handlers
│   │   ├── middleware/
│   │   │   ├── validate.js       # Zod validation middleware
│   │   │   └── errorHandler.js   # Global error handler
│   │   └── validators/
│   │       └── leadValidator.js  # Zod schemas
│   ├── __tests__/
│   │   └── leads.test.js         # Jest + Supertest API tests
│   ├── data/                     # SQLite database (gitignored)
│   ├── .env                      # Environment config (gitignored)
│   ├── .env.example              # Safe template
│   └── package.json
│
├── .gitignore
├── .env.example
└── README.md
```

---

## Database Design

**Table: `leads`**

| Column      | Type    | Constraints                                            |
|-------------|---------|--------------------------------------------------------|
| id          | INTEGER | PRIMARY KEY AUTOINCREMENT                              |
| name        | TEXT    | NOT NULL                                               |
| email       | TEXT    | NOT NULL, UNIQUE                                       |
| phone       | TEXT    | NOT NULL                                               |
| company     | TEXT    | NOT NULL                                               |
| source      | TEXT    | NOT NULL, CHECK (one of 6 valid values)                |
| status      | TEXT    | NOT NULL, DEFAULT 'New', CHECK (one of 7 valid values) |
| notes       | TEXT    | NULLABLE                                               |
| created_at  | TEXT    | DEFAULT datetime('now')                                |
| updated_at  | TEXT    | DEFAULT datetime('now'), updated on every PUT          |

**Valid Sources:** `Website`, `Referral`, `Social Media`, `Email Campaign`, `Cold Call`, `Other`

**Valid Statuses:** `New`, `Contacted`, `Qualified`, `Proposal`, `Negotiation`, `Closed Won`, `Closed Lost`

---

## API Endpoints

Base URL: `http://localhost:5000/api`

| Method | Endpoint           | Description                             | Query Params |
|--------|--------------------|-----------------------------------------|--------------|
| GET    | /leads             | List leads (paginated, sorted, filtered)| `search`, `status`, `sortBy`, `sortOrder`, `page`, `limit` |
| GET    | /leads/stats       | Dashboard statistics                    | — |
| GET    | /leads/:id         | Get single lead                         | — |
| POST   | /leads             | Create a lead                           | — |
| PUT    | /leads/:id         | Update a lead                           | — |
| DELETE | /leads/:id         | Delete a lead                           | — |
| GET    | /health            | Server health check                     | — |

**Example — Create Lead:**
```json
POST /api/leads
{
  "name": "Jane Smith",
  "email": "jane@acme.com",
  "phone": "+91-9876543210",
  "company": "Acme Corp",
  "source": "Website",
  "status": "New",
  "notes": "Interested in enterprise plan"
}
```

**Example — List Response:**
```json
{
  "data": [ { "id": 1, "name": "Jane Smith", ... } ],
  "pagination": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/bhoomikabhatt05/meru-lead-manager.git
cd meru-lead-manager
```

### 2. Backend setup

```bash
cd server
cp .env.example .env     # Edit .env if needed (defaults work out of the box)
npm install
```

### 3. Frontend setup

```bash
cd ../client
npm install
```

---

## Running the Application

### Start the backend

```bash
cd server
npm run dev       # Development (nodemon, auto-restart)
# or
npm start         # Production
```

Server starts on **http://localhost:5000**

### Start the frontend (in a separate terminal)

```bash
cd client
npm run dev
```

Frontend starts on **http://localhost:5173**

The Vite dev server proxies all `/api` requests to the Express server, so no CORS configuration is needed during development.

---

## Environment Configuration

**`server/.env`** (copy from `.env.example`):

```env
PORT=5000               # Express server port
NODE_ENV=development    # 'development' | 'production'
DB_PATH=./data/leads.db # Path to SQLite database file
CLIENT_URL=http://localhost:5173  # Frontend origin for CORS
```

The database file is created automatically on first run.

---

## Running Tests

```bash
cd server
npm test
```

Tests use an isolated test database (auto-cleaned before each test, deleted after).

**Test coverage:**
- Health check endpoint
- Create lead (success, missing fields, invalid email, invalid status, duplicate email)
- Read leads (list, search, filter by status, single by ID, 404)
- Update lead (success, 404)
- Delete lead (success, 404, verify deletion)
- Dashboard stats endpoint
- Pagination

---

## Assumptions

1. **Email is unique** — each lead must have a unique email address.
2. **No authentication** — this is a single-user internal tool, so auth was not included.
3. **SQLite** — chosen for simplicity and zero external dependencies. For production scale, replace with PostgreSQL.
4. **No real-time updates** — the table refreshes after each mutation. For multi-user scenarios, WebSocket or polling would be needed.
5. **Phone validation** — allows international formats (7–20 chars, digits, spaces, dashes, parentheses, `+`).

---

## Future Improvements

- User authentication (JWT + sessions)
- Role-based access control (admin vs. sales rep)
- Lead assignment to team members
- Activity log per lead (call notes, follow-ups)
- Email integration to trigger outreach directly
- CSV import / export
- PostgreSQL or MySQL for multi-user production deployments
- End-to-end tests with Playwright

---

## What was Challenging or Interesting

Building a fully self-contained full-stack app in one day required making fast but deliberate decisions — particularly around keeping the architecture simple without sacrificing correctness. The most interesting challenge was designing the query builder in the controller: safely composing dynamic SQL `WHERE` clauses with parameterized inputs to support search, filter, sort, and pagination simultaneously, without an ORM. Using `better-sqlite3`'s synchronous API actually made this cleaner than async alternatives.

---

*Assignment submitted by: Bhoomika Bhatt*
*Assignment: Meru Technosoft Pvt. Ltd. Full Stack Developer Screening*
