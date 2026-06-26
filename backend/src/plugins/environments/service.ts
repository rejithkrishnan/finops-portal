import prisma from '../../core/database/prisma';
import { ApiError } from '../../core/middleware/errorHandler';

// ─── Dashboard ────────────────────────────────────────────────────

export async function getDashboardData() {
  const [appCount, envCount, serverCount, dbCount] = await Promise.all([
    prisma.application.count({ where: { isActive: true } }),
    prisma.environment.count({ where: { isActive: true } }),
    prisma.server.count({ where: { isActive: true } }),
    prisma.databaseInstance.count({ where: { isActive: true } }),
  ]);

  // Servers per environment
  const serversPerEnv = await prisma.environment.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      shortCode: true,
      _count: { select: { servers: true } },
      servers: {
        where: { isActive: true },
        select: { role: { select: { name: true, color: true } } },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Server role distribution
  const roleDistribution = await prisma.serverRole.findMany({
    select: {
      name: true,
      color: true,
      _count: { select: { servers: { where: { isActive: true } } } },
    },
  });

  // Servers per application
  const serversPerApp = await prisma.application.findMany({
    where: { isActive: true },
    select: {
      name: true,
      environments: {
        select: {
          _count: { select: { servers: { where: { isActive: true } } } },
        },
      },
    },
  });

  return {
    summary: {
      applications: appCount,
      environments: envCount,
      servers: serverCount,
      databases: dbCount,
    },
    serversPerEnvironment: serversPerEnv.map((env) => {
      const roleCounts: Record<string, { count: number; color: string }> = {};
      env.servers.forEach((s) => {
        if (!roleCounts[s.role.name]) {
          roleCounts[s.role.name] = { count: 0, color: s.role.color };
        }
        roleCounts[s.role.name].count++;
      });
      return {
        id: env.id,
        name: env.name,
        shortCode: env.shortCode,
        total: env._count.servers,
        roles: roleCounts,
      };
    }),
    roleDistribution: roleDistribution.map((r) => ({
      name: r.name,
      color: r.color,
      count: r._count.servers,
    })),
    serversPerApp: serversPerApp.map((app) => ({
      name: app.name,
      count: app.environments.reduce((sum, env) => sum + env._count.servers, 0),
    })),
  };
}

// ─── Applications ─────────────────────────────────────────────────

export async function listApplications() {
  return prisma.application.findMany({
    where: { isActive: true },
    include: {
      environments: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              servers: { where: { isActive: true } },
              databases: { where: { isActive: true } },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getApplication(id: number) {
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      environments: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              servers: { where: { isActive: true } },
              databases: { where: { isActive: true } },
            },
          },
        },
      },
    },
  });

  if (!app) throw new ApiError(404, 'Application not found');
  return app;
}

export async function createApplication(data: { name: string; description?: string; icon?: string }) {
  return prisma.application.create({ data });
}

export async function updateApplication(id: number, data: { name?: string; description?: string; icon?: string; isActive?: boolean }) {
  return prisma.application.update({ where: { id }, data });
}

export async function deleteApplication(id: number) {
  return prisma.application.update({ where: { id }, data: { isActive: false } });
}

// ─── Environments ─────────────────────────────────────────────────

