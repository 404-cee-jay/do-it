# doit

**Task Entropy Management System**

A next-generation task management app that solves the "Cluttered List" problem through intelligent entropy-based prioritization, automatically highlighting urgent tasks while gracefully fading stale, low-priority items.

---

## The Problem

Task management apps fail not because of missing features, but because of **cognitive overload**.

Users start with enthusiasm, adding tasks freely. Within weeks, they face a **wall of 50+ items** with no clear hierarchy. Every completed task reveals three more waiting beneath. The list becomes a source of guilt rather than productivity.

**The result?** Users abandon the app entirely, returning to scattered notes or mental checklists.

Traditional solutions (folders, tags, manual prioritization) shift the burden to the user. They require constant maintenance, which fails the moment life gets busy—exactly when task management matters most.

---

## The Solution: Task Entropy

**doit** introduces an **Entropy Algorithm** that makes task relevance a function of time and interaction, not just manual priority.

### How It Works

Every task has an **entropy score** calculated from:

- **Priority level** (High/Medium/Low) — set once by the user
- **`lastInteractedAt`** — automatically updated when viewed, edited, or marked complete
- **Time decay** — tasks "fade" as days pass without interaction

```
entropy = priority_weight × (1 / days_since_interaction)
```

**Visual Result:**

- **High-entropy tasks** (urgent + recently touched) appear prominent with full opacity
- **Low-entropy tasks** (stale + low priority) fade to 40% opacity, moving down the list
- Tasks naturally **breathe**: Completing one task doesn't make another magically urgent

This creates a **self-organizing task list** that reflects actual priority without constant manual grooming.

---

## Tech Stack

Built with modern, scalable technologies for rapid development and production reliability:

- **Next.js 14** — React framework with App Router and Server Components
- **Tailwind CSS** — Utility-first styling with custom opacity modifiers for entropy visualization
- **Prisma** — Type-safe ORM with migration management
- **PostgreSQL** — Primary database (via Supabase)
- **Supabase** — Backend-as-a-Service for auth, database, and real-time subscriptions

### Why This Stack?

- **Prisma + PostgreSQL**: Native support for `DateTime` fields critical for `lastInteractedAt` tracking
- **Next.js Server Components**: Compute entropy scores server-side, send pre-calculated UI to client
- **Tailwind**: Dynamic opacity classes map directly to entropy scores (`opacity-100` → `opacity-40`)
- **Supabase**: Row-level security for multi-tenant task isolation without custom auth logic

---

## Core Features

### Entropy-Driven UI

- Tasks automatically reorder based on calculated entropy
- Visual fading (opacity) provides instant cognitive hierarchy
- No manual sorting required

### Smart Interactions

- `lastInteractedAt` updates on view, edit, complete, snooze
- Priority changes recalculate entropy in real-time
- Completed tasks archive after 7 days of inactivity

### Minimal Input, Maximum Context

- Single-field task creation (title only required)
- Optional description, due date, priority
- Focus on getting tasks out of your head, not perfect categorization

---

## Getting Started

```bash
# Clone repository
git clone https://github.com/yourusername/doit.git
cd doit

# Install dependencies
npm install

# Set up database
cp .env.example .env.local
# Add your DATABASE_URL and Supabase credentials

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

---

## Database Schema

See [SCHEMA.md](SCHEMA.md) for detailed documentation of the database design, including the critical `lastInteractedAt` field and entropy calculation logic.

---

## Product Philosophy

**doit** is built on a core belief: **The best task manager is one you don't have to manage.**

Traditional apps optimize for power users who enjoy meticulous organization. We optimize for people who need tasks to fade when they're not relevant, without the guilt of deletion or the effort of manual archiving.

Entropy isn't just a feature—it's a recognition that **task relevance decays over time**, and your tools should reflect that reality.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

For major changes, please open an issue first to discuss what you'd like to change.

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

**Built by product engineers who got tired of their own task lists.**
