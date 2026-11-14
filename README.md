# Smart Worker Hiring & Service Booking

A web platform connecting customers with skilled local workers for verified home-service bookings.
**Stack:** React.js (Vite) · Node.js + Express.js REST API · MySQL · JWT authentication · Leaflet / OpenStreetMap

## Features
| Role | Features |
|---|---|
| **Customer** | Register/login, browse services, search & filter workers, nearby workers by distance, view profiles & reviews, book with phone + address + **map pin**, pay Rs. 100, track/cancel bookings, rate workers, report problems |
| **Worker** | Register/login, profile with photo, skills, experience, availability & service location, booking alerts, **accept/reject within 10 minutes**, customer details unlock after payment, update job status |
| **Admin** | Login, verify workers, block/unblock users, manage service categories, monitor bookings, handle complaints, moderate reviews, reports |

## Quick start (Windows)
1. Install **Node.js (LTS)** and **MySQL 8**.
2. Create the database (once). In MySQL Workbench / phpMyAdmin run everything in `database/schema.sql`.
3. Double-click **setup.bat**, then edit `backend\.env` and set `DB_PASSWORD` (your MySQL password).
4. In a terminal: `cd backend` → `npm run migrate` → `npm run seed`
5. Double-click **start.bat** (opens backend + frontend and the browser at http://localhost:5173).

### Manual start
```
cd backend  && npm install && copy .env.example .env && npm run migrate && npm run seed && npm run dev
cd frontend && npm install && copy .env.example .env && npm run dev
```

## Accounts
- **Admin:** `aloxrai@123gmail.com` / `123456alox` (use the *Admin* tab on the login page; created by `npm run seed`)
- Customers and workers sign up from the website.

## Try the whole flow
1. Sign up as a **worker** → complete profile (photo + map location) → popup confirms.
2. Log in as **admin** → *Workers* → **Verify worker** (only verified workers appear to customers).
   For quick testing you may set `AUTO_VERIFY_WORKERS=true` in `backend/.env`.
3. Sign up as a **customer** → pick a service → open the worker → pin your location → send request.
4. Worker accepts within 10 minutes → customer pays Rs. 100 → worker sees phone, address and map pin.
5. Worker starts and completes the job → customer rates.

## Project structure
```
setup.bat / start.bat         one-click install and run (Windows)
database/schema.sql           tables: users, categories, worker_profiles, bookings, payments, reviews, complaints
backend/src/routes/           auth, workers, profile, bookings, categories, admin
backend/src/utils/            seed (admin), migrate (map columns), expiry (10-minute rule)
frontend/src/pages/           Home, Hire, Work, Login, Register, Workers, WorkerDetail, MyBookings,
                              WorkerDashboard, WorkerProfile, WorkerMyProfile, CustomerProfile, Admin
```

## Notes
- Payment is a **demo** endpoint. For production integrate eSewa / Khalti.
- Change the admin password and `JWT_SECRET` before deploying.
- Troubleshooting: if the website says it cannot reach the server, check the backend terminal for
  `✅ Database connected`; `❌ DATABASE ERROR` means `DB_PASSWORD` in `backend/.env` is wrong.
