# CategorySection.tsx

**Path:** `src/client/components/CategorySection.tsx`
**Role:** Renders one category group — a heading with a dashboard count badge, followed by either a card grid or a list of rows. Owns all drag-and-drop state for its own items and debounces saves to `sys_user_preference`.

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `categoryName` | `string` | ✅ | Displayed as the section heading |
| `dashboards` | `Dashboard[]` | ✅ | Dashboards from the server (in server order) |
| `viewMode` | `'grid' \| 'list'` | ✅ | Switches between card grid and list rows |
| `savedOrder` | `string[]` | optional | Ordered sys_id array from `sys_user_preference`; applied on mount |
| `onOrderChange` | `(cat, ids) => void` | optional | Callback fired (debounced 800ms) after a drop |

---

## `applyOrder` helper

```typescript
function applyOrder(dashboards: Dashboard[], savedOrder: string[] | undefined): Dashboard[] {
    if (!savedOrder || savedOrder.length === 0) return dashboards
    const byId = new Map(dashboards.map(d => [d.sys_id, d]))
    const ordered: Dashboard[] = []
    for (const id of savedOrder) {
        const d = byId.get(id)
        if (d) { ordered.push(d); byId.delete(id) }
    }
    // Append any dashboards not in the saved order (newly added since last save)
    for (const d of byId.values()) ordered.push(d)
    return ordered
}
```

New dashboards that were added to the instance after the user's last save are appended at the end rather than being silently dropped.

---

## Drag-and-Drop

Uses the **native HTML5 Drag-and-Drop API** — no library.

```
draggingId (useRef)  — sys_id of the card currently being dragged
dragOverId (useState) — sys_id of the card being hovered over (for visual highlight)
saveDebounce (useRef) — holds the debounce timer handle
```

### Flow

1. `dragstart` → set `draggingId.current`
2. `dragover` → `e.preventDefault()` (required to allow drop) + set `dragOverId` for highlight
3. `drop` → splice the dashboard from its old index to the new index in `orderedDashboards`, call `notifyOrderChange` (which starts the 800ms debounce timer)
4. `dragend` → clear both IDs (fired even if drop was cancelled)

Cross-category drops are prevented naturally because each `CategorySection` only listens to drops on its own children — a card dragged out of the section and dropped on a different section's card triggers that section's `drop` handler, which checks `draggingId.current` against its own list and does nothing if the ID is not found.

---

## Full Source

```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import './CategorySection.css'
import DashboardCard from './DashboardCard'
import type { Dashboard } from '../services/DashboardService'

interface CategorySectionProps {
    categoryName: string
    dashboards: Dashboard[]
    viewMode: 'grid' | 'list'
    savedOrder?: string[]
    onOrderChange?: (categoryName: string, orderedIds: string[]) => void
}

function applyOrder(dashboards: Dashboard[], savedOrder: string[] | undefined): Dashboard[] {
    if (!savedOrder || savedOrder.length === 0) return dashboards
    const byId = new Map(dashboards.map(d => [d.sys_id, d]))
    const ordered: Dashboard[] = []
    for (const id of savedOrder) {
        const d = byId.get(id)
        if (d) {
            ordered.push(d)
            byId.delete(id)
        }
    }
    for (const d of byId.values()) ordered.push(d)
    return ordered
}

export default function CategorySection({
    categoryName,
    dashboards,
    viewMode,
    savedOrder,
    onOrderChange,
}: CategorySectionProps) {
    const [orderedDashboards, setOrderedDashboards] = useState<Dashboard[]>(() =>
        applyOrder(dashboards, savedOrder)
    )
    const [dragOverId, setDragOverId] = useState<string | null>(null)
    const draggingId = useRef<string | null>(null)
    const saveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        setOrderedDashboards(applyOrder(dashboards, savedOrder))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dashboards])

    const notifyOrderChange = useCallback(
        (ordered: Dashboard[]) => {
            if (!onOrderChange) return
            if (saveDebounce.current) clearTimeout(saveDebounce.current)
            saveDebounce.current = setTimeout(() => {
                onOrderChange(categoryName, ordered.map(d => d.sys_id))
            }, 800)
        },
        [categoryName, onOrderChange]
    )

    function handleDragStart(id: string) {
        draggingId.current = id
    }

    function handleDragOver(e: React.DragEvent, overId: string) {
        e.preventDefault()
        setDragOverId(overId)
    }

    function handleDrop(targetId: string) {
        const srcId = draggingId.current
        if (!srcId || srcId === targetId) {
            setDragOverId(null)
            draggingId.current = null
            return
        }
        setOrderedDashboards(prev => {
            const from = prev.findIndex(d => d.sys_id === srcId)
            const to = prev.findIndex(d => d.sys_id === targetId)
            if (from === -1 || to === -1) return prev
            const next = [...prev]
            const [moved] = next.splice(from, 1)
            next.splice(to, 0, moved)
            notifyOrderChange(next)
            return next
        })
        setDragOverId(null)
        draggingId.current = null
    }

    function handleDragEnd() {
        draggingId.current = null
        setDragOverId(null)
    }

    return (
        <section className="category-section">
            <h2 className="category-section__heading">
                {categoryName}
                <span className="category-section__count">{orderedDashboards.length}</span>
            </h2>

            {viewMode === 'grid' ? (
                <div className="category-section__grid">
                    {orderedDashboards.map(d => (
                        <DashboardCard
                            key={d.sys_id}
                            dashboard={d}
                            isDragging={draggingId.current === d.sys_id}
                            isDragOver={dragOverId === d.sys_id}
                            onDragStart={() => handleDragStart(d.sys_id)}
                            onDragOver={e => handleDragOver(e, d.sys_id)}
                            onDrop={() => handleDrop(d.sys_id)}
                            onDragEnd={handleDragEnd}
                        />
                    ))}
                </div>
            ) : (
                <ul className="category-section__list">
                    {orderedDashboards.map(d => (
                        <li
                            key={d.sys_id}
                            className={[
                                'category-section__list-item',
                                dragOverId === d.sys_id ? 'category-section__list-item--drag-over' : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            draggable
                            onDragStart={() => handleDragStart(d.sys_id)}
                            onDragOver={e => handleDragOver(e, d.sys_id)}
                            onDrop={() => handleDrop(d.sys_id)}
                            onDragEnd={handleDragEnd}
                        >
                            <span className="category-section__list-handle" aria-hidden="true">⠿</span>
                            <a
                                className="category-section__list-title"
                                href={d.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {d.name}
                                <svg className="category-section__ext-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    <path d="M9 2h5v5M14 2 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </a>
                            {d.description && (
                                <p className="category-section__list-desc">{d.description}</p>
                            )}
                            {d.owner && (
                                <span className="category-section__list-owner">👤 {d.owner}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
```
