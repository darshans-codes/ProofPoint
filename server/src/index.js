import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import projectRoutes from './routes/projectRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import pairRoutes from './routes/pairRoutes.js';
import compareRoutes from './routes/compareRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin is not allowed by ProofPoint CORS policy.'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'ProofPoint Media Intelligence API',
    timestamp: new Date().toISOString(),
    env: {
      mongo: Boolean(process.env.MONGO_URI),
      cloudinary: Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ),
      gemini: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key'),
    },
  });
});

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/pairs', pairRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// Central Error Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
});

// Start Server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[ProofPoint Server] Running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[ProofPoint Server] Failed to connect database:', error.message);
    // Still start server so /api/health and other non-db calls can report status
    app.listen(PORT, () => {
      console.log(`[ProofPoint Server] Running in degraded mode on http://localhost:${PORT}`);
    });
  }
}

startServer();
