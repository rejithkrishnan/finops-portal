import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sliders, Server, Activity, PlayCircle, Plus, Edit3, Trash2, CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as envService from '../services/envService';
import * as calendarService from '../services/calendarService';
import type { ServerRole } from '../types/environment';
import type { EnvType } from '../services/envService';
import type { ActivityCategory } from '../types/calendar';
import Modal from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'general' | 'environments' | 'calendar' | 'services' | 'eod'>('environments');

  // Database settings lists
  const [envTypes, setEnvTypes] = useState<EnvType[]>([]);
  const [roles, setRoles] = useState<ServerRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal control states
  const [showAddEnvType, setShowAddEnvType] = useState(false);
  const [showEditEnvType, setShowEditEnvType] = useState(false);
  const [selectedEnvTypeForEdit, setSelectedEnvTypeForEdit] = useState<EnvType | null>(null);

  const [showAddRole, setShowAddRole] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<ServerRole | null>(null);

  // Calendar categories state
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<ActivityCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#97144d', icon: '' });

  // Forms values
  const [envTypeForm, setEnvTypeForm] = useState({ name: '', description: '' });
  const [roleForm, setRoleForm] = useState({ name: '', color: '#97144d', description: '' });

  // Simulated General/Services/EOD configurations states
  const [generalConfig, setGeneralConfig] = useState({ portalTitle: 'FinOps Operations Console', supportEmail: 'ops.support@axisbank.com', envBanner: true });
  const [servicesConfig, setServicesConfig] = useState({ defaultInterval: 60, timeoutSeconds: 15, alertOnFailure: true });
  const [eodConfig, setEodConfig] = useState({ retryCount: 3, executionBufferMin: 15, notificationChannel: '#finops-eod-alerts' });

  const loadSettingsData = async () => {
    try {
      const [envTypeData, roleData, catData] = await Promise.all([
        envService.getEnvTypes(),
        envService.getServerRoles(),
        calendarService.getCategories(),
      ]);
      setEnvTypes(envTypeData);
      setRoles(roleData);
      setCategories(catData);
    } catch {
      toast.error('Failed to load settings configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  // ─── Env Type CRUD Event Handlers ───────────────────────────────────
  const handleCreateEnvType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await envService.createEnvType(envTypeForm);
      toast.success('Environment type added');
      setShowAddEnvType(false);
      setEnvTypeForm({ name: '', description: '' });
      loadSettingsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add environment type');
    }
  };

  const handleUpdateEnvType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnvTypeForEdit) return;
    try {
      await envService.updateEnvType(selectedEnvTypeForEdit.id, envTypeForm);
      toast.success('Environment type updated');
      setShowEditEnvType(false);
      setSelectedEnvTypeForEdit(null);
      setEnvTypeForm({ name: '', description: '' });
      loadSettingsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update environment type');
    }
  };

  const handleDeleteEnvType = async (id: number) => {
    if (!confirm('Are you sure you want to delete this environment type?')) return;
    try {
      await envService.deleteEnvType(id);
      toast.success('Environment type deleted');
      loadSettingsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete environment type');
    }
  };

  // ─── Server Role CRUD Event Handlers ──────────────────────────────────
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await envService.createServerRole(roleForm);
      toast.success('Server role added');
      setShowAddRole(false);
      setRoleForm({ name: '', color: '#97144d', description: '' });
      loadSettingsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add server role');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleForEdit) return;
    try {
      await envService.updateServerRole(selectedRoleForEdit.id, roleForm);
      toast.success('Server role updated');
      setShowEditRole(false);
      setSelectedRoleForEdit(null);
      setRoleForm({ name: '', color: '#97144d', description: '' });
      loadSettingsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update server role');
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm('Are you sure you want to delete this server role?')) return;
    try {
      await envService.deleteServerRole(id);
      toast.success('Server role deleted');
      loadSettingsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete server role');
    }
  };

  // ─── Activity Category CRUD ──────────────────────────────────────
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await calendarService.createCategory(categoryForm);
      toast.success('Category added');
      setShowAddCategory(false);
      setCategoryForm({ name: '', color: '#97144d', icon: '' });
      loadSettingsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryForEdit) return;
    try {
      await calendarService.updateCategory(selectedCategoryForEdit.id, categoryForm);
      toast.success('Category updated');
      setShowEditCategory(false);
      setSelectedCategoryForEdit(null);
      setCategoryForm({ name: '', color: '#97144d', icon: '' });
      loadSettingsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Delete this activity category?')) return;
    try {
      await calendarService.deleteCategory(id);
      toast.success('Category deleted');
      loadSettingsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const sidebarTabs = [
    { id: 'general',      label: 'General Settings',    icon: Sliders      },
    { id: 'environments', label: 'Environments',        icon: Server       },
    { id: 'calendar',     label: 'Calendar Settings',   icon: CalendarDays },
    { id: 'services',     label: 'Monitoring Settings', icon: Activity     },
    { id: 'eod',          label: 'EOD Parameters',      icon: PlayCircle   },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-surface-700/30 pb-4">
        <h1 className="text-2xl font-bold text-surface-100">Portal Settings</h1>
        <p className="text-sm text-surface-500">Configure global properties and options across apps.</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Settings Navigation Sidebar */}
        <div className="w-64 flex-shrink-0 glass-card p-2 space-y-1">
          {sidebarTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/40'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Settings Details Container */}
        <div className="flex-1 glass-card p-6">
          {/* ─── TAB: GENERAL ────────────────────────────────────────────── */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-surface-150 mb-1">General Settings</h2>
                <p className="text-xs text-surface-500">Global portal title and custom display options.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-surface-400">Portal Display Title</label>
                  <input
                    type="text"
                    className="input-field"
                    value={generalConfig.portalTitle}
                    onChange={e => setGeneralConfig({...generalConfig, portalTitle: e.target.value})}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-surface-400">Support Contact Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={generalConfig.supportEmail}
                    onChange={e => setGeneralConfig({...generalConfig, supportEmail: e.target.value})}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="envBanner"
                    className="w-4 h-4 rounded border-surface-700 bg-surface-800 text-brand-500 focus:ring-brand-500"
                    checked={generalConfig.envBanner}
                    onChange={e => setGeneralConfig({...generalConfig, envBanner: e.target.checked})}
                    disabled={!isAdmin}
                  />
                  <label htmlFor="envBanner" className="text-sm font-medium text-surface-300 cursor-pointer">
                    Show Environment Status Banner
                  </label>
                </div>
              </div>
              {isAdmin && (
                <div className="flex justify-end pt-4 border-t border-surface-750">
                  <button onClick={() => toast.success('General settings saved (simulated)')} className="btn-primary">
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: ENVIRONMENTS (CONFIGURABLE DICTIONARIES) ─────────────── */}
          {activeTab === 'environments' && (
            <div className="space-y-8">
              {/* ENV TYPES SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-surface-700/30 pb-2">
                  <div>
                    <h2 className="text-lg font-semibold text-surface-150">Environment Types</h2>
                    <p className="text-xs text-surface-500">Configure list of available environment categories (e.g. PROD, UAT).</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEnvTypeForm({ name: '', description: '' });
                        setShowAddEnvType(true);
                      }}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      Add Type
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase text-surface-500 tracking-wider">
                        <th className="text-left py-2 px-3 font-medium">Name</th>
                        <th className="text-left py-2 px-3 font-medium">Description</th>
                        {isAdmin && <th className="text-right py-2 px-3 font-medium">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {envTypes.map(t => (
                        <tr key={t.id} className="border-b border-surface-800/40 hover:bg-surface-800/20 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-surface-200">{t.name}</td>
                          <td className="py-2.5 px-3 text-surface-400">{t.description || '—'}</td>
                          {isAdmin && (
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedEnvTypeForEdit(t);
                                    setEnvTypeForm({ name: t.name, description: t.description || '' });
                                    setShowEditEnvType(true);
                                  }}
                                  className="p-1 rounded hover:bg-surface-800 text-surface-500 hover:text-brand-400 transition-colors"
                                  title="Edit Env Type"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteEnvType(t.id)}
                                  className="p-1 rounded hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors"
                                  title="Delete Env Type"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SERVER ROLES SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-surface-700/30 pb-2">
                  <div>
                    <h2 className="text-lg font-semibold text-surface-150">Server Roles</h2>
                    <p className="text-xs text-surface-500">Configure role categorization for host servers (e.g. IHS, WAS, APP).</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setRoleForm({ name: '', color: '#97144d', description: '' });
                        setShowAddRole(true);
                      }}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      Add Role
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase text-surface-500 tracking-wider">
                        <th className="text-left py-2 px-3 font-medium">Role</th>
                        <th className="text-left py-2 px-3 font-medium">Color</th>
                        <th className="text-left py-2 px-3 font-medium">Description</th>
                        {isAdmin && <th className="text-right py-2 px-3 font-medium">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map(r => (
                        <tr key={r.id} className="border-b border-surface-800/40 hover:bg-surface-800/20 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-surface-200">{r.name}</td>
                          <td className="py-2.5 px-3 text-surface-400 flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full border border-surface-700" style={{ backgroundColor: r.color }} />
                            <span className="font-mono text-xs">{r.color}</span>
                          </td>
                          <td className="py-2.5 px-3 text-surface-400">{r.description || '—'}</td>
                          {isAdmin && (
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedRoleForEdit(r);
                                    setRoleForm({ name: r.name, color: r.color, description: r.description || '' });
                                    setShowEditRole(true);
                                  }}
                                  className="p-1 rounded hover:bg-surface-800 text-surface-500 hover:text-brand-400 transition-colors"
                                  title="Edit Role"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteRole(r.id)}
                                  className="p-1 rounded hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors"
                                  title="Delete Role"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: CALENDAR ──────────────────────────────────────────────── */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-surface-700/30 pb-2">
                <div>
                  <h2 className="text-lg font-semibold text-surface-150">Activity Categories</h2>
                  <p className="text-xs text-surface-500">Colour-coded categories used to classify calendar events.</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setCategoryForm({ name: '', color: '#97144d', icon: '' });
                      setShowAddCategory(true);
                    }}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    Add Category
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-surface-500 tracking-wider">
                      <th className="text-left py-2 px-3 font-medium">Category</th>
                      <th className="text-left py-2 px-3 font-medium">Color</th>
                      <th className="text-left py-2 px-3 font-medium">Icon</th>
                      {isAdmin && <th className="text-right py-2 px-3 font-medium">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(cat => (
                      <tr key={cat.id} className="border-b border-surface-800/40 hover:bg-surface-800/20 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-surface-200">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-surface-400 flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full border border-surface-700" style={{ backgroundColor: cat.color }} />
                          <span className="font-mono text-xs">{cat.color}</span>
                        </td>
                        <td className="py-2.5 px-3 text-surface-400 font-mono text-xs">{cat.icon || '—'}</td>
                        {isAdmin && (
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedCategoryForEdit(cat);
                                  setCategoryForm({ name: cat.name, color: cat.color, icon: cat.icon || '' });
                                  setShowEditCategory(true);
                                }}
                                className="p-1 rounded hover:bg-surface-800 text-surface-500 hover:text-brand-400 transition-colors"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1 rounded hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-surface-600 text-sm">
                          No categories configured yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB: SERVICES (MONITORING) ─────────────────────────────────── */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-surface-150 mb-1">Service Monitoring Settings</h2>
                <p className="text-xs text-surface-500">Configure polling loops and agent connection policies.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-surface-400">Default Check Interval (Seconds)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={servicesConfig.defaultInterval}
                    onChange={e => setServicesConfig({...servicesConfig, defaultInterval: parseInt(e.target.value)})}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-surface-400">Connection Timeout Threshold (Seconds)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={servicesConfig.timeoutSeconds}
                    onChange={e => setServicesConfig({...servicesConfig, timeoutSeconds: parseInt(e.target.value)})}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6 col-span-2">
                  <input
                    type="checkbox"
                    id="alertOnFailure"
                    className="w-4 h-4 rounded border-surface-700 bg-surface-800 text-brand-500 focus:ring-brand-500"
                    checked={servicesConfig.alertOnFailure}
                    onChange={e => setServicesConfig({...servicesConfig, alertOnFailure: e.target.checked})}
                    disabled={!isAdmin}
                  />
                  <label htmlFor="alertOnFailure" className="text-sm font-medium text-surface-300 cursor-pointer">
                    Send alert immediately if check fails
                  </label>
                </div>
              </div>
              {isAdmin && (
                <div className="flex justify-end pt-4 border-t border-surface-750">
                  <button onClick={() => toast.success('Monitoring parameters saved (simulated)')} className="btn-primary">
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: EOD PARAMETERS ────────────────────────────────────────── */}
          {activeTab === 'eod' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-surface-150 mb-1">EOD Parameters</h2>
                <p className="text-xs text-surface-500">Configure parameters relating to the End Of Day batch execution scheduler.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-surface-400">Max Retry Attempts on Script Crash</label>
                  <input
                    type="number"
                    className="input-field"
                    value={eodConfig.retryCount}
                    onChange={e => setEodConfig({...eodConfig, retryCount: parseInt(e.target.value)})}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-surface-400">Pre-Execution Lock Buffer (Minutes)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={eodConfig.executionBufferMin}
                    onChange={e => setEodConfig({...eodConfig, executionBufferMin: parseInt(e.target.value)})}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-surface-400">Notifications Slack/Teams Webhook Channel</label>
                  <input
                    type="text"
                    className="input-field font-mono"
                    value={eodConfig.notificationChannel}
                    onChange={e => setEodConfig({...eodConfig, notificationChannel: e.target.value})}
                    disabled={!isAdmin}
                  />
                </div>
              </div>
              {isAdmin && (
                <div className="flex justify-end pt-4 border-t border-surface-750">
                  <button onClick={() => toast.success('EOD parameters saved (simulated)')} className="btn-primary">
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── MODALS: ENV TYPE CRUD ────────────────────────────────────────── */}
      <Modal isOpen={showAddEnvType} onClose={() => setShowAddEnvType(false)} title="Add Environment Type">
        <form onSubmit={handleCreateEnvType} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-400">Type Name *</label>
            <input
              type="text"
              className="input-field"
              value={envTypeForm.name}
              onChange={e => setEnvTypeForm({...envTypeForm, name: e.target.value.toUpperCase()})}
              placeholder="e.g. SIT"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-400">Description</label>
            <input
              type="text"
              className="input-field"
              value={envTypeForm.description}
              onChange={e => setEnvTypeForm({...envTypeForm, description: e.target.value})}
              placeholder="e.g. System Integration Testing"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddEnvType(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Type</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditEnvType} onClose={() => { setShowEditEnvType(false); setSelectedEnvTypeForEdit(null); }} title="Edit Environment Type">
        <form onSubmit={handleUpdateEnvType} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-400">Type Name *</label>
            <input
              type="text"
              className="input-field"
              value={envTypeForm.name}
              onChange={e => setEnvTypeForm({...envTypeForm, name: e.target.value.toUpperCase()})}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-400">Description</label>
            <input
              type="text"
              className="input-field"
              value={envTypeForm.description}
              onChange={e => setEnvTypeForm({...envTypeForm, description: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowEditEnvType(false); setSelectedEnvTypeForEdit(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* ─── MODALS: ACTIVITY CATEGORY CRUD ─────────────────────────────── */}
      <Modal isOpen={showAddCategory} onClose={() => setShowAddCategory(false)} title="Add Activity Category">
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-400">Category Name *</label>
              <input
                type="text"
                className="input-field"
                value={categoryForm.name}
                onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g. DR Activity"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-400">Hex Color *</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="w-10 h-10 border border-surface-700 bg-surface-800 rounded cursor-pointer"
                  value={categoryForm.color}
                  onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                />
                <input
                  type="text"
                  className="input-field font-mono"
                  value={categoryForm.color}
                  onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-400">Icon (Lucide name)</label>
            <input
              type="text"
              className="input-field font-mono"
              value={categoryForm.icon}
              onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })}
              placeholder="e.g. ShieldAlert"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddCategory(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Category</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditCategory} onClose={() => { setShowEditCategory(false); setSelectedCategoryForEdit(null); }} title="Edit Activity Category">
        <form onSubmit={handleUpdateCategory} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-400">Category Name *</label>
              <input
                type="text"
                className="input-field"
                value={categoryForm.name}
                onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-400">Hex Color *</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="w-10 h-10 border border-surface-700 bg-surface-800 rounded cursor-pointer"
                  value={categoryForm.color}
                  onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                />
                <input
                  type="text"
                  className="input-field font-mono"
                  value={categoryForm.color}
                  onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-400">Icon (Lucide name)</label>
            <input
              type="text"
              className="input-field font-mono"
              value={categoryForm.icon}
              onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowEditCategory(false); setSelectedCategoryForEdit(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* ─── MODALS: SERVER ROLE CRUD ─────────────────────────────────────── */}
      <Modal isOpen={showAddRole} onClose={() => setShowAddRole(false)} title="Add Server Role">
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-400">Role Name *</label>
              <input
                type="text"
                className="input-field font-mono"
                value={roleForm.name}
                onChange={e => setRoleForm({...roleForm, name: e.target.value.toUpperCase()})}
                placeholder="e.g. KAFKA"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-400">Hex Color Code *</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="w-10 h-10 border border-surface-700 bg-surface-800 rounded cursor-pointer"
                  value={roleForm.color}
                  onChange={e => setRoleForm({...roleForm, color: e.target.value})}
                />
                <input
                  type="text"
                  className="input-field font-mono"
                  value={roleForm.color}
                  onChange={e => setRoleForm({...roleForm, color: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-400">Description</label>
            <input
              type="text"
              className="input-field"
              value={roleForm.description}
              onChange={e => setRoleForm({...roleForm, description: e.target.value})}
              placeholder="e.g. Message Streaming Broker Server"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddRole(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Role</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditRole} onClose={() => { setShowEditRole(false); setSelectedRoleForEdit(null); }} title="Edit Server Role">
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-400">Role Name *</label>
              <input
                type="text"
                className="input-field font-mono"
                value={roleForm.name}
                onChange={e => setRoleForm({...roleForm, name: e.target.value.toUpperCase()})}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-400">Hex Color Code *</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="w-10 h-10 border border-surface-700 bg-surface-800 rounded cursor-pointer"
                  value={roleForm.color}
                  onChange={e => setRoleForm({...roleForm, color: e.target.value})}
                />
                <input
                  type="text"
                  className="input-field font-mono"
                  value={roleForm.color}
                  onChange={e => setRoleForm({...roleForm, color: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-400">Description</label>
            <input
              type="text"
              className="input-field"
              value={roleForm.description}
              onChange={e => setRoleForm({...roleForm, description: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowEditRole(false); setSelectedRoleForEdit(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
