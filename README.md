# 🏛️ Axis Bank Finacle Operations Portal (FinOps Portal)

A modern, extensible operations and infrastructure management dashboard for Finacle core banking servers and databases. Built on a modular, three-layer database-configurable architecture, this platform empowers Axis Bank operations teams to manage environments, execute End of Day (EOD) jobs, monitor system health, and orchestrate service deployments from a centralized, secure interface.

---

## 🚀 Key Capabilities

- **🖥️ Environment & Server Registry**: Full-scale infrastructure topology mapping. Maintain hosts, IP addresses, specs (OS, Cores, Memory), site types (DC/DR), environment tiers (DEV, UAT, PROD), and servers across diverse roles (WEB, WAS, APP, SMS, LB, DB).
- **🔋 Three-Layer EOD Orchestration**: Initiates and monitors critical End-of-Day (EOD) processes.
  1. **Frontend Interface**: React-based monitoring and execution triggers.
  2. **Application Layer**: Central Node.js server orchestrating requests and maintaining status logs.
  3. **Local Agent**: A lightweight Python HTTP agent deployed directly on AIX/Linux Finacle servers to securely execute tasks locally.
- **🔌 Database-Configurable Portal**: Add new applications directly in the database (or via admin dashboard in the future) and they will immediately populate the sidebar navigation and metrics dashboards dynamically without code changes.
- **🛡️ Secure Access & RBAC**: Integrated JWT authentication with Access/Refresh token rotation and role-based access controls (`ADMIN`, `OPERATOR`, `VIEWER`).
- **📊 Real-time Monitoring & Statistics**: Deep insight visualization for active servers, database health (Oracle 19c, PostgreSQL), and batch-job runs.
- **🌓 Dual Theme Support**: Smooth toggle between Light and Dark modes, dynamically adjusting system colors, tables, and charting axes on the fly.

---

## 🏗️ System Architecture

```mermaid
graph TD
    %% Styling
    classDef client fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef app fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef db fill:#ec4899,stroke:#be185d,stroke-width:2px,color:#fff;
    classDef agent fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;
    
    %% Components
    subgraph client_layer ["Client Layer - React SPA"]
        A[Sidebar Layout]
        B[LoginPage]
        C[Environments Dashboard]
        D[EOD Orchestration UI]
    end
    
    subgraph app_layer ["Application Layer - Express API Server"]
        E[Auth Middleware]
        F[API Routers]
        G[Environments Service]
        H[EOD Execution Engine]
    end

    subgraph db_layer ["Persistence Layer"]
        I[(PostgreSQL DB)]
    end

    subgraph agent_layer ["Finacle Server Agents"]
        J[Python Agent - APP 01]
        K[Python Agent - APP 02]
    end

    %% Connections
    client_layer -->|HTTPS / JWT Auth| app_layer
    app_layer -->|Prisma Client| db_layer
    app_layer -->|Secure REST Trigger| agent_layer
    
    class A,B,C,D client;
    class E,F,G,H app;
    class I db;
    class J,K agent;
```

---

## 🛠️ Technology Stack

### Frontend
- **React 19** & **TypeScript** — Component structure and type safety.
- **Vite** — Lightweight and ultra-fast build tooling.
- **Tailwind CSS** — Custom UI design system with high fidelity styles.
- **Framer Motion** — Smooth animations and interface transitions.
- **Lucide React** — Premium iconography.
- **React Router Dom (v7)** — Client-side SPA routing with protected route wrappers.
- **Recharts** — System usage and infrastructure metrics rendering.

### Backend
- **Express 5** & **TypeScript** — RESTful backend logic.
- **Prisma ORM** — Modern database interface and type generation.
- **PostgreSQL** — Primary relational database for configuration and operational logging.
- **BCrypt.js** & **JSON Web Tokens (JWT)** — Secure credentials hashing and stateless sessions.
- **TSX** — Fast, watch-enabled TypeScript execution tool.

---

## 📁 Repository Structure

