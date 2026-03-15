# CICS DocHub

A centralized document management system for the **College of Information & Computing Sciences (CICS)** at New Era University. Users log in using their NEU Google account to browse and download official CICS documents such as curriculum guides, academic forms, policies, and announcements.

---

## How It Works

### Student
1. Visit the site and click **Continue with Google**
2. Sign in using your `@neu.edu.ph` Google account
3. On first login, enter your full name and undergraduate program
4. Browse, search, and download official CICS documents

### Admin
1. Visit the site and click **Continue with Google**
2. Sign in using your `@neu.edu.ph` Google account
3. Admin access is granted by setting the account role to `admin` in the database
4. Admins are automatically redirected to the Admin Dashboard after login

---

## Features

- 🔒 Google OAuth login restricted to `@neu.edu.ph` accounts
- 📄 Browse and download CICS documents (PDF)
- 📊 Admin dashboard with login and download statistics
- 🎓 Student account management (block/unblock)
- 📥 Export login and download reports as CSV
- ⏱️ Auto logout after 5 minutes of inactivity
- 📱 Responsive — works on mobile and desktop

---

## Tech Stack

- **Frontend** — HTML, CSS, JavaScript, Tailwind CSS
- **Database** — Supabase (PostgreSQL)
- **Auth** — Google OAuth 2.0
- **Storage** — Supabase Storage
- **Hosting** — Vercel

---

## Live Site

🌐 [cicsdocs.vercel.app](https://cicsdocs.vercel.app)
