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

        // Build dashboard map
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

        // Build category lookup: dashboardSysId → string[]
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

        // Group dashboards by category
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

        // Sort categories alphabetically
        const sorted = Array.from(groupMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([categoryName, dbs]) => ({ categoryName, dashboards: dbs }))

        // Append "Other" last
        if (uncategorized.length > 0) {
            sorted.push({ categoryName: 'Other', dashboards: uncategorized })
        }

        return sorted
    }
}
