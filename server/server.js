import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import routineRoutes from './routes/routineRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());

// CORS config to allow specific frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/projects', projectRoutes);

// Base route
app.get('/', (req, res) => {
  res.send(`${process.env.APP_NAME} API is running...`);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
