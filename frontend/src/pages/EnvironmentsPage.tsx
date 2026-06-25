import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AppWindow, Server, Database, Globe, Search, Plus, ChevronDown, ChevronRight,
  Trash2, Monitor, HardDrive,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import toast from 'react-hot-toast';
import * as envService from '../services/envService';
import type {
  Application, DashboardData, Environment, ServerRole,
} from '../types/environment';
import Modal from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';

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
  icon: any; label: string; value: number; color: string; delay: number;
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
  env, roles, onRefresh, isAdmin,
}: {
  env: Environment; roles: ServerRole[]; onRefresh: () => void; isAdmin: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'servers' | 'databases'>('servers');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddServer, setShowAddServer] = useState(false);
  const [showAddDb, setShowAddDb] = useState(false);

  const filteredServers = env.servers?.filter((s) =>
    s.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ipAddress.includes(searchQuery) ||
    s.role.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredDbs = env.databases?.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.host.includes(searchQuery)
  ) || [];

  const handleAddServer = async (data: any) => {
    try {
      await envService.createServer(env.id, data);
      toast.success('Server added');
      setShowAddServer(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add server');
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

  const handleAddDb = async (data: any) => {
    try {
      await envService.createDatabase(env.id, { ...data, port: parseInt(data.port) });
      toast.success('Database added');
      setShowAddDb(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add database');
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
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-surface-700/50 text-surface-400">{env.envType}</span>
          <span className="px-2 py-0.5 rounded bg-surface-700/50 text-surface-400">{env.siteType}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-3 flex items-center gap-1 border-b border-surface-700/30">
        <button
          onClick={() => setActiveTab('servers')}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
            activeTab === 'servers'
              ? 'text-brand-400'
              : 'text-surface-500 hover:text-surface-300'
          }`}
        >
          <Monitor size={15} />
          Servers
          <span className={`px-1.5 py-0.5 rounded text-xs ${
            activeTab === 'servers' ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-700 text-surface-500'
          }`}>
            {env.servers?.length || 0}
          </span>
          {activeTab === 'servers' && (
            <motion.div layoutId={`tab-${env.id}`} className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('databases')}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
            activeTab === 'databases'
              ? 'text-brand-400'
              : 'text-surface-500 hover:text-surface-300'
          }`}
        >
          <HardDrive size={15} />
          Databases
          <span className={`px-1.5 py-0.5 rounded text-xs ${
            activeTab === 'databases' ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-700 text-surface-500'
          }`}>
            {env.databases?.length || 0}
          </span>
          {activeTab === 'databases' && (
            <motion.div layoutId={`tab-${env.id}`} className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400 rounded-t-full" />
          )}
        </button>

        <div className="ml-auto flex items-center gap-2 pb-1">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field text-xs py-1.5 pl-8 pr-3 w-48"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => activeTab === 'servers' ? setShowAddServer(true) : setShowAddDb(true)}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Plus size={14} />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'servers' ? (
            <motion.table
              key="servers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full text-sm"
            >
              <thead>
                <tr className="text-xs uppercase text-surface-500 tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Hostname</th>
                  <th className="text-left px-5 py-3 font-medium">IP</th>
                  <th className="text-left px-5 py-3 font-medium">Role</th>
                  <th className="text-left px-5 py-3 font-medium">OS</th>
                  <th className="text-left px-5 py-3 font-medium">Cores</th>
                  <th className="text-left px-5 py-3 font-medium">Memory</th>
                  <th className="text-left px-5 py-3 font-medium">Segment</th>
                  {isAdmin && <th className="text-right px-5 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredServers.map((server, i) => (
                  <motion.tr
                    key={server.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="table-row"
                  >
                    <td className="px-5 py-3 font-medium text-surface-200">{server.hostname}</td>
                    <td className="px-5 py-3 text-surface-400 font-mono text-xs">{server.ipAddress}</td>
                    <td className="px-5 py-3">
                      <RoleBadge name={server.role.name} color={server.role.color} />
                    </td>
                    <td className="px-5 py-3 text-surface-400">{server.os || '—'}</td>
                    <td className="px-5 py-3 text-surface-400">{server.cores || '—'}</td>
                    <td className="px-5 py-3 text-surface-400">{server.memory || '—'}</td>
                    <td className="px-5 py-3 text-surface-400">{server.segment || '—'}</td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDeleteServer(server.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))}
                {filteredServers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-surface-600">
                      {searchQuery ? 'No servers match your search' : 'No servers configured'}
                    </td>
                  </tr>
                )}
              </tbody>
            </motion.table>
          ) : (
            <motion.table
              key="databases"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full text-sm"
            >
              <thead>
                <tr className="text-xs uppercase text-surface-500 tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Host</th>
                  <th className="text-left px-5 py-3 font-medium">Port</th>
                  <th className="text-left px-5 py-3 font-medium">Type</th>
                  <th className="text-left px-5 py-3 font-medium">Version</th>
                  <th className="text-left px-5 py-3 font-medium">Schema</th>
                  {isAdmin && <th className="text-right px-5 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredDbs.map((db, i) => (
                  <motion.tr
                    key={db.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="table-row"
                  >
                    <td className="px-5 py-3 font-medium text-surface-200">{db.name}</td>
                    <td className="px-5 py-3 text-surface-400 font-mono text-xs">{db.host}</td>
                    <td className="px-5 py-3 text-surface-400">{db.port}</td>
                    <td className="px-5 py-3">
                      <RoleBadge name={db.dbType} color="#f43f5e" />
                    </td>
                    <td className="px-5 py-3 text-surface-400">{db.version || '—'}</td>
                    <td className="px-5 py-3 text-surface-400">{db.schemaName || '—'}</td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDeleteDb(db.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))}
                {filteredDbs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-surface-600">
                      {searchQuery ? 'No databases match your search' : 'No databases configured'}
                    </td>
                  </tr>
                )}
              </tbody>
            </motion.table>
          )}
        </AnimatePresence>
      </div>

      {/* Add Server Modal */}
      <Modal isOpen={showAddServer} onClose={() => setShowAddServer(false)} title="Add Server">
        <ServerForm roles={roles} onSubmit={handleAddServer} onCancel={() => setShowAddServer(false)} />
      </Modal>

      {/* Add Database Modal */}
      <Modal isOpen={showAddDb} onClose={() => setShowAddDb(false)} title="Add Database">
        <DatabaseForm onSubmit={handleAddDb} onCancel={() => setShowAddDb(false)} />
      </Modal>
    </motion.div>
  );
}

