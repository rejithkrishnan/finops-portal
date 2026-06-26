# Finacle Calendar — Activity Planner

A calendar module for scheduling and visualising recurring operational activities (DR runs, month-end, quarter-end, deployments, etc.) across the Finacle ecosystem, similar to MS Outlook's event calendar.

---

## Decisions Confirmed

| Decision | Answer |
|---|---|
| Activity scope | Both specific env(s) AND ecosystem-wide; environments picked from those configured in the Environments app |
| Recurring events | YES — support `NONE / MONTHLY / QUARTERLY / YEARLY` repeat patterns with an optional repeat-end-date |
| Category management | Configurable by ADMINs in a **Calendar Settings** section of the Settings page |
| Who can create | ADMIN + OPERATOR; VIEWERs read-only |
| Notifications | Toast alerts for today/tomorrow activities + notification bell icon dropdown in Navbar |
| All-day vs timed | Both supported (all-day toggle on form) |

---

## Proposed Changes

### Database — Prisma Schema

#### [MODIFY] [schema.prisma](file:///d:/Coding/finops-portal/backend/prisma/schema.prisma)

Add three new models at the bottom of the existing schema:

```prisma
// ─── Calendar Module ──────────────────────────────────────────────

model ActivityCategory {
  id          Int        @id @default(autoincrement())
  name        String     @unique          // "DR Activity", "Month End", etc.
  color       String                      // hex colour for calendar display
  icon        String?                     // optional lucide icon name
  createdAt   DateTime   @default(now())  @map("created_at")
  activities  Activity[]

  @@map("activity_categories")
}

model Activity {
  id            Int                @id @default(autoincrement())
  title         String
  description   String?
  categoryId    Int                @map("category_id")
  startDate     DateTime           @map("start_date")      // inclusive
  endDate       DateTime           @map("end_date")        // inclusive
  allDay        Boolean            @default(true) @map("all_day")
  isEcosystem   Boolean            @default(false) @map("is_ecosystem")  // true = applies to ALL envs
  createdById   Int                @map("created_by_id")
  createdAt     DateTime           @default(now())  @map("created_at")
  updatedAt     DateTime           @updatedAt       @map("updated_at")

  category      ActivityCategory   @relation(fields: [categoryId], references: [id])
  createdBy     User               @relation(fields: [createdById], references: [id])
  environments  ActivityEnvironment[]

  @@map("activities")
}

model ActivityEnvironment {
  activityId    Int         @map("activity_id")
  environmentId Int         @map("environment_id")
  activity      Activity    @relation(fields: [activityId], references: [id], onDelete: Cascade)
  environment   Environment @relation(fields: [environmentId], references: [id], onDelete: Cascade)

  @@id([activityId, environmentId])
  @@map("activity_environments")
}
```

**Relations to update on existing models:**
- `User` → add `activities Activity[]`
- `Environment` → add `activityEnvironments ActivityEnvironment[]`

---

### Backend — Calendar Plugin

Following the exact same plugin pattern as `environments/`:

#### [NEW] [index.ts](file:///d:/Coding/finops-portal/backend/src/plugins/calendar/index.ts)

Plugin registration barrel — exports `calendarPlugin` with `name: 'calendar'` and `prefix: '/api'`.

#### [NEW] [service.ts](file:///d:/Coding/finops-portal/backend/src/plugins/calendar/service.ts)

Prisma-backed service layer with functions:

| Function | Description |
|---|---|
| `getActivities(month, year, envId?)` | Fetch all activities within a month. Optional filter by environment ID. Returns activities with their category and linked environments. |
| `getActivity(id)` | Single activity detail with category, environments, and creator. |
| `createActivity(data, userId)` | Create an activity. If `isEcosystem=false`, requires at least one `environmentIds[]` entry. |
| `updateActivity(id, data)` | Update title, dates, category, environment links. |
| `deleteActivity(id)` | Hard-delete an activity. |
| `getCategories()` | List all activity categories. |
| `createCategory(data)` | Admin-only: add a new category. |
| `getMonthSummary(month, year)` | Returns per-day activity counts for the month grid. |

#### [NEW] [routes.ts](file:///d:/Coding/finops-portal/backend/src/plugins/calendar/routes.ts)

