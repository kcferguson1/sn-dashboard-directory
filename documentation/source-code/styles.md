# Styles

All CSS files used by the application. The bundler (Rollup + `@servicenow/isomorphic-rollup`) inlines these into `main.jsdbx` at build time — there are no separate `.css` files served to the browser.

---

## app.css

**Path:** `src/client/app.css`
**Scope:** Global styles — page shell, header, view toggle buttons, loading spinner, error banner, empty state.

```css
*,
*::before,
*::after {
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    margin: 0;
    padding: 0;
}

/* ── App shell ──────────────────────────────────────────────── */

.directory-app {
    background: #f8f9fa;
    min-height: 100vh;
}

/* ── Header ─────────────────────────────────────────────────── */

.directory-header {
    align-items: center;
    background: #ffffff;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: space-between;
    padding: 20px 32px;
}

.directory-header__title {
    color: #1f1f1f;
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 4px;
}

.directory-header__subtitle {
    color: #666;
    font-size: 13px;
    margin: 0;
}

.directory-header__meta {
    align-items: center;
    display: flex;
    gap: 16px;
}

.directory-header__count {
    color: #555;
    font-size: 13px;
}

/* ── View toggle ────────────────────────────────────────────── */

.view-toggle {
    background: #f1f3f4;
    border-radius: 6px;
    display: flex;
    padding: 3px;
}

.view-toggle__btn {
    align-items: center;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #555;
    cursor: pointer;
    display: flex;
    font-size: 13px;
    font-weight: 500;
    gap: 5px;
    padding: 6px 12px;
    transition: background 0.15s, color 0.15s;
}

.view-toggle__btn svg {
    height: 15px;
    width: 15px;
}

.view-toggle__btn:hover {
    background: #e2e5e9;
    color: #1f1f1f;
}

.view-toggle__btn--active {
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    color: #1a73e8;
}

.view-toggle__btn--active:hover {
    background: #ffffff;
    color: #1a73e8;
}

/* ── Main content ───────────────────────────────────────────── */

.directory-main {
    margin: 0 auto;
    max-width: 1280px;
    padding: 32px;
}

/* ── Loading ────────────────────────────────────────────────── */

.directory-loading {
    align-items: center;
    color: #555;
    display: flex;
    font-size: 14px;
    gap: 12px;
    justify-content: center;
    padding: 80px 0;
}

.directory-spinner {
    animation: spin 0.8s linear infinite;
    border: 3px solid #e0e0e0;
    border-radius: 50%;
    border-top-color: #1a73e8;
    height: 24px;
    width: 24px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* ── Error banner ───────────────────────────────────────────── */

.directory-error {
    align-items: center;
    background: #fce8e6;
    border: 1px solid #f28b82;
    border-radius: 6px;
    color: #c5221f;
    display: flex;
    font-size: 14px;
    gap: 12px;
    margin-bottom: 24px;
    padding: 12px 16px;
}

.directory-error__dismiss {
    background: transparent;
    border: 1px solid #c5221f;
    border-radius: 4px;
    color: #c5221f;
    cursor: pointer;
    font-size: 12px;
    margin-left: auto;
    padding: 3px 10px;
}

.directory-error__dismiss:hover {
    background: #c5221f;
    color: #fff;
}

/* ── Empty state ────────────────────────────────────────────── */

.directory-empty {
    color: #777;
    font-size: 14px;
    padding: 80px 0;
    text-align: center;
}
```

---

## CategorySection.css

**Path:** `src/client/components/CategorySection.css`
**Scope:** Category heading, card grid layout, list layout, list item drag states.