// ─── Server Form ──────────────────────────────────────────────────
function ServerForm({ roles, onSubmit, onCancel }: { roles: ServerRole[]; onSubmit: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ hostname: '', ipAddress: '', roleId: '', os: '', cores: '', memory: '', segment: '' });

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
        <button type="submit" className="btn-primary">Add Server</button>
      </div>
    </form>
  );
}

// ─── Database Form ────────────────────────────────────────────────
function DatabaseForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', host: '', port: '1521', dbType: 'Oracle', version: '', schemaName: '', connectionString: '' });

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
        <button type="submit" className="btn-primary">Add Database</button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ENVIRONMENTS PAGE
// ═══════════════════════════════════════════════════════════════════
export default function EnvironmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [expandedEnvs, setExpandedEnvs] = useState<Record<number, Environment>>({});
  const [roles, setRoles] = useState<ServerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedApps, setExpandedApps] = useState<Record<number, boolean>>({});

  const loadData = async () => {
    try {
      const [dashData, appData, roleData] = await Promise.all([
        envService.getDashboard(),
        envService.getApplications(),
        envService.getServerRoles(),
      ]);
      setDashboard(dashData);
      setApplications(appData);
      setRoles(roleData);
      // Auto-expand first app
      if (appData.length > 0) {
        setExpandedApps({ [appData[0].id]: true });
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

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

  const scrollToEnv = (envId: number) => {
    loadEnvironment(envId);
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

  // Chart colors
  const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b', '#06b6d4', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* ─── Summary Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard icon={AppWindow} label="Applications" value={dashboard?.summary.applications || 0} color="#6366f1" delay={0} />
        <SummaryCard icon={Globe} label="Environments" value={dashboard?.summary.environments || 0} color="#10b981" delay={0.05} />
        <SummaryCard icon={Server} label="Servers" value={dashboard?.summary.servers || 0} color="#f59e0b" delay={0.1} />
        <SummaryCard icon={Database} label="Databases" value={dashboard?.summary.databases || 0} color="#f43f5e" delay={0.15} />
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
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="shortCode"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
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
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
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
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
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
          {applications.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                  <AppWindow size={18} />
                </div>
                <h2 className="text-lg font-semibold text-surface-200">{app.name}</h2>
                <span className="text-xs text-surface-500">
                  {app.environments.length} environment{app.environments.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4">
                {app.environments.map((envSummary) => {
                  const env = expandedEnvs[envSummary.id];

                  return (
                    <div key={envSummary.id}>
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
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