Express Router with Zod validation:

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/calendar/activities` | All | Query: `month`, `year`, `envId?` |
| `GET` | `/calendar/activities/:id` | All | Single activity detail |
| `POST` | `/calendar/activities` | ADMIN/OPERATOR | Create activity |
| `PUT` | `/calendar/activities/:id` | ADMIN/OPERATOR | Update activity |
| `DELETE` | `/calendar/activities/:id` | ADMIN/OPERATOR | Delete activity |
| `GET` | `/calendar/categories` | All | List categories |
| `POST` | `/calendar/categories` | ADMIN | Add category |
| `GET` | `/calendar/summary` | All | Month summary (day counts) |

#### [MODIFY] [server.ts](file:///d:/Coding/finops-portal/backend/src/server.ts)

Register the new calendar routes:
```diff
+import calendarRoutes from './plugins/calendar/routes';
 app.use('/api', environmentsRoutes);
+app.use('/api', calendarRoutes);
```

---

### Frontend — Calendar Page

#### [NEW] [calendarService.ts](file:///d:/Coding/finops-portal/frontend/src/services/calendarService.ts)

API service layer (same pattern as `envService.ts`):
- `getActivities(month, year, envId?)` → `Activity[]`
- `getActivity(id)` → `Activity`
- `createActivity(data)` → `Activity`
- `updateActivity(id, data)` → `Activity`
- `deleteActivity(id)` → void
- `getCategories()` → `ActivityCategory[]`
- `createCategory(data)` → `ActivityCategory`
- `getMonthSummary(month, year)` → `DaySummary[]`

#### [NEW] [calendar.ts](file:///d:/Coding/finops-portal/frontend/src/types/calendar.ts)

TypeScript interfaces:
```typescript
export interface ActivityCategory {
  id: number;
  name: string;
  color: string;
  icon?: string;
}

export interface ActivityEnvironmentLink {
  environmentId: number;
  environment: { id: number; name: string; shortCode: string };
}

export interface Activity {
  id: number;
  title: string;
  description?: string;
  categoryId: number;
  category: ActivityCategory;
  startDate: string;   // ISO datetime
  endDate: string;
  allDay: boolean;
  isEcosystem: boolean;
  environments: ActivityEnvironmentLink[];
  createdBy: { id: number; displayName: string };
  createdAt: string;
  updatedAt: string;
}

export interface DaySummary {
  date: string;       // YYYY-MM-DD
  count: number;
  categories: { name: string; color: string; count: number }[];
}
```

#### [NEW] [CalendarPage.tsx](file:///d:/Coding/finops-portal/frontend/src/pages/CalendarPage.tsx)

The main calendar view — **the largest piece of work**. Layout:

```
┌──────────────────────────────────────────────────────────┐
│  Header: "Finacle Calendar" | Month/Year selector | ◀ ▶ │
│  Filter: [All Envs ▼] [All Categories ▼]    [+ Activity] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Mon   Tue   Wed   Thu   Fri   Sat   Sun               │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐           │
│  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │           │
│  │     │ ██  │ ██  │ ██  │     │     │     │           │
│  │     │DR   │DR   │DR   │     │     │     │           │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤           │
│  │  8  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │           │
│  │     │     │     │     │     │     │     │           │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤           │
│  │ ... │     │     │     │     │     │     │           │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘           │
│                                                          │
│  ┌── Upcoming Activities ──────────────────────┐         │
│  │ 🔴 DR Run (PROD DC)           Jun 25–27     │         │
│  │ 🟠 Month End Activities        Jun 28–30     │         │
│  │ 🔵 Q1 Close-out               Jun 28–Jul 2  │         │
│  └──────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────┘
```

**Key components inside CalendarPage:**

| Component | Purpose |
|---|---|
| `MonthGrid` | 7×6 calendar grid. Each cell shows date number + colour-coded activity bars spanning across days (multi-day events rendered as horizontal bars). Clicking a day opens a day detail panel. |
| `ActivityBar` | A small coloured strip inside the grid cell showing the activity title. Multi-day activities span across cells using CSS grid or absolute positioning. |
| `DayDetailPanel` | Slide-in panel (right side or modal) showing all activities for a clicked day. Each activity shows title, category badge, time range, environment tags. |
| `ActivityForm` | Modal form to create/edit an activity. Fields: Title, Description, Category (dropdown), Start Date, End Date, All Day toggle, Scope (Ecosystem checkbox or multi-select environments). |
| `UpcomingList` | Below the calendar grid — a compact list of the next 5–10 upcoming activities with countdown badges. |
| `CategoryLegend` | Colour legend showing all category colours with names. |

**Responsiveness:**
- Desktop: Full month grid with multi-day event bars
- Tablet: Same grid, tighter cells
- Mobile (`< sm`): Switch to a vertical list/agenda view (list of days with activities)

**Animations (Framer Motion):**
- Month transitions: slide left/right when navigating
- Activity bars: fade in on mount
- Day detail panel: slide in from right
- Individual components: stagger fade-in on page load

#### [MODIFY] [Sidebar.tsx](file:///d:/Coding/finops-portal/frontend/src/components/common/Sidebar.tsx)

Add calendar nav item (replace one of the disabled "Soon" items):
```diff
 const navItems = [
   { path: '/', icon: LayoutDashboard, label: 'Dashboard', disabled: false },
   { path: '/environments', icon: Server, label: 'Environments', disabled: false },
+  { path: '/calendar', icon: Calendar, label: 'Calendar', disabled: false },
   { path: '/eod', icon: PlayCircle, label: 'EOD Execution', disabled: true },
   ...
 ];
