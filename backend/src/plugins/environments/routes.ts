import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../core/middleware/authenticate';
import { authorize } from '../../core/middleware/authorize';
import * as service from './service';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────────

const appSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
});

const envSchema = z.object({
  applicationId: z.number().int().positive(),
  name: z.string().min(1).max(100),
  shortCode: z.string().min(1).max(50),
  description: z.string().optional(),
  envType: z.string().min(1),
  siteType: z.string().min(1),
});

const serverSchema = z.object({
  hostname: z.string().min(1),
  ipAddress: z.string().min(1),
  roleId: z.number().int().positive(),
  os: z.string().optional(),
  cores: z.number().int().optional(),
  memory: z.string().optional(),
  segment: z.string().optional(),
});

const dbSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().positive(),
  dbType: z.string().min(1),
  version: z.string().optional(),
  sid: z.string().optional(),
  connectionString: z.string().optional(),
});

const roleSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  description: z.string().optional(),
});

const envTypeSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
});

// ─── Dashboard ────────────────────────────────────────────────────

router.get('/dashboard', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getDashboardData();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// ─── Applications ─────────────────────────────────────────────────

router.get('/applications', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listApplications();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/applications/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getApplication(parseInt(req.params.id as string));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/applications', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = appSchema.parse(req.body);
    const data = await service.createApplication(body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/applications/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = appSchema.partial().parse(req.body);
    const data = await service.updateApplication(parseInt(req.params.id as string), body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/applications/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteApplication(parseInt(req.params.id as string));
    res.json({ success: true, message: 'Application deleted' });
  } catch (error) { next(error); }
});

// ─── Environments ─────────────────────────────────────────────────

router.get('/environments', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appId = req.query.applicationId ? parseInt(req.query.applicationId as string) : undefined;
    const data = await service.listEnvironments(appId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/environments/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getEnvironment(parseInt(req.params.id as string));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/environments', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = envSchema.parse(req.body);
    const data = await service.createEnvironment(body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/environments/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = envSchema.partial().parse(req.body);
    const data = await service.updateEnvironment(parseInt(req.params.id as string), body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/environments/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteEnvironment(parseInt(req.params.id as string));
    res.json({ success: true, message: 'Environment deleted' });
  } catch (error) { next(error); }
});

// ─── Servers ──────────────────────────────────────────────────────

router.get('/environments/:envId/servers', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listServers(parseInt(req.params.envId as string));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/environments/:envId/servers', authenticate, authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = serverSchema.parse(req.body);
    const data = await service.createServer({ ...body, environmentId: parseInt(req.params.envId as string) });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/servers/:id', authenticate, authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = serverSchema.partial().parse(req.body);
    const data = await service.updateServer(parseInt(req.params.id as string), body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/servers/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteServer(parseInt(req.params.id as string));
    res.json({ success: true, message: 'Server deleted' });
  } catch (error) { next(error); }
});

// ─── Database Instances ───────────────────────────────────────────

router.get('/environments/:envId/databases', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listDatabases(parseInt(req.params.envId as string));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/environments/:envId/databases', authenticate, authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = dbSchema.parse(req.body);
    const data = await service.createDatabase({ ...body, environmentId: parseInt(req.params.envId as string) });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/databases/:id', authenticate, authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = dbSchema.partial().parse(req.body);
    const data = await service.updateDatabase(parseInt(req.params.id as string), body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/databases/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteDatabase(parseInt(req.params.id as string));
    res.json({ success: true, message: 'Database deleted' });
  } catch (error) { next(error); }
});

// ─── Server Roles ─────────────────────────────────────────────────

router.get('/server-roles', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listServerRoles();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/server-roles', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = roleSchema.parse(req.body);
    const data = await service.createServerRole(body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/server-roles/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = roleSchema.partial().parse(req.body);
    const data = await service.updateServerRole(parseInt(req.params.id as string), body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/server-roles/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteServerRole(parseInt(req.params.id as string));
    res.json({ success: true, message: 'Server role deleted' });
  } catch (error) { next(error); }
});

// ─── Env Types ────────────────────────────────────────────────────

router.get('/env-types', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listEnvTypes();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/env-types', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = envTypeSchema.parse(req.body);
    const data = await service.createEnvType(body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/env-types/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = envTypeSchema.partial().parse(req.body);
    const data = await service.updateEnvType(parseInt(req.params.id as string), body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/env-types/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteEnvType(parseInt(req.params.id as string));
    res.json({ success: true, message: 'Environment type deleted' });
  } catch (error) { next(error); }
});

export default router;
