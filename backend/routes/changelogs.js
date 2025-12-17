import express from 'express';
import Changelog from '../models/Changelog.js';
import { body, validationResult, query } from 'express-validator';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /api/changelogs - Liste tous les changelogs avec filtres
router.get('/', [
  query('site').optional().isString(),
  query('application').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('source').optional().isIn(['n8n', 'manual']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, async (req, res) => {
  try {
    const {
      site,
      application,
      startDate,
      endDate,
      source,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    if (site) filter.site = site;
    if (application) filter.application = application;
    if (source) filter.source = source;
    
    if (startDate || endDate) {
      filter.buildDate = {};
      if (startDate) filter.buildDate.$gte = new Date(startDate);
      if (endDate) filter.buildDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const changelogs = await Changelog.find(filter)
      .sort({ buildDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Changelog.countDocuments(filter);

    res.json({
      data: changelogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/changelogs/:id - Récupère un changelog spécifique
router.get('/:id', async (req, res) => {
  try {
    const changelog = await Changelog.findById(req.params.id);
    if (!changelog) {
      return res.status(404).json({ error: 'Changelog not found' });
    }
    res.json(changelog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/changelogs - Crée un nouveau changelog (utilisé par n8n ou manuellement)
router.post('/', [
  body('site').notEmpty().isString(),
  body('application').notEmpty().isString(),
  body('version').notEmpty().isString(),
  body('buildNumber').notEmpty().isString(),
  body('changes').isArray().notEmpty(),
  body('changes.*.type').isIn(['feature', 'fix', 'update', 'security', 'breaking']),
  body('changes.*.description').notEmpty().isString(),
  body('buildDate').optional().isISO8601(),
  body('source').optional().isIn(['n8n', 'manual']),
  body('metadata').optional().isObject()
], validate, async (req, res) => {
  try {
    const changelogData = {
      ...req.body,
      buildDate: req.body.buildDate ? new Date(req.body.buildDate) : new Date(),
      source: req.body.source || 'manual'
    };

    const changelog = new Changelog(changelogData);
    await changelog.save();
    
    res.status(201).json(changelog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/changelogs/:id - Met à jour un changelog
router.put('/:id', [
  body('site').optional().isString(),
  body('application').optional().isString(),
  body('version').optional().isString(),
  body('buildNumber').optional().isString(),
  body('changes').optional().isArray(),
  body('buildDate').optional().isISO8601()
], validate, async (req, res) => {
  try {
    const changelog = await Changelog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!changelog) {
      return res.status(404).json({ error: 'Changelog not found' });
    }
    
    res.json(changelog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/changelogs/:id - Supprime un changelog
router.delete('/:id', async (req, res) => {
  try {
    const changelog = await Changelog.findByIdAndDelete(req.params.id);
    if (!changelog) {
      return res.status(404).json({ error: 'Changelog not found' });
    }
    res.json({ message: 'Changelog deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/changelogs/stats/summary - Statistiques globales
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await Changelog.countDocuments();
    const bySource = await Changelog.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    const bySite = await Changelog.aggregate([
      { $group: { _id: '$site', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const recent = await Changelog.countDocuments({
      buildDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      total,
      bySource: bySource.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      bySite,
      recentWeek: recent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;















