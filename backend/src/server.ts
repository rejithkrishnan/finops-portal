import express from 'express';
import cors from 'cors';
import { config } from './core/config';
import { errorHandler, notFoundHandler } from './core/middleware/errorHandler';
import authRoutes from './core/auth/authRoutes';
import environmentsRoutes from './plugins/environments/routes';

const app = express();

// ─── Global Middleware ────────────────────────────────────────────
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Auth Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── API Routes ───────────────────────────────────────────────────
app.use('/api', environmentsRoutes);

async function bootstrap() {

  // ─── Error Handlers (must be after routes) ──────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`\n🚀 FinOps Portal API running on http://localhost:${config.port}`);
    console.log(`📦 Environment: ${config.nodeEnv}\n`);
  });
}

bootstrap().catch(console.error);

export default app;
