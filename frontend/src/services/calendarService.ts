import api from './api';
import type { Activity, ActivityCategory, DaySummary } from '../types/calendar';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ─── Activities ────────────────────────────────────────────────────
export const getActivities = (month: number, year: number, envId?: number) =>
  api.get<ApiResponse<Activity[]>>('/calendar/activities', { params: { month, year, ...(envId ? { envId } : {}) } }).then(r => r.data.data);

export const getActivity = (id: number) =>
  api.get<ApiResponse<Activity>>(`/calendar/activities/${id}`).then(r => r.data.data);

export const createActivity = (data: {
  title: string;
  description?: string;
  categoryId: number;
  startDate: string;
  endDate: string;
  allDay: boolean;
  isEcosystem: boolean;
  environmentIds?: number[];
}) => api.post<ApiResponse<Activity>>('/calendar/activities', data).then(r => r.data.data);

export const updateActivity = (id: number, data: Partial<{
  title: string;
  description: string;
  categoryId: number;
  startDate: string;
  endDate: string;
  allDay: boolean;
  isEcosystem: boolean;
  environmentIds: number[];
}>) => api.put<ApiResponse<Activity>>(`/calendar/activities/${id}`, data).then(r => r.data.data);

export const deleteActivity = (id: number) =>
  api.delete(`/calendar/activities/${id}`);

// ─── Categories ────────────────────────────────────────────────────
export const getCategories = () =>
  api.get<ApiResponse<ActivityCategory[]>>('/calendar/categories').then(r => r.data.data);

export const createCategory = (data: { name: string; color: string; icon?: string }) =>
  api.post<ApiResponse<ActivityCategory>>('/calendar/categories', data).then(r => r.data.data);

export const updateCategory = (id: number, data: Partial<{ name: string; color: string; icon: string }>) =>
  api.put<ApiResponse<ActivityCategory>>(`/calendar/categories/${id}`, data).then(r => r.data.data);

export const deleteCategory = (id: number) =>
  api.delete(`/calendar/categories/${id}`);

// ─── Month Summary ─────────────────────────────────────────────────
export const getMonthSummary = (month: number, year: number) =>
  api.get<ApiResponse<DaySummary[]>>('/calendar/summary', { params: { month, year } }).then(r => r.data.data);
