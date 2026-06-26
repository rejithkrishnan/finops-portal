import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Create Admin User ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@axisbank.com',
      passwordHash,
      displayName: 'System Admin',
      role: 'ADMIN',
    },
  });
  console.log(`✓ Admin user: ${admin.username} (password: admin123)`);

  // ─── Create Server Roles ───────────────────────────────────────
  const roles = [
    { name: 'WEB', color: '#6366f1', description: 'Web Server' },
    { name: 'WAS', color: '#10b981', description: 'WebSphere Application Server' },
    { name: 'APP', color: '#8b5cf6', description: 'Application Server' },
    { name: 'SMS', color: '#f59e0b', description: 'SMS Gateway Server' },
    { name: 'LB', color: '#64748b', description: 'Load Balancer' },
    { name: 'DB', color: '#f43f5e', description: 'Database Server' },
  ];

  const createdRoles: Record<string, number> = {};
  for (const role of roles) {
    const r = await prisma.serverRole.upsert({
      where: { name: role.name },
      update: { color: role.color, description: role.description },
      create: role,
    });
    createdRoles[r.name] = r.id;
    console.log(`✓ Server Role: ${r.name} (${r.color})`);
  }

  // ─── Create Environment Types ────────────────────────────────────
  const envTypes = [
    { name: 'PROD', description: 'Production Environment' },
    { name: 'UAT', description: 'User Acceptance Testing' },
    { name: 'DEV', description: 'Development Environment' },
    { name: 'DR', description: 'Disaster Recovery' },
    { name: 'PT', description: 'Performance Testing' },
    { name: 'PREPROD', description: 'Pre-Production Environment' },
    { name: 'FININQ', description: 'Finacle Inquiry' },
  ];

  for (const type of envTypes) {
    await prisma.envType.upsert({
      where: { name: type.name },
      update: { description: type.description },
      create: type,
    });
    console.log(`✓ Env Type: ${type.name}`);
  }

  // ─── Create Applications ───────────────────────────────────────
  const finacle = await prisma.application.upsert({
    where: { name: 'Finacle' },
    update: {},
    create: {
      name: 'Finacle',
      description: 'Finacle Core Banking Solution',
      icon: 'building-2',
    },
  });
  console.log(`\n✓ Application: ${finacle.name}`);

  const fininq = await prisma.application.upsert({
    where: { name: 'FININQ' },
    update: {},
    create: {
      name: 'FININQ',
      description: 'Finacle Inquiry System',
      icon: 'search',
    },
  });
  console.log(`✓ Application: ${fininq.name}`);

  // ─── Create Environments ───────────────────────────────────────

  // PROD DC
  const prodDC = await prisma.environment.upsert({
    where: { applicationId_shortCode: { applicationId: finacle.id, shortCode: 'PROD-DC' } },
    update: {},
    create: {
      applicationId: finacle.id,
      name: 'PROD 10.2.25 DC',
      shortCode: 'PROD-DC',
      description: 'Finacle Production DC Environment',
      envType: 'PROD',
      siteType: 'DC',
    },
  });

  // PROD DR
  const prodDR = await prisma.environment.upsert({
    where: { applicationId_shortCode: { applicationId: finacle.id, shortCode: 'PROD-DR' } },
    update: {},
    create: {
      applicationId: finacle.id,
      name: 'PROD 10.2.25 DR',
      shortCode: 'PROD-DR',
      description: 'Finacle Production DR Environment',
      envType: 'PROD',
      siteType: 'DR',
    },
  });

  // UAT
  const uat = await prisma.environment.upsert({
    where: { applicationId_shortCode: { applicationId: finacle.id, shortCode: 'UAT' } },
    update: {},
    create: {
      applicationId: finacle.id,
      name: 'UAT 10.2.25',
      shortCode: 'UAT',
      description: 'Finacle UAT Environment',
      envType: 'UAT',
      siteType: 'DC',
    },
  });

  // DEV
  const dev = await prisma.environment.upsert({
    where: { applicationId_shortCode: { applicationId: finacle.id, shortCode: 'DEV' } },
    update: {},
    create: {
      applicationId: finacle.id,
      name: 'DEV 10.2.25',
      shortCode: 'DEV',
      description: 'Finacle Development Environment',
      envType: 'DEV',
      siteType: 'DC',
    },
  });

  // FININQ DC
  const fininqDC = await prisma.environment.upsert({
    where: { applicationId_shortCode: { applicationId: fininq.id, shortCode: 'FININQ-DC' } },
    update: {},
    create: {
      applicationId: fininq.id,
      name: 'FININQ 10.2.25 DC',
      shortCode: 'FININQ-DC',
      description: 'Finacle Inquiry DC Environment',
      envType: 'PROD',
      siteType: 'DC',
    },
  });

  // FININQ DR
  const fininqDR = await prisma.environment.upsert({
    where: { applicationId_shortCode: { applicationId: fininq.id, shortCode: 'FININQ-DR' } },
    update: {},
    create: {
      applicationId: fininq.id,
      name: 'FININQ 10.2.25 DR',
      shortCode: 'FININQ-DR',
      description: 'Finacle Inquiry DR Environment',
      envType: 'PROD',
      siteType: 'DR',
    },
  });

  console.log('✓ Environments created: PROD DC, PROD DR, UAT, DEV, FININQ DC, FININQ DR');

  // ─── Create Servers ─────────────────────────────────────────────

  const prodDCServers = [
    { hostname: 'B2NFIN25PROWEB01', ipAddress: '10.8.157.210', roleId: createdRoles['WEB'] },
    { hostname: 'B2NFIN25PROWEB02', ipAddress: '10.8.157.211', roleId: createdRoles['WEB'] },
    { hostname: 'B2NFIN25PROWEB03', ipAddress: '10.8.157.212', roleId: createdRoles['WEB'] },
    { hostname: 'B2NFIN25PROWAS01', ipAddress: '10.8.144.52', roleId: createdRoles['WAS'] },
    { hostname: 'B2NFIN25PROWAS02', ipAddress: '10.8.144.53', roleId: createdRoles['WAS'] },
    { hostname: 'B2NFIN25PROWAS03', ipAddress: '10.8.144.54', roleId: createdRoles['WAS'] },
    { hostname: 'B2NFIN25PROAPP01', ipAddress: '10.8.144.26', roleId: createdRoles['APP'] },
    { hostname: 'B2NFIN25PROAPP02', ipAddress: '10.8.144.77', roleId: createdRoles['APP'] },
    { hostname: 'B2NFIN25PROSMS01', ipAddress: '10.8.21.65', roleId: createdRoles['SMS'] },
    { hostname: 'FinacleLB', ipAddress: '10.8.132.134', roleId: createdRoles['LB'] },
  ];

  for (const server of prodDCServers) {
    await prisma.server.upsert({
      where: { id: 0 },
      update: {},
      create: { ...server, environmentId: prodDC.id, os: 'AIX 7.2', cores: 8, memory: '32GB', segment: 'Banking' },
    }).catch(async () => {
      // Upsert by id=0 always creates, this is intentional for seed idempotency
      const existing = await prisma.server.findFirst({
        where: { hostname: server.hostname, environmentId: prodDC.id },
      });
      if (!existing) {
        await prisma.server.create({
          data: { ...server, environmentId: prodDC.id, os: 'AIX 7.2', cores: 8, memory: '32GB', segment: 'Banking' },
        });
      }
    });
  }

  // FININQ DC servers
  const fininqServers = [
    { hostname: 'B2NFININQWEB01', ipAddress: '10.8.61.235', roleId: createdRoles['WEB'] },
    { hostname: 'B2NFININQWAS01', ipAddress: '10.5.22.81', roleId: createdRoles['WAS'] },
    { hostname: 'B2NFININQWAS02', ipAddress: '10.5.21.82', roleId: createdRoles['WAS'] },
    { hostname: 'B2NFININQAPP01', ipAddress: '10.5.21.78', roleId: createdRoles['APP'] },
    { hostname: 'B2NFININQAPP02', ipAddress: '10.5.21.89', roleId: createdRoles['APP'] },
    { hostname: 'FinacleInqLB', ipAddress: '10.5.21.168', roleId: createdRoles['LB'] },
  ];

  for (const server of fininqServers) {
    const existing = await prisma.server.findFirst({
      where: { hostname: server.hostname, environmentId: fininqDC.id },
    });
    if (!existing) {
      await prisma.server.create({
        data: { ...server, environmentId: fininqDC.id, os: 'AIX 7.2', cores: 4, memory: '16GB', segment: 'Inquiry' },
      });
    }
  }

  console.log('✓ Servers created for PROD DC and FININQ DC');

  // ─── Create Database Instances ──────────────────────────────────

  const existingDb = await prisma.databaseInstance.findFirst({
    where: { name: 'FINPROD', environmentId: prodDC.id },
  });
  if (!existingDb) {
    await prisma.databaseInstance.create({
      data: {
        environmentId: prodDC.id,
        name: 'FINPROD',
        host: '10.8.150.100',
        port: 1521,
        dbType: 'Oracle',
        version: '19c',
        sid: 'FINACLE',
        connectionString: 'jdbc:oracle:thin:@10.8.150.100:1521/FINPROD',
      },
    });
  }

  const existingInqDb = await prisma.databaseInstance.findFirst({
    where: { name: 'FININQDB', environmentId: fininqDC.id },
  });
  if (!existingInqDb) {
    await prisma.databaseInstance.create({
      data: {
        environmentId: fininqDC.id,
        name: 'FININQDB',
        host: '10.5.21.168',
        port: 1521,
        dbType: 'Oracle',
        version: '19c',
        sid: 'FININQ',
        connectionString: 'jdbc:oracle:thin:@10.5.21.168:1521/FININQDB',
      },
    });
  }

  console.log('✓ Database instances created');
  console.log('\n✅ Seed complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
