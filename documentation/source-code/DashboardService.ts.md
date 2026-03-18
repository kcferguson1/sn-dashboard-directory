# DashboardService.ts

**Path:** `src/client/services/DashboardService.ts`
**Role:** Fetches all active + certified dashboards and their category assignments from the ServiceNow REST API. Joins the two datasets in memory and returns them grouped by category, sorted alphabetically. Dashboards with no category are placed in a group called "Other" at the end.

---

## Interfaces

```typescript
export interface Dashboard {
    sys_id: string       // ServiceNow unique identifier
    name: string         // Dashboard display name (used as the link text)
    description: string  // Long-form description shown below the title
    owner: string        // Display name of the owning user
    url: string          // Full URL to open the dashboard in Analytics Workspace
}

export interface CategoryGroup {
    categoryName: string     // The category heading
    dashboards: Dashboard[]  // Ordered list of dashboards in this category
}
```

---

## REST API Calls

### 1. Fetch dashboards — `par_dashboard`

```
GET /api/now/table/par_dashboard
    ?sysparm_query=active=true^certified=true^ORDERBYname
    &sysparm_display_value=all
    &sysparm_fields=sys_id,name,description,owner
```

- **Filter:** Only active (`active=true`) AND certified (`certified=true`) records
- **Order:** Alphabetical by name
- **`sysparm_display_value=all`:** Returns each field as `{ value: "...", display_value: "..." }` so reference fields (like `owner`) return the human-readable name

### 2. Fetch category M2M — `analytics_category_m2m`

```
GET /api/now/table/analytics_category_m2m
    ?sysparm_query=type=par_dashboard
    &sysparm_display_value=all
    &sysparm_fields=artifact_id,category,analytics_category,category_id
```

- **Filter:** `type=par_dashboard` — only rows that link to PA dashboards
- **`artifact_id`:** sys_id of the dashboard this row belongs to
- **Category field resolution:** The M2M table may use `category`, `analytics_category`, or `category_id` depending on the instance configuration. The code tries all three and uses the first non-empty display value

Both calls are made in **parallel** using `Promise.all` to minimise load time.

---

## Join Logic

```typescript
// Build a Map<dashboardSysId, categoryName[]>
for (const row of rawM2m) {
    const dashId = getValue(row.artifact_id)
    const catName = firstNonEmpty(
        getDisplayValue(row.category),
        getDisplayValue(row.analytics_category),
        getDisplayValue(row.category_id)
    )
    categoryMap.get(dashId).push(catName)  // deduplicated
}

// Group dashboards
for (const dashboard of dashboards) {
    const cats = categoryMap.get(dashboard.sys_id)
    if (!cats || cats.length === 0) {
        uncategorized.push(dashboard)  // → "Other" group
    } else {
        for (const cat of cats) {
            groupMap.get(cat).push(dashboard)
        }
    }
}
```

A dashboard can belong to **multiple categories** (the M2M table allows this). In that case, it appears under each one.

---

## Dashboard URL

```typescript
url: `${window.location.origin}/now/platform-analytics-workspace/dashboards/params/edit/false/sys-id/${sysId}`
```

Opens the PA Analytics Workspace in the browser. The `edit/false` segment means view-only mode. The `sys-id` segment is the dashboard's `sys_id`.

---

## Full Source

```typescript
declare global {
    interface Window {
        g_ck: string
    }
}

export interface Dashboard {
    sys_id: string
    name: string
    description: string
    owner: string
    url: string
}

export interface CategoryGroup {
    categoryName: string
    dashboards: Dashboard[]
}

function getDisplayValue(field: unknown): string {
    if (!field) return ''
    if (typeof field === 'object' && field !== null && 'display_value' in field) {
        return (field as { display_value: string }).display_value || ''
    }
    return String(field)
}

function getValue(field: unknown): string {
    if (!field) return ''
    if (typeof field === 'object' && field !== null && 'value' in field) {
        return (field as { value: string }).value || ''
    }
    return String(field)
}

function firstNonEmpty(...values: string[]): string {
    return values.find(v => v && v.trim() !== '') || ''
}

export class DashboardService {
    private readonly headers: HeadersInit

    constructor() {
        this.headers = {
            Accept: 'application/json',
            'X-UserToken': window.g_ck,
        }
    }

    async getDashboardsGroupedByCategory(): Promise<CategoryGroup[]> {
        const dashboardParams = new URLSearchParams({
            sysparm_query: 'active=true^certified=true^ORDERBYname',
            sysparm_display_value: 'all',
            sysparm_fields: 'sys_id,name,description,owner',
        })

        const m2mParams = new URLSearchParams({
            sysparm_query: 'type=par_dashboard',
            sysparm_display_value: 'all',
            sysparm_fields: 'artifact_id,category,analytics_category,category_id',
        })

        const [dashboardRes, m2mRes] = await Promise.all([
            fetch(`/api/now/table/par_dashboard?${dashboardParams.toString()}`, {
                method: 'GET',
                headers: this.headers,
            }),
            fetch(`/api/now/table/analytics_category_m2m?${m2mParams.toString()}`, {
                method: 'GET',
                headers: this.headers,
            }),
        ])

        if (!dashboardRes.ok) {
            const err = await dashboardRes.json()
            throw new Error(err.error?.message || `Failed to fetch dashboards (HTTP ${dashboardRes.status})`)
        }
        if (!m2mRes.ok) {
            const err = await m2mRes.json()
            throw new Error(err.error?.message || `Failed to fetch categories (HTTP ${m2mRes.status})`)
        }

        const { result: rawDashboards } = await dashboardRes.json()
        const { result: rawM2m } = await m2mRes.json()

        const base = window.location.origin

        const dashboards: Dashboard[] = (rawDashboards || []).map((row: unknown) => {
            const r = row as Record<string, unknown>
            const sysId = getValue(r.sys_id) || getDisplayValue(r.sys_id)
            return {
                sys_id: sysId,
                name: getDisplayValue(r.name) || getValue(r.name),
                description: getDisplayValue(r.description) || getValue(r.description),
                owner: getDisplayValue(r.owner),
                url: `${base}/now/platform-analytics-workspace/dashboards/params/edit/false/sys-id/${sysId}`,
            }
        })

        const categoryMap = new Map<string, string[]>()
        for (const row of rawM2m || []) {
            const r = row as Record<string, unknown>
            const dashId = getValue(r.artifact_id) || getDisplayValue(r.artifact_id)
            if (!dashId) continue
            const catName = firstNonEmpty(
                getDisplayValue(r.category),
                getDisplayValue(r.analytics_category),
                getDisplayValue(r.category_id)
            )
            if (!catName) continue
            if (!categoryMap.has(dashId)) categoryMap.set(dashId, [])
            const existing = categoryMap.get(dashId)!
            if (!existing.includes(catName)) existing.push(catName)
        }

        const groupMap = new Map<string, Dashboard[]>()
        const uncategorized: Dashboard[] = []

        for (const dashboard of dashboards) {
            const cats = categoryMap.get(dashboard.sys_id)
            if (!cats || cats.length === 0) {
                uncategorized.push(dashboard)
            } else {
                for (const cat of cats) {
                    if (!groupMap.has(cat)) groupMap.set(cat, [])
                    groupMap.get(cat)!.push(dashboard)
                }
            }
        }

        const sorted = Array.from(groupMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([categoryName, dbs]) => ({ categoryName, dashboards: dbs }))

        if (uncategorized.length > 0) {
            sorted.push({ categoryName: 'Other', dashboards: uncategorized })
        }

        return sorted
    }
}
```
