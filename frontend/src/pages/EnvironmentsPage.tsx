import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AppWindow, Server as ServerIcon, Database, Globe, Search, Plus, ChevronDown, ChevronRight,
  ChevronUp, Trash2, Monitor, HardDrive, Edit3,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import toast from 'react-hot-toast';
import * as envService from '../services/envService';
import type { EnvType } from '../services/envService';
import type {
  Application, DashboardData, Environment, ServerRole, Server, DatabaseInstance,
} from '../types/environment';
import Modal from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// ─── Animated Counter ─────────────────────────────────────────────
function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.ceil(value / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{display}</span>;
}

// ─── Summary Card ─────────────────────────────────────────────────
function SummaryCard({
  icon: Icon, label, value, color, delay,
}: {
  icon: React.ElementType; label: string; value: number; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="glass-card-hover p-5 flex items-center gap-4"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon size={24} />
      </div>
      <div>
        <p className="text-2xl font-bold text-surface-100">
          <AnimatedCounter value={value} />
        </p>
        <p className="text-sm text-surface-500 uppercase tracking-wider">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────
function RoleBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: `${color}20`,
        color,
        boxShadow: `0 0 8px ${color}15`,
      }}
    >
      {name}
    </span>
  );
}

// ─── Environment Detail Card ──────────────────────────────────────
function EnvironmentCard({
  env, roles, onRefresh, isAdmin, onEditEnv, onCollapse, searchQuery,
}: {
  env: Environment;
  roles: ServerRole[];
  onRefresh: () => void;
  isAdmin: boolean;
  onEditEnv: (env: Environment) => void;
  onCollapse: (envId: number) => void;
  searchQuery: string;
}) {
  const [showAddServer, setShowAddServer] = useState(false);
  const [showAddDb, setShowAddDb] = useState(false);

  const [showEditServer, setShowEditServer] = useState(false);
  const [selectedServerForEdit, setSelectedServerForEdit] = useState<Server | null>(null);
  const [showEditDb, setShowEditDb] = useState(false);
  const [selectedDbForEdit, setSelectedDbForEdit] = useState<DatabaseInstance | null>(null);

  const filteredServers = env.servers?.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.hostname.toLowerCase().includes(q) ||
           s.ipAddress.includes(q) ||
           s.role.name.toLowerCase().includes(q) ||
           (s.os && s.os.toLowerCase().includes(q)) ||
           (s.segment && s.segment.toLowerCase().includes(q));
  }) || [];

  const filteredDbs = env.databases?.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.name.toLowerCase().includes(q) ||
           d.host.includes(q) ||
           d.dbType.toLowerCase().includes(q) ||
           (d.schemaName && d.schemaName.toLowerCase().includes(q));
  }) || [];

  const handleAddServer = async (data: {
    hostname: string;
    ipAddress: string;
    roleId: number;
    os?: string;
    cores?: number;
    memory?: string;
    segment?: string;
  }) => {
    try {
      await envService.createServer(env.id, data);
      toast.success('Server added');
      setShowAddServer(false);
      onRefresh();
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || 'Failed to add server');
    }
  };

  const handleEditServer = async (data: Partial<{
    hostname: string;
    ipAddress: string;
    roleId: number;
    os?: string;
    cores?: number;
    memory?: string;
    segment?: string;
  }>) => {
    if (!selectedServerForEdit) return;
    try {
      await envService.updateServer(selectedServerForEdit.id, data);
      toast.success('Server updated');
      setShowEditServer(false);
      setSelectedServerForEdit(null);
      onRefresh();
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || 'Failed to update server');
    }
  };

  const handleDeleteServer = async (id: number) => {
    if (!confirm('Remove this server?')) return;
    try {
      await envService.deleteServer(id);
      toast.success('Server removed');
      onRefresh();
    } catch {
      toast.error('Failed to remove server');
    }
  };

  const handleAddDb = async (data: {
    name: string;
    host: string;
    port: string;
    dbType: string;
    version?: string;
    schemaName?: string;
    connectionString?: string;
  }) => {
    try {
      await envService.createDatabase(env.id, { ...data, port: parseInt(data.port) });
      toast.success('Database added');
      setShowAddDb(false);
      onRefresh();
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || 'Failed to add database');
    }
  };

  const handleEditDb = async (data: Partial<{
    name: string;
    host: string;
    port: string;
    dbType: string;
    version?: string;
    schemaName?: string;
    connectionString?: string;
  }>) => {
    if (!selectedDbForEdit) return;
    try {
      await envService.updateDatabase(selectedDbForEdit.id, { ...data, port: parseInt(data.port) });
      toast.success('Database updated');
      setShowEditDb(false);
      setSelectedDbForEdit(null);
      onRefresh();
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || 'Failed to update database');
    }
  };

  const handleDeleteDb = async (id: number) => {
    if (!confirm('Remove this database?')) return;
    try {
      await envService.deleteDatabase(id);
      toast.success('Database removed');
      onRefresh();
    } catch {
      toast.error('Failed to remove database');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
      id={`env-${env.id}`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-surface-700/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${env.isActive ? 'bg-emerald-400 animate-pulse-subtle' : 'bg-surface-600'}`} />
          <div>
            <h3 className="font-semibold text-surface-100">{env.name}</h3>
            <p className="text-sm text-surface-500">{env.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-surface-700/50 text-surface-400">{env.envType}</span>
          </div>
          {isAdmin && (
            <button
              onClick={() => onEditEnv(env)}
              className="p-1.5 rounded hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
              title="Edit Environment"
            >
              <Edit3 size={15} />
            </button>
          )}
          <button
            onClick={() => onCollapse(env.id)}
            className="p-1.5 rounded hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
            title="Collapse"
          >
            <ChevronUp size={15} />
          </button>
        </div>
      </div>

      {/* Content: Unified Servers & Databases View */}
      <div className="p-5 space-y-6">
        
        {/* ─── SERVERS SECTION ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-surface-700/20 pb-2">
            <div className="flex items-center gap-2">
              <Monitor size={16} className="text-brand-400" />
              <h4 className="font-semibold text-sm text-surface-200">Servers</h4>
              <span className="px-2 py-0.5 rounded-full text-xs bg-surface-800 text-surface-400 font-medium">
                {env.servers?.length || 0}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowAddServer(true)}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Plus size={13} />
                  Add Server
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-surface-500 tracking-wider">
                  <th className="text-left px-4 py-2.5 font-medium">Hostname</th>
                  <th className="text-left px-4 py-2.5 font-medium">IP</th>
                  <th className="text-left px-4 py-2.5 font-medium">Role</th>
                  <th className="text-left px-4 py-2.5 font-medium">OS</th>
                  <th className="text-left px-4 py-2.5 font-medium">Cores</th>
                  <th className="text-left px-4 py-2.5 font-medium">Memory</th>
                  <th className="text-left px-4 py-2.5 font-medium">Segment</th>
                  {isAdmin && <th className="text-right px-4 py-2.5 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredServers.map((server) => (
                  <tr key={server.id} className="table-row">
                    <td className="px-4 py-2 font-medium text-surface-200">{server.hostname}</td>
                    <td className="px-4 py-2 text-surface-400 font-mono text-xs">{server.ipAddress}</td>
                    <td className="px-4 py-2">
                      <RoleBadge name={server.role.name} color={server.role.color} />
                    </td>
                    <td className="px-4 py-2 text-surface-400">{server.os || '—'}</td>
                    <td className="px-4 py-2 text-surface-400">{server.cores || '—'}</td>
                    <td className="px-4 py-2 text-surface-400">{server.memory || '—'}</td>
                    <td className="px-4 py-2 text-surface-400">{server.segment || '—'}</td>
                    {isAdmin && (
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedServerForEdit(server);
                              setShowEditServer(true);
                            }}
                            className="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-brand-400 transition-colors"
                            title="Edit Server"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteServer(server.id)}
                            className="p-1 rounded hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors"
                            title="Delete Server"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredServers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-surface-600">
                      {searchQuery ? 'No servers match your search' : 'No servers configured'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── DATABASES SECTION ─── */}
        <div className="space-y-3 pt-4 border-t border-surface-800/40">
          <div className="flex items-center justify-between border-b border-surface-700/20 pb-2">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-brand-400" />
              <h4 className="font-semibold text-sm text-surface-200">Databases</h4>
              <span className="px-2 py-0.5 rounded-full text-xs bg-surface-800 text-surface-400 font-medium">
                {env.databases?.length || 0}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowAddDb(true)}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Plus size={13} />
                  Add Database
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-surface-500 tracking-wider">
                  <th className="text-left px-4 py-2.5 font-medium">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium">Host</th>
                  <th className="text-left px-4 py-2.5 font-medium">Port</th>
                  <th className="text-left px-4 py-2.5 font-medium">Type</th>
                  <th className="text-left px-4 py-2.5 font-medium">Version</th>
                  <th className="text-left px-4 py-2.5 font-medium">Schema</th>
                  {isAdmin && <th className="text-right px-4 py-2.5 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredDbs.map((db) => (
                  <tr key={db.id} className="table-row">
                    <td className="px-4 py-2 font-medium text-surface-200">{db.name}</td>
                    <td className="px-4 py-2 text-surface-400 font-mono text-xs">{db.host}</td>
                    <td className="px-4 py-2 text-surface-400">{db.port}</td>
                    <td className="px-4 py-2">
                      <RoleBadge name={db.dbType} color="#f43f5e" />
                    </td>
                    <td className="px-4 py-2 text-surface-400">{db.version || '—'}</td>
                    <td className="px-4 py-2 text-surface-400">{db.schemaName || '—'}</td>
                    {isAdmin && (
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedDbForEdit(db);
                              setShowEditDb(true);
                            }}
                            className="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-brand-400 transition-colors"
                            title="Edit Database"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteDb(db.id)}
                            className="p-1 rounded hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors"
                            title="Delete Database"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredDbs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-surface-600">
                      {searchQuery ? 'No databases match your search' : 'No databases configured'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add Server Modal */}
      <Modal isOpen={showAddServer} onClose={() => setShowAddServer(false)} title="Add Server">
        <ServerForm roles={roles} onSubmit={handleAddServer} onCancel={() => setShowAddServer(false)} />
      </Modal>

      {/* Edit Server Modal */}
      <Modal isOpen={showEditServer} onClose={() => { setShowEditServer(false); setSelectedServerForEdit(null); }} title="Edit Server">
        <ServerForm roles={roles} onSubmit={handleEditServer} onCancel={() => { setShowEditServer(false); setSelectedServerForEdit(null); }} initialData={selectedServerForEdit} />
      </Modal>

      {/* Add Database Modal */}
      <Modal isOpen={showAddDb} onClose={() => setShowAddDb(false)} title="Add Database">
        <DatabaseForm onSubmit={handleAddDb} onCancel={() => setShowAddDb(false)} />
      </Modal>

      {/* Edit Database Modal */}
      <Modal isOpen={showEditDb} onClose={() => { setShowEditDb(false); setSelectedDbForEdit(null); }} title="Edit Database">
        <DatabaseForm onSubmit={handleEditDb} onCancel={() => { setShowEditDb(false); setSelectedDbForEdit(null); }} initialData={selectedDbForEdit} />
      </Modal>
    </motion.div>
  );
}

// ─── Server Form ──────────────────────────────────────────────────
function ServerForm({
  roles,
  onSubmit,
  onCancel,
  initialData,
}: {
  roles: ServerRole[];
  onSubmit: (data: {
    hostname: string;
    ipAddress: string;
    roleId: number;
    os?: string;
    cores?: number;
    memory?: string;
    segment?: string;
  }) => void;
  onCancel: () => void;
  initialData?: Server | null;
}) {
  const [form, setForm] = useState({
    hostname: initialData?.hostname || '',
    ipAddress: initialData?.ipAddress || '',
    roleId: initialData?.roleId?.toString() || '',
    os: initialData?.os || '',
    cores: initialData?.cores?.toString() || '',
    memory: initialData?.memory || '',
    segment: initialData?.segment || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      roleId: parseInt(form.roleId),
      cores: form.cores ? parseInt(form.cores) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Hostname *</label>
          <input className="input-field" value={form.hostname} onChange={e => setForm({...form, hostname: e.target.value})} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">IP Address *</label>
          <input className="input-field" value={form.ipAddress} onChange={e => setForm({...form, ipAddress: e.target.value})} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Role *</label>
          <select className="input-field" value={form.roleId} onChange={e => setForm({...form, roleId: e.target.value})} required>
            <option value="">Select role</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">OS</label>
          <input className="input-field" value={form.os} onChange={e => setForm({...form, os: e.target.value})} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Cores</label>
          <input className="input-field" type="number" value={form.cores} onChange={e => setForm({...form, cores: e.target.value})} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Memory</label>
          <input className="input-field" value={form.memory} onChange={e => setForm({...form, memory: e.target.value})} placeholder="e.g. 32GB" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-surface-400">Segment</label>
        <input className="input-field" value={form.segment} onChange={e => setForm({...form, segment: e.target.value})} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{initialData ? 'Save Server' : 'Add Server'}</button>
      </div>
    </form>
  );
}

// ─── Database Form ────────────────────────────────────────────────
function DatabaseForm({
  onSubmit,
  onCancel,
  initialData,
}: {
  onSubmit: (data: {
    name: string;
    host: string;
    port: string;
    dbType: string;
    version?: string;
    schemaName?: string;
    connectionString?: string;
  }) => void;
  onCancel: () => void;
  initialData?: DatabaseInstance | null;
}) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    host: initialData?.host || '',
    port: initialData?.port?.toString() || '1521',
    dbType: initialData?.dbType || 'Oracle',
    version: initialData?.version || '',
    schemaName: initialData?.schemaName || '',
    connectionString: initialData?.connectionString || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Name *</label>
          <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Host *</label>
          <input className="input-field" value={form.host} onChange={e => setForm({...form, host: e.target.value})} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Port *</label>
          <input className="input-field" type="number" value={form.port} onChange={e => setForm({...form, port: e.target.value})} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">DB Type *</label>
          <input className="input-field" value={form.dbType} onChange={e => setForm({...form, dbType: e.target.value})} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Version</label>
          <input className="input-field" value={form.version} onChange={e => setForm({...form, version: e.target.value})} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Schema</label>
          <input className="input-field" value={form.schemaName} onChange={e => setForm({...form, schemaName: e.target.value})} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-surface-400">Connection String</label>
        <input className="input-field" value={form.connectionString} onChange={e => setForm({...form, connectionString: e.target.value})} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{initialData ? 'Save Database' : 'Add Database'}</button>
      </div>
    </form>
  );
}

// ─── Application Form ─────────────────────────────────────────────
function ApplicationForm({
  onSubmit,
  onCancel,
  initialData,
}: {
  onSubmit: (data: { name: string; description?: string }) => void;
  onCancel: () => void;
  initialData?: Application | null;
}) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-surface-400">Section Name *</label>
        <input
          className="input-field"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Finacle Core Applications"
          required
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-surface-400">Description</label>
        <textarea
          className="input-field min-h-[80px]"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="e.g. Core banking applications and microservices"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {initialData ? 'Save Section' : 'Add Section'}
        </button>
      </div>
    </form>
  );
}

// ─── Environment Form ─────────────────────────────────────────────
function EnvironmentForm({
  onSubmit,
  onCancel,
  initialData,
  envTypes,
}: {
  onSubmit: (data: {
    name: string;
    shortCode: string;
    description?: string;
    envType: string;
    siteType: string;
  }) => void;
  onCancel: () => void;
  initialData?: Environment | null;
  envTypes: EnvType[];
}) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    shortCode: initialData?.shortCode || '',
    description: initialData?.description || '',
    envType: initialData?.envType || '',
    siteType: initialData?.siteType || 'DC',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Environment Name *</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Production"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Short Code *</label>
          <input
            className="input-field font-mono"
            value={form.shortCode}
            onChange={(e) => setForm({ ...form, shortCode: e.target.value.toUpperCase() })}
            placeholder="e.g. PROD"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-400">Env Type *</label>
          <select
            className="input-field"
            value={form.envType}
            onChange={(e) => setForm({ ...form, envType: e.target.value })}
            required
          >
            <option value="">Select type</option>
            {envTypes.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-surface-400">Description</label>
        <input
          className="input-field"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="e.g. Primary production environment"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {initialData ? 'Save Environment' : 'Add Environment'}
        </button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ENVIRONMENTS PAGE
// ═══════════════════════════════════════════════════════════════════
export default function EnvironmentsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isAdmin = user?.role === 'ADMIN';

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [expandedEnvs, setExpandedEnvs] = useState<Record<number, Environment>>({});
  const [roles, setRoles] = useState<ServerRole[]>([]);
  const [envTypes, setEnvTypes] = useState<EnvType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedApps, setExpandedApps] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddApp, setShowAddApp] = useState(false);
  const [showAddEnv, setShowAddEnv] = useState(false);
  const [selectedAppForNewEnv, setSelectedAppForNewEnv] = useState<Application | null>(null);

  const [showEditApp, setShowEditApp] = useState(false);
  const [selectedAppForEdit, setSelectedAppForEdit] = useState<Application | null>(null);
  const [showEditEnv, setShowEditEnv] = useState(false);
  const [selectedEnvForEdit, setSelectedEnvForEdit] = useState<Environment | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [dashData, appData, roleData, envTypeData] = await Promise.all([
        envService.getDashboard(),
        envService.getApplications(),
        envService.getServerRoles(),
        envService.getEnvTypes(),
      ]);
      setDashboard(dashData);
      setApplications(appData);
      setRoles(roleData);
      setEnvTypes(envTypeData);

      // Fetch details for all environments in parallel to expand them by default
      const allEnvIds = appData.flatMap(app => app.environments.map(env => env.id));
      if (allEnvIds.length > 0) {
        const envDetails = await Promise.all(allEnvIds.map(id => envService.getEnvironment(id)));
        const envMap = envDetails.reduce((acc, env) => {
          acc[env.id] = env;
          return acc;
        }, {} as Record<number, Environment>);
        setExpandedEnvs(envMap);
      }

      // Auto-expand first app on initial load only
      if (appData.length > 0) {
        setExpandedApps(prev => Object.keys(prev).length === 0 ? { [appData[0].id]: true } : prev);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, [loadData]);

  const handleAddApp = async (data: { name: string; description?: string }) => {
    try {
      await envService.createApplication(data);
      toast.success('Section added successfully');
      setShowAddApp(false);
      loadData();
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || 'Failed to add section');
    }
  };

  const handleEditApp = async (data: { name: string; description?: string }) => {
    if (!selectedAppForEdit) return;
    try {
      await envService.updateApplication(selectedAppForEdit.id, data);
      toast.success('Section updated successfully');
      setShowEditApp(false);
      setSelectedAppForEdit(null);
      loadData();
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || 'Failed to update section');
    }
  };

  const handleAddEnv = async (data: {
    name: string;
    shortCode: string;
    description?: string;
    envType: string;
    siteType: string;
  }) => {
    if (!selectedAppForNewEnv) return;
    try {
      await envService.createEnvironment({
        ...data,
        applicationId: selectedAppForNewEnv.id,
      });
      toast.success('Environment added successfully');
      setShowAddEnv(false);
      setSelectedAppForNewEnv(null);
      loadData();
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || 'Failed to add environment');
    }
  };

  const handleEditEnv = async (data: {
    name: string;
    shortCode: string;
    description?: string;
    envType: string;
    siteType: string;
  }) => {
    if (!selectedEnvForEdit) return;
    try {
      await envService.updateEnvironment(selectedEnvForEdit.id, data);
      toast.success('Environment updated successfully');
      setShowEditEnv(false);
      setSelectedEnvForEdit(null);
      loadData();
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || 'Failed to update environment');
    }
  };

  const loadEnvironment = async (envId: number) => {
    if (expandedEnvs[envId]) {
      // Collapse
      const copy = { ...expandedEnvs };
      delete copy[envId];
      setExpandedEnvs(copy);
      return;
    }
    try {
      const env = await envService.getEnvironment(envId);
      setExpandedEnvs(prev => ({ ...prev, [envId]: env }));
    } catch {
      toast.error('Failed to load environment');
    }
  };

  const scrollToEnv = async (envId: number) => {
    if (!expandedEnvs[envId]) {
      try {
        const env = await envService.getEnvironment(envId);
        setExpandedEnvs(prev => ({ ...prev, [envId]: env }));
      } catch {
        toast.error('Failed to load environment');
        return;
      }
    }
    setTimeout(() => {
      document.getElementById(`env-${envId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-24 shimmer rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-64 shimmer rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Chart colors aligned with Axis Bank brand (burgundy-based for light, mint-based for dark)
  const CHART_COLORS = theme === 'light'
    ? ['#97144d', '#c1216b', '#db2777', '#008269', '#005a48', '#b45309', '#0284c7', '#4f46e5']
    : ['#00c5a0', '#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#f43f5e'];

  const filteredApplications = applications.map(app => {
    const appMatches = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const filteredEnvs = app.environments.filter(envSummary => {
      if (!searchQuery) return true;
      
      const envTextMatches = envSummary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             envSummary.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (envSummary.description && envSummary.description.toLowerCase().includes(searchQuery.toLowerCase()));
      if (envTextMatches || appMatches) return true;

      const envDetails = expandedEnvs[envSummary.id];
      if (envDetails) {
        const serverMatches = envDetails.servers?.some(s => 
          s.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.ipAddress.includes(searchQuery.toLowerCase()) ||
          s.role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.os && s.os.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (s.segment && s.segment.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        if (serverMatches) return true;

        const dbMatches = envDetails.databases?.some(d =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.host.includes(searchQuery.toLowerCase()) ||
          d.dbType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.schemaName && d.schemaName.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        if (dbMatches) return true;
      }
      
      return false;
    });

    return {
      ...app,
      environments: filteredEnvs
    };
  }).filter(app => app.environments.length > 0 || app.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* ─── Summary Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard icon={AppWindow} label="Applications" value={dashboard?.summary.applications || 0} color={theme === 'light' ? '#97144d' : '#00c5a0'} delay={0} />
        <SummaryCard icon={Globe} label="Environments" value={dashboard?.summary.environments || 0} color={theme === 'light' ? '#db2777' : '#10b981'} delay={0.05} />
        <SummaryCard icon={ServerIcon} label="Servers" value={dashboard?.summary.servers || 0} color={theme === 'light' ? '#008269' : '#06b6d4'} delay={0.1} />
        <SummaryCard icon={Database} label="Databases" value={dashboard?.summary.databases || 0} color={theme === 'light' ? '#0284c7' : '#8b5cf6'} delay={0.15} />
      </div>

      {/* ─── Charts Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Servers per Environment */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">
            Servers per Environment
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={dashboard?.serversPerEnvironment.slice(0, 8) || []}
              layout="vertical"
              margin={{ left: 80, right: 10, top: 5, bottom: 5 }}
            >
              <XAxis type="number" tick={{ fill: theme === 'light' ? '#475569' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="shortCode"
                tick={{ fill: theme === 'light' ? '#334155' : '#cbd5e1', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'light' ? '#ffffff' : '#1e293b',
                  border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid #334155',
                  borderRadius: 8,
                  fontSize: 12,
                  color: theme === 'light' ? '#0f172a' : '#f1f5f9',
                }}
                labelStyle={{ color: theme === 'light' ? '#0f172a' : '#e2e8f0' }}
              />
              <Bar dataKey="total" fill={theme === 'light' ? '#97144d' : '#00c5a0'} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Role Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">
            Server Role Distribution
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dashboard?.roleDistribution.filter(r => r.count > 0) || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {dashboard?.roleDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'light' ? '#ffffff' : '#1e293b',
                    border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid #334155',
                    borderRadius: 8,
                    fontSize: 12,
                    color: theme === 'light' ? '#0f172a' : '#f1f5f9',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {dashboard?.roleDistribution.filter(r => r.count > 0).map((role) => (
              <div key={role.name} className="flex items-center gap-1.5 text-xs text-surface-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: role.color }} />
                {role.name} ({role.count})
              </div>
            ))}
          </div>
        </motion.div>

        {/* Servers per App */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">
            Servers per Application
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dashboard?.serversPerApp.filter(a => a.count > 0) || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {dashboard?.serversPerApp.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'light' ? '#ffffff' : '#1e293b',
                    border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid #334155',
                    borderRadius: 8,
                    fontSize: 12,
                    color: theme === 'light' ? '#0f172a' : '#f1f5f9',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {dashboard?.serversPerApp.filter(a => a.count > 0).map((app, i) => (
              <div key={app.name} className="flex items-center gap-1.5 text-xs text-surface-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {app.name} ({app.count})
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── Environments List with Jump-To Sidebar ────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="flex items-center justify-between border-b border-surface-700/30 pb-3 mb-4"
      >
        <div>
          <h2 className="text-xl font-bold text-surface-100">Applications & Environments</h2>
          <p className="text-sm text-surface-500">Configure sections and environment instances.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
            <input
              type="text"
              placeholder="Search sections, envs, servers, IPs, DBs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field text-sm py-1.5 pl-9 pr-4 w-72"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddApp(true)}
              className="btn-primary flex items-center gap-2 text-xs py-2 px-3 flex-shrink-0"
            >
              <Plus size={16} />
              Add Section
            </button>
          )}
        </div>
      </motion.div>

      <div className="flex gap-6">
        {/* Jump-To Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="w-56 flex-shrink-0"
        >
          <div className="glass-card p-4 sticky top-24">
            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Jump To</h4>
            <div className="space-y-1">
              {applications.map((app) => (
                <div key={app.id}>
                  <button
                    onClick={() => setExpandedApps(prev => ({ ...prev, [app.id]: !prev[app.id] }))}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-surface-300 hover:bg-surface-800/50 transition-colors"
                  >
                    {expandedApps[app.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {app.name}
                  </button>
                  <AnimatePresence>
                    {expandedApps[app.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 pl-2 border-l border-surface-700/50 space-y-0.5 py-1">
                          {app.environments.map((env) => (
                            <button
                              key={env.id}
                              onClick={() => scrollToEnv(env.id)}
                              className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center gap-2 ${
                                expandedEnvs[env.id]
                                  ? 'text-brand-400 bg-brand-500/10'
                                  : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800/30'
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${env.isActive ? 'bg-emerald-400' : 'bg-surface-600'}`} />
                              {env.shortCode}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Environment Cards */}
        <div className="flex-1 space-y-4">
          {filteredApplications.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                    <AppWindow size={18} />
                  </div>
                  <h2 className="text-lg font-semibold text-surface-200">{app.name}</h2>
                  <span className="text-xs text-surface-500">
                    {app.environments.length} environment{app.environments.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedAppForEdit(app);
                        setShowEditApp(true);
                      }}
                      className="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-brand-400 transition-colors"
                      title="Edit Section"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAppForNewEnv(app);
                        setShowAddEnv(true);
                      }}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Environment
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {app.environments.map((envSummary, envIndex) => {
                  const env = expandedEnvs[envSummary.id];

                  return (
                    <motion.div
                      key={envSummary.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + index * 0.1 + envIndex * 0.05, duration: 0.25 }}
                    >
                      {/* Collapsed summary */}
                      {!env && (
                        <motion.button
                          onClick={() => loadEnvironment(envSummary.id)}
                          className="w-full glass-card-hover p-4 text-left flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${envSummary.isActive ? 'bg-emerald-400' : 'bg-surface-600'}`} />
                            <div>
                              <span className="font-medium text-surface-200 group-hover:text-surface-100">
                                {envSummary.name}
                              </span>
                              <span className="text-surface-600 mx-2">•</span>
                              <span className="text-sm text-surface-500">{envSummary.description}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-surface-500">
                            <span className="flex items-center gap-1"><Monitor size={12} /> {envSummary._count.servers}</span>
                            <span className="flex items-center gap-1"><HardDrive size={12} /> {envSummary._count.databases}</span>
                            <ChevronRight size={14} className="text-surface-600 group-hover:text-surface-400 transition-colors" />
                          </div>
                        </motion.button>
                      )}

                      {/* Expanded detail */}
                      {env && (
                        <EnvironmentCard
                          env={env}
                          roles={roles}
                          onRefresh={() => {
                            // Reload this environment
                            envService.getEnvironment(env.id).then(updated => {
                              setExpandedEnvs(prev => ({ ...prev, [env.id]: updated }));
                            });
                            loadData();
                          }}
                          isAdmin={isAdmin}
                          onEditEnv={(e) => {
                            setSelectedEnvForEdit(e);
                            setShowEditEnv(true);
                          }}
                          onCollapse={loadEnvironment}
                          searchQuery={searchQuery}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
          {filteredApplications.length === 0 && (
            <div className="glass-card p-12 text-center text-surface-400">
              <Search size={32} className="mx-auto text-surface-500 mb-3" />
              <p className="font-semibold text-surface-200">No matches found</p>
              <p className="text-xs text-surface-500 mt-1">Try refining your search terms for sections, environments, server hostnames/IPs, or database instances.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Section (Application) Modal */}
      <Modal isOpen={showAddApp} onClose={() => setShowAddApp(false)} title="Add Section">
        <ApplicationForm onSubmit={handleAddApp} onCancel={() => setShowAddApp(false)} />
      </Modal>

      {/* Edit Section Modal */}
      <Modal isOpen={showEditApp} onClose={() => { setShowEditApp(false); setSelectedAppForEdit(null); }} title="Edit Section">
        <ApplicationForm onSubmit={handleEditApp} onCancel={() => { setShowEditApp(false); setSelectedAppForEdit(null); }} initialData={selectedAppForEdit} />
      </Modal>

      {/* Add Environment Modal */}
      <Modal isOpen={showAddEnv} onClose={() => { setShowAddEnv(false); setSelectedAppForNewEnv(null); }} title={`Add Environment to ${selectedAppForNewEnv?.name || 'Section'}`}>
        <EnvironmentForm onSubmit={handleAddEnv} onCancel={() => { setShowAddEnv(false); setSelectedAppForNewEnv(null); }} envTypes={envTypes} />
      </Modal>

      {/* Edit Environment Modal */}
      <Modal isOpen={showEditEnv} onClose={() => { setShowEditEnv(false); setSelectedEnvForEdit(null); }} title="Edit Environment">
        <EnvironmentForm onSubmit={handleEditEnv} onCancel={() => { setShowEditEnv(false); setSelectedEnvForEdit(null); }} initialData={selectedEnvForEdit} envTypes={envTypes} />
      </Modal>
    </div>
  );
}
