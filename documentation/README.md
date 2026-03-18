# Dashboard Directory — Documentation

## Overview

The **Dashboard Directory** is a React-powered ServiceNow UI Page that displays a browseable index of Performance Analytics dashboards. It is scoped to the **My Dashboards** application (`x_121762_my_dashbo`) and deployed to the instance at `https://dev336871.service-now.com`.

### Live URL

```
https://dev336871.service-now.com/x_121762_my_dashbo_dashboard_directory.do
```

---

## What the Application Does

- Fetches all **active and certified** dashboards from the `par_dashboard` table
- Looks up category assignments from `analytics_category_m2m` and **groups dashboards by category**
- Dashboards with no category are placed under **"Other"** at the bottom
- Each dashboard title is a **hyperlink** that opens the PA Analytics Workspace in a new tab
- Shows the dashboard **description** and **owner** beneath the title
- Supports a **Card grid view** and a **List view**, toggled by buttons in the header
- Users can **drag-and-drop** cards to reorder them within a category
- The custom sort order is **persisted per user** in `sys_user_preference` — survives browser close and works across devices

---

## Application Scope

| Field | Value |
|-------|-------|
| Application Name | My Dashboards |
| Scope | `x_121762_my_dashbo` |
| Application sys_id | `e0b35e7055384c76ba79634ac818b719` |
| Instance | `https://dev336871.service-now.com` |

---

## Architecture

```
Browser
  └── UI Page: x_121762_my_dashbo_dashboard_directory.do
        └── HTML shell (loads ServiceNow globals + React bundle)
              └── main.jsdbx (compiled React application)
                    ├── App (app.tsx)              — root component, state, layout
                    ├── CategorySection (tsx)      — per-category heading + items, drag logic
                    ├── DashboardCard (tsx)        — individual card in grid view
                    ├── DashboardService (ts)      — REST calls to par_dashboard + analytics_category_m2m
                    └── PreferenceService (ts)     — REST calls to sys_user_preference

REST API calls made at runtime:
  GET  /api/now/table/par_dashboard              → dashboards (active+certified)
  GET  /api/now/table/analytics_category_m2m    → category assignments
  GET  /api/now/table/sys_user_preference        → saved card order for current user
  POST /api/now/table/sys_user_preference        → create order preference (first save)
  PATCH /api/now/table/sys_user_preference/{id} → update order preference (subsequent saves)
```

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [platform-objects.md](./platform-objects.md) | Every ServiceNow record created — table, sys_id, all field values |
| [manual-recreation-guide.md](./manual-recreation-guide.md) | How to recreate this entire application directly in the browser without the SDK, including complete source code |
| [source-code/app.tsx.md](./source-code/app.tsx.md) | Root React component — full annotated source |
| [source-code/main.tsx.md](./source-code/main.tsx.md) | React entry point |
| [source-code/DashboardService.ts.md](./source-code/DashboardService.ts.md) | Data fetching service — annotated source |
| [source-code/PreferenceService.ts.md](./source-code/PreferenceService.ts.md) | User preference persistence — annotated source |
| [source-code/CategorySection.tsx.md](./source-code/CategorySection.tsx.md) | Category section component with drag-and-drop |
| [source-code/DashboardCard.tsx.md](./source-code/DashboardCard.tsx.md) | Dashboard card component |
| [source-code/styles.md](./source-code/styles.md) | All CSS files with annotations |

---

## Technology Stack

| Technology | Version | Role |
|-----------|---------|------|
| React | 19.x | UI framework |
| React DOM | 19.x | DOM rendering |
| TypeScript | 5.5.4 | Type safety |
| @servicenow/sdk | 4.4.0 | Build + deploy toolchain |
| @servicenow/isomorphic-rollup | ^1.2.14 | JavaScript bundler |
| ServiceNow Table REST API | v1 | Data access |
| Native HTML5 Drag-and-Drop API | — | Card reordering (no library) |

---

## Tables Used

| Table | Access | Purpose |
|-------|--------|---------|
| `par_dashboard` | READ | Source of dashboard records |
| `analytics_category_m2m` | READ | Maps dashboards to categories |
| `sys_user_preference` | READ + WRITE | Persists per-user card order |

---

## Build & Deploy Commands

```bash
# Build (TypeScript compile + Rollup bundle)
npx @servicenow/sdk build

# Deploy to ServiceNow instance
npx @servicenow/sdk install
```
