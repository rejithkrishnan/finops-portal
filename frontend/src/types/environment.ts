export interface Application {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  environments: EnvironmentSummary[];
}

export interface EnvironmentSummary {
  id: number;
  applicationId: number;
  name: string;
  shortCode: string;
  description: string | null;
  envType: string;
  siteType: string;
  isActive: boolean;
  _count: {
    servers: number;
    databases: number;
  };
}

export interface Environment extends EnvironmentSummary {
  application: { id: number; name: string };
  servers: Server[];
  databases: DatabaseInstance[];
}

export interface ServerRole {
  id: number;
  name: string;
  color: string;
  description: string | null;
  _count?: { servers: number };
}

export interface Server {
  id: number;
  environmentId: number;
  hostname: string;
  ipAddress: string;
  roleId: number;
  os: string | null;
  cores: number | null;
  memory: string | null;
  segment: string | null;
  isActive: boolean;
  role: ServerRole;
}

export interface DatabaseInstance {
  id: number;
  environmentId: number;
  name: string;
  host: string;
  port: number;
  dbType: string;
  version: string | null;
  schemaName: string | null;
  connectionString: string | null;
  isActive: boolean;
}

export interface DashboardData {
  summary: {
    applications: number;
    environments: number;
    servers: number;
    databases: number;
  };
  serversPerEnvironment: {
    id: number;
    name: string;
    shortCode: string;
    total: number;
    roles: Record<string, { count: number; color: string }>;
  }[];
  roleDistribution: {
    name: string;
    color: string;
    count: number;
  }[];
  serversPerApp: {
    name: string;
    count: number;
  }[];
}
