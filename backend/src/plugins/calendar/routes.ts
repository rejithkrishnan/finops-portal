import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../core/middleware/authenticate';
import { authorize } from '../../core/middleware/authorize';
import { AuthenticatedRequest } from '../../core/middleware/authenticate';
import * as service from './service';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────────

const activitySchema = z.object({
  title:          z.string().min(1).max(200),
  description:    z.string().optional(),
  categoryId:     z.number().int().positive(),
  startDate:      z.string().min(1),
  endDate:        z.string().min(1),
  allDay:         z.boolean().default(true),
  isEcosystem:    z.boolean().default(false),
  environmentIds: z.array(z.number().int().positive()).optional(),
});

const categorySchema = z.object({
  name:  z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  icon:  z.string().optional(),
});

const monthYearSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year:  z.coerce.number().int().min(2000).max(2100),
  envId: z.coerce.number().int().positive().optional(),
});

// ─── Activities ───────────────────────────────────────────────────

router.get('/calendar/activities', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month, year, envId } = monthYearSchema.parse(req.query);
    const data = await service.getActivities(month, year, envId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/calendar/activities/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getActivity(parseInt(req.params.id as string));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/calendar/activities', authenticate, authorize('ADMIN', 'OPERATOR'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = activitySchema.parse(req.body);
    const data = await service.createActivity(body, req.user!.id);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/calendar/activities/:id', authenticate, authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = activitySchema.partial().parse(req.body);
    const data = await service.updateActivity(parseInt(req.params.id as string), body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/calendar/activities/:id', authenticate, authorize('ADMIN', 'OPERATOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteActivity(parseInt(req.params.id as string));
    res.json({ success: true, message: 'Activity deleted' });
  } catch (error) { next(error); }
});

// ─── Month Summary ────────────────────────────────────────────────

router.get('/calendar/summary', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month, year } = monthYearSchema.parse(req.query);
    const data = await service.getMonthSummary(month, year);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// ─── Categories ───────────────────────────────────────────────────

router.get('/calendar/categories', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getCategories();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/calendar/categories', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = categorySchema.parse(req.body);
    const data = await service.createCategory(body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/calendar/categories/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = categorySchema.partial().parse(req.body);
    const data = await service.updateCategory(parseInt(req.params.id as string), body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/calendar/categories/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteCategory(parseInt(req.params.id as string));
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) { next(error); }
});

export default router;
