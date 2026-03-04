/**
 * Prisma Database Seed Script
 * 
 * Populates database with sample data for development and testing.
 * Creates 1 demo user and 15 tasks with varied entropy characteristics.
 * 
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@entropytasks.dev' },
    update: {},
    create: {
      email: 'demo@entropytasks.dev',
      name: 'Demo User',
      passwordHash: 'demo-password-hash', // In real app, use bcrypt
    },
  });

  console.log(`✅ Created user: ${user.email} (${user.id})`);

  // Helper function to create date N days ago
  const daysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  // Sample tasks with varied characteristics
  const tasks = [
    // High-entropy tasks (recent, high priority)
    {
      title: 'Deploy new API endpoint',
      description: 'Push the authentication improvements to production',
      priority: 'HIGH',
      column: 'DOING',
      status: 'ACTIVE',
      lastInteractedAt: daysAgo(0.1), // Today
    },
    {
      title: 'Review pull request #47',
      description: 'Frontend refactoring for task components',
      priority: 'HIGH',
      column: 'TODO',
      status: 'ACTIVE',
      lastInteractedAt: daysAgo(1),
    },
    {
      title: 'Fix critical bug in entropy calculation',
      description: 'Division by zero edge case when task created <2 hours ago',
      priority: 'HIGH',
      column: 'TODO',
      status: 'ACTIVE',
      lastInteractedAt: daysAgo(2),
      dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // Due in 12 hours
    },

    // Medium-entropy tasks (medium priority, moderate recency)
    {
      title: 'Update README documentation',
      description: 'Add setup instructions and architecture diagrams',
      priority: 'MEDIUM',
      column: 'TODO',
      status: 'ACTIVE',
      lastInteractedAt: daysAgo(3),
    },
    {
      title: 'Implement drag-and-drop for Kanban',
      description: 'Use react-beautiful-dnd or dnd-kit library',
      priority: 'MEDIUM',
      column: 'TODO',
      status: 'ACTIVE',
      lastInteractedAt: daysAgo(5),
    },
    {
      title: 'Add unit tests for stress meter',
      description: 'Test different task load scenarios',
      priority: 'MEDIUM',
      column: 'TODO',
      status: 'ACTIVE',
      lastInteractedAt: daysAgo(7),
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'GitHub Actions for automated testing and deployment',
      priority: 'MEDIUM',
      column: 'TODO',
      status: 'ACTIVE',
      lastInteractedAt: daysAgo(10),
    },

    // Low-entropy tasks (low priority, stale)
    {
      title: 'Research alternative UI frameworks',
      description: 'Evaluate Svelte, Vue, or Solid.js for future projects',
      priority: 'LOW',
      column: 'TODO',
      status: 'ACTIVE',
      lastInteractedAt: daysAgo(15),
    },
    {
      title: 'Refactor CSS utility classes',
      description: 'Consolidate repeated Tailwind patterns',
      priority: 'LOW',
      column: 'TODO',
      status: 'ACTIVE',
      lastInteractedAt: daysAgo(20),
    },
    {
      title: 'Optimize database indexes',
      description: 'Analyze slow query logs and add composite indexes',
      priority: 'LOW',
      column: 'TODO',
      status: 'ACTIVE',
      lastInteractedAt: daysAgo(25),
    },

    // Recently completed tasks
    {
      title: 'Set up Prisma schema',
      description: 'Define User and Task models with entropy fields',
      priority: 'HIGH',
      column: 'DONE',
      status: 'COMPLETED',
      lastInteractedAt: daysAgo(1),
      completedAt: daysAgo(1),
    },
    {
      title: 'Create TaskCard component',
      description: 'Display task with entropy-based opacity',
      priority: 'MEDIUM',
      column: 'DONE',
      status: 'COMPLETED',
      lastInteractedAt: daysAgo(2),
      completedAt: daysAgo(2),
    },

    // Archived tasks (for Graveyard testing)
    {
      title: 'Investigate GraphQL migration',
      description: 'Evaluate switching from REST to GraphQL',
      priority: 'LOW',
      column: 'TODO',
      status: 'ARCHIVED',
      lastInteractedAt: daysAgo(35),
    },
    {
      title: 'Write blog post about entropy algorithm',
      description: 'Explain the math behind task prioritization',
      priority: 'MEDIUM',
      column: 'TODO',
      status: 'ARCHIVED',
      lastInteractedAt: daysAgo(40),
    },
    {
      title: 'Learn Rust for backend services',
      description: 'Online course and practice projects',
      priority: 'LOW',
      column: 'TODO',
      status: 'ARCHIVED',
      lastInteractedAt: daysAgo(60),
    },
  ];

  // Create tasks
  for (const taskData of tasks) {
    await prisma.task.create({
      data: {
        ...taskData,
        userId: user.id,
      },
    });
  }

  console.log(`✅ Created ${tasks.length} sample tasks`);
  console.log('');
  console.log('📊 Task Distribution:');
  console.log(`   - High Priority: ${tasks.filter(t => t.priority === 'HIGH').length}`);
  console.log(`   - Medium Priority: ${tasks.filter(t => t.priority === 'MEDIUM').length}`);
  console.log(`   - Low Priority: ${tasks.filter(t => t.priority === 'LOW').length}`);
  console.log('');
  console.log('📂 Status Distribution:');
  console.log(`   - Active: ${tasks.filter(t => t.status === 'ACTIVE').length}`);
  console.log(`   - Completed: ${tasks.filter(t => t.status === 'COMPLETED').length}`);
  console.log(`   - Archived: ${tasks.filter(t => t.status === 'ARCHIVED').length}`);
  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Visit: http://localhost:3000');
  console.log('  3. Open Prisma Studio: npx prisma studio');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
