export interface ActivityCategory {
  id: number;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
}

export interface ActivityEnvironmentLink {
  activityId: number;
  environmentId: number;
  environment: { id: number; name: string; shortCode: string };
}

export interface Activity {
  id: number;
  title: string;
  description?: string;
  categoryId: number;
  category: ActivityCategory;
  startDate: string;
  endDate: string;
  allDay: boolean;
  isEcosystem: boolean;
  environments: ActivityEnvironmentLink[];
  createdBy: { id: number; displayName: string };
  createdAt: string;
  updatedAt: string;
}

export interface DaySummary {
  date: string;
  count: number;
  categories: { name: string; color: string; count: number }[];
}
