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
3. Double-click **setup.bat**, then edit `backend\.env`. Set `DB_PASSWORD`, a unique `JWT_SECRET`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD`.
4. In a terminal: `cd backend` → `npm run migrate` → `npm run seed`
5. Double-click **start.bat** (opens backend + frontend and the browser at http://localhost:5173).

### Manual start
```
cd backend  && npm install && copy .env.example .env && npm run migrate && npm run seed && npm run dev
cd frontend && npm install && copy .env.example .env && npm run dev
```

## Accounts
- Create the admin account using `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend\.env`, then run `npm run seed` from `backend`. Use the *Admin* tab to sign in.
- Customers and workers sign up from the website.

## Deploy publicly (Vercel + Render + hosted MySQL)
1. Create a **new, empty** hosted MySQL database and import `database/schema.sql` into it. This schema drops existing tables, so never import it into a database with data you need.
2. Deploy `backend` as a Node.js web service on Render (`npm start`). Add the database settings (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), a long random `JWT_SECRET`, your frontend's exact public URL as `CLIENT_URL`, and `ADMIN_NAME`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD` as environment variables. Keep `AUTO_VERIFY_WORKERS=false`.
3. Before opening the site, run `npm run migrate` and `npm run seed` from the backend service's shell or a one-off job. Both commands must complete successfully.
4. Deploy `frontend` as a Vercel project. Set its root directory to `frontend`, build command to `npm run build`, and output directory to `dist`. Set `VITE_API_URL` to the public backend URL (for example, `https://your-api.onrender.com`, with no trailing slash).
5. Set `CLIENT_URL` to the Vercel site's public origin (for example, `https://your-app.vercel.app`), redeploy the backend, then test registration, login, bookings, and uploads.

Do not commit either `.env` file or paste secrets into source code. The backend currently saves uploaded images to its local `uploads` folder; configure persistent storage or an image-storage service on the hosting provider, or uploads may disappear when the service restarts or redeploys. The payment flow is still a demo and should not be used to collect real payments.

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