```css
.category-section {
    margin-bottom: 40px;
}

.category-section__heading {
    align-items: center;
    border-bottom: 2px solid #1a73e8;
    color: #1f1f1f;
    display: flex;
    font-size: 17px;
    font-weight: 700;
    gap: 10px;
    letter-spacing: 0.02em;
    margin: 0 0 18px;
    padding-bottom: 8px;
    text-transform: uppercase;
}

.category-section__count {
    background: #e8f0fe;
    border-radius: 12px;
    color: #1a73e8;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
}

/* Grid layout */
.category-section__grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

/* List layout */
.category-section__list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.category-section__list-item {
    align-items: center;
    border-bottom: 1px solid #f0f0f0;
    cursor: grab;
    display: grid;
    gap: 2px 8px;
    grid-template-areas:
        "handle title owner"
        "handle desc  owner";
    grid-template-columns: 20px 1fr auto;
    padding: 12px 4px;
    transition: background 0.12s;
}

.category-section__list-item:active {
    cursor: grabbing;
}

.category-section__list-item:last-child {
    border-bottom: none;
}

.category-section__list-item--drag-over {
    background: #e8f0fe;
    border-color: #1a73e8;
    border-radius: 4px;
}

.category-section__list-handle {
    color: #bbb;
    font-size: 16px;
    grid-area: handle;
    text-align: center;
    user-select: none;
}

.category-section__list-title {
    align-items: center;
    color: #1a73e8;
    display: inline-flex;
    font-size: 14px;
    font-weight: 600;
    gap: 5px;
    grid-area: title;
    text-decoration: none;
}

.category-section__list-title:hover {
    text-decoration: underline;
}

.category-section__ext-icon {
    flex-shrink: 0;
    height: 12px;
    opacity: 0.7;
    width: 12px;
}

.category-section__list-desc {
    color: #555;
    font-size: 13px;
    grid-area: desc;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.category-section__list-owner {
    align-self: center;
    color: #888;
    font-size: 12px;
    font-style: italic;
    grid-area: owner;
    white-space: nowrap;
}
```

---

## DashboardCard.css

**Path:** `src/client/components/DashboardCard.css`
**Scope:** Individual card in grid view — base styles, hover lift, grab cursor, drag states, title link, description, owner footer.

```css
.dashboard-card {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    cursor: grab;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 140px;
    padding: 18px 20px;
    position: relative;
    transition: box-shadow 0.18s ease, transform 0.18s ease, opacity 0.18s ease;
}

.dashboard-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}

.dashboard-card:active {
    cursor: grabbing;
}

/* Drag handle icon — top-right, visible on hover */
.dashboard-card__drag-handle {
    color: #bbb;
    font-size: 16px;
    line-height: 1;
    opacity: 0;
    position: absolute;
    right: 10px;
    top: 10px;
    transition: opacity 0.15s;
    user-select: none;
}

.dashboard-card:hover .dashboard-card__drag-handle {
    opacity: 1;
}

/* Being dragged */
.dashboard-card--dragging {
    border: 2px dashed #1a73e8;
    cursor: grabbing;
    opacity: 0.4;
    transform: none;
}

/* Drop target */
.dashboard-card--drag-over {
    background: #e8f0fe;
    border-color: #1a73e8;
    box-shadow: 0 0 0 2px #1a73e8;
}

.dashboard-card__body {
    flex: 1;
}

.dashboard-card__title {
    align-items: center;
    color: #1a73e8;
    display: inline-flex;
    font-size: 15px;
    font-weight: 600;
    gap: 5px;
    line-height: 1.4;
    text-decoration: none;
}

.dashboard-card__title:hover {
    text-decoration: underline;
}

.dashboard-card__ext-icon {
    flex-shrink: 0;
    height: 13px;
    opacity: 0.7;
    width: 13px;
}

.dashboard-card__description {
    color: #555;
    font-size: 13px;
    line-height: 1.5;
    margin: 8px 0 0;
}

.dashboard-card__footer {
    align-items: center;
    border-top: 1px solid #f0f0f0;
    display: flex;
    font-size: 12px;
    gap: 5px;
    margin-top: 14px;
    padding-top: 10px;
}

.dashboard-card__owner-icon {
    font-size: 12px;
}

.dashboard-card__owner {
    color: #777;
    font-style: italic;
}
```
