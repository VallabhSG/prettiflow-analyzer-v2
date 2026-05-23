TYPE READY
CONTEXT
SUMMARY: Prettiflow Analyzer is an AI-powered app complexity scorecard tool that shows developers what Prettiflow handles vs what requires manual work.
GOAL: Build a full-featured web application with authentication, analysis tracking, and visual scorecards

TECH
FRONTEND: Next.js 16 with Tailwind CSS v4 and Radix UI components
BACKEND: Express.js with Drizzle ORM and Neon Postgres
DEPLOYMENT: Vercel-ready

DATABASE SCHEMA
users: id, email, name, created_at
analyses: id, user_id (nullable), app_name, input, input_type ('description'|'github'), result (JSON), provider, complexity_label, overall_complexity (int 1-10), created_at
Public analyses visible to all; user analyses saved to their account

FEATURES
- User authentication (login/signup with email+password)
- App complexity analysis with scorecard visualization
- Public and private analysis feeds
- Dashboard for user's saved analyses
- Leaderboard with filters and charts
- Responsive design with brand colors and animations

TODOS
[1] TITLE: Set up project structure and basic pages
    DESC: Create the Next.js 16 project with Tailwind CSS v4 and Radix UI. Implement the homepage with hero section, tab switcher, textarea input, and recent analyses feed. Set up the /dashboard and /explore routes as empty pages. Use the /workspace/frontend/app/page.tsx file for the homepage.
    DEPS: []

[2] TITLE: Implement user authentication system
    DESC: Add login and signup functionality with email+password. Use Firebase Authentication or a custom solution with JWT. Store user data in the users table. Implement protected routes for dashboard and private analyses.
    DEPS: [1]

[3] TITLE: Create analysis database schema with Drizzle ORM
    DESC: Define the users and analyses tables using Drizzle ORM. Set up Neon Postgres connection. Implement basic CRUD operations for analyses.
    DEPS: [1]

[4] TITLE: Implement API routes for analysis and recent public analyses
    DESC: Create POST /api/analyze endpoint that accepts {input, inputType} and returns placeholder {result, provider, id}. Create GET /api/recent endpoint that returns last 20 public analyses. Use the /workspace/backend/api/analyze.ts and /workspace/backend/api/recent.ts files.
    DEPS: [1, 3]

[5] TITLE: Build result page /r/[id]
    DESC: Create the result page with analysis scorecard visualization. Include animated SVG ring for overall score, 6 dimension cards with score bars, Prettiflow handles/manual work lists, time comparison, verdict paragraph, and CTA button. Use the /workspace/frontend/app/r/[id]/page.tsx file.
    DEPS: [1, 4]

[6] TITLE: Implement dashboard /dashboard
    DESC: Create user's saved analyses card grid with sorting by date/complexity. Show stats: total analyzed, avg complexity, most common complexity label. Use the /workspace/frontend/app/dashboard/page.tsx file.
    DEPS: [1, 2]

[7] TITLE: Create leaderboard /explore
    DESC: Implement public feed of all analyses with filters by complexity label. Add charts for complexity distribution (pie) and top stack categories (bar chart with Recharts). Use the /workspace/frontend/app/explore/page.tsx file.
    DEPS: [1, 4]

[8] TITLE: Add design system and animations
    DESC: Implement brand colors (#F67AB6 and #84b9ef gradient), off-white background with drifting gradient orbs, rounded cards, clean typography, and animated score bars on scroll. Add animated SVG ring for overall score on result page. Use Tailwind CSS for styling.
    DEPS: [1, 5, 6, 7]

[9] TITLE: Implement file structure and deployment
    DESC: Organize project files with proper directory structure. Add Vercel configuration files. Ensure all pages are properly routed and deployed.
    DEPS: [1, 2, 3, 4, 5, 6, 7, 8]