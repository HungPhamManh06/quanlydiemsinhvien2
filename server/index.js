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
    const indexFile = path.join(distPath, 'index.html');
    res.sendFile(indexFile, (err) => {
      if (err) {
        res.status(500).send('Không tìm thấy file index.html. Hãy chạy "npm run build" trước.');
      }
    });
  }
});

// Start server
async function start() {
  try {
    console.log('🔄 Đang kết nối database...');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Đã cấu hình' : '❌ Chưa cấu hình'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    
    // Initialize database tables
    await initDatabase();

    // Seed sample data if database is empty
    const hasData = await hasSampleData();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║   🎓 Quản Lý Điểm Sinh Viên - Server Started    ║
║                                                   ║
║   🌐 URL: http://localhost:${PORT}                  ║
║   📡 API: http://localhost:${PORT}/api              ║
║   📦 DB:  PostgreSQL Connected ✅                 ║
║   🔒 ENV: ${process.env.NODE_ENV || 'development'}                          ║
╚═══════════════════════════════════════════════════╝
      `);

      // Auto-seed if empty
      if (!hasData) {
        console.log('📦 Database trống, đang tạo dữ liệu mẫu...');
        fetch(`http://localhost:${PORT}/api/seed`, { method: 'POST' })
          .then(r => r.json())
          .then(d => console.log('✅ Dữ liệu mẫu đã được tạo:', d.message))
          .catch(e => console.log('⚠️  Không thể tự tạo dữ liệu mẫu:', e.message));
      }
    });
  } catch (err) {
    console.error('');
    console.error('╔════════════════════════════════════════════════════════╗');
    console.error('║  ❌ KHÔNG THỂ KHỞI ĐỘNG SERVER                       ║');
    console.error('╠════════════════════════════════════════════════════════╣');
    console.error(`║  Lỗi: ${err.message}`);
    console.error('║                                                        ║');
    console.error('║  Kiểm tra:                                             ║');
    console.error('║  1. DATABASE_URL có đúng không?                        ║');
    console.error('║  2. Database PostgreSQL có đang chạy không?            ║');
    console.error('║  3. IP có được whitelist trên database không?          ║');
    console.error('╚════════════════════════════════════════════════════════╝');
    console.error('');
    process.exit(1);
  }
}

start();