```text
finops-portal/
├── db/                         # Database orchestration and helpers
│   ├── docker-compose.yml      # Starts PostgreSQL container on port 54332
│   ├── start.bat               # Helper script to launch database
│   └── stop.bat                # Helper script to stop database
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema models (User, Application, Server, DB, etc.)
│   │   └── seed.ts             # Default admin, role, server, and application records
│   ├── src/
│   │   ├── core/               # Global features (Auth, DB connection, middleware, config)
│   │   ├── plugins/            # Feature directories (e.g., Environments)
│   │   └── server.ts           # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Shared layouts, inputs, and UI widgets
│   │   ├── contexts/           # Global states (Auth context, Toast configurations)
│   │   ├── layouts/            # Sidebar navigation container
│   │   ├── pages/              # Dashboards, environments, and login screens
│   │   ├── services/           # Axios interceptors and endpoints
│   │   └── main.tsx            # React application mount
│   ├── package.json
│   └── vite.config.ts
├── start_all.bat               # Starts all three layers (DB, BE, FE) on Windows
├── start_all.sh                # Starts all three layers on Linux/WSL/Git Bash
├── stop_all.bat                # Stops all three layers on Windows
└── requirement.txt             # Original bank specifications and offline constraints
```

---

## ⚙️ Quick Start & Local Setup

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Docker Desktop** (running)

### 🚀 Standard Quick Start (All Services)
You can spin up all layers (PostgreSQL DB, Backend Server, and Frontend Web) simultaneously using the root orchestration scripts:
- **On Windows (CMD/PowerShell)**: 
  - **Start all**: Double-click or run [start_all.bat](file:///d:/Coding/finops-portal/start_all.bat) at the root level.
  - **Stop all**: Double-click or run [stop_all.bat](file:///d:/Coding/finops-portal/stop_all.bat) at the root level.
- **On Unix/Git Bash/WSL**: 
  - **Start & Stop**: Run `./start_all.sh` at the root level, and press `Ctrl+C` in that terminal to stop all services.

Both start scripts will automatically:
1. Start the Docker database container.
2. Check and install package dependencies in `/backend` and `/frontend`.
3. Generate the Prisma database client.
4. Launch backend and frontend development servers.

---

### 🔧 Manual Step-by-Step Setup

#### 1. Database Startup & Configuration
If you prefer starting services manually:

##### A. Starting the Database via Docker
1. Ensure **Docker Desktop** is running.
2. Run [start.bat](file:///d:/Coding/finops-portal/db/start.bat) inside the `db` directory to launch PostgreSQL on port `54332`.
3. To stop it, run [stop.bat](file:///d:/Coding/finops-portal/db/stop.bat).

##### B. Backend Environment File Configuration
In the `/backend/` directory, create a `.env` file containing:

```env
PORT=3001
NODE_ENV=development

# Adjust username, password, host, port (54332), and db name according to setup
DATABASE_URL="postgresql://postgres:postgres@localhost:54332/finops_portal?schema=public"

JWT_SECRET=finops-portal-secret-key-change-in-production
JWT_REFRESH_SECRET=finops-portal-refresh-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

#### 2. Backend Installation & Startup
Open a terminal in the `/backend/` directory:

```bash
# Install dependencies
npm install

# Generate Prisma Client models
npm run db:generate

# Synchronize / Migrate database schema (choose one):
# A) Push schema directly (Recommended for fresh local containers):
npm run db:push
# B) Run Prisma migrations (For tracking versioned schema changes):
npm run db:migrate

# Seed database with base roles, test environments, and default admin user
npm run db:seed

# Start backend dev server
npm run dev
```

> **Default Seed Admin Login Credentials**:
> - **Username**: `admin`
> - **Password**: `admin123`

### 3. Frontend Installation & Startup
Open a terminal in the `/frontend/` directory:

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔒 Offline Deployment & Bank Production Delivery

Axis Bank staging and production environments operate on **isolated/offline networks**. To bundle and transfer this portal:

1. **Pre-Cache Node Packages**: Run installation on an internet-enabled PC, then bundle `node_modules` or host a local offline NPM registry (e.g., using `verdaccio` or caching `.tgz` tarballs).
2. **Offline Seed Packages**: The repository maintains standard package lockfiles. Use `npm ci --offline` once the cache is transferred.
3. **Dockerization (Delivery Container)**:
   - Containerize both applications by packaging standard Dockerfiles:
     ```dockerfile
     # Sample Backend Dockerfile
     FROM node:18-alpine
     WORKDIR /app
     COPY package*.json ./
     RUN npm ci --omit=dev
     COPY . .
     RUN npm run db:generate && npm run build
     EXPOSE 3001
     CMD ["npm", "start"]
     ```
   - Build image archives:
     ```bash
     docker save -o finops-backend.tar finops-backend:latest
     docker save -o finops-frontend.tar finops-frontend:latest
     ```
   - Transfer `.tar` images via authorized secure media, and load on the bank server:
     ```bash
     docker load -i finops-backend.tar
     docker load -i finops-frontend.tar
     ```
