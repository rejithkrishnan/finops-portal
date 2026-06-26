import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, Globe, Edit3, Trash2,
  Calendar as CalendarIcon, X, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as calendarService from '../services/calendarService';
import * as envService from '../services/envService';
import type { Activity, ActivityCategory } from '../types/calendar';
import type { Application } from '../types/environment';
import Modal from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// ─── Date Utilities ────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function toCol(date: Date): number {
  return (date.getDay() + 6) % 7; // Mon=0 … Sun=6
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildCalendarWeeks(year: number, month: number): Date[][] {
  const firstDay  = new Date(year, month - 1, 1);
  const startCol  = toCol(firstDay);
  const cur       = new Date(year, month - 1, 1 - startCol); // Mon of first week
  const lastDay   = new Date(year, month, 0);                // last day of month
  const weeks: Date[][] = [];

  do {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  } while (cur <= lastDay && weeks.length < 6);

  return weeks;
}

// ─── Activity Slot Computation ─────────────────────────────────────

type Slot = {
  activity: Activity;
  startCol: number;
  endCol: number;
  isStart: boolean;
  isEnd: boolean;
  lane: number;
};

function computeWeekSlots(week: Date[], activities: Activity[]): Slot[] {
  const weekStart = new Date(week[0]);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(week[6]);
  weekEnd.setHours(23, 59, 59, 999);

  const slots: Slot[] = [];

  for (const activity of activities) {
    const start = parseISODate(activity.startDate);
    const end   = parseISODate(activity.endDate);

    if (start > weekEnd || end < weekStart) continue;

    const startCol = start < weekStart ? 0 : toCol(start);
    const endCol   = end   > weekEnd   ? 6 : toCol(end);

    slots.push({
      activity,
      startCol,
      endCol,
      isStart: start >= weekStart,
      isEnd:   end   <= weekEnd,
      lane: 0,
    });
  }

  // Sort: earlier start first, then longer spans first
  slots.sort((a, b) =>
    a.startCol !== b.startCol
      ? a.startCol - b.startCol
      : (b.endCol - b.startCol) - (a.endCol - a.startCol)
  );

  // Assign lanes (greedy)
  const laneEnds: number[] = [];
  for (const slot of slots) {
    let lane = laneEnds.findIndex(end => end < slot.startCol);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(slot.endCol); }
    else laneEnds[lane] = slot.endCol;
    slot.lane = lane;
  }

  return slots;
}

// ─── Upcoming Activities List ──────────────────────────────────────

