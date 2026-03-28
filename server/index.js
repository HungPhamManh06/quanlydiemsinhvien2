import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase, hasSampleData } from './db.js';
import apiRoutes from './routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Serve static files from the React build
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// For any non-API route, serve index.html (SPA support)
app.get('/{*splat}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// Start server
async function start() {
  try {
    // Initialize database tables
    await initDatabase();

    // Seed sample data if database is empty
    const hasData = await hasSampleData();
    if (!hasData) {
      console.log('📦 Database is empty, seeding sample data...');
      // Import fetch to call our own seed endpoint after server starts
    }

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║   🎓 Quản Lý Điểm Sinh Viên - Server Started    ║
║                                                   ║
║   🌐 URL: http://localhost:${PORT}                  ║
║   📡 API: http://localhost:${PORT}/api              ║
║   📦 DB:  PostgreSQL Connected                    ║
╚═══════════════════════════════════════════════════╝
      `);

      // Auto-seed if empty
      if (!hasData) {
        fetch(`http://localhost:${PORT}/api/seed`, { method: 'POST' })
          .then(r => r.json())
          .then(d => console.log('✅ Sample data seeded:', d.message))
          .catch(e => console.log('⚠️  Could not auto-seed:', e.message));
      }
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