export async function listEnvironments(applicationId?: number) {
  return prisma.environment.findMany({
    where: {
      isActive: true,
      ...(applicationId && { applicationId }),
    },
    include: {
      application: { select: { id: true, name: true } },
      _count: {
        select: {
          servers: { where: { isActive: true } },
          databases: { where: { isActive: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getEnvironment(id: number) {
  const env = await prisma.environment.findUnique({
    where: { id },
    include: {
      application: { select: { id: true, name: true } },
      servers: {
        where: { isActive: true },
        include: { role: true },
        orderBy: { hostname: 'asc' },
      },
      databases: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!env) throw new ApiError(404, 'Environment not found');
  return env;
}

export async function createEnvironment(data: {
  applicationId: number;
  name: string;
  shortCode: string;
  description?: string;
  envType: string;
  siteType: string;
}) {
  return prisma.environment.create({
    data,
    include: {
      application: { select: { id: true, name: true } },
    },
  });
}

export async function updateEnvironment(id: number, data: Partial<{
  name: string;
  shortCode: string;
  description: string;
  envType: string;
  siteType: string;
  isActive: boolean;
}>) {
  return prisma.environment.update({ where: { id }, data });
}

export async function deleteEnvironment(id: number) {
  return prisma.environment.update({ where: { id }, data: { isActive: false } });
}

// ─── Servers ──────────────────────────────────────────────────────

export async function listServers(environmentId: number) {
  return prisma.server.findMany({
    where: { environmentId, isActive: true },
    include: { role: true },
    orderBy: { hostname: 'asc' },
  });
}

export async function createServer(data: {
  environmentId: number;
  hostname: string;
  ipAddress: string;
  roleId: number;
  os?: string;
  cores?: number;
  memory?: string;
  segment?: string;
}) {
  return prisma.server.create({
    data,
    include: { role: true },
  });
}

export async function updateServer(id: number, data: Partial<{
  hostname: string;
  ipAddress: string;
  roleId: number;
  os: string;
  cores: number;
  memory: string;
  segment: string;
  isActive: boolean;
}>) {
  return prisma.server.update({
    where: { id },
    data,
    include: { role: true },
  });
}

export async function deleteServer(id: number) {
  return prisma.server.update({ where: { id }, data: { isActive: false } });
}

// ─── Database Instances ───────────────────────────────────────────

export async function listDatabases(environmentId: number) {
  return prisma.databaseInstance.findMany({
    where: { environmentId, isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function createDatabase(data: {
  environmentId: number;
  name: string;
  host: string;
  port: number;
  dbType: string;
  version?: string;
  schemaName?: string;
  connectionString?: string;
}) {
  return prisma.databaseInstance.create({ data });
}

export async function updateDatabase(id: number, data: Partial<{
  name: string;
  host: string;
  port: number;
  dbType: string;
  version: string;
  schemaName: string;
  connectionString: string;
  isActive: boolean;
}>) {
  return prisma.databaseInstance.update({ where: { id }, data });
}

export async function deleteDatabase(id: number) {
  return prisma.databaseInstance.update({ where: { id }, data: { isActive: false } });
}

// ─── Server Roles ─────────────────────────────────────────────────

export async function listServerRoles() {
  return prisma.serverRole.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { servers: { where: { isActive: true } } } },
    },
  });
}

export async function createServerRole(data: { name: string; color: string; description?: string }) {
  return prisma.serverRole.create({ data });
}

export async function updateServerRole(id: number, data: Partial<{ name: string; color: string; description: string }>) {
  return prisma.serverRole.update({ where: { id }, data });
}

export async function deleteServerRole(id: number) {
  const count = await prisma.server.count({ where: { roleId: id, isActive: true } });
  if (count > 0) {
    throw new ApiError(400, `Cannot delete role: ${count} active servers use this role`);
  }
  return prisma.serverRole.delete({ where: { id } });
}

// ─── Env Types ────────────────────────────────────────────────────

export async function listEnvTypes() {
  return prisma.envType.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createEnvType(data: { name: string; description?: string }) {
  return prisma.envType.create({ data });
}

export async function updateEnvType(id: number, data: Partial<{ name: string; description: string }>) {
  return prisma.envType.update({ where: { id }, data });
}

export async function deleteEnvType(id: number) {
  const envType = await prisma.envType.findUnique({ where: { id } });
  if (envType) {
    const count = await prisma.environment.count({ where: { envType: envType.name, isActive: true } });
    if (count > 0) {
      throw new ApiError(400, `Cannot delete type: ${count} active environments use this type`);
    }
  }
  return prisma.envType.delete({ where: { id } });
}
