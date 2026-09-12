import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import claimsRoutes from './routes/claimsRoutes.js';
import orchestratorRoutes from './routes/orchestratorRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AI Claims Automation Backend',
    version: '1.0.0'
  });
});

// Route Handlers
app.use('/api/claims', claimsRoutes);
app.use('/api/orchestrator', orchestratorRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log('======================================================');
  console.log(`  ?? AI Claims Automation Backend running on port ${PORT}`);
  console.log(`  ?? Health: http://localhost:${PORT}/api/health`);
  console.log(`  ?? Claims API: http://localhost:${PORT}/api/claims`);
  console.log(`  ?? Orchestrator API: http://localhost:${PORT}/api/orchestrator`);
  console.log('======================================================');
});

export default app;
