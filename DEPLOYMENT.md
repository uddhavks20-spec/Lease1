# 🚀 Deployment Guide for Lease

This project is ready to be deployed to **Vercel**. Since this is a monorepo (Frontend + Backend), follow these steps to get it live.

## 1. Prerequisites
- A **GitHub/GitLab/Bitbucket** repository with this code pushed.
- A **Vercel** account.
- A hosted **PostgreSQL** database (e.g., [Neon](https://neon.tech), [Railway](https://railway.app), or [Vercel Postgres](https://vercel.com/storage/postgres)).

---

## 2. Deploying the Backend (Express API)
Vercel will treat the `backend` folder as a Serverless Function.

1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import your repository.
3. For the **Backend** project:
   - **Root Directory**: `backend`
   - **Framework Preset**: `Other`
   - **Environment Variables**:
     - `DATABASE_URL`: Your production PostgreSQL connection string.
     - `JWT_SECRET`: A long random string.
     - `RAZORPAY_KEY_ID`: Your Razorpay Key ID.
     - `RAZORPAY_KEY_SECRET`: Your Razorpay Secret.
     - `FRONTEND_ORIGIN`: The URL of your frontend (you'll get this after the next step).
4. Click **Deploy**.

---

## 3. Deploying the Frontend (Next.js)
1. Go to [Vercel Dashboard](https://vercel.com/new) again.
2. Import the same repository.
3. For the **Frontend** project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend (e.g., `https://lease-api.vercel.app/api`).
     - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Your Razorpay Key ID.
4. Click **Deploy**.

---

## 4. Deploying Lease Co-Pilot (Static HTML)
The `lease_copilot.html` is a standalone file. You can:
1. Move it into the `frontend/public` folder to access it at `your-app.com/lease_copilot.html`.
2. OR deploy it as a separate static site on Vercel by selecting the root folder and setting the build command to `none`.

---

## 🛠 Configurations Added
- **`backend/vercel.json`**: Configured Express to run as a serverless function.
- **`frontend/src/lib/api.ts`**: Updated to use `NEXT_PUBLIC_API_URL` for client-side requests.
- **`.env.example`**: Updated with production-ready keys.

---

**Note:** Ensure your database has the tables created by running the `database/schema.sql` script in your production database's SQL editor.
