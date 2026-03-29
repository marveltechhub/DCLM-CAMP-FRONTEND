# DCLM Easter Retreat — Camp Registration System

Full-stack app: **Express + MongoDB** API and **Next.js (App Router)** UI with JWT roles (super admin / registrar), sequential registration numbers, optional **Cloudinary** photos, success modal, and canvas **ID cards** (PNG download, print, QR code).

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Optional: Cloudinary account for profile images

## Backend

```bash
cd backend
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, CLOUDINARY_* (optional), FRONTEND_URL

npm install
npm run seed       # creates super admin (email/password from .env)
npm run seed:reset # re-hash password if user exists but login fails
npm run dev     # http://localhost:5000
```

## Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api

npm install
npm run dev     # http://localhost:3000
```

If `npm install` fails with `EBUSY` on Windows, close other processes using `frontend/node_modules`, delete `frontend/node_modules` and `package-lock.json`, then run `npm install` again.

## Production deployment

- Set strong `JWT_SECRET` (16+ characters).
- Use HTTPS and set `FRONTEND_URL` to your deployed site origin (CORS).
- Run `npm run build` and `npm start` for Next.js; use `npm start` for the API with a process manager (PM2, systemd, etc.).
