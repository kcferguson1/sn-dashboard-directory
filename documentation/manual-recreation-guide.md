# Manual Recreation Guide

A step-by-step guide to recreating the Dashboard Directory application entirely through the ServiceNow browser UI — no SDK, no local tooling required (for Path B), no command line.

This guide explains **every term, every concept, and every field value** so that someone unfamiliar with ServiceNow development can follow it from scratch.

---

## Table of Contents

1. [Key Concepts — Read This First](#key-concepts--read-this-first)
2. [Prerequisites](#prerequisites)
3. [Step 1 — Create the Scoped Application](#step-1--create-the-scoped-application)
4. [Path A — Upload the Pre-Built React Bundle](#path-a--upload-the-pre-built-react-bundle)
5. [Path B — Fully Self-Contained Vanilla JS (No Build Step)](#path-b--fully-self-contained-vanilla-js-no-build-step)
6. [Required Access Controls (ACLs)](#required-access-controls-acls)
7. [Adding a Navigation Module](#adding-a-navigation-module-optional)

---

## Key Concepts — Read This First

Before following any steps, read these explanations. They are referenced throughout the guide.

---

### What is a `sys_id`?

Every record in ServiceNow — every user, every table row, every configuration item — has a globally unique identifier called a `sys_id`. It is a 32-character hexadecimal string, for example: `e0b35e7055384c76ba79634ac818b719`.

You will see `sys_id` values throughout this guide. When you create a record (like a UI Page), ServiceNow automatically assigns it a new `sys_id`. You sometimes need to copy this ID and reference it elsewhere — for example, when linking a JavaScript bundle to the page that loads it.

---

### What is a Scoped Application?

A **Scoped Application** (also called a "scoped app") is a container in ServiceNow that groups related records together under a unique namespace called a **scope**. Think of it like a folder or a package.

The scope prefix (`x_121762_my_dashbo` in this project) is automatically prepended to the names of tables, endpoints, and other artifacts created within the application. This prevents naming conflicts between different apps on the same instance.

- **Scope format:** `x_{vendor_code}_{app_name}` — the vendor code is assigned when you register as a ServiceNow developer
- **Application scope:** `x_121762_my_dashbo`
- **Application name:** My Dashboards

When you see an endpoint like `x_121762_my_dashbo_dashboard_directory.do`, the first part (`x_121762_my_dashbo`) is the scope, and `dashboard_directory` is the name of the specific page.

---

### What is a UI Page?

A **UI Page** (`sys_ui_page`) is a ServiceNow record that stores a complete web page — HTML, JavaScript, and CSS — and serves it at a specific URL endpoint.

Think of it like a file on a web server. When a user navigates to `yourinstance.service-now.com/x_121762_my_dashbo_dashboard_directory.do`, ServiceNow finds the UI Page record with that endpoint, renders its HTML (evaluating any server-side tags along the way), and sends the result to the browser.

UI Pages are one of the oldest and most flexible ways to build custom pages in ServiceNow. They can contain:
- Static HTML
- Server-side Jelly scripting tags (like `<g:requires>`)
- References to JavaScript files
- Inline JavaScript and CSS

The `.do` suffix on the URL is a ServiceNow convention meaning "execute this page handler".

---

### What is `main.jsdbx`?

`main.jsdbx` is the compiled JavaScript bundle that contains the entire React application — all components, services, styles, and the React library itself — combined into a single file.

**Why `.jsdbx` and not `.js`?**

ServiceNow uses the `.jsdbx` extension for its own custom JavaScript delivery format. This is functionally identical to a standard `.js` file, but the `.jsdbx` extension tells ServiceNow's asset delivery system (`/uxasset/`) to handle it with special caching, cache-busting, and security headers. You cannot simply rename it to `.js` and serve it from a normal web server — it must go through ServiceNow's UX asset pipeline.

**What is inside it?**

The file is produced by a tool called **Rollup** (a JavaScript bundler), which:
1. Starts from `src/client/main.tsx` (the entry point)
2. Follows every `import` statement recursively
3. Compiles TypeScript → JavaScript
4. Compiles JSX (React's HTML-like syntax) → plain JavaScript function calls
5. Combines React 19, ReactDOM 19, all components, all services, and all CSS into one file
6. Minifies the result to reduce file size

The output is approximately 421 KB of minified JavaScript. When the browser loads this file, it runs the React application inside the `<div id="root">` element on the page.

---

### What is a UX Library Asset?

A **UX Library Asset** (`sys_ux_lib_asset`) is a ServiceNow record that stores a JavaScript file (or other static asset) and makes it available to the browser via the `/uxasset/externals/` URL path.

It is ServiceNow's version of a static file server entry. When you create a UX Library Asset named `x_121762_my_dashbo/main` and attach `main.jsdbx` to it, ServiceNow makes the file available at:

```
/uxasset/externals/x_121762_my_dashbo/main.jsdbx
```

The UI Page HTML then loads it with a `<script>` tag pointing to that URL.

---

### What is `window.g_ck`?

`g_ck` stands for **Glide Client Key** (also called the **session token** or **CSRF token**). It is a secret string that ServiceNow generates for each logged-in user session.

Every REST API call made from the browser must include this token in the `X-UserToken` HTTP header. ServiceNow checks this header to verify that the request is coming from a legitimate page session — not a cross-site request forgery (CSRF) attack. Without it, all API calls return a `403 Forbidden` error.

In the UI Page HTML you will see this line:

```javascript
window.g_ck = "$[gs.getSession().getSessionToken() || gs.getSessionToken()]";
```

The `$[...]` syntax is **server-side substitution** — ServiceNow evaluates the expression inside the brackets on the server before sending the HTML to the browser. By the time the browser sees the page, `g_ck` already contains the real token string (e.g. `"abc123def456..."`).

The JavaScript code then reads it as `window.g_ck` and includes it in every REST API request.

---

### What is `$[...]` (server-side substitution)?

ServiceNow UI Pages support a templating syntax where `$[expression]` is evaluated on the server before the page is delivered to the browser.

For example:
- `$[gs.getSession().getSessionToken()]` → runs the server-side Java/Groovy method and inserts the result (the session token string) directly into the HTML
- `$[UxFrameworkScriptables.getFlushTimestamp()]` → inserts a cache-busting timestamp number

This is different from client-side JavaScript. The `$[...]` expressions are executed by ServiceNow's server when processing the page request, not by the browser.

---

### What are `<g:requires>` tags?

`<g:requires>` is a server-side Jelly tag (ServiceNow's XML-based templating language) that tells ServiceNow to include a specific JavaScript file in the page's `<head>`.

For example:
```html
<g:requires name="scripts/lib/prototype.js"></g:requires>
```

This inserts a `<script>` tag pointing to ServiceNow's built-in `prototype.js` library. These are not custom files — they are internal ServiceNow JavaScript libraries that the platform provides. They must be loaded before your custom JavaScript runs because they initialise the global environment (`GlideAjax`, `GlideUser`, etc.) that the session needs.

You do not need to create or upload these files — they are already present on every ServiceNow instance.

---

### What does `direct: true` mean on a UI Page?

When **Direct** is checked on a UI Page, ServiceNow serves the page HTML exactly as written — without wrapping it in the standard ServiceNow navigation shell (the banner, left nav panel, header bar, etc.).

With `direct: false` (the default), your page would appear inside the full ServiceNow chrome, with the nav panel on the left and the header at the top. That's appropriate for pages that are part of the normal application navigation.

With `direct: true`, the page takes over the entire browser window. This is what we use so the Dashboard Directory has its own clean, full-screen layout without ServiceNow's chrome competing with it.

---

### What are `sysparm_query`, `sysparm_display_value`, and `sysparm_fields`?

These are URL query parameters for the **ServiceNow Table REST API** — the API used to read and write records from ServiceNow tables.

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `sysparm_query` | Filter which records are returned, using ServiceNow's encoded query syntax | `active=true^certified=true` |
| `sysparm_display_value` | Controls how reference fields are returned. `all` returns both the raw value (sys_id) and the human-readable display value | `all` |
| `sysparm_fields` | Comma-separated list of field names to return. Omitting this returns every field (slow) | `sys_id,name,description` |
| `sysparm_limit` | Maximum number of records to return | `100` |

**Encoded query syntax** uses `^` as AND and `^OR` as OR. For example:
- `active=true^certified=true` → active is true AND certified is true
- `ORDERBYname` → sort alphabetically by name (appended at the end)

**`sysparm_display_value=all`** is important because ServiceNow reference fields (like `owner`, which points to a user record) return two values when you use `all`:
```json
"owner": {
    "value": "6816f79cc0a8016401c5a33be04be441",
    "display_value": "System Administrator"
}
```
The `value` is the raw `sys_id` of the referenced record. The `display_value` is what a human would see. We use `display_value` to show the owner's name on the card.

---

### What is the `analytics_category_m2m` table?

This is a ServiceNow platform table that stores the **many-to-many relationship** between Performance Analytics dashboards and their categories.

A "many-to-many" relationship means: one dashboard can belong to multiple categories, and one category can contain multiple dashboards. A direct field on the dashboard record can only hold one category, so a separate junction table is needed.

Each row in `analytics_category_m2m` represents one link between one dashboard and one category:

| Field | Contains |
|-------|---------|
| `artifact_id` | The `sys_id` of the dashboard (`par_dashboard`) |
| `type` | The type of artifact — `par_dashboard` for PA dashboards |
| `category` | Reference to the category record |

To find all categories for a dashboard, you query this table filtering by `artifact_id = {dashboard_sys_id}` and `type = par_dashboard`.

---

### What is `sys_user_preference`?

`sys_user_preference` is a built-in ServiceNow table for storing arbitrary key-value pairs per user. ServiceNow itself uses it to remember things like which columns a user has pinned in a list, or what their timezone is.

We use it to store the user's custom dashboard sort order. The record looks like this:

| Field | Value |
|-------|-------|
| `name` | `x_121762_my_dashbo.dashboard_order` (our unique key) |
| `user` | Reference to the logged-in user's `sys_user` record |
| `value` | A JSON string: `{"Finance": ["sys_id_1", "sys_id_2"], "HR": ["sys_id_3"]}` |

Because `user` is scoped per-user, each person gets their own preference record. One user's order never affects another user's view.

---

## Prerequisites

- **Admin role** on your ServiceNow instance — required to create UI Pages, UX Library Assets, and Application records
- **The project source code** (from GitHub: `https://github.com/kcferguson1/sn-dashboard-directory`) — needed for Path A only
- **Node.js 18 or later** installed locally — needed for Path A only (to run the build)
- For **Path B**: nothing extra — just a browser and admin access

---

## Step 1 — Create the Scoped Application

> **Skip this step** if the "My Dashboards" application already exists on your instance (check by navigating to `https://<your-instance>.service-now.com/sys_app_list.do` and searching for "My Dashboards").

A scoped application must exist before you can create records inside it. All UI Pages, UX Library Assets, and other records created in this guide will be assigned to this application.

### Why do we need a scoped application?

Without a scope, any records you create belong to the "Global" application — meaning they share a namespace with all other global records on the instance. Scoped apps provide isolation: their records have a unique prefix, they can be exported/imported as a unit, and their access can be controlled independently.

### Steps

1. In your ServiceNow instance, use the **application navigator** (the search box in the top-left) and type `Studio`
2. Click **Studio** to open the Application Studio in a new tab
3. In the Studio welcome screen, click **Create Application**
4. Fill in the fields:

   | Field | Value | Why |
   |-------|-------|-----|
   | **Name** | `My Dashboards` | The human-readable name shown in the UI |
   | **Scope** | `x_121762_my_dashbo` | The unique namespace prefix. Enter this exactly — it must match what the code expects. If you use a different scope, you must update all references to `x_121762_my_dashbo` throughout the code and the documentation. |
   | **Version** | `0.0.1` | Semantic version — used for tracking changes |

5. Click **Create**
6. ServiceNow will create the application and open it in Studio
7. **Copy the `sys_id`** of the new application: navigate to `https://<your-instance>.service-now.com/sys_app_list.do`, find "My Dashboards", open it, and copy the `sys_id` from the URL or the record header

> **Note on scope names:** The scope `x_121762_my_dashbo` was generated for this developer account. If you are creating a new application from scratch on a different developer account, ServiceNow will assign you a different vendor code (the `121762` part). In that case, you can choose any scope name — just update every occurrence of `x_121762_my_dashbo` in the code and steps below.

---

## Path A — Upload the Pre-Built React Bundle

This path uses the compiled output of the SDK build process. You run one build command locally, which produces the `main.jsdbx` file. You then upload that file to ServiceNow and wire it up to a UI Page — everything after the build is done in the browser.

**When to choose Path A:**
- You want the full React application (TypeScript, components, proper state management)
- You have Node.js installed and can run `npm` commands
- You want the ability to modify the source code and redeploy updates

---

### Step A1: Build the JS bundle locally

The build process compiles the TypeScript + React source code into a single minified JavaScript file (`main.jsdbx`) that browsers can execute.

**What happens during the build:**
1. TypeScript checks all types and reports any errors
2. Rollup (the bundler) starts at `src/client/main.tsx` and follows every import
3. It compiles JSX syntax (`<div className="...">`) into `React.createElement(...)` calls
4. It combines React 19, ReactDOM 19, all components, services, and CSS into one file
5. It minifies the result (removes whitespace, shortens variable names) to reduce size
6. The output is written to `dist/static/main.jsdbx` (~421 KB)

**Commands to run:**

```bash
# 1. Open a terminal and navigate into the project folder
cd "/path/to/sn sdk app"

# 2. Install all npm dependencies (React, TypeScript, the ServiceNow SDK, etc.)
#    This reads package.json and downloads everything into node_modules/
#    Only needs to be run once, or when package.json changes
npm install

# 3. Run the SDK build
#    'npx' runs a package from node_modules without globally installing it
#    '@servicenow/sdk' is the ServiceNow SDK package
#    'build' is the command that triggers TypeScript compilation + Rollup bundling
npx @servicenow/sdk build
```

**Expected output:**
```
[now-sdk] Building project from ...
[now-sdk] Type check completed successfully
[now-sdk] Bundled chunk: main.jsdbx (421720 bytes)
[now-sdk] Build completed successfully
```

**The file you need:** `dist/static/main.jsdbx`

If the build fails with TypeScript errors, fix the reported issues before continuing. If it fails with a "module not found" error, run `npm install` first.

---

### Step A2: Create a UX Library Asset for the JS bundle

A **UX Library Asset** is the ServiceNow record that hosts the `main.jsdbx` file and makes it available at a URL that the UI Page can load.

Think of it like uploading a file to a CDN (content delivery network). ServiceNow stores the file as an attachment on this record and serves it at `/uxasset/externals/{asset-name}.jsdbx`.

**Steps:**

1. Navigate to the UX Library Assets list:
   ```
   https://<your-instance>.service-now.com/sys_ux_lib_asset_list.do
   ```
   > If you don't see this URL, search for "Library Assets" in the application navigator, or go to **UX Framework > Library Assets**

2. Click **New** to create a new record

3. Fill in the fields:

   | Field | Value | Why |
   |-------|-------|-----|
   | **Name** | `x_121762_my_dashbo/main` | This is the asset's identifier in ServiceNow's asset delivery system. The `/` is not a folder separator — the full string is the name. The URL it produces will be `/uxasset/externals/x_121762_my_dashbo/main.jsdbx`. The `x_121762_my_dashbo` prefix matches the scope so ServiceNow knows which application owns this asset. |
   | **Application** | `My Dashboards` | Links this asset to the scoped application created in Step 1 |

4. Click **Submit** (or **Save**) to create the record

5. The record will now be open. You will see a **paperclip icon** or an **Attachments** section at the bottom of the form. Click it to open the attachment manager.

6. Click **Add attachment** (or drag-and-drop) and select `dist/static/main.jsdbx` from your computer

7. After uploading, the asset is ready. Note the record's `sys_id` from the URL — you may need it for troubleshooting

> **Important:** The file must be attached with the filename `main.jsdbx` exactly. ServiceNow uses the filename (with the `.jsdbx` extension) to determine how to serve it.

---

### Step A3: Create the UI Page

The **UI Page** is the actual web page record. It stores the HTML that the browser receives when navigating to the page URL. This HTML is a shell — it loads the ServiceNow environment and then loads `main.jsdbx`, which contains the React application.

**Steps:**

1. Navigate to the UI Pages list:
   ```
   https://<your-instance>.service-now.com/sys_ui_page_list.do
   ```
   > Or search "UI Pages" in the application navigator → **System UI > UI Pages**

2. Click **New**

3. Fill in every field carefully:

   | Field | Value | Detailed Explanation |
   |-------|-------|---------------------|
   | **Name** | `dashboard_directory` | The internal record name. Must be lowercase with underscores. This becomes part of the endpoint URL. |
   | **Endpoint** | `x_121762_my_dashbo_dashboard_directory.do` | The full URL path users will navigate to. The format is `{scope}_{page_name}.do`. The scope prefix ensures it doesn't clash with other apps. The `.do` suffix is a ServiceNow convention for "execute this handler". |
   | **Description** | `Dashboard Directory` | A human-readable description shown in the record list — no functional effect |
   | **Direct** | ✅ **Checked** | When checked, the page renders without ServiceNow's navigation shell (the banner and left nav panel). The page takes over the full browser window. Leave unchecked if you want the page inside the standard SN chrome. |
   | **Category** | `general` | Groups UI pages for filtering purposes. `general` is the standard default category. |
   | **Application** | `My Dashboards` | Assigns the record to the scoped application. Start typing "My Dashboards" and select it from the dropdown. |

4. Locate the **HTML** field (a large text area, usually below the basic fields). Click into it and **select all existing content** (`Ctrl+A` / `Cmd+A`) and delete it.

5. Paste the following HTML **exactly as shown** (do not modify anything unless instructed):

```html
<html>
  <head>
    <title>Dashboard Directory</title>

    <!--
      SERVER-SIDE SETUP BLOCK
      ========================
      Everything in this <script> block runs on the ServiceNow SERVER before the
      page is sent to the browser. The $[...] syntax is server-side substitution —
      ServiceNow evaluates these expressions and replaces them with their values.

      window.NOW: Global configuration object that the ServiceNow client framework
      reads to understand the environment.

      window.g_ck: The session security token (CSRF token). Every REST API call
      this page makes must include this value in the X-UserToken header. Without it,
      all API calls will be rejected with a 403 error. ServiceNow generates a new
      token for each user session.
    -->
    <script>
      window.NOW = {};
      window.NOW.user = {};
      window.NOW.batch_glide_ajax_requests = false;
      window.NOW.isUsingPolaris = true;
      window.NOW.exclude_dark_theme = "false";
      window.g_ck = "$[gs.getSession().getSessionToken() || gs.getSessionToken()]";
    </script>

    <!--
      SERVICENOW FRAMEWORK SCRIPTS
      =============================
      These <g:requires> tags are Jelly (server-side XML templating) directives.
      ServiceNow evaluates them on the server and replaces each one with a <script>
      tag pointing to that built-in library file. These are NOT files you create —
      they are part of the ServiceNow platform.

      functions_bootstrap14.js  — Core ServiceNow bootstrap functions
      prototype.js              — Prototype.js, a JS utility library SN depends on
      GlideURL.js               — Helper for constructing ServiceNow URLs
      CustomEventManager.js     — ServiceNow's custom event system
      GlideAjax.js              — ServiceNow's AJAX helper class
      GlideUser.js              — Client-side user object (current user info)
    -->
    <g:requires name="scripts/doctype/functions_bootstrap14.js"></g:requires>
    <g:requires name="scripts/lib/prototype.js"></g:requires>
    <g:requires name="scripts/classes/ajax/GlideURL.js"></g:requires>
    <g:requires name="scripts/doctype/CustomEventManager.js"></g:requires>
    <g:requires name="scripts/classes/ajax/GlideAjax.js"></g:requires>
    <g:requires name="scripts/classes/GlideUser.js"></g:requires>

    <!--
      USER CLIENT SCRIPTS
      ====================
      This tag loads any client scripts that have been configured in the system
      for the current user's session context. It's a standard inclusion for most
      ServiceNow pages.
    -->
    <g2:client_script type="user"></g2:client_script>

    <!--
      YOUR REACT APPLICATION BUNDLE
      ==============================
      This loads the main.jsdbx file you uploaded in Step A2.

      The URL breaks down as:
        /uxasset/externals/   — ServiceNow's static asset delivery path
        x_121762_my_dashbo/   — The scope prefix of the application
        main.jsdbx            — The filename of the UX Library Asset you uploaded

      type="module" tells the browser this is an ES Module (modern JavaScript).
      The React application uses ES Module syntax (import/export), so this is required.

      ?uxpcb=$[UxFrameworkScriptables.getFlushTimestamp()]
        This is a cache-busting query parameter. Each time ServiceNow deploys an
        update, this timestamp changes — forcing browsers to download the new version
        instead of serving a cached copy. The $[...] is evaluated server-side.
    -->
    <script
      src="/uxasset/externals/x_121762_my_dashbo/main.jsdbx?uxpcb=$[UxFrameworkScriptables.getFlushTimestamp()]"
      type="module">
    </script>
  </head>
  <body>
    <!--
      REACT MOUNT POINT
      ==================
      This is the only element in the body. The React application (main.jsdbx)
      finds this element by its id="root" and mounts itself inside it.
      React then takes over and renders all the dashboard cards, category sections,
      and controls by writing into this div. The div starts empty — React fills it.
    -->
    <div id="root"></div>
  </body>
</html>
```

6. Click **Submit** to save the UI Page

---

### Step A4: Verify the asset URL resolves

Before testing the full page, confirm the JS file is being served correctly:

1. Open a new browser tab
2. Navigate to:
   ```
   https://<your-instance>.service-now.com/uxasset/externals/x_121762_my_dashbo/main.jsdbx
   ```
3. You should see a large block of minified JavaScript (it will look like garbled text — that's normal for minified code)
4. If you get a 404, the UX Library Asset name or the attachment filename is incorrect — go back to Step A2 and verify the **Name** field is exactly `x_121762_my_dashbo/main` and the attachment filename is `main.jsdbx`

---

### Step A5: Test the page

Navigate to:
```
https://<your-instance>.service-now.com/x_121762_my_dashbo_dashboard_directory.do
```

You should see the Dashboard Directory load with a spinner, followed by the category sections containing your dashboards.

**If the page loads but shows no dashboards:** The user you're logged in as may not have read access to `par_dashboard` or `analytics_category_m2m`. See the [ACL section](#required-access-controls-acls) below.

**If you see a JavaScript error in the browser console:** Open browser DevTools (`F12`), go to the Console tab, and look for the error. Common causes:
- `window.g_ck is undefined` — the server-side substitution in the HTML didn't run correctly; check that the `<script>` block with `window.g_ck = "$[...]"` is present and that the page is being served by ServiceNow (not a static file server)
- `Failed to fetch` — a REST API call failed; check the Network tab for the specific request and its response

---

## Path B — Fully Self-Contained Vanilla JS (No Build Step)

This path provides a **complete, self-contained HTML document** that implements the same Dashboard Directory using plain JavaScript — no React, no TypeScript, no build step, no file uploads. Everything is in a single block of HTML that you paste directly into the UI Page's HTML field.

**When to choose Path B:**
- You cannot install Node.js or run build commands
- You want the simplest possible setup (one paste, done)
- You're prototyping or doing a quick proof-of-concept
- You need to understand exactly how the page works without a build layer

**What is "vanilla JavaScript"?** It means plain JavaScript as supported by the browser — no frameworks, no libraries, no compilation. The application logic (fetching data, building the DOM, handling drag events) is implemented from scratch using standard browser APIs.

---

### Step B1: Create the UI Page

1. Navigate to:
   ```
   https://<your-instance>.service-now.com/sys_ui_page_list.do
   ```

2. Click **New**

3. Fill in the fields exactly as shown:

   | Field | Value |
   |-------|-------|
   | **Name** | `dashboard_directory` |
   | **Endpoint** | `x_121762_my_dashbo_dashboard_directory.do` |
   | **Description** | `Dashboard Directory` |
   | **Direct** | ✅ Checked |
   | **Category** | `general` |
   | **Application** | `My Dashboards` |

4. Clear the HTML field and paste the **entire block below** — from `<html>` to the closing `</html>`

5. Click **Submit**

---

### Complete Self-Contained HTML

This is everything — styles, markup structure, and JavaScript logic — in one file. Read the comments inside the code for explanations of every section.

```html
<html>
<head>
  <title>Dashboard Directory</title>

  <!--
    SESSION TOKEN
    =============
    ServiceNow evaluates "$[...]" on the server before sending this page to the browser.
    gs.getSession().getSessionToken() returns the current user's CSRF security token.
    All REST API calls from this page include this token in the X-UserToken header.
    Without it, every API call returns 403 Forbidden.
  -->
  <script>
    window.g_ck = "$[gs.getSession().getSessionToken() || gs.getSessionToken()]";
  </script>

  <style>
    /*
      CSS RESET + BASE
      =================
      box-sizing: border-box makes width/height calculations include padding and border,
      which is the expected behavior for modern layouts.
    */
    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0; padding: 0; background: #f8f9fa; min-height: 100vh;
    }

    /* ── HEADER ─────────────────────────────────── */
    .dir-header {
      background: #fff; border-bottom: 1px solid #e0e0e0;
      display: flex; flex-wrap: wrap; align-items: center;
      justify-content: space-between; gap: 16px; padding: 20px 32px;
    }
    .dir-header__title { color: #1f1f1f; font-size: 24px; font-weight: 700; margin: 0 0 4px; }
    .dir-header__subtitle { color: #666; font-size: 13px; margin: 0; }
    .dir-header__meta { display: flex; align-items: center; gap: 16px; }
    .dir-header__count { color: #555; font-size: 13px; }

    /* ── VIEW TOGGLE (Cards / List buttons) ──────── */
    .view-toggle { background: #f1f3f4; border-radius: 6px; display: flex; padding: 3px; }
    .view-toggle__btn {
      align-items: center; background: transparent; border: none; border-radius: 4px;
      color: #555; cursor: pointer; display: flex; font-size: 13px; font-weight: 500;
      gap: 5px; padding: 6px 12px; transition: background .15s, color .15s;
    }
    .view-toggle__btn svg { width: 15px; height: 15px; }
    .view-toggle__btn:hover { background: #e2e5e9; color: #1f1f1f; }
    /* The .active class is added/removed by JavaScript when a button is clicked */
    .view-toggle__btn.active {
      background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.15); color: #1a73e8;
    }

    /* ── MAIN CONTENT AREA ───────────────────────── */
    .dir-main { max-width: 1280px; margin: 0 auto; padding: 32px; }

    /* ── LOADING SPINNER ─────────────────────────── */
    .dir-loading {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; padding: 80px 0; color: #555; font-size: 14px;
    }
    .dir-spinner {
      width: 24px; height: 24px; border-radius: 50%;
      border: 3px solid #e0e0e0; border-top-color: #1a73e8;
      animation: spin .8s linear infinite;
    }
    /* CSS keyframe animation that rotates the spinner 360 degrees continuously */
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── ERROR BANNER ────────────────────────────── */
    .dir-error {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      background: #fce8e6; border: 1px solid #f28b82; border-radius: 6px;
      color: #c5221f; font-size: 14px; margin-bottom: 24px;
    }
    .dir-error__dismiss {
      margin-left: auto; background: transparent; border: 1px solid #c5221f;
      border-radius: 4px; color: #c5221f; cursor: pointer; font-size: 12px; padding: 3px 10px;
    }

    /* ── EMPTY STATE (no dashboards found) ───────── */
    .dir-empty { text-align: center; padding: 80px 0; color: #777; font-size: 14px; }

    /* ── CATEGORY SECTION ────────────────────────── */
    .cat-section { margin-bottom: 40px; }
    .cat-heading {
      display: flex; align-items: center; gap: 10px;
      border-bottom: 2px solid #1a73e8; padding-bottom: 8px; margin: 0 0 18px;
      color: #1f1f1f; font-size: 17px; font-weight: 700;
      letter-spacing: .02em; text-transform: uppercase;
    }
    /* Small pill badge showing the count of dashboards in this category */
    .cat-count {
      background: #e8f0fe; border-radius: 12px; color: #1a73e8;
      font-size: 12px; font-weight: 600; padding: 2px 8px;
    }

    /* ── CARD GRID ───────────────────────────────── */
    /*
      CSS Grid with auto-fill and minmax:
      - auto-fill: create as many columns as will fit
      - minmax(280px, 1fr): each column is at least 280px wide, but expands equally
      This creates a responsive grid that automatically adjusts column count.
    */
    .cat-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }

    /* ── DASHBOARD CARD (grid view) ──────────────── */
    .dash-card {
      background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
      cursor: grab;   /* Shows a hand/grab cursor — tells users this is draggable */
      display: flex; flex-direction: column;
      justify-content: space-between; min-height: 140px; padding: 18px 20px;
      position: relative; /* Needed so the drag handle (⠿) can be positioned absolutely */
      transition: box-shadow .18s, transform .18s, opacity .18s;
    }
    .dash-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.12); transform: translateY(-2px); }
    .dash-card:active { cursor: grabbing; }

    /* The ⠿ drag handle icon — hidden by default, shown on hover */
    .dash-card__handle {
      position: absolute; right: 10px; top: 10px; color: #bbb;
      font-size: 16px; opacity: 0; transition: opacity .15s; user-select: none;
    }
    .dash-card:hover .dash-card__handle { opacity: 1; }

    /* Visual state while this card is being dragged */
    .dash-card.is-dragging { border: 2px dashed #1a73e8; opacity: .4; transform: none; cursor: grabbing; }

    /* Visual state when another card is being dragged over this card (drop target) */
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

    /* ── LIST VIEW ───────────────────────────────── */
    .cat-list { list-style: none; margin: 0; padding: 0; }
    .cat-list-item {
      align-items: center; border-bottom: 1px solid #f0f0f0; cursor: grab;
      display: grid; gap: 2px 8px;
      /*
        CSS Grid named areas — defines a two-row, three-column layout:
        Row 1: [drag handle] [title]  [owner]
        Row 2: [drag handle] [description] [owner]
        The handle and owner span both rows (align-self: center handles the owner).
      */
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

<!--
  APPLICATION ROOT ELEMENT
  =========================
  The JavaScript below writes all HTML into this div using DOM manipulation.
  It starts empty — JavaScript fills it when the page loads.
  The id="app" is what the JavaScript uses to find this element.
-->
<div id="app"></div>

<script>
/*
  IMMEDIATELY INVOKED FUNCTION EXPRESSION (IIFE)
  ================================================
  The entire application is wrapped in (function() { ... })() to create a private
  scope. This means all variables declared inside (state, render, loadData, etc.)
  are not accessible from the global window object. This prevents naming conflicts
  with ServiceNow's own JavaScript.

  'use strict' enables strict mode, which catches common programming mistakes and
  prevents some unsafe features.
*/
(function () {
  'use strict';

  /*
    CONFIGURATION CONSTANTS
    ========================
    PREF_KEY: The unique name used to store the user's sort order in sys_user_preference.
              This must be globally unique across the instance, so we prefix it with
              the application scope.

    BASE: The root URL of the instance (e.g. "https://dev336871.service-now.com").
          Used to construct the full URL for each dashboard link.
  */
  const PREF_KEY = 'x_121762_my_dashbo.dashboard_order';
  const BASE = window.location.origin;

  /*
    APPLICATION STATE
    =================
    This single object holds all the data the application needs to render.
    When any value changes, we call render() to rebuild the UI from scratch.

    This pattern (single state object + re-render) is a simplified version of
    what React does internally.

    loading:      true while API calls are in flight — shows the spinner
    error:        non-null if any API call fails — shows the error banner
    categories:   array of { name, dashboards[] } — the grouped dashboard data
    orderMap:     { categoryName: [sys_id, sys_id, ...] } — saved sort order
    viewMode:     'grid' or 'list' — which layout to render
    prefSysId:    the sys_id of the sys_user_preference record, cached after
                  the first load so subsequent saves use PATCH instead of POST
    draggingId:   sys_id of the card currently being dragged
    dragOverId:   sys_id of the card being hovered over during a drag
    dragCategory: the category name of the item being dragged (used to prevent
                  cross-category drops)
  */
  let state = {
    loading: true,
    error: null,
    categories: [],
    orderMap: {},
    viewMode: 'grid',
    prefSysId: null,
    draggingId: null,
    dragOverId: null,
    dragCategory: null,
  };

  /*
    RENDER FUNCTION
    ===============
    Completely rebuilds the UI by:
    1. Finding the <div id="app"> element
    2. Clearing its contents (app.innerHTML = '')
    3. Building new DOM elements based on the current state
    4. Inserting them into the div

    This is called:
    - Once immediately on page load (shows the spinner)
    - After data finishes loading (shows the dashboards)
    - After any user interaction (view toggle, drag-and-drop)

    Re-rendering the whole page on every change is simple but works well for
    this scale of application. React optimises this process with a virtual DOM,
    but for ~50-100 cards, rebuilding from scratch is imperceptibly fast.
  */
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

  /*
    BUILD HEADER
    ============
    Renders the white top bar with the title, subtitle, dashboard count, and
    the Cards/List toggle buttons. The toggle buttons update state.viewMode
    and re-render when clicked.
  */
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

  /*
    BUILD MAIN
    ==========
    Renders the main content area. Shows one of:
    - A spinner (while loading)
    - An error banner (if loading failed)
    - An empty state message (if no dashboards found)
    - The list of category sections (normal case)
  */
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
      /*
        applyOrder reorders the dashboards array using the saved sort order from
        sys_user_preference. If no order is saved for this category, the original
        alphabetical order (from the API) is used.
      */
      const ordered = applyOrder(group.dashboards, state.orderMap[group.name]);
      main.appendChild(buildCategorySection(group.name, ordered));
    }

    return main;
  }

  function buildCategorySection(catName, dashboards) {
    const section = el('section', { className: 'cat-section' });

    const heading = el('h2', { className: 'cat-heading' });
    heading.appendChild(document.createTextNode(catName));
    const badge = el('span', { className: 'cat-count', textContent: String(dashboards.length) });
    heading.appendChild(badge);
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

  /*
    BUILD CARD
    ==========
    Creates one dashboard card for the grid view. The card:
    - Has draggable=true so the browser treats it as a drag source
    - Shows the ⠿ drag handle on hover
    - Applies CSS classes based on drag state (is-dragging, is-drag-over)
    - Contains the title link, description, and owner
    - Has drag event listeners attached via attachDragHandlers()
  */
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
    /*
      The external link icon (↗ arrow) is an inline SVG. Using SVG instead of
      a font icon or emoji ensures consistent rendering across browsers and OS.
    */
    link.innerHTML += `<svg class="dash-card__ext" viewBox="0 0 16 16" fill="none"><path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 2h5v5M14 2 8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    /*
      stopPropagation prevents the click on the link from also triggering any
      drag-related events on the parent card element.
    */
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

  /*
    DRAG AND DROP
    =============
    Uses the native HTML5 Drag-and-Drop API — no library needed.

    The four relevant events are:
      dragstart  — fires on the element being dragged, when the drag begins
      dragover   — fires repeatedly on elements the dragged item passes over
      drop       — fires on the element where the dragged item is released
      dragend    — fires on the original dragged element when the drag ends
                   (regardless of whether a valid drop occurred)

    Cross-category prevention: state.dragCategory records which category the
    drag started in. On drop, if state.dragCategory !== catName (the drop target's
    category), the drop is ignored.

    Debounced save: After a successful drop, scheduleSave() is called. It waits
    800ms before saving to sys_user_preference. If the user drops again within
    800ms, the timer resets — preventing excessive API calls during rapid drags.
  */
  let saveDebounceTimer = null;

  function attachDragHandlers(node, sysId, catName) {
    node.addEventListener('dragstart', () => {
      state.draggingId = sysId;
      state.dragCategory = catName;
    });

    node.addEventListener('dragover', e => {
      /*
        e.preventDefault() is REQUIRED to allow a drop to occur. By default,
        browsers do not allow dropping onto elements. Calling preventDefault()
        on dragover signals that this element accepts drops.
      */
      e.preventDefault();
      if (state.dragOverId !== sysId || state.dragCategory !== catName) {
        state.dragOverId = sysId;
        state.dragCategory = catName;
        render(); /* Re-render to show the blue drop target highlight */
      }
    });

    node.addEventListener('drop', () => {
      const srcId = state.draggingId;
      const srcCat = state.dragCategory;

      /* Ignore drops from a different category or dropping onto itself */
      if (!srcId || srcCat !== catName || srcId === sysId) {
        state.draggingId = null; state.dragOverId = null; state.dragCategory = null;
        render(); return;
      }

      /* Find the current positions of source and target in the ordered array */
      const group = state.categories.find(c => c.name === catName);
      if (!group) return;
      const ordered = applyOrder(group.dashboards, state.orderMap[catName]);
      const from = ordered.findIndex(d => d.sys_id === srcId);
      const to = ordered.findIndex(d => d.sys_id === sysId);

      if (from !== -1 && to !== -1 && from !== to) {
        /* Remove the dragged item from its old position and insert at new position */
        const next = [...ordered];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        /* Update the orderMap with the new sequence of sys_ids for this category */
        state.orderMap = { ...state.orderMap, [catName]: next.map(d => d.sys_id) };
        scheduleSave();
      }

      state.draggingId = null; state.dragOverId = null; state.dragCategory = null;
      render();
    });

    node.addEventListener('dragend', () => {
      /* Clean up drag state if the drag was cancelled (e.g. user pressed Escape) */
      state.draggingId = null; state.dragOverId = null; state.dragCategory = null;
      render();
    });
  }

  /*
    APPLY ORDER
    ===========
    Takes the server-provided dashboards array (in alphabetical order) and
    reorders it to match the user's saved order from sys_user_preference.

    Algorithm:
    1. Build a Map from sys_id → dashboard object for O(1) lookups
    2. Walk through the saved order array, pulling each dashboard out of the Map
       in the saved sequence
    3. Any dashboards that appear in the live data but NOT in the saved order
       (i.e. newly added since the user last saved) are appended at the end
       rather than being silently dropped

    This means the page gracefully handles new dashboards without requiring
    the user to reset their preferences.
  */
  function applyOrder(dashboards, savedOrder) {
    if (!savedOrder || savedOrder.length === 0) return dashboards;
    const byId = new Map(dashboards.map(d => [d.sys_id, d]));
    const ordered = [];
    for (const id of savedOrder) {
      const d = byId.get(id);
      if (d) { ordered.push(d); byId.delete(id); }
    }
    for (const d of byId.values()) ordered.push(d); /* append new dashboards */
    return ordered;
  }

  function scheduleSave() {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(savePreference, 800);
  }

  /*
    REST API HELPERS
    ================
    headers(): Returns the HTTP headers required for every ServiceNow Table API call.
      - Accept: tells ServiceNow to respond with JSON
      - Content-Type: tells ServiceNow the request body is JSON (for POST/PATCH)
      - X-UserToken: the CSRF security token from window.g_ck (see top of page)

    apiFetch(): A wrapper around the browser's fetch() API that:
      - Always includes the required headers
      - Throws an error if the response status is not OK (4xx/5xx)
      - Returns the parsed JSON body
  */
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

  /*
    LOAD DATA
    =========
    Makes three REST API calls in parallel using Promise.all():
      1. Fetch active+certified dashboards from par_dashboard
      2. Fetch category assignments from analytics_category_m2m
      3. Fetch the user's saved sort order from sys_user_preference

    Using Promise.all() means all three calls are sent simultaneously.
    The function waits until ALL three have responded before continuing.
    This is faster than making them sequentially.

    After the calls complete, the data is joined in memory:
    - Each M2M row maps a dashboard sys_id to a category name
    - Dashboards are grouped into { name, dashboards[] } objects
    - Categories are sorted alphabetically; uncategorized go to "Other"
  */
  async function loadData() {
    const dashP = new URLSearchParams({
      sysparm_query: 'active=true^certified=true^ORDERBYname',
      sysparm_display_value: 'all',   /* Return both raw values and display values */
      sysparm_fields: 'sys_id,name,description,owner', /* Only fetch what we need */
    });

    const m2mP = new URLSearchParams({
      sysparm_query: 'type=par_dashboard', /* Only rows linking to PA dashboards */
      sysparm_display_value: 'all',
      sysparm_fields: 'artifact_id,category,analytics_category,category_id',
    });

    const prefP = new URLSearchParams({
      /*
        javascript:gs.getUserName() is a server-side encoded query expression.
        ServiceNow evaluates this on the server to get the current user's username,
        so this query only returns the preference record for the logged-in user.
      */
      sysparm_query: `name=${PREF_KEY}^user.user_name=javascript:gs.getUserName()`,
      sysparm_fields: 'sys_id,value',
      sysparm_limit: '1',
    });

    const [dashData, m2mData, prefData] = await Promise.all([
      apiFetch(`/api/now/table/par_dashboard?${dashP}`),
      apiFetch(`/api/now/table/analytics_category_m2m?${m2mP}`),
      apiFetch(`/api/now/table/sys_user_preference?${prefP}`).catch(() => ({ result: [] })),
    ]);

    /* Transform dashboard records into our internal format */
    const dashboards = (dashData.result || []).map(r => ({
      sys_id: dv(r.sys_id) || val(r.sys_id),
      name: dv(r.name) || val(r.name),
      description: dv(r.description) || val(r.description),
      owner: dv(r.owner), /* display_value gives the user's full name, not their sys_id */
      url: `${BASE}/now/platform-analytics-workspace/dashboards/params/edit/false/sys-id/${dv(r.sys_id) || val(r.sys_id)}`,
    }));

    /* Build a Map<dashboardSysId, categoryName[]> from the M2M records */
    const catMap = new Map();
    for (const r of m2mData.result || []) {
      const id = val(r.artifact_id) || dv(r.artifact_id);
      if (!id) continue;
      /*
        The category field name varies by instance configuration.
        Try 'category', then 'analytics_category', then 'category_id'.
        Use the first one that has a non-empty display value.
      */
      const cat = firstNonEmpty(dv(r.category), dv(r.analytics_category), dv(r.category_id));
      if (!cat) continue;
      if (!catMap.has(id)) catMap.set(id, []);
      const arr = catMap.get(id);
      if (!arr.includes(cat)) arr.push(cat); /* deduplicate */
    }

    /* Group dashboards by category */
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

    /* Sort categories alphabetically and append "Other" last */
    const sorted = Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, dbs]) => ({ name, dashboards: dbs }));
    if (uncategorized.length) sorted.push({ name: 'Other', dashboards: uncategorized });

    /* Load saved order from preference (if a record exists) */
    let orderMap = {};
    if (prefData.result && prefData.result.length > 0) {
      state.prefSysId = prefData.result[0].sys_id; /* cache for future saves */
      try { orderMap = JSON.parse(prefData.result[0].value); } catch {}
    }

    state.categories = sorted;
    state.orderMap = orderMap;
    state.loading = false;
  }

  /*
    SAVE PREFERENCE
    ===============
    Writes the current orderMap to sys_user_preference.

    First save (no existing record): POST creates a new record.
      ServiceNow automatically assigns the record to the current user.
      We capture the new record's sys_id for future saves.

    Subsequent saves (record exists): PATCH updates only the 'value' field.
      Using PATCH instead of PUT means we only send the changed field,
      not the entire record. This is more efficient and avoids accidentally
      overwriting other fields.
  */
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

  /*
    UTILITY FUNCTIONS
    =================
    el(tag, props): Creates a DOM element with the given tag and properties.
      Shorthand to avoid writing document.createElement() and setAttribute() repeatedly.
      Handles className specially because 'class' is a reserved word in JavaScript.

    dv(field): Extracts the display_value from a ServiceNow API field.
      When sysparm_display_value=all is used, fields come back as objects:
        { "value": "6816f79cc0a8016401c5a33be04be441", "display_value": "System Administrator" }
      dv() returns the display_value (human-readable).
      If the field is a plain string (not an object), returns it directly.

    val(field): Same as dv() but returns the raw value (the sys_id).

    firstNonEmpty(...args): Returns the first argument that is a non-empty string.
      Used to try multiple field names for the category (since different instances
      use different field names in analytics_category_m2m).

    escHtml(s): Escapes HTML special characters to prevent XSS injection when
      inserting text into innerHTML. Any error message from the API could contain
      characters like < > & that would break HTML if inserted directly.
  */
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

  /*
    BOOTSTRAP — APPLICATION START
    ==============================
    1. Call render() immediately — this shows the loading spinner right away,
       giving the user visual feedback while the API calls are in flight.

    2. Call loadData() — this fires all three API calls in parallel and waits
       for them to complete.

    3. When loadData() resolves, call render() again — this time state.loading
       is false and state.categories is populated, so the dashboards are shown.

    4. If loadData() rejects (any API call failed), catch the error, store it
       in state.error, and render() to show the error banner.
  */
  render(); /* Show spinner immediately */

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

### Step B2: Test

Navigate to:
```
https://<your-instance>.service-now.com/x_121762_my_dashbo_dashboard_directory.do
```

You should see the loading spinner briefly, then the dashboard directory with category headings, cards, and the Cards/List toggle in the header.

---

## Required Access Controls (ACLs)

**What is an ACL?** An Access Control List (ACL) is a ServiceNow record that defines who can read, write, create, or delete records in a specific table. If a user does not have a matching ACL, their API call returns a `403 Forbidden` or returns empty results.

For this page to function correctly, the logged-in user must have:

| Table | Operation | Why it's needed | Default access |
|-------|-----------|-----------------|----------------|
| `par_dashboard` | `read` | To retrieve the list of dashboards | Usually open to all authenticated users, but may be restricted on locked-down instances |
| `analytics_category_m2m` | `read` | To retrieve which category each dashboard belongs to | Usually open to all authenticated users |
| `sys_user_preference` | `read` | To load the user's saved card order on page load | Open to all authenticated users by default |
| `sys_user_preference` | `write` / `create` | To save the card order after a drag-and-drop | Open to all authenticated users by default |

**If dashboards don't appear:** The most likely cause is that the logged-in role doesn't have read access to `par_dashboard`. Ask an admin to check the ACLs on that table, or test while logged in as an admin.

**To check ACLs:** Navigate to `https://<your-instance>.service-now.com/sys_security_acl_list.do` and filter by the table name in question.

---

## Adding a Navigation Module (Optional)

**What is a Navigation Module?** The left navigation panel in ServiceNow is built from "Application Menus" (the headings) and "Modules" (the individual links). You can add a module that links directly to the Dashboard Directory page so users can find it in the nav panel without knowing the URL.

### Steps

1. Navigate to **System Definition > Application Menus**:
   ```
   https://<your-instance>.service-now.com/sys_app_application_list.do
   ```

2. Search for or create an application menu for **My Dashboards**

3. In the **Modules** related list at the bottom of the record, click **New**

4. Fill in the module fields:

   | Field | Value | Explanation |
   |-------|-------|-------------|
   | **Title** | `Dashboard Directory` | The text shown in the nav panel |
   | **Order** | `100` | Controls sort order within the menu (lower = higher) |
   | **Link type** | `URL (from arguments)` | Tells ServiceNow to navigate to a URL when clicked |
   | **Arguments** | `x_121762_my_dashbo_dashboard_directory.do` | The relative URL path — ServiceNow prepends the instance base URL |
   | **Application** | `My Dashboards` | Scopes the module to this application |
   | **Active** | ✅ Checked | Must be checked for the module to appear in the nav |

5. Click **Submit**

6. Users with the appropriate roles will now see **Dashboard Directory** appear under **My Dashboards** in the left navigation panel. They may need to refresh the page or clear their navigation cache for it to appear.

> **Tip:** If the menu doesn't appear after saving, navigate to `https://<your-instance>.service-now.com/$flush.do` to flush the server-side cache, then refresh.
