# Platform Objects

Every ServiceNow record created or managed by this application, with full field values and navigation paths.

---

## 1. Scoped Application — `sys_app`

The container for all application records. All objects below are owned by this scope.

| Field | Value |
|-------|-------|
| Table | `sys_app` |
| sys_id | `e0b35e7055384c76ba79634ac818b719` |
| Name | My Dashboards |
| Scope | `x_121762_my_dashbo` |
| Version | 0.0.1 |
| Active | true |

**Navigate to:** `https://dev336871.service-now.com/sys_app.do?sys_id=e0b35e7055384c76ba79634ac818b719`

---

## 2. UI Page — `sys_ui_page`

The page served to the browser. Contains the HTML shell that bootstraps ServiceNow globals and loads the React bundle.

| Field | Value |
|-------|-------|
| Table | `sys_ui_page` |
| sys_id | `c79cdb88ed104d5ca1ac7c7dfc3d61cd` |
| Name | `dashboard_directory` |
| Endpoint | `x_121762_my_dashbo_dashboard_directory.do` |
| Description | Dashboard Directory |
| Direct | `true` (bypasses the ServiceNow chrome/frame) |
| Category | `general` |
| Scope | `x_121762_my_dashbo` |

**Navigate to:** `https://dev336871.service-now.com/sys_ui_page.do?sys_id=c79cdb88ed104d5ca1ac7c7dfc3d61cd`

**Access the page at:** `https://dev336871.service-now.com/x_121762_my_dashbo_dashboard_directory.do`

### HTML Field (full content)

```html
<html>
  <head>
    <title>Incident Response Manager</title>
    <!-- Initialize globals and Include ServiceNow's required scripts -->
    <!-- @sdk:now-ux-globals -->
    <!-- Resolved from sdk:now-ux-globals tag at NowSDK build time to support earlier Glide releases -->
    <script>window.NOW = {};
window.NOW.user = {};
window.NOW.batch_glide_ajax_requests = false;
window.NOW.isUsingPolaris = true;
window.NOW.exclude_dark_theme = "false";
window.g_ck = "$[gs.getSession().getSessionToken() || gs.getSessionToken()]";</script>
    <!-- Include ServiceNow's required scripts -->
    <g:requires name="scripts/doctype/functions_bootstrap14.js"></g:requires>
    <g:requires name="scripts/lib/prototype.js"></g:requires>
    <g:requires name="scripts/classes/ajax/GlideURL.js"></g:requires>
    <g:requires name="scripts/doctype/CustomEventManager.js"></g:requires>
    <g:requires name="scripts/classes/ajax/GlideAjax.js"></g:requires>
    <g:requires name="scripts/classes/GlideUser.js"></g:requires>
    <g2:client_script type="user"></g2:client_script>
    <link rel="preload" href="/uxasset/set-cache-buster/$[UxFrameworkScriptables.getFlushTimestamp()].js" as="script"></link>
    <g:requires name="scripts/polaris_theme_refresh_observer.js"></g:requires>
    <link data-source-id="glide-theme" id="polarisberg_theme_variables" rel="stylesheet" href="/$uxappimmutables.do?sysparm_request_type=ux_theme$[AMP]sysparm_app_sys_id=c86a62e2c7022010099a308dc7c26022$[AMP]uxpcb=$[sn_ui.PolarisUI.getThemeVariableCssCacheKey()]"></link>
    <script type="module" src="/uxasset/externals/@devsnc/library-uxf/index.jsdbx"></script>
    <!-- Include your React entry point -->
    <script src="/uxasset/externals/x_121762_my_dashbo/main.jsdbx?uxpcb=$[UxFrameworkScriptables.getFlushTimestamp()]" type="module"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### Key points about the HTML
- `window.g_ck` is set server-side to the session token — used as the `X-UserToken` header in all REST calls
- `window.NOW.isUsingPolaris = true` enables the Polaris (Next Experience) theme
- The React bundle is loaded from `/uxasset/externals/x_121762_my_dashbo/main.jsdbx` — this is the UX Library Asset below
- The `<div id="root">` is where React mounts
- `?uxpcb=...` is a cache-busting parameter automatically injected by ServiceNow

---

## 3. UX Library Asset — JavaScript Bundle — `sys_ux_lib_asset`

The compiled React application bundle. Contains all components, services, and styles tree-shaken and minified by Rollup.

| Field | Value |
|-------|-------|
| Table | `sys_ux_lib_asset` |
| sys_id | `34ff804d687c465ebc03d41b89e4d9ce` |
| Name | `x_121762_my_dashbo/main` |
| File name | `main.jsdbx` |
| Size | ~421 KB |
| Scope | `x_121762_my_dashbo` |
| Served at | `/uxasset/externals/x_121762_my_dashbo/main.jsdbx` |

**Navigate to:** `https://dev336871.service-now.com/sys_ux_lib_asset.do?sys_id=34ff804d687c465ebc03d41b89e4d9ce`

This asset contains the compiled output of:
- `src/client/main.tsx`
- `src/client/app.tsx`
- `src/client/components/CategorySection.tsx`
- `src/client/components/DashboardCard.tsx`
- `src/client/services/DashboardService.ts`
- `src/client/services/PreferenceService.ts`
- All associated CSS files (inlined by the bundler)
- React 19 + ReactDOM 19 (bundled in)

