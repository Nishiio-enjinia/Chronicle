import express from 'express';
import PipelineLog from '../models/PipelineLog.js';
import KeywordGroup from '../models/KeywordGroup.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chronicle-secret-key-change-in-production';

// Middleware pour vérifier l'authentification
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/pipeline-logs - Liste des logs avec filtres
router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      dataSourceId,
      projectId,
      pipelineId,
      keywords,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (dataSourceId) {
      query.dataSourceId = dataSourceId;
    }

    if (projectId) {
      query.projectId = projectId;
    }

    if (pipelineId) {
      query.pipelineId = pipelineId;
    }

    if (keywords) {
      const keywordArray = keywords.split(',').filter(k => k);
      if (keywordArray.length > 0) {
        query.keywords = { $in: keywordArray };
      }
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await PipelineLog.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await PipelineLog.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pipeline-logs/keywords - Récupérer les groupes de mots-clés
router.get('/keywords', requireAuth, async (req, res) => {
  try {
    const { dataSourceId } = req.query;
    
    const query = {};
    if (dataSourceId) {
      query.dataSourceId = dataSourceId;
    }

    const keywordGroups = await KeywordGroup.find(query)
      .sort({ keyword: 1 })
      .lean();

    // Formater pour le frontend
    const formatted = keywordGroups.map(kg => ({
      keyword: kg.keyword,
      items: kg.items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type
      }))
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
