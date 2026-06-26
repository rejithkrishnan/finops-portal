# FinOps Portal Project Customization Rules

## TypeScript & React Import Guardrails
*   **Prevent Namespace Collisions with Icon Libraries**: When importing icons from libraries (such as `lucide-react`) whose names match local TypeScript data interfaces or models (e.g., `Server` or `Database`), always alias the icon imports using the `as` keyword (e.g., `Server as ServerIcon`, `Database as DatabaseIcon`). Keep the actual data interfaces under their clean names.

## Windows Scripting & Process Management
*   **Robust Service Port Cleanup**: When stopping or restarting background web or API servers in Windows shell scripts (`.bat` / `.cmd`), do not rely solely on window titles or names. Always check for and terminate any active processes listening on the service ports (e.g., frontend port `5173` or backend port `3001`) using `netstat` and `taskkill`:
    ```cmd
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
    ```

## Axis Bank Brand Design Guidelines (Light Mode)
*   **Clean Minimalist Card Theme**:
    *   **Page Background**: Use a clean, soft off-white background (`#f6f6f8`).
    *   **Card Containers**: Use pure white backgrounds (`#ffffff`) for card layouts (`.glass-card`), modals, and main views.
    *   **Axis Accents**: Apply subtle burgundy-tinted borders (`rgba(151, 20, 77, 0.12)`) and light drop shadows to card containers to make them pop elegantly without using heavy pink backgrounds.
*   **No Grey Pills or Badges in Light Mode**: Never use `bg-surface-700`, `bg-surface-800`, or raw grey Tailwind classes for count pills, env-type tags, or status chips in light mode. Instead use the `.surface-pill` CSS utility class which applies a soft burgundy-tinted background (`brand-50`, `#fee2f7`) with burgundy text (`#97144d`) and a matching border. This ensures all small UI elements stay on-brand.
*   **Table Row Hover — Burgundy Tint**: In light mode, `table-row` hover states must use a soft burgundy tint (`rgba(254, 242, 247, 0.65)`) instead of the default grey `surface-800`. This is already handled in `index.css` via `.light .table-row:hover`. Do not override this with inline Tailwind hover classes.

## Responsive Layout Guidelines
*   **All pages must be responsive.** Use Tailwind responsive prefixes throughout. Never use fixed column counts without breakpoint variants.
*   **Standard grid breakpoints**:
    *   Summary/stat cards: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`
    *   Chart rows: `grid-cols-1 lg:grid-cols-3`
    *   Modal form grids: `grid-cols-1 sm:grid-cols-2`
*   **Sidebar-aware main content**: The main content area margin is driven by `SidebarContext` — do NOT use static `ml-[240px]`. The `MainLayout` uses `motion.div` with `animate={{ marginLeft: collapsed ? 64 : 240 }}` so it tracks the sidebar animation in sync.
*   **Jump-to sidebars**: Hide navigation sidebars on mobile with `hidden lg:block`. They reappear at `lg` breakpoint (1024px+).
*   **Tables**: Always set a `min-w-[Xpx]` on `<table>` inside an `overflow-x-auto` container so rows scroll horizontally instead of overflowing on narrow viewports.
*   **Headers and action bars**: Use `flex-col sm:flex-row` with `gap-3` so search inputs and action buttons wrap vertically on mobile without clipping.

## Sidebar Context Pattern
*   **`SidebarContext`** (`src/contexts/SidebarContext.tsx`) is the single source of truth for collapsed state.
    *   `SidebarProvider` is the **default export** (so Fast Refresh treats the file as component-only).
    *   `useSidebar` and `SidebarContext` are **named exports**.
    *   Import the provider as: `import SidebarProvider from './contexts/SidebarContext'`
    *   Import the hook as: `import { useSidebar } from '../../contexts/SidebarContext'`
*   **Never** add a second local `useState` for sidebar collapse state anywhere. Always consume `useSidebar()`.

## React Fast Refresh Rules
*   A file that mixes React component exports with non-component exports (hooks, constants, plain functions) will break Fast Refresh hot-reloading in Vite.
*   **Fix**: Make the React component the **default export**. Keep hooks/utils as named exports in the same file only if the primary export is a component. For heavily mixed files, split into separate files.

