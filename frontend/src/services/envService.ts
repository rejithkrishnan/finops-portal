import api from './api';
import type { Application, Environment, DashboardData, ServerRole, Server, DatabaseInstance } from '../types/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ─── Dashboard ────────────────────────────────────────────────────
export const getDashboard = () =>
  api.get<ApiResponse<DashboardData>>('/dashboard').then(r => r.data.data);

// ─── Applications ─────────────────────────────────────────────────
export const getApplications = () =>
  api.get<ApiResponse<Application[]>>('/applications').then(r => r.data.data);

export const getApplication = (id: number) =>
  api.get<ApiResponse<Application>>(`/applications/${id}`).then(r => r.data.data);

export const createApplication = (data: { name: string; description?: string }) =>
  api.post<ApiResponse<Application>>('/applications', data).then(r => r.data.data);

export const updateApplication = (id: number, data: Partial<{ name: string; description: string }>) =>
  api.put<ApiResponse<Application>>(`/applications/${id}`, data).then(r => r.data.data);

export const deleteApplication = (id: number) =>
  api.delete(`/applications/${id}`);

// ─── Environments ─────────────────────────────────────────────────
export const getEnvironments = (applicationId?: number) =>
  api.get<ApiResponse<Environment[]>>('/environments', { params: { applicationId } }).then(r => r.data.data);

export const getEnvironment = (id: number) =>
  api.get<ApiResponse<Environment>>(`/environments/${id}`).then(r => r.data.data);

export const createEnvironment = (data: {
  applicationId: number; name: string; shortCode: string;
  description?: string; envType: string; siteType: string;
}) => api.post<ApiResponse<Environment>>('/environments', data).then(r => r.data.data);

export const updateEnvironment = (id: number, data: Partial<{
  name: string; shortCode: string; description: string; envType: string; siteType: string;
}>) => api.put<ApiResponse<Environment>>(`/environments/${id}`, data).then(r => r.data.data);

export const deleteEnvironment = (id: number) =>
  api.delete(`/environments/${id}`);

// ─── Servers ──────────────────────────────────────────────────────
export const getServers = (envId: number) =>
  api.get<ApiResponse<Server[]>>(`/environments/${envId}/servers`).then(r => r.data.data);

export const createServer = (envId: number, data: {
  hostname: string; ipAddress: string; roleId: number;
  os?: string; cores?: number; memory?: string; segment?: string;
}) => api.post<ApiResponse<Server>>(`/environments/${envId}/servers`, data).then(r => r.data.data);

export const updateServer = (id: number, data: Partial<{
  hostname: string; ipAddress: string; roleId: number;
  os: string; cores: number; memory: string; segment: string;
}>) => api.put<ApiResponse<Server>>(`/servers/${id}`, data).then(r => r.data.data);

export const deleteServer = (id: number) =>
  api.delete(`/servers/${id}`);

// ─── Databases ────────────────────────────────────────────────────
export const getDatabases = (envId: number) =>
  api.get<ApiResponse<DatabaseInstance[]>>(`/environments/${envId}/databases`).then(r => r.data.data);

export const createDatabase = (envId: number, data: {
  name: string; host: string; port: number; dbType: string;
  version?: string; schemaName?: string; connectionString?: string;
}) => api.post<ApiResponse<DatabaseInstance>>(`/environments/${envId}/databases`, data).then(r => r.data.data);

export const updateDatabase = (id: number, data: Partial<{
  name: string; host: string; port: number; dbType: string;
  version: string; schemaName: string; connectionString: string;
}>) => api.put<ApiResponse<DatabaseInstance>>(`/databases/${id}`, data).then(r => r.data.data);

export const deleteDatabase = (id: number) =>
  api.delete(`/databases/${id}`);

// ─── Server Roles ─────────────────────────────────────────────────
export const getServerRoles = () =>
  api.get<ApiResponse<ServerRole[]>>('/server-roles').then(r => r.data.data);

export const createServerRole = (data: { name: string; color: string; description?: string }) =>
  api.post<ApiResponse<ServerRole>>('/server-roles', data).then(r => r.data.data);

export const updateServerRole = (id: number, data: Partial<{ name: string; color: string; description: string }>) =>
  api.put<ApiResponse<ServerRole>>(`/server-roles/${id}`, data).then(r => r.data.data);

export const deleteServerRole = (id: number) =>
  api.delete(`/server-roles/${id}`);
