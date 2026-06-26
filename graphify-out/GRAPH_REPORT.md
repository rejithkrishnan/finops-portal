# Graph Report - .  (2026-06-27)

## Corpus Check
- Corpus is ~22,500 words - fits in a single context window. You may not need a graph.

## Summary
- 355 nodes · 434 edges · 28 communities (18 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Environment Management UI|Environment Management UI]]
- [[_COMMUNITY_Auth Routes & Services|Auth Routes & Services]]
- [[_COMMUNITY_Shared UI Components|Shared UI Components]]
- [[_COMMUNITY_Database & Environment Services|Database & Environment Services]]
- [[_COMMUNITY_Backend Runtime Dependencies|Backend Runtime Dependencies]]
- [[_COMMUNITY_Frontend Dev Toolchain|Frontend Dev Toolchain]]
- [[_COMMUNITY_Design Docs & Agents|Design Docs & Agents]]
- [[_COMMUNITY_Backend TypeScript Config|Backend TypeScript Config]]
- [[_COMMUNITY_Frontend App TS Config|Frontend App TS Config]]
- [[_COMMUNITY_Frontend Node TS Config|Frontend Node TS Config]]
- [[_COMMUNITY_Backend Dev Dependencies|Backend Dev Dependencies]]
- [[_COMMUNITY_Sidebar Navigation|Sidebar Navigation]]
- [[_COMMUNITY_Frontend Runtime Dependencies|Frontend Runtime Dependencies]]
- [[_COMMUNITY_Local Auth Provider|Local Auth Provider]]
- [[_COMMUNITY_Frontend Entry & Assets|Frontend Entry & Assets]]
- [[_COMMUNITY_Claude Code Config|Claude Code Config]]
- [[_COMMUNITY_Startup Scripts|Startup Scripts]]
- [[_COMMUNITY_Frontend TS Config Root|Frontend TS Config Root]]
- [[_COMMUNITY_Database Seed|Database Seed]]
- [[_COMMUNITY_Local Claude Settings|Local Claude Settings]]
- [[_COMMUNITY_React Asset|React Asset]]
- [[_COMMUNITY_Project README|Project README]]
- [[_COMMUNITY_Frontend README|Frontend README]]
- [[_COMMUNITY_Public Icons|Public Icons]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `compilerOptions` - 16 edges
3. `compilerOptions` - 15 edges
4. `useAuth()` - 12 edges
5. `scripts` - 10 edges
6. `LocalAuthProvider` - 8 edges
7. `ApiError` - 8 edges
8. `AuthUser` - 7 edges
9. `README.md - Axis Bank FinOps Portal Documentation` - 7 edges
10. `AGENTS.md - FinOps Portal Project Customization Rules` - 6 edges

## Surprising Connections (you probably didn't know these)
- `AGENTS.md - FinOps Portal Project Customization Rules` --semantically_similar_to--> `Project Skill - FinOps Portal Customization Rules`  [INFERRED] [semantically similar]
  .agents/AGENTS.md → .claude/skills/project-skill.md
- `hero.png - Isometric Stacked Layers Hero Image (purple gradient)` --conceptually_related_to--> `Three-Layer System Architecture (React SPA / Express API / Python Agent)`  [INFERRED]
  frontend/src/assets/hero.png → README.md
- `requirement.txt - Original Axis Bank Portal Specifications` --conceptually_related_to--> `README.md - Axis Bank FinOps Portal Documentation`  [INFERRED]
  requirement.txt → README.md
- `README.md - Axis Bank FinOps Portal Documentation` --references--> `Docker Compose - PostgreSQL Container Setup`  [EXTRACTED]
  README.md → db/docker-compose.yml
- `Finacle Calendar Implementation Plan` --references--> `Axis Bank Brand Design Guidelines (burgundy, glass-card, surface-pill)`  [EXTRACTED]
  artifacts/implementation_plan.md → .agents/AGENTS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **FinOps Portal Three-Layer System Architecture** — readme_three_layer_architecture, readme_eod_orchestration, db_docker_compose_postgres, readme_environment_registry [INFERRED 0.85]
- **Calendar Module Prisma Data Model** — artifacts_implementation_plan_activitycategory, artifacts_implementation_plan_activity, artifacts_implementation_plan_activityenvironment [EXTRACTED 1.00]
- **Axis Bank UI Design System Guidelines** — agents_agents_sidebar_context, agents_agents_axis_brand, agents_agents_responsive_layout [EXTRACTED 1.00]

## Communities (28 total, 10 thin omitted)

### Community 0 - "Environment Management UI"
Cohesion: 0.05
Nodes (10): ApiError, ApiResponse, EnvType, Application, DashboardData, DatabaseInstance, Environment, EnvironmentSummary (+2 more)

### Community 1 - "Auth Routes & Services"
Cohesion: 0.10
Nodes (26): createUserSchema, loginSchema, router, updateUserSchema, authProvider, generateAccessToken(), generateRefreshToken(), verifyAccessToken() (+18 more)

### Community 2 - "Shared UI Components"
Cohesion: 0.09
Nodes (21): ModalProps, Navbar(), AuthContext, AuthContextType, AuthProvider(), useAuth(), Theme, ThemeContext (+13 more)

### Community 4 - "Backend Runtime Dependencies"
Cohesion: 0.07
Nodes (28): author, dependencies, bcryptjs, cors, dotenv, express, jsonwebtoken, @prisma/client (+20 more)

### Community 5 - "Frontend Dev Toolchain"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+17 more)

### Community 6 - "Design Docs & Agents"
Cohesion: 0.11
Nodes (23): AGENTS.md - FinOps Portal Project Customization Rules, Axis Bank Brand Design Guidelines (burgundy, glass-card, surface-pill), React Fast Refresh Rules (default export pattern), Icon Import Alias Pattern (prevent lucide-react namespace collisions), Responsive Layout Guidelines (Tailwind breakpoints, sidebar-aware), SidebarContext Pattern - Single Source of Truth for Sidebar State, Finacle Calendar Implementation Plan, Activity Prisma Model (title, dates, allDay, isEcosystem, recurrence) (+15 more)

### Community 7 - "Backend TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir (+12 more)

### Community 8 - "Frontend App TS Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 9 - "Frontend Node TS Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 10 - "Backend Dev Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, nodemon, prisma, ts-node, tsx, @types/bcryptjs, @types/cors, @types/express (+3 more)

### Community 11 - "Sidebar Navigation"
Cohesion: 0.29
Nodes (6): navItems, Sidebar(), SidebarContext, SidebarContextType, useSidebar(), MainLayout()

### Community 12 - "Frontend Runtime Dependencies"
Cohesion: 0.18
Nodes (11): dependencies, axios, clsx, framer-motion, lucide-react, react, react-dom, react-hot-toast (+3 more)

### Community 13 - "Local Auth Provider"
Cohesion: 0.31
Nodes (3): AuthProvider, AuthUser, LocalAuthProvider

### Community 14 - "Frontend Entry & Assets"
Cohesion: 0.67
Nodes (3): vite.svg - Vite Build Tool Logo (purple lightning bolt), frontend/index.html - SPA HTML Entry Point, favicon.svg - Custom Purple Lightning Bolt Icon

## Knowledge Gaps
- **162 isolated node(s):** `PreToolUse`, `skillOverrides`, `name`, `version`, `description` (+157 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiError` connect `Auth Routes & Services` to `Database & Environment Services`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Backend Dev Dependencies` to `Backend Runtime Dependencies`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `PreToolUse`, `skillOverrides`, `name` to the rest of the system?**
  _164 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Environment Management UI` be split into smaller, more focused modules?**
  _Cohesion score 0.0549645390070922 - nodes in this community are weakly interconnected._
- **Should `Auth Routes & Services` be split into smaller, more focused modules?**
  _Cohesion score 0.0990990990990991 - nodes in this community are weakly interconnected._
- **Should `Shared UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.0873015873015873 - nodes in this community are weakly interconnected._
- **Should `Database & Environment Services` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._