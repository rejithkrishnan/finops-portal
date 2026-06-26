import prisma from '../../core/database/prisma';
import { ApiError } from '../../core/middleware/errorHandler';

// ─── Helper ───────────────────────────────────────────────────────

const activityInclude = {
  category: true,
  createdBy: { select: { id: true, displayName: true } },
  environments: {
    include: {
      environment: { select: { id: true, name: true, shortCode: true } },
    },
  },
} as const;

// ─── Activities ───────────────────────────────────────────────────

export async function getActivities(month: number, year: number, envId?: number) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth   = new Date(year, month, 0, 23, 59, 59, 999);

  const dateFilter = {
    startDate: { lte: endOfMonth },
    endDate:   { gte: startOfMonth },
  };

  const where = envId
    ? {
        ...dateFilter,
        OR: [
          { isEcosystem: true },
          { environments: { some: { environmentId: envId } } },
        ],
      }
    : dateFilter;

  return prisma.activity.findMany({
    where,
    include: activityInclude,
    orderBy: [{ startDate: 'asc' }, { title: 'asc' }],
  });
}

export async function getActivity(id: number) {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: activityInclude,
  });
  if (!activity) throw new ApiError(404, 'Activity not found');
  return activity;
}

export async function createActivity(
  data: {
    title: string;
    description?: string;
    categoryId: number;
    startDate: string;
    endDate: string;
    allDay: boolean;
    isEcosystem: boolean;
    environmentIds?: number[];
  },
  userId: number
) {
  return prisma.activity.create({
    data: {
      title:       data.title,
      description: data.description,
      categoryId:  data.categoryId,
      startDate:   new Date(data.startDate),
      endDate:     new Date(data.endDate),
      allDay:      data.allDay,
      isEcosystem: data.isEcosystem,
      createdById: userId,
      environments: data.environmentIds?.length
        ? { create: data.environmentIds.map(id => ({ environmentId: id })) }
        : undefined,
    },
    include: activityInclude,
  });
}

export async function updateActivity(
  id: number,
  data: {
    title?:          string;
    description?:    string;
    categoryId?:     number;
    startDate?:      string;
    endDate?:        string;
    allDay?:         boolean;
    isEcosystem?:    boolean;
    environmentIds?: number[];
  }
) {
  // Replace environment links if provided
  if (data.environmentIds !== undefined) {
    await prisma.activityEnvironment.deleteMany({ where: { activityId: id } });
    if (data.environmentIds.length > 0) {
      await prisma.activityEnvironment.createMany({
        data: data.environmentIds.map(envId => ({ activityId: id, environmentId: envId })),
      });
    }
  }

  return prisma.activity.update({
    where: { id },
    data: {
      title:       data.title,
      description: data.description,
      categoryId:  data.categoryId,
      startDate:   data.startDate ? new Date(data.startDate) : undefined,
      endDate:     data.endDate   ? new Date(data.endDate)   : undefined,
      allDay:      data.allDay,
      isEcosystem: data.isEcosystem,
    },
    include: activityInclude,
  });
}

export async function deleteActivity(id: number) {
  const exists = await prisma.activity.findUnique({ where: { id } });
  if (!exists) throw new ApiError(404, 'Activity not found');
  return prisma.activity.delete({ where: { id } });
}

// ─── Month Summary ────────────────────────────────────────────────

export async function getMonthSummary(month: number, year: number) {
  const activities = await getActivities(month, year);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dayStart = new Date(year, month - 1, d, 0, 0, 0, 0);
    const dayEnd   = new Date(year, month - 1, d, 23, 59, 59, 999);

    const dayActs = activities.filter(a => {
      const s = new Date(a.startDate);
      const e = new Date(a.endDate);
      return s <= dayEnd && e >= dayStart;
    });

    const catMap: Record<string, { name: string; color: string; count: number }> = {};
    dayActs.forEach(a => {
      if (!catMap[a.category.name]) {
        catMap[a.category.name] = { name: a.category.name, color: a.category.color, count: 0 };
      }
      catMap[a.category.name].count++;
    });

    return {
      date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      count: dayActs.length,
      categories: Object.values(catMap),
    };
  });
}

// ─── Categories ───────────────────────────────────────────────────

export async function getCategories() {
  return prisma.activityCategory.findMany({ orderBy: { name: 'asc' } });
}

export async function createCategory(data: { name: string; color: string; icon?: string }) {
  return prisma.activityCategory.create({ data });
}

export async function updateCategory(
  id: number,
  data: Partial<{ name: string; color: string; icon: string }>
) {
  return prisma.activityCategory.update({ where: { id }, data });
}

export async function deleteCategory(id: number) {
  const count = await prisma.activity.count({ where: { categoryId: id } });
  if (count > 0) throw new ApiError(400, `Cannot delete: ${count} activities use this category`);
  return prisma.activityCategory.delete({ where: { id } });
}
