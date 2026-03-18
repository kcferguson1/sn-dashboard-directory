import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { DashboardService } from './services/DashboardService'
import type { CategoryGroup } from './services/DashboardService'
import { PreferenceService } from './services/PreferenceService'
import type { OrderMap } from './services/PreferenceService'
import CategorySection from './components/CategorySection'
import './app.css'

type ViewMode = 'grid' | 'list'

export default function App() {
    const [categories, setCategories] = useState<CategoryGroup[]>([])
    const [orderMap, setOrderMap] = useState<OrderMap>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('grid')

    const dashboardService = useMemo(() => new DashboardService(), [])
    const preferenceService = useMemo(() => new PreferenceService(), [])

    useEffect(() => {
        void (async () => {
            try {
                setLoading(true)
                setError(null)
                const [data, savedOrder] = await Promise.all([
                    dashboardService.getDashboardsGroupedByCategory(),
                    preferenceService.load(),
                ])
                setCategories(data)
                setOrderMap(savedOrder)
            } catch (err) {
                setError('Failed to load dashboards: ' + ((err as Error).message || 'Unknown error'))
            } finally {
                setLoading(false)
            }
        })()
    }, [dashboardService, preferenceService])

    const handleOrderChange = useCallback(
        (categoryName: string, orderedIds: string[]) => {
            const next = { ...orderMap, [categoryName]: orderedIds }
            setOrderMap(next)
            void preferenceService.save(next)
        },
        [orderMap, preferenceService]
    )

    const totalDashboards = categories.reduce((sum, cat) => sum + cat.dashboards.length, 0)

    return (
        <div className="directory-app">
            <header className="directory-header">
                <div className="directory-header__text">
                    <h1 className="directory-header__title">Dashboard Directory</h1>
                    <p className="directory-header__subtitle">
                        Active &amp; certified dashboards, organised by category
                    </p>
                </div>
                <div className="directory-header__meta">
                    {!loading && !error && (
                        <span className="directory-header__count">
                            {totalDashboards} dashboard{totalDashboards !== 1 ? 's' : ''}
                        </span>
                    )}
                    <div className="view-toggle" role="group" aria-label="View mode">
                        <button
                            className={`view-toggle__btn${viewMode === 'grid' ? ' view-toggle__btn--active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            aria-pressed={viewMode === 'grid'}
                            title="Card view"
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <rect x="2" y="2" width="7" height="7" rx="1.5"/>
                                <rect x="11" y="2" width="7" height="7" rx="1.5"/>
                                <rect x="2" y="11" width="7" height="7" rx="1.5"/>
                                <rect x="11" y="11" width="7" height="7" rx="1.5"/>
                            </svg>
                            Cards
                        </button>
                        <button
                            className={`view-toggle__btn${viewMode === 'list' ? ' view-toggle__btn--active' : ''}`}
                            onClick={() => setViewMode('list')}
                            aria-pressed={viewMode === 'list'}
                            title="List view"
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <rect x="2" y="4" width="16" height="2" rx="1"/>
                                <rect x="2" y="9" width="16" height="2" rx="1"/>
                                <rect x="2" y="14" width="16" height="2" rx="1"/>
                            </svg>
                            List
                        </button>
                    </div>
                </div>
            </header>

            <main className="directory-main">
                {loading && (
                    <div className="directory-loading">
                        <div className="directory-spinner" aria-label="Loading..." />
                        <span>Loading dashboards…</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="directory-error" role="alert">
                        <strong>Error:</strong> {error}
                        <button className="directory-error__dismiss" onClick={() => setError(null)}>Dismiss</button>
                    </div>
                )}

                {!loading && !error && categories.length === 0 && (
                    <div className="directory-empty">
                        No active, certified dashboards found.
                    </div>
                )}

                {!loading && !error && categories.map(group => (
                    <CategorySection
                        key={group.categoryName}
                        categoryName={group.categoryName}
                        dashboards={group.dashboards}
                        viewMode={viewMode}
                        savedOrder={orderMap[group.categoryName]}
                        onOrderChange={handleOrderChange}
                    />
                ))}
            </main>
        </div>
    )
}
