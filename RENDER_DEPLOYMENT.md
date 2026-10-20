# UniTrack Deployment & Supabase Setup Guide

This guide explains how to connect **Supabase** for cloud database storage and deploy the website onto **Render**.

---

## Part 1: Setting up Supabase Database

### Step 1: Create a Free Project in Supabase
1. Go to [https://supabase.com](https://supabase.com) and sign in or sign up.
2. Click **New Project**, choose an organization, give it a name (e.g. `unitrack`), set a database password, and click **Create new project**.

### Step 2: Run the SQL Migration Schema
1. In your Supabase Dashboard, click on **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the [`supabase_schema.sql`](./supabase_schema.sql) file located in this repository.
4. Copy all of its contents, paste them into the SQL Editor, and click **Run** (or `Ctrl`+`Enter`).
5. This automatically creates:
   - `students` table (with Koshin, Abijith vasudev, Enoch john, Thirush, Naresh — clean initials, no photos)
   - `classes` table (with sequential sessions and timings: Period 1: 09:00 AM - 10:15 AM, Period 2: 10:30 AM - 11:45 AM, Period 3: 01:00 PM - 02:15 PM, Period 4: 02:30 PM - 03:45 PM)
   - `attendance_records` table (with real-time replication)
   - `notifications` table (staff-to-student warning system)
   - Permissive Row Level Security (RLS) policies for frontend access.

### Step 3: Get Your API Credentials
1. In your Supabase Dashboard, go to **Project Settings** (gear icon) -> **API**.
2. Copy the **Project URL** (e.g., `https://xyzcompany.supabase.co`).
3. Copy the **Project API Keys** -> `anon` / `public` key.
4. Open your local `.env` file and fill them in:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
5. Once set, the website will display **🟢 Supabase Live** in the navbar and sync all QR attendance scans and session changes directly with your cloud database!

---

## Part 2: Hosting the Website on Render

Render provides free, fast static site hosting with global CDN and automated CI/CD.

### Option A: 1-Click Deploy via GitHub & Render Dashboard

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure Supabase and Render static deployment"
   git push origin main
   ```

2. **Create New Static Site on Render**:
   - Go to [https://dashboard.render.com](https://dashboard.render.com).
   - Click **New +** -> **Static Site**.
   - Connect your GitHub repository.

3. **Configure Settings**:
   - **Name**: `unitrack` (or your preferred name)
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

4. **Add Environment Variables (under Advanced)**:
   - `VITE_SUPABASE_URL`: (your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY`: (your Supabase Anon Key)

5. Click **Create Static Site**.
   - Render will automatically build the project and assign you a free HTTPS URL (e.g. `https://unitrack-xxxx.onrender.com`).

---

### Option B: Deploy using Render Blueprint (`render.yaml`)

This repository already includes [`render.yaml`](./render.yaml) and [`public/_redirects`](./public/_redirects).
1. Go to [https://dashboard.render.com/blueprints](https://dashboard.render.com/blueprints).
2. Click **New Blueprint Instance**.
3. Select this repository.
4. Fill in the environment variables when prompted.
5. Click **Apply**!

---

## Features Included in This Build

- ✅ **No Student Photos**: All student profiles and rosters use clean initials badges.
- ✅ **Class Timings on Every Class**:
  - Session 1: `09:00 AM - 10:15 AM`
  - Session 2: `10:30 AM - 11:45 AM`
  - Session 3: `01:00 PM - 02:15 PM`
  - Session 4: `02:30 PM - 03:45 PM`
- ✅ **Supabase Cloud Database & Fallback**: Real-time cloud sync when credentials are provided; zero-lag offline/local cache fallback if offline.
- ✅ **Render-Ready SPA**: Pre-configured with `dist` publish path and `_redirects` for flawless deep linking.