```

#### [MODIFY] [App.tsx](file:///d:/Coding/finops-portal/frontend/src/App.tsx)

Add route:
```diff
+import CalendarPage from './pages/CalendarPage';
 <Route path="environments" element={<EnvironmentsPage />} />
+<Route path="calendar" element={<CalendarPage />} />
 <Route path="settings" element={<SettingsPage />} />
```

---

### Seed Data

#### [MODIFY] [seed.ts](file:///d:/Coding/finops-portal/backend/prisma/seed.ts)

Add default activity categories and a few sample activities:

**Categories:**
| Name | Colour | Icon |
|---|---|---|
| DR Activity | `#97144d` | `ShieldAlert` |
| Month End | `#d97706` | `CalendarClock` |
| Quarter End | `#2563eb` | `CalendarRange` |
| Deployment | `#059669` | `Rocket` |
| Maintenance | `#7c3aed` | `Wrench` |
| Other | `#6b7280` | `CalendarDays` |

**Sample Activities (for current month):**
- "Quarterly DR Drill — All Environments" (ecosystem-wide, 3-day span)
- "Month End Reconciliation" (tagged to PROD environments)
- "UAT Deployment — API Gateway" (tagged to UAT environment)

---

## Design & Branding

Following the established Axis Bank branding guidelines from [AGENTS.md](file:///d:/Coding/finops-portal/.agents/AGENTS.md):

- **Calendar grid cells**: `glass-card` with `#ffffff` background in light mode
- **Today highlight**: Burgundy-tinted border ring (`rgba(151, 20, 77, 0.3)`)
- **Activity bars**: Use category colour with 20% opacity background + solid left border
- **Count pills**: Use `.surface-pill` class (burgundy-tinted, not grey)
- **Header/filters**: `flex-col sm:flex-row` responsive wrapping
- **Grid responsive**: Full month grid on `md+`, agenda list view on mobile
- **All form grids**: `grid-cols-1 sm:grid-cols-2`
- **Environment multi-select**: Checkbox list grouped by application name

---

## File Summary

| Layer | File | Action |
|---|---|---|
| DB | `schema.prisma` | MODIFY — add 3 models + 2 relation fields |
| DB | `seed.ts` | MODIFY — add categories + sample activities |
| Backend | `plugins/calendar/index.ts` | NEW |
| Backend | `plugins/calendar/service.ts` | NEW |
| Backend | `plugins/calendar/routes.ts` | NEW |
| Backend | `server.ts` | MODIFY — register calendar routes |
| Frontend | `types/calendar.ts` | NEW |
| Frontend | `services/calendarService.ts` | NEW |
| Frontend | `pages/CalendarPage.tsx` | NEW — main calendar UI |
| Frontend | `components/common/Sidebar.tsx` | MODIFY — add Calendar nav item |
| Frontend | `App.tsx` | MODIFY — add `/calendar` route |

---

## Verification Plan

### Automated Tests
```bash
# 1. Prisma migration
cd backend && npx prisma migrate dev --name add_calendar_module

# 2. Seed data
npx prisma db seed

# 3. TypeScript compilation
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# 4. ESLint
npx eslint frontend/src/pages/CalendarPage.tsx
npx eslint backend/src/plugins/calendar/routes.ts
npx eslint backend/src/plugins/calendar/service.ts
```

### Manual Verification
- Navigate to `/calendar` in the browser
- Verify month grid renders with correct day layout
- Create an activity via the form modal
- Verify multi-day activities display as coloured bars across cells
- Click a day cell → verify day detail panel shows activities
- Filter by environment → verify only tagged activities appear
- Test responsive: resize browser to mobile → verify agenda view
- Toggle light/dark mode → verify branding is correct
- Verify upcoming activities list below the grid