function UpcomingList({
  activities,
  onEditActivity,
}: {
  activities: Activity[];
  onEditActivity: (a: Activity) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = activities
    .filter(a => parseISODate(a.endDate) >= today)
    .sort((a, b) => parseISODate(a.startDate).getTime() - parseISODate(b.startDate).getTime())
    .slice(0, 8);

  if (upcoming.length === 0) return null;

  const badge = (a: Activity) => {
    const start = parseISODate(a.startDate);
    const end   = parseISODate(a.endDate);
    if (isSameDay(today, start) || (today >= start && today <= end)) return { label: 'Today', cls: 'text-emerald-400' };
    const diff = Math.ceil((start.getTime() - today.getTime()) / 86400000);
    if (diff === 1) return { label: 'Tomorrow', cls: 'text-amber-400' };
    return { label: `In ${diff}d`, cls: 'text-surface-400' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-5"
    >
      <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">
        Upcoming Activities
      </h3>
      <div className="space-y-1">
        {upcoming.map(a => {
          const b = badge(a);
          const startD = parseISODate(a.startDate);
          const endD   = parseISODate(a.endDate);
          const sameDay = isSameDay(startD, endD);
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-800/30 transition-colors cursor-pointer group"
              onClick={() => onEditActivity(a)}
            >
              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: a.category.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-200 truncate group-hover:text-surface-100">
                  {a.title}
                </p>
                <p className="text-xs text-surface-500">
                  {startD.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  {!sameDay && ` – ${endD.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                  {' · '}
                  {a.isEcosystem ? 'Ecosystem' : a.environments.map(e => e.environment.shortCode).join(', ')}
                </p>
              </div>
              <span className={`text-xs flex-shrink-0 ${b.cls}`}>{b.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Day Detail Panel ──────────────────────────────────────────────

function DayDetailPanel({
  day,
  activities,
  onClose,
  onEdit,
  onDelete,
  canEdit,
}: {
  day: Date;
  activities: Activity[];
  onClose: () => void;
  onEdit: (a: Activity) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
}) {
  const today = new Date();
  const isToday = isSameDay(day, today);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${isToday ? ' — Today' : ''}`}
      size="md"
    >
      {activities.length === 0 ? (
        <p className="text-surface-500 text-sm text-center py-8">No activities on this day.</p>
      ) : (
        <div className="space-y-3">
          {activities.map(a => (
            <div
              key={a.id}
              className="rounded-xl p-3.5 border border-surface-700/40 hover:border-surface-600/60 transition-colors"
              style={{ borderLeftColor: a.category.color, borderLeftWidth: 3 }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${a.category.color}20`, color: a.category.color }}
                    >
                      {a.category.name}
                    </span>
                    {a.isEcosystem && (
                      <span className="text-xs text-surface-500 flex items-center gap-1">
                        <Globe size={11} /> Ecosystem
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-surface-100">{a.title}</p>
                  {a.description && (
                    <p className="text-xs text-surface-400 mt-0.5">{a.description}</p>
                  )}
                  <p className="text-xs text-surface-500 mt-1">
                    {parseISODate(a.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {' – '}
                    {parseISODate(a.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  {!a.isEcosystem && a.environments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {a.environments.map(e => (
                        <span key={e.environmentId} className="surface-pill text-[10px] px-1.5 py-0.5 rounded">
                          {e.environment.shortCode}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { onClose(); onEdit(a); }}
                      className="p-1 rounded hover:bg-surface-700 text-surface-400 hover:text-brand-400 transition-colors"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(a.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-surface-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ─── Activity Form ─────────────────────────────────────────────────

function ActivityForm({
  initialData,
  categories,
  applications,
  onSubmit,
  onCancel,
}: {
  initialData?: Activity | null;
  categories: ActivityCategory[];
  applications: Application[];
  onSubmit: (data: {
    title: string; description?: string; categoryId: number;
    startDate: string; endDate: string; allDay: boolean;
    isEcosystem: boolean; environmentIds: number[];
  }) => void;
  onCancel: () => void;
}) {
  const today = toDateInputValue(new Date());

  const [form, setForm] = useState({
    title:          initialData?.title       ?? '',
    description:    initialData?.description ?? '',
    categoryId:     initialData?.categoryId  ?? (categories[0]?.id ?? 0),
    startDate:      initialData ? initialData.startDate.split('T')[0] : today,
    endDate:        initialData ? initialData.endDate.split('T')[0]   : today,
    startTime:      '09:00',
    endTime:        '17:00',
    allDay:         initialData?.allDay      ?? true,
    isEcosystem:    initialData?.isEcosystem ?? false,
    environmentIds: initialData?.environments.map(e => e.environmentId) ?? [] as number[],
  });

  const toggleEnv = (id: number) => {
    setForm(f => ({
      ...f,
      environmentIds: f.environmentIds.includes(id)
        ? f.environmentIds.filter(e => e !== id)
        : [...f.environmentIds, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) { toast.error('Please select a category'); return; }
    if (!form.isEcosystem && form.environmentIds.length === 0) {
      toast.error('Select at least one environment or mark as Ecosystem'); return;
    }
    const startDate = form.allDay ? form.startDate : `${form.startDate}T${form.startTime}:00`;
    const endDate   = form.allDay ? form.endDate   : `${form.endDate}T${form.endTime}:00`;
    onSubmit({ ...form, categoryId: Number(form.categoryId), startDate, endDate });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-surface-400">Title *</label>
          <input
            className="input-field"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Monthly DR Switchover"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Category *</label>
          <select
            className="input-field"
            value={form.categoryId}
            onChange={e => setForm({ ...form, categoryId: parseInt(e.target.value) })}
            required
          >
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Description</label>
          <input
            className="input-field"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Optional notes"
          />
        </div>
      </div>

      {/* All Day toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="allDay"
          className="w-4 h-4 rounded border-surface-700 bg-surface-800 text-brand-500 focus:ring-brand-500 cursor-pointer"
          checked={form.allDay}
          onChange={e => setForm({ ...form, allDay: e.target.checked })}
        />
        <label htmlFor="allDay" className="text-sm font-medium text-surface-300 cursor-pointer">All-day event</label>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Start Date *</label>
          <input
            type="date"
            className="input-field"
            value={form.startDate}
            onChange={e => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">End Date *</label>
          <input
            type="date"
            className="input-field"
            value={form.endDate}
            min={form.startDate}
            onChange={e => setForm({ ...form, endDate: e.target.value })}
            required
          />
        </div>
        {!form.allDay && (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-400">Start Time</label>
              <input
                type="time"
                className="input-field"
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-400">End Time</label>
              <input
                type="time"
                className="input-field"
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </>
        )}
      </div>

      {/* Scope */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-surface-400">Scope</label>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isEcosystem"
            className="w-4 h-4 rounded border-surface-700 bg-surface-800 text-brand-500 focus:ring-brand-500 cursor-pointer"
            checked={form.isEcosystem}
            onChange={e => setForm({ ...form, isEcosystem: e.target.checked, environmentIds: [] })}
          />
          <label htmlFor="isEcosystem" className="text-sm font-medium text-surface-300 cursor-pointer flex items-center gap-1.5">
            <Globe size={14} className="text-brand-400" /> Applies to all environments (Ecosystem-wide)
          </label>
        </div>

        {/* Environment multi-select */}
        {!form.isEcosystem && (
          <div className="border border-surface-700/50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-3 mt-1">
            {applications.map(app => (
              <div key={app.id}>
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">{app.name}</p>
                <div className="space-y-1">
                  {app.environments.map(env => (
                    <label key={env.id} className="flex items-center gap-2.5 cursor-pointer group py-0.5">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded border-surface-700 bg-surface-800 text-brand-500 focus:ring-brand-500"
                        checked={form.environmentIds.includes(env.id)}
                        onChange={() => toggleEnv(env.id)}
                      />
                      <span className="text-sm text-surface-300 group-hover:text-surface-100 transition-colors">
                        {env.name}
                        <span className="ml-1.5 text-xs text-surface-600 font-mono">{env.shortCode}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-surface-700/30">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">
          {initialData ? 'Save Changes' : 'Create Activity'}
        </button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN CALENDAR PAGE
// ═══════════════════════════════════════════════════════════════════

export default function CalendarPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1–12
  const [direction, setDirection] = useState<1 | -1>(1);

  const [activities,    setActivities]    = useState<Activity[]>([]);
  const [categories,    setCategories]    = useState<ActivityCategory[]>([]);
  const [applications,  setApplications]  = useState<Application[]>([]);
  const [loading,       setLoading]       = useState(true);

  const [selectedDay,      setSelectedDay]      = useState<Date | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showForm,         setShowForm]         = useState(false);
  const [isEditMode,       setIsEditMode]       = useState(false);
  const [formDefaultDate,  setFormDefaultDate]  = useState<string | undefined>();

  const [envFilter,      setEnvFilter]      = useState<number | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [showFilters,    setShowFilters]    = useState(false);

  // ─── Data Fetch ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [acts, cats, apps] = await Promise.all([
        calendarService.getActivities(month, year, envFilter || undefined),
        calendarService.getCategories(),
        envService.getApplications(),
      ]);
      setActivities(acts);
      setCategories(cats);
      setApplications(apps);
    } catch {
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [month, year, envFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Month Navigation ────────────────────────────────────────────
  const navigate = (dir: 1 | -1) => {
    setDirection(dir);
    if (dir === 1) {
      if (month === 12) { setMonth(1); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    } else {
      if (month === 1) { setMonth(12); setYear(y => y - 1); }
      else setMonth(m => m - 1);
    }
  };

  const goToToday = () => {
    const t = new Date();
    setDirection(t.getFullYear() * 12 + t.getMonth() > year * 12 + (month - 1) ? 1 : -1);
    setYear(t.getFullYear());
    setMonth(t.getMonth() + 1);
  };

  // ─── CRUD Handlers ───────────────────────────────────────────────
  const handleCreate = async (data: Parameters<typeof calendarService.createActivity>[0]) => {
    try {
      await calendarService.createActivity(data);
      toast.success('Activity created');
      setShowForm(false);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e.response?.data?.error?.message || 'Failed to create activity');
    }
  };

  const handleUpdate = async (data: Parameters<typeof calendarService.createActivity>[0]) => {
    if (!selectedActivity) return;
    try {
      await calendarService.updateActivity(selectedActivity.id, data);
      toast.success('Activity updated');
      setShowForm(false);
      setSelectedActivity(null);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(e.response?.data?.error?.message || 'Failed to update activity');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await calendarService.deleteActivity(id);
      toast.success('Activity deleted');
      setSelectedDay(null);
      loadData();
    } catch {
      toast.error('Failed to delete activity');
    }
  };

  const openEditForm = (a: Activity) => {
    setSelectedActivity(a);
    setIsEditMode(true);
    setShowForm(true);
  };

  const openCreateForm = (defaultDate?: string) => {
    setSelectedActivity(null);
    setIsEditMode(false);
    setFormDefaultDate(defaultDate);
    setShowForm(true);
  };

  // ─── Derived State ────────────────────────────────────────────────
  const filteredActivities = categoryFilter
    ? activities.filter(a => a.categoryId === Number(categoryFilter))
    : activities;

  const weeks = buildCalendarWeeks(year, month);

  const dayActivities = selectedDay
    ? filteredActivities.filter(a => {
        const start = parseISODate(a.startDate);
        const end   = parseISODate(a.endDate);
        const day   = new Date(selectedDay);
        day.setHours(0, 0, 0, 0);
        return start <= day && end >= day;
      })
    : [];

  // Flat env list for filter dropdown
  const allEnvironments = applications.flatMap(app =>
    app.environments.map(env => ({ ...env, appName: app.name }))
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 glass-card shimmer rounded-xl" />
        <div className="h-96 glass-card shimmer rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-700/30 pb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 flex-shrink-0">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-100">Finacle Calendar</h1>
            <p className="text-sm text-surface-500">Activity planner for operational events</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => openCreateForm()}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Add Activity
            </button>
          )}
        </div>
      </motion.div>

      {/* ─── Controls Row ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Month Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-bold text-surface-100 w-44 text-center">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={goToToday}
            className="text-xs px-3 py-1.5 rounded-lg border border-surface-700 text-surface-400 hover:text-surface-200 hover:border-surface-600 transition-colors ml-1"
          >
            Today
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              showFilters || envFilter || categoryFilter
                ? 'border-brand-500/40 text-brand-400 bg-brand-500/10'
                : 'border-surface-700 text-surface-400 hover:border-surface-600 hover:text-surface-200'
            }`}
          >
            <Filter size={14} />
            Filters
            {(envFilter || categoryFilter) && (
              <span className="ml-1 bg-brand-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {[envFilter, categoryFilter].filter(Boolean).length}
              </span>
            )}
          </button>
          {(envFilter || categoryFilter) && (
            <button
              onClick={() => { setEnvFilter(''); setCategoryFilter(''); }}
              className="text-xs text-surface-500 hover:text-surface-300 flex items-center gap-1"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium text-surface-500 uppercase tracking-wider">Environment</label>
                <select
                  className="input-field text-sm"
                  value={envFilter}
                  onChange={e => setEnvFilter(e.target.value ? parseInt(e.target.value) : '')}
                >
                  <option value="">All Environments</option>
                  {allEnvironments.map(env => (
                    <option key={env.id} value={env.id}>{env.appName} — {env.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium text-surface-500 uppercase tracking-wider">Category</label>
                <select
                  className="input-field text-sm"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value ? parseInt(e.target.value) : '')}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Calendar Grid ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card overflow-hidden"
      >
        {/* Day name headers */}
        <div className="grid grid-cols-7 border-b border-surface-700/40">
          {DAY_NAMES.map(day => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-surface-500 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Animated Month Grid */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${year}-${month}`}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir * 20, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit:  (dir: number) => ({ x: dir * -20, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18 }}
          >
            {weeks.map((week, weekIdx) => {
              const slots    = computeWeekSlots(week, filteredActivities);
              const maxLane  = slots.reduce((m, s) => Math.max(m, s.lane), -1);
              const rowHeight = 44 + (maxLane + 1) * 24 + 8;

              return (
                <div
                  key={weekIdx}
                  className="relative border-b border-surface-800/30 last:border-b-0"
                  style={{ minHeight: rowHeight }}
                >
                  {/* Day cells */}
                  <div className="grid grid-cols-7 h-full divide-x divide-surface-800/20">
                    {week.map((day, dayIdx) => {
                      const isCurrentMonth = day.getMonth() === month - 1;
                      const isToday        = isSameDay(day, now);

                      return (
                        <div
                          key={dayIdx}
                          className={`pt-1.5 px-1.5 cursor-pointer transition-colors ${
                            isCurrentMonth ? '' : 'opacity-30'
                          } ${isToday
                            ? 'bg-brand-500/5'
                            : 'hover:bg-surface-800/20'
                          }`}
                          onClick={() => setSelectedDay(day)}
                        >
                          <div className="flex justify-end">
                            <span
                              className={`text-sm font-medium flex items-center justify-center w-7 h-7 rounded-full ${
                                isToday
                                  ? 'bg-brand-500 text-white font-bold'
                                  : 'text-surface-400'
                              }`}
                            >
                              {day.getDate()}
                            </span>
                          </div>
                          {/* Quick-add on empty space click — only show for current month */}
                          {canEdit && isCurrentMonth && (
                            <div
                              className="absolute opacity-0 hover:opacity-100 transition-opacity"
                              style={{ display: 'none' }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Activity bars overlay */}
                  <div className="absolute left-0 right-0 pointer-events-none" style={{ top: 38 }}>
                    {slots.map((slot, i) => {
                      const col  = slot.activity.category.color;
                      const br = [
                        slot.isStart ? '3px' : '0',
                        slot.isEnd   ? '3px' : '0',
                        slot.isEnd   ? '3px' : '0',
                        slot.isStart ? '3px' : '0',
                      ].join(' ');

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scaleX: 0.9 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          transition={{ duration: 0.15, delay: i * 0.02 }}
                          className="absolute h-5 flex items-center overflow-hidden pointer-events-auto cursor-pointer select-none"
                          style={{
                            top: slot.lane * 24,
                            left:  `calc(${slot.startCol / 7 * 100}% + 2px)`,
                            width: `calc(${(slot.endCol - slot.startCol + 1) / 7 * 100}% - 4px)`,
                            backgroundColor: `${col}22`,
                            color: col,
                            borderLeft: slot.isStart ? `3px solid ${col}` : `1px solid ${col}40`,
                            borderRight: `1px solid ${col}40`,
                            borderTop:   `1px solid ${col}30`,
                            borderBottom: `1px solid ${col}30`,
                            borderRadius: br,
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedDay(null);
                            setTimeout(() => setSelectedDay(
                              slot.isStart
                                ? parseISODate(slot.activity.startDate)
                                : week[0]
                            ), 0);
                          }}
                          title={slot.activity.title}
                        >
                          <span className="px-1.5 text-[11px] font-medium truncate leading-none">
                            {slot.isStart ? slot.activity.title : ''}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ─── Category Legend ──────────────────────────────────────── */}
      {categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card px-5 py-3 flex flex-wrap gap-4"
        >
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(c => c === cat.id ? '' : cat.id)}
              className={`flex items-center gap-2 text-xs font-medium transition-opacity ${
                categoryFilter && categoryFilter !== cat.id ? 'opacity-30' : ''
              }`}
            >
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
              <span className="text-surface-400">{cat.name}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* ─── Upcoming Activities ──────────────────────────────────── */}
      <UpcomingList activities={filteredActivities} onEditActivity={openEditForm} />

      {/* ─── Day Detail Panel ─────────────────────────────────────── */}
      {selectedDay && (
        <DayDetailPanel
          day={selectedDay}
          activities={dayActivities}
          onClose={() => setSelectedDay(null)}
          onEdit={openEditForm}
          onDelete={id => { handleDelete(id); setSelectedDay(null); }}
          canEdit={canEdit}
        />
      )}

      {/* ─── Activity Form Modal ──────────────────────────────────── */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setSelectedActivity(null); }}
        title={isEditMode ? 'Edit Activity' : 'New Activity'}
        size="lg"
      >
        <ActivityForm
          initialData={isEditMode ? selectedActivity : null}
          categories={categories}
          applications={applications}
          onSubmit={isEditMode ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setSelectedActivity(null); }}
        />
      </Modal>
    </div>
  );
}
