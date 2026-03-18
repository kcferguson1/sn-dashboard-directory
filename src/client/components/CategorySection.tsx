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
    // Append any dashboards not in the saved order (newly added)
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

    // Re-apply order when dashboards prop changes (e.g. on refresh)
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
