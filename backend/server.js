import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { connectDB } from './config/database.js';
import changelogRoutes from './routes/changelogs.js';
import eventRoutes from './routes/events.js';
import siteRoutes from './routes/sites.js';
import applicationRoutes from './routes/applications.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Chronicle API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/changelogs', changelogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/applications', applicationRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    await connectDB();
    
    // Initialize admin user if it doesn't exist
    try {
      const User = (await import('./models/User.js')).default;
      const existingAdmin = await User.findOne({ username: 'admin' });
      if (!existingAdmin) {
        const admin = new User({
          username: 'admin',
          password: 'admin',
          role: 'admin',
          isActive: true
        });
        await admin.save();
        console.log('✅ Admin user created (admin/admin)');
      }
    } catch (error) {
      console.log('⚠️  Could not initialize admin user:', error.message);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Chronicle API server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();














