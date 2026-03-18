# main.tsx

**Path:** `src/client/main.tsx`
**Role:** React entry point. Finds the `<div id="root">` element placed in the UI Page HTML and mounts the `App` component into it.

---

## Full Source

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'

const rootElement = document.getElementById('root')
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    )
}
```

---

## Notes

- `React.StrictMode` is enabled — this causes every component to render twice in development to help detect side effects, but has no effect in the production bundle
- The `if (rootElement)` guard prevents a crash if the page HTML changes and the `root` div is missing
- This file is the **Rollup entry point** referenced in `now.prebuild.mjs`; everything imported here (and transitively) is bundled into `main.jsdbx`
