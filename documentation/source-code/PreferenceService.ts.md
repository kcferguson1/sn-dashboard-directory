# PreferenceService.ts

**Path:** `src/client/services/PreferenceService.ts`
**Role:** Reads and writes the user's custom dashboard sort order to `sys_user_preference`. The preference persists server-side, so the order survives browser close and works across devices.

---

## Preference Record

| Field | Value |
|-------|-------|
| Table | `sys_user_preference` |
| `name` | `x_121762_my_dashbo.dashboard_order` |
| `value` | JSON string: `{ "Category Name": ["sys_id_1", "sys_id_2"], ... }` |
| `user` | Set automatically by ServiceNow to the current session user |

---

## REST API Calls

### Load — `GET sys_user_preference`

```
GET /api/now/table/sys_user_preference
    ?sysparm_query=name=x_121762_my_dashbo.dashboard_order^user.user_name=javascript:gs.getUserName()
    &sysparm_fields=sys_id,value
    &sysparm_limit=1
```

- Uses `javascript:gs.getUserName()` as a server-side encoded value in the query — ServiceNow evaluates it server-side to the logged-in user's username, scoping the lookup to only that user's record
- Returns the `sys_id` and `value` of the preference record if it exists
- The `sys_id` is **cached** in `this.cachedSysId` so subsequent saves use `PATCH` instead of `POST`

### Save (create) — `POST sys_user_preference`

```
POST /api/now/table/sys_user_preference
Body: { "name": "x_121762_my_dashbo.dashboard_order", "value": "{...}" }
```

Called only on the first save (when no preference record exists yet). ServiceNow automatically assigns the record to the current user.

### Save (update) — `PATCH sys_user_preference/{sys_id}`

```
PATCH /api/now/table/sys_user_preference/{cachedSysId}
Body: { "value": "{...}" }
```

Called on all subsequent saves. Uses the cached `sys_id` to avoid an extra lookup.

---

## Debouncing

`PreferenceService.save()` is not debounced internally — debouncing (800 ms) is applied in `CategorySection.tsx` via a `useRef`-held timer. This means rapid drag actions won't flood the API; the save fires 800 ms after the last drop.

---

## Full Source

```typescript
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
```
