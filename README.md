# CICS DocHub — Setup Guide
## A document management system for the College of Information & Computing Sciences, NEU

---

## 📁 Project Structure

```
cics-docs/
├── index.html                  ← Student login page (Google OAuth)
├── supabase_schema.sql         ← Run this FIRST in Supabase SQL Editor
├── js/
│   └── supabase.js             ← ⚠️ PUT YOUR SUPABASE KEYS HERE
└── pages/
    ├── auth-callback.html      ← OAuth redirect handler
    ├── onboarding.html         ← First-time student program selection
    ├── student-dashboard.html  ← Student document browser
    ├── admin-login.html        ← Admin email/password login
    └── admin-dashboard.html    ← Full admin panel
```

---

## 🚀 Step-by-Step Setup

### 1. Create a Supabase Project
1. Go to https://supabase.com and create a new project
2. Note your **Project URL** and **Anon Key** (Settings → API)

### 2. Configure Google OAuth
1. In Supabase Dashboard → **Authentication** → **Providers** → enable **Google**
2. Create Google OAuth credentials at https://console.cloud.google.com
   - Authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
3. Paste your Google Client ID & Secret into Supabase
4. To restrict to `neu.edu.ph` domain, the `hd` param is already set in `js/supabase.js`

### 3. Run the Database Schema
1. Open Supabase Dashboard → **SQL Editor**
2. Paste the entire contents of `supabase_schema.sql` and run it

### 4. Configure your Keys
Open `js/supabase.js` and replace:
```js
const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON = 'YOUR_ANON_KEY';
```

### 5. Set Redirect URLs
In Supabase Dashboard → **Authentication** → **URL Configuration**:
- **Site URL**: `https://your-domain.com` (or `http://localhost:PORT` for local dev)
- **Redirect URLs**: add `https://your-domain.com/pages/auth-callback.html`

### 6. Create the First Admin
Admin accounts use email/password (not Google OAuth).
1. In Supabase Dashboard → **Authentication** → **Users** → **Invite user**
2. Set the email (e.g., `admin@cics.edu.ph`) and let them set a password
3. In the `profiles` table, set `role = 'admin'` for that user

Alternatively, run this SQL after the user signs up:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@cics.edu.ph';
```

### 7. Deploy
You can host this as a **static website** on:
- **Netlify** (drag & drop the folder)
- **Vercel** (connect GitHub repo)
- **GitHub Pages**
- Any web server (Apache/Nginx)

---

## 👤 User Roles

| Feature | Student | Admin |
|---|---|---|
| Login via Google (@neu.edu.ph only) | ✅ | — |
| Login via Email/Password | — | ✅ |
| View & download documents | ✅ | ✅ |
| Upload documents | ❌ | ✅ |
| Hide/delete documents | ❌ | ✅ |
| Block/unblock students | ❌ | ✅ |
| View login stats & charts | ❌ | ✅ |
| Export download/login reports (CSV) | ❌ | ✅ |

---

## 📊 Admin Dashboard Features
- **Stats** — total students, documents, downloads, logins (today/week/month)
- **Login chart** — 7-day, 30-day, 90-day activity graph
- **Top downloads** — bar chart of most downloaded documents
- **Documents** — table with hide/show toggle and delete
- **Upload** — drag & drop PDF upload with metadata
- **Students** — view all accounts, block/unblock
- **Reports** — export CSV of downloads or logins by: today, this week, this month, or custom date range

---

## 🔒 Security Notes
- Only `@neu.edu.ph` emails are allowed via Google OAuth (enforced both client-side via `hd` param and server-side in `auth-callback.html`)
- Blocked students cannot access documents or download anything
- Storage bucket is **private** — files are accessed via short-lived signed URLs (60 seconds)
- Row Level Security (RLS) is enabled on all tables
- Admin accounts are completely separate from Google OAuth flow
