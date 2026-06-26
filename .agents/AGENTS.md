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
