# Manual Recreation Guide

A step-by-step guide to recreating the Dashboard Directory application through the ServiceNow browser UI — no SDK required for Path B.

---

## Table of Contents

1. [Key Concepts](#key-concepts)
2. [Prerequisites](#prerequisites)
3. [Step 1 — Create the Scoped Application](#step-1--create-the-scoped-application)
4. [Path A — Upload the Pre-Built React Bundle](#path-a--upload-the-pre-built-react-bundle)
5. [Path B — Fully Self-Contained Vanilla JS (No Build Step)](#path-b--fully-self-contained-vanilla-js-no-build-step)
6. [Required Access Controls (ACLs)](#required-access-controls-acls)
7. [Adding a Navigation Module (Optional)](#adding-a-navigation-module-optional)

---

## Key Concepts

**sys_id** — Every ServiceNow record has a unique 32-character hex identifier. When creating records that reference each other (e.g. linking a JS bundle to a UI Page), you'll need to copy and paste these IDs.

**Scoped Application** — A container that groups related records under a unique namespace prefix (`x_121762_my_dashbo`). This prefix is prepended to endpoints and table names to prevent naming conflicts.

**UI Page (`sys_ui_page`)** — A record that stores an HTML page and serves it at a `.do` URL. It supports server-side Jelly tags (`<g:requires>`) and `$[...]` substitution expressions that ServiceNow evaluates before sending the page to the browser.

**`main.jsdbx`** — The compiled React application bundle. During the build, Rollup compiles all TypeScript, JSX, React libraries, components, and CSS into a single minified JavaScript file (~421 KB). The `.jsdbx` extension tells ServiceNow's asset delivery system (`/uxasset/`) to serve it with proper caching headers.

**UX Library Asset (`sys_ux_lib_asset`)** — A record that hosts a `.jsdbx` file and makes it available at `/uxasset/externals/{name}.jsdbx`. This is how the UI Page loads the React bundle.

**`window.g_ck`** — The session security token (CSRF token). Every REST API call from the page must include this in the `X-UserToken` header or ServiceNow returns `403 Forbidden`. The UI Page HTML sets it via server-side substitution: `window.g_ck = "$[gs.getSession().getSessionToken()]"`.

**`$[...]` server-side substitution** — Expressions inside `$[...]` are evaluated on the server before the page is sent to the browser. Used to inject the session token and cache-busting timestamps.

**`<g:requires>` tags** — Server-side Jelly directives that include ServiceNow's built-in JavaScript libraries (Prototype.js, GlideAjax, etc.) in the page. These are pre-existing platform files — you don't create or upload them.

**`direct: true`** — When set on a UI Page, ServiceNow serves the page without the standard navigation shell (banner, left nav). The page fills the full browser window.

**`sysparm_query` / `sysparm_display_value` / `sysparm_fields`** — Table REST API parameters for filtering records, returning both raw and display values for reference fields (e.g. owner name vs. owner sys_id), and limiting which fields are returned.

**`analytics_category_m2m`** — The junction table linking PA dashboards to their categories. Each row maps an `artifact_id` (dashboard sys_id) to a category. A separate table is needed because one dashboard can belong to multiple categories.

**`sys_user_preference`** — A built-in per-user key-value store. We use it to persist the user's drag-and-drop card order under the key `x_121762_my_dashbo.dashboard_order`. Each user gets their own record, so one user's order never affects another's.

---

## Prerequisites

- **Admin role** on your ServiceNow instance
- **The project source code** (from GitHub: `https://github.com/kcferguson1/sn-dashboard-directory`) — needed for Path A only
- **Node.js 18+** installed locally — needed for Path A only
- For **Path B**: just a browser and admin access

---

## Step 1 — Create the Scoped Application

> Skip this step if "My Dashboards" already exists on your instance (`sys_app_list.do` → search "My Dashboards").

All records created in this guide belong to this application.

1. Open the **Application Navigator** and search for **Studio**
2. Click **Create Application**
3. Fill in the fields:

   | Field | Value |
   |-------|-------|
   | **Name** | `My Dashboards` |
   | **Scope** | `x_121762_my_dashbo` |
   | **Version** | `0.0.1` |

4. Click **Create**

> **Note on scope:** `x_121762_my_dashbo` was generated for this developer account. If using a different account, your vendor code will differ — update every occurrence of `x_121762_my_dashbo` in the steps and code below.

---

## Path A — Upload the Pre-Built React Bundle

Use this path when you want the full React application and can run a local build.

---

### Step A1: Build the JS bundle locally

The build compiles all TypeScript, JSX, React, and CSS into `dist/static/main.jsdbx`.

```bash
cd "/path/to/sn sdk app"
npm install
npx @servicenow/sdk build
```

Expected output ends with:
```
[now-sdk] Bundled chunk: main.jsdbx (421720 bytes)
[now-sdk] Build completed successfully
```

---

### Step A2: Create a UX Library Asset for the JS bundle

This record hosts the `main.jsdbx` file and makes it available at `/uxasset/externals/x_121762_my_dashbo/main.jsdbx`.

1. Navigate to `sys_ux_lib_asset_list.do` (or **UX Framework > Library Assets**)
2. Click **New**
3. Fill in the fields:

   | Field | Value |
   |-------|-------|
   | **Name** | `x_121762_my_dashbo/main` |
   | **Application** | `My Dashboards` |

4. Click **Submit**
5. On the saved record, open **Attachments** and upload `dist/static/main.jsdbx`

> The attachment filename must be exactly `main.jsdbx`.

---

### Step A3: Create the UI Page

This record stores the HTML shell that loads the React bundle.

1. Navigate to `sys_ui_page_list.do` (or **System UI > UI Pages**)
2. Click **New**
3. Fill in the fields:

   | Field | Value |
   |-------|-------|
   | **Name** | `dashboard_directory` |
   | **Endpoint** | `x_121762_my_dashbo_dashboard_directory.do` |
   | **Description** | `Dashboard Directory` |
   | **Direct** | ✅ Checked |
   | **Category** | `general` |
   | **Application** | `My Dashboards` |

4. Clear the **HTML** field and paste:

```html
<html>
  <head>
    <title>Dashboard Directory</title>

    <!-- Sets the session token so the React app can make authenticated REST calls -->
    <script>
      window.NOW = {};
      window.NOW.user = {};
      window.NOW.batch_glide_ajax_requests = false;
      window.NOW.isUsingPolaris = true;
      window.NOW.exclude_dark_theme = "false";
      window.g_ck = "$[gs.getSession().getSessionToken() || gs.getSessionToken()]";
    </script>

    <!-- Loads ServiceNow's built-in client-side libraries -->
    <g:requires name="scripts/doctype/functions_bootstrap14.js"></g:requires>
    <g:requires name="scripts/lib/prototype.js"></g:requires>
    <g:requires name="scripts/classes/ajax/GlideURL.js"></g:requires>
    <g:requires name="scripts/doctype/CustomEventManager.js"></g:requires>
    <g:requires name="scripts/classes/ajax/GlideAjax.js"></g:requires>
    <g:requires name="scripts/classes/GlideUser.js"></g:requires>

    <g2:client_script type="user"></g2:client_script>

    <!-- Loads the compiled React bundle uploaded in Step A2.
         The ?uxpcb= query parameter is a cache-busting timestamp evaluated server-side. -->
    <script
      src="/uxasset/externals/x_121762_my_dashbo/main.jsdbx?uxpcb=$[UxFrameworkScriptables.getFlushTimestamp()]"
      type="module">
    </script>
  </head>
  <body>
    <!-- React mounts the entire application into this div -->
    <div id="root"></div>
  </body>
</html>
```

5. Click **Submit**

---

### Step A4: Verify the asset URL resolves

Navigate to:
```
https://<your-instance>.service-now.com/uxasset/externals/x_121762_my_dashbo/main.jsdbx
```

You should see minified JavaScript. A 404 means the UX Library Asset **Name** or attachment filename is incorrect — go back to Step A2.

---

### Step A5: Test the page

Navigate to:
```
https://<your-instance>.service-now.com/x_121762_my_dashbo_dashboard_directory.do
```

You should see a spinner followed by the dashboard directory. If no dashboards appear, check the ACLs section below.

---

## Path B — Fully Self-Contained Vanilla JS (No Build Step)

A complete self-contained HTML document — no React, no TypeScript, no file uploads. Paste it directly into a UI Page's HTML field.

---

### Step B1: Create the UI Page

1. Navigate to `sys_ui_page_list.do`
2. Click **New**
3. Fill in the fields:

   | Field | Value |
   |-------|-------|
   | **Name** | `dashboard_directory` |
   | **Endpoint** | `x_121762_my_dashbo_dashboard_directory.do` |
   | **Description** | `Dashboard Directory` |
   | **Direct** | ✅ Checked |
   | **Category** | `general` |
   | **Application** | `My Dashboards` |

4. Clear the HTML field and paste the entire block below
5. Click **Submit**

---

### Complete Self-Contained HTML

```html
<html>
<head>
  <title>Dashboard Directory</title>

  <!-- Sets the session token for authenticated REST API calls -->
  <script>
    window.g_ck = "$[gs.getSession().getSessionToken() || gs.getSessionToken()]";
  </script>

  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0; padding: 0; background: #f8f9fa; min-height: 100vh;
    }

    /* Header */
    .dir-header {
      background: #fff; border-bottom: 1px solid #e0e0e0;
      display: flex; flex-wrap: wrap; align-items: center;
      justify-content: space-between; gap: 16px; padding: 20px 32px;
    }
    .dir-header__title { color: #1f1f1f; font-size: 24px; font-weight: 700; margin: 0 0 4px; }
    .dir-header__subtitle { color: #666; font-size: 13px; margin: 0; }
    .dir-header__meta { display: flex; align-items: center; gap: 16px; }
    .dir-header__count { color: #555; font-size: 13px; }

    /* View toggle buttons */
    .view-toggle { background: #f1f3f4; border-radius: 6px; display: flex; padding: 3px; }
    .view-toggle__btn {
      align-items: center; background: transparent; border: none; border-radius: 4px;
      color: #555; cursor: pointer; display: flex; font-size: 13px; font-weight: 500;
      gap: 5px; padding: 6px 12px; transition: background .15s, color .15s;
    }
    .view-toggle__btn svg { width: 15px; height: 15px; }
    .view-toggle__btn:hover { background: #e2e5e9; color: #1f1f1f; }
    .view-toggle__btn.active {
      background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.15); color: #1a73e8;
    }

    /* Main content */
    .dir-main { max-width: 1280px; margin: 0 auto; padding: 32px; }

    /* Loading spinner */
    .dir-loading {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; padding: 80px 0; color: #555; font-size: 14px;
    }
    .dir-spinner {
      width: 24px; height: 24px; border-radius: 50%;
      border: 3px solid #e0e0e0; border-top-color: #1a73e8;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Error banner */
    .dir-error {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      background: #fce8e6; border: 1px solid #f28b82; border-radius: 6px;
      color: #c5221f; font-size: 14px; margin-bottom: 24px;
    }
    .dir-error__dismiss {
      margin-left: auto; background: transparent; border: 1px solid #c5221f;
      border-radius: 4px; color: #c5221f; cursor: pointer; font-size: 12px; padding: 3px 10px;
    }

    /* Empty state */
    .dir-empty { text-align: center; padding: 80px 0; color: #777; font-size: 14px; }

    /* Category section */
    .cat-section { margin-bottom: 40px; }
    .cat-heading {
      display: flex; align-items: center; gap: 10px;
      border-bottom: 2px solid #1a73e8; padding-bottom: 8px; margin: 0 0 18px;
      color: #1f1f1f; font-size: 17px; font-weight: 700;
      letter-spacing: .02em; text-transform: uppercase;
    }
    .cat-count {
      background: #e8f0fe; border-radius: 12px; color: #1a73e8;
      font-size: 12px; font-weight: 600; padding: 2px 8px;
    }

    /* Card grid — responsive, fills available columns */
    .cat-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }

    /* Dashboard card */
    .dash-card {
      background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
      cursor: grab; display: flex; flex-direction: column;
      justify-content: space-between; min-height: 140px; padding: 18px 20px;
      position: relative; transition: box-shadow .18s, transform .18s, opacity .18s;
    }
    .dash-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.12); transform: translateY(-2px); }
    .dash-card:active { cursor: grabbing; }
    .dash-card__handle {
      position: absolute; right: 10px; top: 10px; color: #bbb;
      font-size: 16px; opacity: 0; transition: opacity .15s; user-select: none;
    }
    .dash-card:hover .dash-card__handle { opacity: 1; }
    .dash-card.is-dragging { border: 2px dashed #1a73e8; opacity: .4; transform: none; cursor: grabbing; }
    .dash-card.is-drag-over { background: #e8f0fe; border-color: #1a73e8; box-shadow: 0 0 0 2px #1a73e8; }
    .dash-card__title {
      align-items: center; color: #1a73e8; display: inline-flex;
      font-size: 15px; font-weight: 600; gap: 5px; line-height: 1.4; text-decoration: none;
    }
    .dash-card__title:hover { text-decoration: underline; }
    .dash-card__ext { width: 13px; height: 13px; opacity: .7; flex-shrink: 0; }
    .dash-card__desc { color: #555; font-size: 13px; line-height: 1.5; margin: 8px 0 0; }
    .dash-card__footer {
      align-items: center; border-top: 1px solid #f0f0f0;
      display: flex; font-size: 12px; gap: 5px; margin-top: 14px; padding-top: 10px;
    }
    .dash-card__owner { color: #777; font-style: italic; }

    /* List view */
    .cat-list { list-style: none; margin: 0; padding: 0; }
    .cat-list-item {
      align-items: center; border-bottom: 1px solid #f0f0f0; cursor: grab;
      display: grid; gap: 2px 8px;
      grid-template-areas: "handle title owner" "handle desc owner";
      grid-template-columns: 20px 1fr auto;
      padding: 12px 4px; transition: background .12s;
    }
    .cat-list-item:last-child { border-bottom: none; }
    .cat-list-item:active { cursor: grabbing; }
    .cat-list-item.is-drag-over { background: #e8f0fe; border-color: #1a73e8; border-radius: 4px; }
    .cat-list-handle { color: #bbb; font-size: 16px; grid-area: handle; text-align: center; user-select: none; }
    .cat-list-title {
      align-items: center; color: #1a73e8; display: inline-flex;
      font-size: 14px; font-weight: 600; gap: 5px; grid-area: title; text-decoration: none;
    }
    .cat-list-title:hover { text-decoration: underline; }
    .cat-list-desc {
      color: #555; font-size: 13px; grid-area: desc; margin: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .cat-list-owner { align-self: center; color: #888; font-size: 12px; font-style: italic; grid-area: owner; white-space: nowrap; }
  </style>
</head>
<body>

<!-- JavaScript writes all content into this div -->
<div id="app"></div>

<script>
(function () {
  'use strict';

  // ── CONFIGURATION ────────────────────────────────────────────────────────
  // PREF_KEY is the unique name for the user's sort-order preference record.
  // BASE is used to build dashboard URLs.
  const PREF_KEY = 'x_121762_my_dashbo.dashboard_order';
  const BASE = window.location.origin;

  // ── APPLICATION STATE ────────────────────────────────────────────────────
  // All UI state lives here. Calling render() rebuilds the page from this object.
  let state = {
    loading: true,
    error: null,
    categories: [],   // [{ name, dashboards[] }]
    orderMap: {},     // { categoryName: [sys_id, ...] } — saved sort order
    viewMode: 'grid',
    prefSysId: null,  // cached sys_id of the user_preference record
    draggingId: null,
    dragOverId: null,
    dragCategory: null,
  };

  // ── RENDER ───────────────────────────────────────────────────────────────
  // Clears #app and rebuilds the entire UI from the current state.
  function render() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '';
    app.appendChild(buildPage());
  }

  function buildPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(buildHeader());
    frag.appendChild(buildMain());
    return frag;
  }

  // Builds the top bar with the title, dashboard count, and Cards/List toggle.
  function buildHeader() {
    const header = el('div', { className: 'dir-header' });

    const text = el('div');
    text.appendChild(el('h1', { className: 'dir-header__title', textContent: 'Dashboard Directory' }));
    text.appendChild(el('p', { className: 'dir-header__subtitle', textContent: 'Active & certified dashboards, organised by category' }));
    header.appendChild(text);

    const meta = el('div', { className: 'dir-header__meta' });

    if (!state.loading && !state.error) {
      const total = state.categories.reduce((s, c) => s + c.dashboards.length, 0);
      meta.appendChild(el('span', { className: 'dir-header__count', textContent: `${total} dashboard${total !== 1 ? 's' : ''}` }));
    }

    const toggle = el('div', { className: 'view-toggle', role: 'group' });
    toggle.setAttribute('aria-label', 'View mode');

    const btnGrid = el('button', { className: 'view-toggle__btn' + (state.viewMode === 'grid' ? ' active' : ''), title: 'Card view' });
    btnGrid.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>Cards`;
    btnGrid.addEventListener('click', () => { state.viewMode = 'grid'; render(); });

    const btnList = el('button', { className: 'view-toggle__btn' + (state.viewMode === 'list' ? ' active' : ''), title: 'List view' });
    btnList.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor"><rect x="2" y="4" width="16" height="2" rx="1"/><rect x="2" y="9" width="16" height="2" rx="1"/><rect x="2" y="14" width="16" height="2" rx="1"/></svg>List`;
    btnList.addEventListener('click', () => { state.viewMode = 'list'; render(); });

    toggle.appendChild(btnGrid);
    toggle.appendChild(btnList);
    meta.appendChild(toggle);
    header.appendChild(meta);
    return header;
  }

  // Renders the main content area: spinner, error banner, empty state, or category sections.
  function buildMain() {
    const main = el('main', { className: 'dir-main' });

    if (state.loading) {
      const loading = el('div', { className: 'dir-loading' });
      loading.appendChild(el('div', { className: 'dir-spinner' }));
      loading.appendChild(el('span', { textContent: 'Loading dashboards…' }));
      main.appendChild(loading);
      return main;
    }

    if (state.error) {
      const err = el('div', { className: 'dir-error', role: 'alert' });
      err.innerHTML = `<strong>Error:</strong> ${escHtml(state.error)}`;
      const dismiss = el('button', { className: 'dir-error__dismiss', textContent: 'Dismiss' });
      dismiss.addEventListener('click', () => { state.error = null; render(); });
      err.appendChild(dismiss);
      main.appendChild(err);
      return main;
    }

    if (state.categories.length === 0) {
      main.appendChild(el('div', { className: 'dir-empty', textContent: 'No active, certified dashboards found.' }));
      return main;
    }

    for (const group of state.categories) {
      const ordered = applyOrder(group.dashboards, state.orderMap[group.name]);
      main.appendChild(buildCategorySection(group.name, ordered));
    }

    return main;
  }

  function buildCategorySection(catName, dashboards) {
    const section = el('section', { className: 'cat-section' });

    const heading = el('h2', { className: 'cat-heading' });
    heading.appendChild(document.createTextNode(catName));
    heading.appendChild(el('span', { className: 'cat-count', textContent: String(dashboards.length) }));
    section.appendChild(heading);

    if (state.viewMode === 'grid') {
      const grid = el('div', { className: 'cat-grid' });
      for (const d of dashboards) grid.appendChild(buildCard(d, catName));
      section.appendChild(grid);
    } else {
      const list = el('ul', { className: 'cat-list' });
      for (const d of dashboards) list.appendChild(buildListItem(d, catName));
      section.appendChild(list);
    }

    return section;
  }

  // Builds one dashboard card for the grid view with drag state classes and event handlers.
  function buildCard(d, catName) {
    const classes = ['dash-card'];
    if (state.draggingId === d.sys_id) classes.push('is-dragging');
    if (state.dragOverId === d.sys_id && state.dragCategory === catName) classes.push('is-drag-over');

    const card = el('div', { className: classes.join(' '), draggable: true });

    const handle = el('div', { className: 'dash-card__handle', textContent: '⠿' });
    handle.setAttribute('aria-hidden', 'true');
    card.appendChild(handle);

    const body = el('div');
    const link = el('a', { className: 'dash-card__title', href: d.url, target: '_blank', rel: 'noopener noreferrer' });
    link.textContent = d.name;
    link.innerHTML += `<svg class="dash-card__ext" viewBox="0 0 16 16" fill="none"><path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 2h5v5M14 2 8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    link.addEventListener('click', e => e.stopPropagation());
    body.appendChild(link);

    if (d.description) body.appendChild(el('p', { className: 'dash-card__desc', textContent: d.description }));
    card.appendChild(body);

    if (d.owner) {
      const footer = el('div', { className: 'dash-card__footer' });
      footer.appendChild(el('span', { textContent: '👤', 'aria-hidden': 'true' }));
      footer.appendChild(el('span', { className: 'dash-card__owner', textContent: d.owner }));
      card.appendChild(footer);
    }

    attachDragHandlers(card, d.sys_id, catName);
    return card;
  }

  function buildListItem(d, catName) {
    const classes = ['cat-list-item'];
    if (state.dragOverId === d.sys_id && state.dragCategory === catName) classes.push('is-drag-over');

    const li = el('li', { className: classes.join(' '), draggable: true });
    const handle = el('span', { className: 'cat-list-handle', textContent: '⠿' });
    handle.setAttribute('aria-hidden', 'true');
    li.appendChild(handle);

    const link = el('a', { className: 'cat-list-title', href: d.url, target: '_blank', rel: 'noopener noreferrer' });
    link.textContent = d.name;
    link.innerHTML += `<svg class="dash-card__ext" viewBox="0 0 16 16" fill="none" style="width:12px;height:12px"><path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 2h5v5M14 2 8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    li.appendChild(link);

    if (d.description) li.appendChild(el('p', { className: 'cat-list-desc', textContent: d.description }));
    if (d.owner) li.appendChild(el('span', { className: 'cat-list-owner', textContent: `👤 ${d.owner}` }));

    attachDragHandlers(li, d.sys_id, catName);
    return li;
  }

  // ── DRAG AND DROP ────────────────────────────────────────────────────────
  // Uses the native HTML5 Drag-and-Drop API (no library).
  // dragCategory tracks which category a drag started in — drops across
  // categories are ignored. After a successful drop, the order is saved
  // to sys_user_preference after an 800ms debounce.
  let saveDebounceTimer = null;

  function attachDragHandlers(node, sysId, catName) {
    node.addEventListener('dragstart', () => {
      state.draggingId = sysId;
      state.dragCategory = catName;
    });

    node.addEventListener('dragover', e => {
      e.preventDefault(); // required to allow dropping
      if (state.dragOverId !== sysId || state.dragCategory !== catName) {
        state.dragOverId = sysId;
        state.dragCategory = catName;
        render();
      }
    });

    node.addEventListener('drop', () => {
      const srcId = state.draggingId;
      const srcCat = state.dragCategory;

      if (!srcId || srcCat !== catName || srcId === sysId) {
        state.draggingId = null; state.dragOverId = null; state.dragCategory = null;
        render(); return;
      }

      const group = state.categories.find(c => c.name === catName);
      if (!group) return;
      const ordered = applyOrder(group.dashboards, state.orderMap[catName]);
      const from = ordered.findIndex(d => d.sys_id === srcId);
      const to = ordered.findIndex(d => d.sys_id === sysId);

      if (from !== -1 && to !== -1 && from !== to) {
        const next = [...ordered];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        state.orderMap = { ...state.orderMap, [catName]: next.map(d => d.sys_id) };
        scheduleSave();
      }

      state.draggingId = null; state.dragOverId = null; state.dragCategory = null;
      render();
    });

    node.addEventListener('dragend', () => {
      state.draggingId = null; state.dragOverId = null; state.dragCategory = null;
      render();
    });
  }

  // ── ORDER HELPERS ────────────────────────────────────────────────────────
  // Reorders dashboards to match the saved order. Dashboards added since the
  // last save are appended at the end rather than dropped.
  function applyOrder(dashboards, savedOrder) {
    if (!savedOrder || savedOrder.length === 0) return dashboards;
    const byId = new Map(dashboards.map(d => [d.sys_id, d]));
    const ordered = [];
    for (const id of savedOrder) {
      const d = byId.get(id);
      if (d) { ordered.push(d); byId.delete(id); }
    }
    for (const d of byId.values()) ordered.push(d);
    return ordered;
  }

  function scheduleSave() {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(savePreference, 800);
  }

  // ── REST API HELPERS ─────────────────────────────────────────────────────
  // headers() includes the session token required by all ServiceNow REST calls.
  // apiFetch() wraps fetch() to always include headers and throw on non-2xx responses.
  function headers() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-UserToken': window.g_ck
    };
  }

  async function apiFetch(url, opts) {
    const res = await fetch(url, { headers: headers(), ...opts });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ── LOAD DATA ────────────────────────────────────────────────────────────
  // Fires three API calls in parallel: dashboards, category M2M records, and
  // the user's saved preference. Joins them in memory, groups by category
  // (alphabetical, "Other" last), and updates state.
  async function loadData() {
    const dashP = new URLSearchParams({
      sysparm_query: 'active=true^certified=true^ORDERBYname',
      sysparm_display_value: 'all',
      sysparm_fields: 'sys_id,name,description,owner',
    });

    const m2mP = new URLSearchParams({
      sysparm_query: 'type=par_dashboard',
      sysparm_display_value: 'all',
      sysparm_fields: 'artifact_id,category,analytics_category,category_id',
    });

    const prefP = new URLSearchParams({
      sysparm_query: `name=${PREF_KEY}^user.user_name=javascript:gs.getUserName()`,
      sysparm_fields: 'sys_id,value',
      sysparm_limit: '1',
    });

    const [dashData, m2mData, prefData] = await Promise.all([
      apiFetch(`/api/now/table/par_dashboard?${dashP}`),
      apiFetch(`/api/now/table/analytics_category_m2m?${m2mP}`),
      apiFetch(`/api/now/table/sys_user_preference?${prefP}`).catch(() => ({ result: [] })),
    ]);

    const dashboards = (dashData.result || []).map(r => ({
      sys_id: dv(r.sys_id) || val(r.sys_id),
      name: dv(r.name) || val(r.name),
      description: dv(r.description) || val(r.description),
      owner: dv(r.owner),
      url: `${BASE}/now/platform-analytics-workspace/dashboards/params/edit/false/sys-id/${dv(r.sys_id) || val(r.sys_id)}`,
    }));

    // Build a map of dashboard sys_id → category names from the M2M table.
    // The category field name varies by instance — try all three known names.
    const catMap = new Map();
    for (const r of m2mData.result || []) {
      const id = val(r.artifact_id) || dv(r.artifact_id);
      if (!id) continue;
      const cat = firstNonEmpty(dv(r.category), dv(r.analytics_category), dv(r.category_id));
      if (!cat) continue;
      if (!catMap.has(id)) catMap.set(id, []);
      const arr = catMap.get(id);
      if (!arr.includes(cat)) arr.push(cat);
    }

    const groupMap = new Map();
    const uncategorized = [];
    for (const d of dashboards) {
      const cats = catMap.get(d.sys_id);
      if (!cats || cats.length === 0) { uncategorized.push(d); continue; }
      for (const cat of cats) {
        if (!groupMap.has(cat)) groupMap.set(cat, []);
        groupMap.get(cat).push(d);
      }
    }

    const sorted = Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, dbs]) => ({ name, dashboards: dbs }));
    if (uncategorized.length) sorted.push({ name: 'Other', dashboards: uncategorized });

    let orderMap = {};
    if (prefData.result && prefData.result.length > 0) {
      state.prefSysId = prefData.result[0].sys_id;
      try { orderMap = JSON.parse(prefData.result[0].value); } catch {}
    }

    state.categories = sorted;
    state.orderMap = orderMap;
    state.loading = false;
  }

  // ── SAVE PREFERENCE ──────────────────────────────────────────────────────
  // POSTs a new sys_user_preference record on the first save, then PATCHes
  // the same record on subsequent saves (using the cached prefSysId).
  async function savePreference() {
    const value = JSON.stringify(state.orderMap);
    try {
      if (state.prefSysId) {
        await apiFetch(`/api/now/table/sys_user_preference/${state.prefSysId}`, {
          method: 'PATCH',
          body: JSON.stringify({ value }),
        });
      } else {
        const data = await apiFetch('/api/now/table/sys_user_preference', {
          method: 'POST',
          body: JSON.stringify({ name: PREF_KEY, value }),
        });
        if (data.result?.sys_id) state.prefSysId = data.result.sys_id;
      }
    } catch (e) {
      console.warn('Failed to save preference:', e);
    }
  }

  // ── UTILITIES ────────────────────────────────────────────────────────────
  function el(tag, props) {
    const node = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (k === 'className') node.className = v;
        else if (k === 'draggable') node.draggable = v;
        else node[k] = v;
      }
    }
    return node;
  }

  // dv() extracts the display_value from a ServiceNow API field object.
  // val() extracts the raw value (sys_id). Both fall back to string fields.
  function dv(f) {
    return (f && typeof f === 'object' && f.display_value)
      ? f.display_value
      : (typeof f === 'string' ? f : '');
  }

  function val(f) {
    return (f && typeof f === 'object' && f.value)
      ? f.value
      : (typeof f === 'string' ? f : '');
  }

  function firstNonEmpty(...args) {
    return args.find(v => v && v.trim()) || '';
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ── BOOTSTRAP ────────────────────────────────────────────────────────────
  // Render immediately (shows spinner), then load data and re-render.
  render();

  loadData()
    .then(() => render())
    .catch(err => {
      state.loading = false;
      state.error = err.message || 'Unknown error';
      render();
    });

})();
</script>
</body>
</html>
```

---

### Step B2: Test

Navigate to:
```
https://<your-instance>.service-now.com/x_121762_my_dashbo_dashboard_directory.do
```

You should see a brief loading spinner, then the dashboard directory with category headings, cards, and the Cards/List toggle.

---

## Required Access Controls (ACLs)

ACLs control which users can read or write to each table. The logged-in user needs:

| Table | Operation | Notes |
|-------|-----------|-------|
| `par_dashboard` | read | Usually open to all authenticated users; may be restricted on locked-down instances |
| `analytics_category_m2m` | read | Usually open to all authenticated users |
| `sys_user_preference` | read + write | Open to all authenticated users by default |

If dashboards don't appear, the most likely cause is missing read access to `par_dashboard`. Check ACLs at `sys_security_acl_list.do`, filtering by table name.

---

## Adding a Navigation Module (Optional)

A navigation module adds the Dashboard Directory as a clickable link in ServiceNow's left nav panel.

1. Navigate to **System Definition > Application Menus** (`sys_app_application_list.do`)
2. Open or create the **My Dashboards** application menu
3. In the **Modules** related list, click **New**
4. Fill in the fields:

   | Field | Value |
   |-------|-------|
   | **Title** | `Dashboard Directory` |
   | **Order** | `100` |
   | **Link type** | `URL (from arguments)` |
   | **Arguments** | `x_121762_my_dashbo_dashboard_directory.do` |
   | **Application** | `My Dashboards` |
   | **Active** | ✅ Checked |

5. Click **Submit**

> If the module doesn't appear after saving, navigate to `/$flush.do` to clear the server-side cache, then refresh.
