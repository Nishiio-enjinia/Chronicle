import express from 'express';
import Changelog from '../models/Changelog.js';
import Event from '../models/Event.js';

const router = express.Router();

// GET /api/sites - Liste tous les sites uniques
router.get('/', async (req, res) => {
  try {
    const sites = await Changelog.distinct('site');
    const sitesWithEvents = await Event.distinct('site');
    
    // Combiner et dédupliquer
    const allSites = [...new Set([...sites, ...sitesWithEvents])].sort();
    
    res.json(allSites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sites/:site/stats - Statistiques pour un site spécifique
router.get('/:site/stats', async (req, res) => {
  try {
    const { site } = req.params;
    
    const changelogCount = await Changelog.countDocuments({ site });
    const eventCount = await Event.countDocuments({ site });
    const applications = await Changelog.distinct('application', { site });
    
    const recentChangelogs = await Changelog.find({ site })
      .sort({ buildDate: -1 })
      .limit(5)
      .select('application version buildDate')
      .lean();
    
    res.json({
      site,
      changelogCount,
      eventCount,
      applications,
      recentChangelogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;