---

## 4. UX Library Asset — Source Map — `sys_ux_lib_asset`

The source map for the JS bundle. Used by browser DevTools to show original TypeScript/React source during debugging.

| Field | Value |
|-------|-------|
| Table | `sys_ux_lib_asset` |
| sys_id | `9da2bcc962f74af1aa61276fa89a9c9f` |
| Name | `x_121762_my_dashbo/main.js.map` |
| File name | `main.jsdbx.map` |
| Size | ~2.6 MB |
| Scope | `x_121762_my_dashbo` |
| Served at | `/uxasset/externals/x_121762_my_dashbo/main.js.map` |

**Navigate to:** `https://dev336871.service-now.com/sys_ux_lib_asset.do?sys_id=9da2bcc962f74af1aa61276fa89a9c9f`

---

## 5. Glider Source Artifact — `sn_glider_source_artifact`

SDK-internal record that groups the UI page and its compiled assets together as a deployable unit. Managed automatically by `npx @servicenow/sdk build`.

| Field | Value |
|-------|-------|
| Table | `sn_glider_source_artifact` |
| sys_id | `7b17b120e51f401ca645f9a71a8122c6` |
| Name | `x_121762_my_dashbo_dashboard_directory.do - BYOUI Files` |
| Scope | `x_121762_my_dashbo` |

---

## 6. Glider Source Artifact M2M — `sn_glider_source_artifact_m2m`

Three junction records linking the source artifact to the individual application files. Managed automatically by the SDK.

| sys_id | application_file | source_artifact | Purpose |
|--------|-----------------|-----------------|---------|
| `2f90c27660314fa385626546dee61996` | `c79cdb88ed104d5ca1ac7c7dfc3d61cd` (UI Page) | `7b17b120e51f401ca645f9a71a8122c6` | Links UI page to artifact |
| `65c002f6ca7644ec896fa9c24164c374` | `34ff804d687c465ebc03d41b89e4d9ce` (JS bundle) | `7b17b120e51f401ca645f9a71a8122c6` | Links JS bundle to artifact |
| `7265773ad8cb4e5d83555bca954e7d39` | `9da2bcc962f74af1aa61276fa89a9c9f` (source map) | `7b17b120e51f401ca645f9a71a8122c6` | Links source map to artifact |

---

## 7. System Module Records — `sys_module`

SDK-internal metadata records that track the project's `bom.json` and `package.json` as application files. Not user-facing.

| sys_id | Purpose |
|--------|---------|
| `377ef879bf11401eb4daeee5e27c0c57` | Tracks `bom.json` (CycloneDX bill of materials — dependency snapshot) |
| `8bd4ea1a4a344c678ff078cf9b12170e` | Tracks `package.json` (project manifest) |

---

## 8. User Preference Records — `sys_user_preference` (runtime, per-user)

Created at runtime (not at deploy time) when a user first reorders a dashboard card. One record per user.

| Field | Value |
|-------|-------|
| Table | `sys_user_preference` |
| sys_id | *(generated per user at first save)* |
| Name | `x_121762_my_dashbo.dashboard_order` |
| User | *(reference to `sys_user` — the logged-in user)* |
| Value | JSON string: `{ "Category Name": ["sys_id_1", "sys_id_2", ...], ... }` |

### Example value

```json
{
  "Finance": ["abc123", "def456", "ghi789"],
  "HR": ["jkl012", "mno345"],
  "Other": ["pqr678"]
}
```

**To view all saved preferences:**
Navigate to `https://dev336871.service-now.com/sys_user_preference_list.do?sysparm_query=name=x_121762_my_dashbo.dashboard_order`

---

## Summary Table

| # | Table | sys_id | Name / Endpoint | Created by |
|---|-------|--------|-----------------|-----------|
| 1 | `sys_app` | `e0b35e7055384c76ba79634ac818b719` | My Dashboards | SDK init |
| 2 | `sys_ui_page` | `c79cdb88ed104d5ca1ac7c7dfc3d61cd` | `x_121762_my_dashbo_dashboard_directory.do` | SDK build + install |
| 3 | `sys_ux_lib_asset` | `34ff804d687c465ebc03d41b89e4d9ce` | `x_121762_my_dashbo/main` | SDK build + install |
| 4 | `sys_ux_lib_asset` | `9da2bcc962f74af1aa61276fa89a9c9f` | `x_121762_my_dashbo/main.js.map` | SDK build + install |
| 5 | `sn_glider_source_artifact` | `7b17b120e51f401ca645f9a71a8122c6` | `x_121762_my_dashbo_dashboard_directory.do - BYOUI Files` | SDK build + install |
| 6 | `sn_glider_source_artifact_m2m` | *(3 records)* | *(junction records)* | SDK build + install |
| 7 | `sys_module` | *(2 records)* | `bom.json`, `package.json` | SDK init |
| 8 | `sys_user_preference` | *(per user)* | `x_121762_my_dashbo.dashboard_order` | Runtime (on first drag) |
