# DashboardCard.tsx

**Path:** `src/client/components/DashboardCard.tsx`
**Role:** Renders a single dashboard as a card in grid view. Displays the dashboard title (as a hyperlink), description, owner, and a drag handle. Accepts drag event props from `CategorySection`.

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `dashboard` | `Dashboard` | ✅ | The dashboard data object |
| `isDragging` | `boolean` | optional | Applies `.dashboard-card--dragging` (faded, dashed border) |
| `isDragOver` | `boolean` | optional | Applies `.dashboard-card--drag-over` (blue highlight) |
| `onDragStart` | `() => void` | optional | Forwarded to the card's `dragstart` event |
| `onDragOver` | `(e) => void` | optional | Forwarded to the card's `dragover` event |
| `onDrop` | `() => void` | optional | Forwarded to the card's `drop` event |
| `onDragEnd` | `() => void` | optional | Forwarded to the card's `dragend` event |

---

## Layout

```
┌─────────────────────────────────┐  ← .dashboard-card (draggable)
│                              ⠿  │  ← drag handle (top-right, visible on hover)
│  Dashboard Title ↗              │  ← .dashboard-card__title (anchor tag)
│  Description text here…         │  ← .dashboard-card__description
│ ─────────────────────────────── │
│ 👤 Owner Name                   │  ← .dashboard-card__footer
└─────────────────────────────────┘
```

The title `<a>` tag has `onClick={e => e.stopPropagation()}` to prevent the drag event from also triggering link navigation.

---

## Full Source

```tsx
import React from 'react'
import './DashboardCard.css'
import type { Dashboard } from '../services/DashboardService'

interface DashboardCardProps {
    dashboard: Dashboard
    isDragging?: boolean
    isDragOver?: boolean
    onDragStart?: () => void
    onDragOver?: (e: React.DragEvent) => void
    onDrop?: () => void
    onDragEnd?: () => void
}

export default function DashboardCard({
    dashboard,
    isDragging = false,
    isDragOver = false,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
}: DashboardCardProps) {
    const classes = [
        'dashboard-card',
        isDragging ? 'dashboard-card--dragging' : '',
        isDragOver ? 'dashboard-card--drag-over' : '',
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <div
            className={classes}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            <div className="dashboard-card__drag-handle" aria-hidden="true">⠿</div>
            <div className="dashboard-card__body">
                <a
                    className="dashboard-card__title"
                    href={dashboard.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                >
                    {dashboard.name}
                    <svg className="dashboard-card__ext-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M9 2h5v5M14 2 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </a>
                {dashboard.description && (
                    <p className="dashboard-card__description">{dashboard.description}</p>
                )}
            </div>
            {dashboard.owner && (
                <div className="dashboard-card__footer">
                    <span className="dashboard-card__owner-icon" aria-hidden="true">👤</span>
                    <span className="dashboard-card__owner">{dashboard.owner}</span>
                </div>
            )}
        </div>
    )
}
```
