const PREF_KEY = 'x_121762_my_dashbo.dashboard_order'

export type OrderMap = Record<string, string[]>

interface PrefRecord {
    sys_id: string
    value: string
}

function getHeaders(): HeadersInit {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-UserToken': window.g_ck,
    }
}

export class PreferenceService {
    private cachedSysId: string | null = null

    async load(): Promise<OrderMap> {
        try {
            const params = new URLSearchParams({
                sysparm_query: `name=${PREF_KEY}^user.user_name=javascript:gs.getUserName()`,
                sysparm_fields: 'sys_id,value',
                sysparm_limit: '1',
            })

            const res = await fetch(`/api/now/table/sys_user_preference?${params.toString()}`, {
                method: 'GET',
                headers: getHeaders(),
            })

            if (!res.ok) return {}

            const { result } = await res.json()
            if (!result || result.length === 0) return {}

            const rec = result[0] as PrefRecord
            this.cachedSysId = rec.sys_id

            try {
                return JSON.parse(rec.value) as OrderMap
            } catch {
                return {}
            }
        } catch {
            return {}
        }
    }

    async save(orderMap: OrderMap): Promise<void> {
        const value = JSON.stringify(orderMap)

        if (this.cachedSysId) {
            await fetch(`/api/now/table/sys_user_preference/${this.cachedSysId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ value }),
            })
        } else {
            const res = await fetch('/api/now/table/sys_user_preference', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ name: PREF_KEY, value }),
            })

            if (res.ok) {
                const { result } = await res.json()
                if (result?.sys_id) this.cachedSysId = result.sys_id
            }
        }
    }
}
