import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';

// Load .env from project root (parent of backend/)
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });
// Also try backend/.env as fallback
dotenv.config({ path: resolve(__dirname, '../.env') });
import cors from 'cors';
import { processRouter } from './routes/process.js';
import { healthRouter } from './routes/health.js';
import { sessionsRouter } from './routes/sessions.js';
import { eventsRouter } from './routes/events.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 9999;

// Middleware - Allow all origins for local development
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api', healthRouter);
app.use('/api', processRouter);
app.use('/api', sessionsRouter);
app.use('/api', eventsRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 X Bookmarks API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Using Claude Code Agent for processing (no API keys needed)`);
});

