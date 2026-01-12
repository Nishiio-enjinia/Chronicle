import express from 'express';
import Event from '../models/Event.js';
import { body, validationResult, query } from 'express-validator';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /api/events - Liste tous les événements avec filtres
router.get('/', [
  query('site').optional().isString(),
  query('application').optional().isString(),
  query('type').optional().isIn(['maintenance', 'intervention', 'incident', 'announcement']),
  query('status').optional().isIn(['scheduled', 'in-progress', 'completed', 'cancelled']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, async (req, res) => {
  try {
    const {
      site,
      application,
      type,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    if (site) filter.site = site;
    if (application) filter.application = application;
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(filter)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Event.countDocuments(filter);

    res.json({
      data: events,
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

// GET /api/events/:id - Récupère un événement spécifique
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events - Crée un nouvel événement manuel
router.post('/', [
  body('title').notEmpty().isString(),
  body('description').notEmpty().isString(),
  body('type').isIn(['maintenance', 'intervention', 'incident', 'announcement']),
  body('site').notEmpty().isString(),
  body('application').optional().isString(),
  body('startDate').notEmpty().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('status').optional().isIn(['scheduled', 'in-progress', 'completed', 'cancelled']),
  body('impact').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('createdBy').optional().isString()
], validate, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      status: req.body.status || 'scheduled',
      impact: req.body.impact || 'medium',
      createdBy: req.body.createdBy || 'system'
    };

    const event = new Event(eventData);
    await event.save();
    
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/events/:id - Met à jour un événement
router.put('/:id', [
  body('title').optional().isString(),
  body('description').optional().isString(),
  body('type').optional().isIn(['maintenance', 'intervention', 'incident', 'announcement']),
  body('status').optional().isIn(['scheduled', 'in-progress', 'completed', 'cancelled']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('impact').optional().isIn(['low', 'medium', 'high', 'critical'])
], validate, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/events/:id - Supprime un événement
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

























