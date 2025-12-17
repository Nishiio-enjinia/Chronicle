import express from 'express';
import User from '../models/User.js';
import Group from '../models/Group.js';
import DataSource from '../models/DataSource.js';
import PublicPage from '../models/PublicPage.js';
import AzureDevOpsProject from '../models/AzureDevOpsProject.js';
import AzureDevOpsPipeline from '../models/AzureDevOpsPipeline.js';
import AzureDevOpsRepository from '../models/AzureDevOpsRepository.js';
import AzureDevOpsUser from '../models/AzureDevOpsUser.js';
import jwt from 'jsonwebtoken';
import { runManualCrawl, runInitialCrawl } from '../bots/index.js';

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

// ========== GESTION DES CRAWLS ==========
// Découvrir les projets Azure DevOps (sans créer de source)
router.post('/data-sources/discover-projects', requireAdmin, async (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config?.organizationUrl || !config?.personalAccessToken) {
      return res.status(400).json({ error: 'URL de l\'organisation et PAT requis' });
    }

    // Importer le bot Azure DevOps
    const azureDevOpsBot = (await import('../bots/azureDevOpsBot.js')).default;
    
    // Créer une source temporaire pour découvrir les projets
    const tempSource = {
      config: {
        organizationUrl: config.organizationUrl,
        personalAccessToken: config.personalAccessToken
      }
    };

    // Utiliser une fonction helper pour découvrir uniquement les projets
    const { WebApi, getPersonalAccessTokenHandler } = await import('azure-devops-node-api');
    const authHandler = getPersonalAccessTokenHandler(config.personalAccessToken);
    const orgUrl = config.organizationUrl.endsWith('/') ? config.organizationUrl.slice(0, -1) : config.organizationUrl;
    const webApi = new WebApi(orgUrl, authHandler);
    const coreApi = await webApi.getCoreApi();
    const projects = await coreApi.getProjects();

    const projectsList = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description || '',
      url: project.url
    }));

    res.json({ projects: projectsList });
  } catch (error) {
    console.error('Erreur lors de la découverte des projets Azure DevOps:', error);
    const errorMessage = error.message || 'Erreur lors de la connexion à Azure DevOps';
    const statusCode = error.statusCode || error.status || 500;
    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Crawl initial (première connexion)
router.post('/data-sources/:id/crawl/initial', requireAdmin, async (req, res) => {
  try {
    const result = await runInitialCrawl(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crawl manuel
router.post('/data-sources/:id/crawl/manual', requireAdmin, async (req, res) => {
  try {
    const result = await runManualCrawl(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== DONNÉES AZURE DEVOPS (pour filtres) ==========
// Récupérer les projets d'une source
router.get('/data-sources/:id/azure-devops/projects', requireAdmin, async (req, res) => {
  try {
    const projects = await AzureDevOpsProject.find({ 
      dataSourceId: req.params.id,
      isVisible: true 
    }).sort({ name: 1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les pipelines d'une source (tous, pas seulement visibles pour la gestion)
router.get('/data-sources/:id/azure-devops/pipelines', requireAdmin, async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = { 
      dataSourceId: req.params.id
    };
    if (projectId) {
      query.projectId = projectId;
    }
    const pipelines = await AzureDevOpsPipeline.find(query).sort({ name: 1 });
    res.json(pipelines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les repositories d'une source (tous, pas seulement visibles pour la gestion)
router.get('/data-sources/:id/azure-devops/repositories', requireAdmin, async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = { 
      dataSourceId: req.params.id
    };
    if (projectId) {
      query.projectId = projectId;
    }
    const repositories = await AzureDevOpsRepository.find(query).sort({ name: 1 });
    res.json(repositories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les utilisateurs d'une source (tous pour la gestion, mais on peut filtrer par active)
router.get('/data-sources/:id/azure-devops/users', requireAdmin, async (req, res) => {
  try {
    const { active } = req.query;
    const query = { 
      dataSourceId: req.params.id
    };
    if (active === 'true') {
      query.active = true;
    }
    const users = await AzureDevOpsUser.find(query).sort({ displayName: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour un projet
router.put('/data-sources/:id/azure-devops/projects/:projectId', requireAdmin, async (req, res) => {
  try {
    const project = await AzureDevOpsProject.findOneAndUpdate(
      { dataSourceId: req.params.id, _id: req.params.projectId },
      { 
        displayName: req.body.displayName,
        isVisible: req.body.isVisible 
      },
      { new: true }
    );
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour un pipeline
router.put('/data-sources/:id/azure-devops/pipelines/:pipelineId', requireAdmin, async (req, res) => {
  try {
    const pipeline = await AzureDevOpsPipeline.findOneAndUpdate(
      { dataSourceId: req.params.id, _id: req.params.pipelineId },
      { 
        displayName: req.body.displayName,
        isVisible: req.body.isVisible 
      },
      { new: true }
    );
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline non trouvé' });
    }
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour un repository
router.put('/data-sources/:id/azure-devops/repositories/:repositoryId', requireAdmin, async (req, res) => {
  try {
    const repository = await AzureDevOpsRepository.findOneAndUpdate(
      { dataSourceId: req.params.id, _id: req.params.repositoryId },
      { 
        displayName: req.body.displayName,
        isVisible: req.body.isVisible 
      },
      { new: true }
    );
    if (!repository) {
      return res.status(404).json({ error: 'Repository non trouvé' });
    }
    res.json(repository);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour un utilisateur
router.put('/data-sources/:id/azure-devops/users/:userId', requireAdmin, async (req, res) => {
  try {
    const user = await AzureDevOpsUser.findOneAndUpdate(
      { dataSourceId: req.params.id, _id: req.params.userId },
      { 
        customDisplayName: req.body.displayName,
        isVisible: req.body.isVisible 
      },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(user);
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

