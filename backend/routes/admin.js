import express from 'express';
import User from '../models/User.js';
import Group from '../models/Group.js';
import DataSource from '../models/DataSource.js';
import PublicPage from '../models/PublicPage.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chronicle-secret-key-change-in-production';

// Middleware pour vérifier l'authentification et le rôle admin
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ========== GESTION DES UTILISATEURS ==========
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('groups', 'name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { username, password, role, groups, isActive } = req.body;
    const user = new User({
      username,
      password,
      role: role || 'user',
      groups: groups || [],
      isActive: isActive !== undefined ? isActive : true
    });
    await user.save();
    const userObj = user.toJSON();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { username, password, role, groups, isActive, customPermissions } = req.body;
    const update = { username, role, groups, isActive, customPermissions };
    
    if (password) {
      update.password = password;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).select('-password').populate('groups', 'name');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== GESTION DES GROUPES ==========
router.get('/groups', requireAdmin, async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/groups', requireAdmin, async (req, res) => {
  try {
    const group = new Group(req.body);
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/groups/:id', requireAdmin, async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/groups/:id', requireAdmin, async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== GESTION DES SOURCES DE DONNÉES ==========
router.get('/data-sources', requireAdmin, async (req, res) => {
  try {
    const sources = await DataSource.find();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/data-sources', requireAdmin, async (req, res) => {
  try {
    const source = new DataSource(req.body);
    await source.save();
    res.status(201).json(source);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/data-sources/:id', requireAdmin, async (req, res) => {
  try {
    const source = await DataSource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!source) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    res.json(source);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/data-sources/:id', requireAdmin, async (req, res) => {
  try {
    const source = await DataSource.findByIdAndDelete(req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    res.json({ message: 'Data source deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== GESTION DES PAGES PUBLIQUES ==========
router.get('/public-pages', requireAdmin, async (req, res) => {
  try {
    const pages = await PublicPage.find();
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/public-pages', requireAdmin, async (req, res) => {
  try {
    const page = new PublicPage(req.body);
    await page.save();
    res.status(201).json(page);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/public-pages/:id', requireAdmin, async (req, res) => {
  try {
    const page = await PublicPage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(page);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/public-pages/:id', requireAdmin, async (req, res) => {
  try {
    const page = await PublicPage.findByIdAndDelete(req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json({ message: 'Page deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

