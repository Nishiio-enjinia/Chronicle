import express from 'express';
import Changelog from '../models/Changelog.js';
import Event from '../models/Event.js';

const router = express.Router();

// GET /api/applications - Liste toutes les applications uniques
router.get('/', async (req, res) => {
  try {
    const { site } = req.query;
    
    const filter = site ? { site } : {};
    const applications = await Changelog.distinct('application', filter);
    const applicationsWithEvents = await Event.distinct('application', site ? { site } : {});
    
    // Combiner et dédupliquer
    const allApplications = [...new Set([...applications, ...applicationsWithEvents])].sort();
    
    res.json(allApplications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/applications/:application/stats - Statistiques pour une application spécifique
router.get('/:application/stats', async (req, res) => {
  try {
    const { application } = req.params;
    const { site } = req.query;
    
    const filter = { application };
    if (site) filter.site = site;
    
    const changelogCount = await Changelog.countDocuments(filter);
    const eventCount = await Event.countDocuments(filter);
    const sites = await Changelog.distinct('site', { application });
    
    const recentChangelogs = await Changelog.find(filter)
      .sort({ buildDate: -1 })
      .limit(5)
      .select('site version buildDate')
      .lean();
    
    res.json({
      application,
      changelogCount,
      eventCount,
      sites,
      recentChangelogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;















