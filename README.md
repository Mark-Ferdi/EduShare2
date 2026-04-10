# EduShare 🎓
**A student-to-student platform for sharing academic resources and advice.**

Mobile-first, production-ready MVP built with HTML/CSS/Vanilla JS + Supabase.

---

## 📁 Project Structure

```
edushare/
├── index.html              # App entry point
├── supabase_setup.sql      # Run this in Supabase SQL Editor
├── README.md
├── css/
│   ├── reset.css           # CSS reset
│   ├── variables.css       # Design tokens (colors, spacing, fonts)
│   ├── layout.css          # App shell, nav, pages
│   ├── components.css      # Buttons, forms, modals, chips, badges
│   ├── marketplace.css     # Item cards, search bar, grid
│   ├── advice.css          # Post cards, upvote button
│   ├── profile.css         # Profile header, stats grid
│   ├── auth.css            # Auth screen
│   └── animations.css      # Keyframes, toasts
└── js/
    ├── config.js           # ⚠️ PUT YOUR SUPABASE KEYS HERE
    ├── app.js              # Bootstrap / init
    ├── auth.js             # Login, signup, logout
    ├── navigation.js       # Page routing
    ├── modals.js           # Modal open/close logic
    ├── marketplace.js      # Items CRUD + image upload
    ├── advice.js           # Posts CRUD + upvotes
    ├── profile.js          # Profile page data
    └── toast.js            # Toast notification system
```

---

## 🚀 Setup Instructions

### Step 1 — Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, give it a name (e.g. `edushare`), set a strong password
3. Wait ~2 minutes for the project to provision

### Step 2 — Run the SQL Setup
1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open `supabase_setup.sql` and paste the entire contents
4. Click **Run** (green button)
5. You should see: `Success. No rows returned`

### Step 3 — Configure Storage
The SQL script creates the storage bucket automatically. If it fails:
1. Go to **Storage** in the sidebar
2. Click **New Bucket**
3. Name it exactly: `item-images`
4. Check **Public bucket** ✅
5. Click **Save**

### Step 4 — Get Your API Keys
1. Go to **Settings → API** in your Supabase dashboard
2. Copy:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **anon / public** key (long JWT string)

### Step 5 — Add Keys to the App
Open `js/config.js` and replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';  // ← paste here
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';              // ← paste here
```

### Step 6 — Run the App
**Option A — Simple (no build step needed):**
```bash
# From the edushare/ folder:
npx serve .
# or
python3 -m http.server 3000
```
Then open `http://localhost:3000`

**Option B — Just open index.html**
> ⚠️ Some browsers block Supabase requests when opened as `file://`. Use a local server (Option A) for best results.

---

## ✅ Features

| Feature | Description |
|---------|-------------|
| 🔐 Auth | Email + password signup/login, persistent session |
| 🛍️ Marketplace | List, browse, search, filter, and view items |
| 🖼️ Image Upload | Upload item photos to Supabase Storage |
| 💬 Advice Feed | Create posts with category tags |
| 👍 Upvotes | 1 upvote per user per post, real-time count |
| 👤 Profile | View your listings and posts with stats |
| 📱 Mobile-first | Bottom nav, FAB, full-screen modals on mobile |
| 💀 Skeleton UI | Loading placeholders while data fetches |
| 🍞 Toast Alerts | Success/error/info notifications |
| 🔒 RLS | Row-level security on all tables |

---

## 🔒 Security Notes

- All tables have **Row Level Security** enabled
- Users can only **edit/delete their own** items and posts
- Image uploads are scoped to the user's own folder (`{user_id}/filename`)
- The `anon` key is safe to expose in frontend code (RLS protects data)
- Never expose your `service_role` key in frontend code

---

## 🎨 Tech Stack

- **Frontend**: HTML5, CSS3 (custom properties, flexbox, grid), Vanilla JS (ES6+)
- **Auth**: Supabase Auth (email + password)
- **Database**: Supabase PostgreSQL with RLS
- **Storage**: Supabase Storage (public bucket)
- **Fonts**: Syne (display) + DM Sans (body) — via Google Fonts
- **Icons**: Inline SVG (no dependencies)

---

## 🛠️ Customization

**Change currency symbol**: Search for `₹` in `marketplace.js` and `modals.js`

**Add more categories**: Edit the `<select>` in `index.html` and the filter chips

**Change color theme**: Edit `css/variables.css` — update `--green-*` variables

**Add real-time updates**: Use `supabase.channel()` subscriptions in `marketplace.js` and `advice.js`

---

## 📸 Screenshots

The app has three main views:
- **Marketplace** — grid of item cards with search + filter
- **Advice Feed** — scrollable posts with upvoting
- **Profile** — stats, your listings, and your posts
