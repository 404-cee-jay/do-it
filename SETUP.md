# EntropyTasks - Setup Guide

## Quick Start

Follow these steps to get EntropyTasks running locally:

### 1. Install Dependencies

```bash
npm install
```

This will install:
- Next.js 14 (App Router)
- Prisma ORM + PostgreSQL client
- Framer Motion (animations)
- Zustand (UI state)
- Tailwind CSS

### 2. Set Up Database

**Option A: Local PostgreSQL**

```bash
# Install PostgreSQL (if not already installed)
# macOS
brew install postgresql
brew services start postgresql

# Create database
createdb entropytasks

# Copy environment file
cp .env.example .env

# Edit .env and update DATABASE_URL
# DATABASE_URL="postgresql://your_user:your_password@localhost:5432/entropytasks"
```

**Option B: Hosted PostgreSQL (Recommended)**

Use a hosted provider:
- **Neon** (free tier, instant setup): https://neon.tech
- **Railway** (free $5/month credit): https://railway.app
- **Supabase** (use PostgreSQL only): https://supabase.com

After creating database:
1. Copy connection string
2. Update `.env` file with `DATABASE_URL`

### 3. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Seed with sample data
npx prisma db seed
```

You should see output confirming:
- ✅ Created user: demo@entropytasks.dev
- ✅ Created 15 sample tasks
- 📊 Task distribution by priority/status

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 5. Explore the Database (Optional)

```bash
# Open Prisma Studio (database GUI)
npx prisma studio
```

This opens at http://localhost:5555 and lets you:
- View all tasks and their entropy data
- Manually edit `lastInteractedAt` timestamps
- Delete/create test data

---

## Project Structure

```
entropytasks/
├── app/                      # Next.js App Router
│   ├── layout.js            # Root layout with StressMeter + Graveyard
│   ├── page.js              # Main board page
│   └── globals.css          # Tailwind directives
├── src/
│   ├── engine/              # Core logic (pure JavaScript)
│   │   ├── entropy.js       # Entropy calculation algorithm
│   │   ├── stress.js        # Stress meter calculation
│   │   └── README.md        # Engine documentation
│   ├── components/
│   │   ├── board/
│   │   │   ├── TaskCard.jsx      # Individual task card
│   │   │   ├── Column.jsx        # Kanban column
│   │   │   └── KanbanBoard.jsx   # Full board (Server Component)
│   │   └── layout/
│   │       ├── StressMeter.jsx   # Cognitive load indicator
│   │       └── GraveyardSidebar.jsx  # Archived tasks
│   ├── actions/
│   │   └── taskActions.js   # Server Actions (DB mutations)
│   └── store/
│       └── uiStore.js       # Zustand UI state
├── lib/
│   └── db.js                # Prisma client singleton
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.js              # Sample data generator
├── SCHEMA.md                # Database architecture docs
├── INTERACTIONS.md          # lastInteractedAt update rules
└── package.json
```

---

## Key Features Implemented

### ✅ Entropy Engine
- Tasks automatically fade based on `lastInteractedAt` timestamp
- Opacity ranges from 0.4 (stale) to 1.0 (fresh)
- High priority tasks decay slower than low priority

### ✅ Stress Meter
- Calculates cognitive load from active task priority weights
- Color-coded: Green → Yellow → Orange → Red
- Helps prevent burnout by visualizing capacity

### ✅ Graveyard Sidebar
- Shows archived tasks (30+ days stale or manually moved)
- Resurrect tasks back to ACTIVE status
- Permanent delete option

### ✅ Kanban Board
- Three columns: To Do, Doing, Done
- WIP limits with visual warnings
- Tasks sorted by entropy (highest first)

### ✅ Task Interactions
- Inline editing (title, description)
- Priority dropdown (LOW, MEDIUM, HIGH)
- Status toggle (ACTIVE ↔ COMPLETED)
- Manual bump (refresh timestamp)
- Archive action

---

## Development Workflow

### Making Changes

1. **Edit Prisma Schema:**
   ```bash
   # After editing prisma/schema.prisma
   npx prisma migrate dev --name your_migration_name
   npx prisma generate
   ```

2. **Reset Database:**
   ```bash
   npx prisma migrate reset
   # This will drop all tables and re-seed
   ```

3. **Hot Reload:**
   - Next.js automatically reloads on file changes
   - Tailwind CSS classes are JIT-compiled

### Testing Entropy Calculations

1. Open Prisma Studio: `npx prisma studio`
2. Find a task and note its `lastInteractedAt` timestamp
3. Change it to 30 days ago: `2026-02-02T10:00:00Z`
4. Refresh your browser at http://localhost:3000
5. Task should appear very faded (low opacity)

### Verifying Interactions

See [INTERACTIONS.md](INTERACTIONS.md) for full testing checklist.

**Quick test:**
1. Click task title and edit it
2. Check Prisma Studio - `lastInteractedAt` should update
3. Task should become more visible (higher opacity)

---

## Common Issues

### "Cannot find module '@prisma/client'"

```bash
npx prisma generate
```

### "Environment variable not found: DATABASE_URL"

1. Ensure `.env` file exists (copy from `.env.example`)
2. Add valid PostgreSQL connection string
3. Restart dev server

### Tasks not appearing

1. Check if database has tasks: `npx prisma studio`
2. If empty, run: `npx prisma db seed`
3. Verify `userId` in seed script matches `DEV_USER_ID` in layout.js

### Tailwind classes not working

```bash
# Ensure Tailwind is configured
npm run dev
# Should see JIT compilation logs
```

---

## Next Steps

### Phase 1 (Current)
- ✅ Core entropy engine
- ✅ Stress meter
- ✅ Graveyard
- ✅ Basic Kanban board

### Phase 2 (TODO)
- [ ] Authentication (NextAuth.js)
- [ ] Task creation modal
- [ ] Drag-and-drop for Kanban columns
- [ ] Due date picker
- [ ] Auto-archive cron job

### Phase 3 (Future)
- [ ] Collaborative tasks
- [ ] Task tags/categories
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# DATABASE_URL=your_production_database_url
```

### Railway

1. Connect GitHub repo to Railway
2. Add PostgreSQL service
3. Copy `DATABASE_URL` to environment variables
4. Deploy automatically on push

---

## Documentation

- [SCHEMA.md](SCHEMA.md) - Database architecture and entropy algorithm
- [INTERACTIONS.md](INTERACTIONS.md) - When `lastInteractedAt` updates
- [src/engine/README.md](src/engine/README.md) - Entropy engine deep dive
- [README.md](README.md) - Project overview and philosophy

---

**Questions?** Check existing documentation or open an issue.

**Version:** 1.0  
**Last Updated:** March 4, 2026
