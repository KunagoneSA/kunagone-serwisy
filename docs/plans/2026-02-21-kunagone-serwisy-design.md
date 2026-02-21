# Kunagone-Serwisy - Design Document

## Goal

Replace the Google Sheets-based fleet/asset maintenance tracker with a database-backed web application. The app tracks vehicles, equipment, and infrastructure maintenance for Kunagone S.A. - including service history, insurance policies, technical inspections, gas tank homologations, and periodic maintenance schedules.

## Users & Auth

- 2-3 users initially, expected to grow
- Google OAuth login (corporate Google accounts) via Supabase Auth
- Roles: admin (manage assets, users) and user (add/view service entries)
- Audit trail: every change logs who, when, what was modified

## Tech Stack

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS 4
- **Backend/DB:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions + Row Level Security)
- **Hosting:** Netlify (frontend static files)
- **Notifications:** Supabase Edge Functions (cron), Resend or Supabase built-in email, Web Push API
- **Calendar:** Google Calendar URL generation (no API key needed)
- **Mobile:** PWA (Progressive Web App) - installable, offline-capable, push notifications

## Data Model

### `assets`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| name | text | e.g. "Dacia Logan" |
| identifier | text | Registration/serial, e.g. "KOS 71687" |
| type | enum | 'vehicle', 'equipment', 'infrastructure' |
| notes | text | Permanent notes (e.g. "nie zamawiać filtra kabinowego") |
| metadata | jsonb | Flexible fields: oil type, filter part numbers, etc. |
| created_at | timestamptz | |
| created_by | uuid FK users | |

### `service_entries`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| asset_id | uuid FK assets | |
| date | date | When service was performed |
| description | text | What was done |
| status | enum | 'done', 'pending', 'waiting', 'external', 'postponed' |
| mileage | integer | Odometer reading (nullable, for vehicles) |
| notes | text | Additional notes (parts used, costs, etc.) |
| priority | integer | 1-5 (nullable) |
| created_at | timestamptz | |
| created_by | uuid FK users | |
| updated_at | timestamptz | |
| updated_by | uuid FK users | |

### `deadlines`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| asset_id | uuid FK assets | |
| type | enum | 'insurance', 'inspection', 'homologation', 'service', 'other' |
| title | text | e.g. "Koniec Polisy", "PRZEGLĄD" |
| due_date | date | |
| is_recurring | boolean | |
| recurrence_rule | text | e.g. "every 3 months", "every 10000 km" |
| notify_days_before | integer[] | e.g. [30, 14, 7, 1] |
| completed | boolean | |
| completed_at | timestamptz | |
| completed_by | uuid FK users | |
| created_at | timestamptz | |
| created_by | uuid FK users | |

### `audit_log`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| table_name | text | Which table was modified |
| record_id | uuid | Which record |
| action | enum | 'insert', 'update', 'delete' |
| old_data | jsonb | Previous values (for updates) |
| new_data | jsonb | New values |
| user_id | uuid FK users | Who made the change |
| created_at | timestamptz | |

### `push_subscriptions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| user_id | uuid FK users | |
| subscription | jsonb | Web Push subscription object |
| created_at | timestamptz | |

### `notification_settings`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| user_id | uuid FK users | |
| email_enabled | boolean | |
| push_enabled | boolean | |
| notify_days | integer[] | Default [30, 14, 7, 1] |

## Views / Pages

### 1. Dashboard (home)
- Summary cards: total assets, upcoming deadlines count, overdue count
- Alert list sorted by urgency:
  - Red: overdue or due within 7 days
  - Yellow: due within 30 days
  - Green: due within 90 days
- Quick-add button for new service entry
- Recent activity feed (from audit log)

### 2. Assets List
- Filterable/searchable table
- Filter by type (vehicles / equipment / infrastructure)
- Shows: name, identifier, next upcoming deadline, last service date
- Click to open asset detail

### 3. Asset Detail
- Header: name, identifier, type, permanent notes
- Metadata section: oil type, filter part numbers (from metadata jsonb)
- Upcoming deadlines with:
  - Status indicators (color-coded by urgency)
  - "Add to Google Calendar" button per deadline
  - "Mark as done" button
- Service history timeline (chronological, newest first)
  - Date, description, mileage, status, who added it
- "Add service entry" button
- "Add deadline" button

### 4. Add/Edit Service Entry (modal or page)
- Asset selector (dropdown)
- Date picker
- Description (text)
- Status selector
- Mileage (optional number input)
- Notes (optional text)
- Priority (1-5, optional)

### 5. Add/Edit Deadline (modal or page)
- Asset selector
- Type selector (insurance, inspection, homologation, service, other)
- Title
- Due date
- Recurring toggle + recurrence rule
- Notification days before

### 6. Audit Log / History
- Filterable by asset, user, date range
- Shows: timestamp, user, action, what changed (diff view)

### 7. Settings
- User profile
- Notification preferences (email on/off, push on/off, notification timing)
- Admin: manage users, invite new users

## Notifications System

### Email (Supabase Edge Function + Cron)
- Daily cron job at 8:00 AM
- Scans deadlines table for upcoming due dates
- Matches against each user's `notify_days` preferences
- Sends email via Resend (free tier: 100 emails/day, more than enough)
- Email contains: asset name, deadline type, due date, days remaining, link to app

### Push Notifications (PWA)
- Service Worker registers Web Push subscription
- Stored in `push_subscriptions` table
- Same cron job sends push notifications alongside emails
- User can enable/disable in settings

### Google Calendar
- No API integration needed (keeps it simple)
- Generate Google Calendar event URL with pre-filled data:
  - `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...`
- User clicks "Add to Calendar" -> opens Google Calendar with event pre-filled
- Future enhancement: full Google Calendar API sync

### In-App Alerts
- Dashboard shows all upcoming/overdue deadlines
- Badge count in navbar
- Color-coded urgency

## Data Migration

One-time script to import existing Google Sheets data:
1. Export CSV from Google Sheets
2. Parse and map to database schema:
   - Extract unique assets from "Nazwa" column
   - Categorize entries as service_entries (status T/done) or deadlines (status P/pending)
   - Map fields: date, description, status, mileage, notes
3. Insert into Supabase via API
4. Verify data integrity

## Security

- Supabase Row Level Security (RLS) on all tables
- Users can only read/write their organization's data
- Admin role can manage users and all data
- Audit log is append-only (no delete/update via RLS)

## PWA / Mobile

- `manifest.json` with app name, icons, theme colors
- Service Worker for:
  - Caching static assets (offline shell)
  - Push notification handling
- Installable on Android/iOS home screen
- Responsive design: mobile-first with Tailwind breakpoints
- Future: React Native app if needed (shared business logic)

## Language

- Polish only (internal company tool)
- UI labels in Polish
