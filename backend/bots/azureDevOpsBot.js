/**
 * Bot pour crawler les données Azure DevOps
 * Gère les pipelines, repositories, work items, etc.
 */

import { WebApi, getPersonalAccessTokenHandler } from 'azure-devops-node-api';
import axios from 'axios';
import AzureDevOpsProject from '../models/AzureDevOpsProject.js';
import AzureDevOpsPipeline from '../models/AzureDevOpsPipeline.js';
import AzureDevOpsRepository from '../models/AzureDevOpsRepository.js';
import AzureDevOpsUser from '../models/AzureDevOpsUser.js';
import PipelineLog from '../models/PipelineLog.js';
import KeywordGroup from '../models/KeywordGroup.js';
import DataSource from '../models/DataSource.js';

/**
 * Crawl initial - première connexion
 * Découvre les sites, pipelines, personnes impliquées
 */
const initialCrawl = async (source) => {
  try {
    const { organizationUrl, personalAccessToken, crawlRepositories, crawlPipelines } = source.config;
    
    if (!organizationUrl || !personalAccessToken) {
      throw new Error('Configuration Azure DevOps incomplète');
    }
    
    // Créer le client Azure DevOps
    const authHandler = getPersonalAccessTokenHandler(personalAccessToken);
    const orgUrl = organizationUrl.endsWith('/') ? organizationUrl.slice(0, -1) : organizationUrl;
    const webApi = new WebApi(orgUrl, authHandler);
    
    const result = {
      projects: [],
      pipelines: [],
      repositories: [],
      users: [],
      workItems: []
    };
    
    // Récupérer tous les projets
    const coreApi = await webApi.getCoreApi();
    let projects = await coreApi.getProjects();
    
    // Filtrer par projets sélectionnés si spécifiés
    const selectedProjects = source.config.selectedProjects;
    if (selectedProjects && selectedProjects.length > 0) {
      projects = projects.filter(p => selectedProjects.includes(p.name));
    }
    
    for (const project of projects) {
      result.projects.push({
        id: project.id,
        name: project.name,
        description: project.description,
        url: project.url
      });
      
      // Si crawl des pipelines activé
      if (crawlPipelines) {
        try {
          const buildApi = await webApi.getBuildApi();
          const pipelines = await buildApi.getDefinitions(project.id);
          
          for (const pipeline of pipelines) {
            result.pipelines.push({
              id: pipeline.id,
              name: pipeline.name,
              projectId: project.id,
              projectName: project.name,
              path: pipeline.path,
              repository: pipeline.repository ? {
                id: pipeline.repository.id,
                type: pipeline.repository.type,
                name: pipeline.repository.name
              } : null
            });
          }
        } catch (error) {
          console.warn(`⚠️  Erreur lors de la récupération des pipelines pour ${project.name}:`, error.message);
        }
      }
      
      // Si crawl des repositories activé
      if (crawlRepositories) {
        try {
          const gitApi = await webApi.getGitApi();
          const repos = await gitApi.getRepositories(project.id);
          
          for (const repo of repos) {
            result.repositories.push({
              id: repo.id,
              name: repo.name,
              projectId: project.id,
              projectName: project.name,
              url: repo.url,
              defaultBranch: repo.defaultBranch
            });
          }
        } catch (error) {
          console.warn(`⚠️  Erreur lors de la récupération des repositories pour ${project.name}:`, error.message);
        }
      }
    }
    
    // Récupérer les utilisateurs de l'organisation
    try {
      const memberEntitlementManagementApi = await webApi.getMemberEntitlementManagementApi();
      const users = await memberEntitlementManagementApi.getUsers();
      
      for (const user of users) {
        result.users.push({
          id: user.id,
          principalName: user.principalName,
          displayName: user.displayName,
          email: user.email,
          active: user.active
        });
      }
    } catch (error) {
      console.warn('⚠️  Erreur lors de la récupération des utilisateurs:', error.message);
    }
    
    // Sauvegarder les données dans MongoDB
    const dataSourceId = source._id;
    
    // Sauvegarder les projets
    for (const project of result.projects) {
      await AzureDevOpsProject.findOneAndUpdate(
        { dataSourceId, projectId: project.id },
        {
          dataSourceId,
          projectId: project.id,
          name: project.name,
          description: project.description || '',
          url: project.url,
          displayName: project.name, // Par défaut, utiliser le nom original
          isVisible: true
        },
        { upsert: true, new: true }
      );
    }
    
    // Sauvegarder les pipelines
    for (const pipeline of result.pipelines) {
      await AzureDevOpsPipeline.findOneAndUpdate(
        { dataSourceId, pipelineId: pipeline.id },
        {
          dataSourceId,
          pipelineId: pipeline.id,
          projectId: pipeline.projectId,
          projectName: pipeline.projectName,
          name: pipeline.name,
          path: pipeline.path || '',
          repository: pipeline.repository || null,
          displayName: pipeline.name, // Par défaut, utiliser le nom original
          isVisible: true
        },
        { upsert: true, new: true }
      );
    }
    
    // Sauvegarder les repositories
    for (const repo of result.repositories) {
      await AzureDevOpsRepository.findOneAndUpdate(
        { dataSourceId, repositoryId: repo.id },
        {
          dataSourceId,
          repositoryId: repo.id,
          projectId: repo.projectId,
          projectName: repo.projectName,
          name: repo.name,
          url: repo.url || '',
          defaultBranch: repo.defaultBranch || '',
          displayName: repo.name, // Par défaut, utiliser le nom original
          isVisible: true
        },
        { upsert: true, new: true }
      );
    }
    
    // Sauvegarder les utilisateurs
    for (const user of result.users) {
      await AzureDevOpsUser.findOneAndUpdate(
        { dataSourceId, userId: user.id },
        {
          dataSourceId,
          userId: user.id,
          principalName: user.principalName || '',
          displayName: user.displayName || '',
          email: user.email || '',
          active: user.active !== undefined ? user.active : true,
          customDisplayName: user.displayName || '', // Par défaut, utiliser le nom original
          isVisible: true
        },
        { upsert: true, new: true }
      );
    }
    
    // Marquer le crawl initial comme terminé
    await DataSource.findByIdAndUpdate(dataSourceId, {
      initialCrawlCompleted: true,
      initialCrawlCompletedAt: new Date()
    });
    
    console.log(`✅ Crawl initial terminé pour "${source.name}":`);
    console.log(`   - ${result.projects.length} projets sauvegardés`);
    console.log(`   - ${result.pipelines.length} pipelines sauvegardés`);
    console.log(`   - ${result.repositories.length} repositories sauvegardés`);
    console.log(`   - ${result.users.length} utilisateurs sauvegardés`);
    console.log(`   ✅ Données sauvegardées dans MongoDB`);
    
    return result;
  } catch (error) {
    console.error('❌ Erreur lors du crawl initial Azure DevOps:', error);
    throw error;
  }
};

/**
 * Crawl régulier - récupère les nouvelles données
 */
const crawl = async (source) => {
  try {
    const { organizationUrl, personalAccessToken, crawlRepositories, crawlPipelines, crawlLogs, crawlWorkItems } = source.config;
    
    if (!organizationUrl || !personalAccessToken) {
      throw new Error('Configuration Azure DevOps incomplète');
    }
    
    // Créer le client Azure DevOps
    const authHandler = getPersonalAccessTokenHandler(personalAccessToken);
    const orgUrl = organizationUrl.endsWith('/') ? organizationUrl.slice(0, -1) : organizationUrl;
    const webApi = new WebApi(orgUrl, authHandler);
    
    const dataSourceId = source._id;
    const updates = {
      pipelineLogs: [],
      workItems: []
    };
    
    // Récupérer uniquement les projets visibles depuis la base de données
    const visibleProjects = await AzureDevOpsProject.find({ 
      dataSourceId, 
      isVisible: true 
    }).lean();
    
    if (visibleProjects.length === 0) {
      console.log(`ℹ️  Aucun projet visible pour la source ${source.name}`);
      return updates;
    }
    
    // Récupérer tous les projets depuis Azure DevOps
    const coreApi = await webApi.getCoreApi();
    let allProjects = await coreApi.getProjects();
    
    // Filtrer par projets sélectionnés si spécifiés
    const selectedProjects = source.config.selectedProjects;
    if (selectedProjects && selectedProjects.length > 0) {
      allProjects = allProjects.filter(p => selectedProjects.includes(p.name));
    }
    
    // Ne garder que les projets visibles
    const visibleProjectIds = new Set(visibleProjects.map(p => p.projectId));
    const projects = allProjects.filter(p => visibleProjectIds.has(p.id));
    
    if (projects.length === 0) {
      console.log(`ℹ️  Aucun projet visible trouvé pour la source ${source.name}`);
      return updates;
    }
    
    // Récupérer uniquement les pipelines visibles
    const visiblePipelines = await AzureDevOpsPipeline.find({ 
      dataSourceId, 
      isVisible: true 
    }).lean();
    
    const visiblePipelineIds = new Set(visiblePipelines.map(p => p.pipelineId));
    
    console.log(`📊 Crawl de ${projects.length} projet(s) visible(s) avec ${visiblePipelineIds.size} pipeline(s) visible(s)`);
    
    // Fonction helper pour extraire les mots-clés d'un nom
    const extractKeywords = (name) => {
      const keywords = [];
      const nameLower = name.toLowerCase();
      
      // Mots-clés courants
      const keywordPatterns = [
        { pattern: /preprod|pre-prod|preprod/i, keyword: 'Preprod' },
        { pattern: /staging|stage/i, keyword: 'Staging' },
        { pattern: /prod|production/i, keyword: 'Production' },
        { pattern: /dev|development/i, keyword: 'Development' },
        { pattern: /test|testing/i, keyword: 'Test' },
        { pattern: /uat|user.*acceptance/i, keyword: 'UAT' }
      ];
      
      for (const { pattern, keyword } of keywordPatterns) {
        if (pattern.test(nameLower) && !keywords.includes(keyword)) {
          keywords.push(keyword);
        }
      }
      
      return keywords;
    };
    
    for (const project of projects) {
      // Crawl des logs de pipelines et builds (le crawl manuel récupère toujours les logs)
      // crawlLogs peut être undefined (par défaut true), donc on vérifie aussi crawlPipelines
      if (crawlPipelines && (crawlLogs !== false)) {
        try {
          const buildApi = await webApi.getBuildApi();
          
          // Récupérer uniquement les IDs des pipelines visibles pour ce projet
          const projectVisiblePipelines = visiblePipelines.filter(p => p.projectId === project.id);
          const pipelineDefinitionIds = projectVisiblePipelines.map(p => parseInt(p.pipelineId));
          
          if (pipelineDefinitionIds.length === 0) {
            console.log(`ℹ️  Aucun pipeline visible pour le projet ${project.name}`);
            continue;
          }
          
          // Récupérer les builds uniquement pour les pipelines visibles
          // getBuilds(project, definitions, queues, buildNumber, minTime, maxTime, requestedFor, reasonFilter, statusFilter, resultFilter, tagFilters, properties, top, continuationToken, maxBuildsPerDefinition, deletedFilter, queryOrder, branchName, buildIds, repositoryId, repositoryType)
          const builds = await buildApi.getBuilds(
            project.id,  // project
            pipelineDefinitionIds,   // definitions (uniquement les pipelines visibles)
            undefined,   // queues
            undefined,   // buildNumber
            undefined,   // minTime
            undefined,   // maxTime
            undefined,   // requestedFor
            undefined,   // reasonFilter
            undefined,   // statusFilter
            undefined,   // resultFilter
            undefined,   // tagFilters
            undefined,   // properties
            50,          // top (nombre de builds à récupérer)
            undefined,   // continuationToken
            undefined,   // maxBuildsPerDefinition
            undefined,   // deletedFilter
            undefined,   // queryOrder
            undefined,   // branchName
            undefined,   // buildIds
            undefined,   // repositoryId
            undefined    // repositoryType
          );
          
          // L'API peut retourner un objet avec une propriété value ou directement un tableau
          let buildsArray = [];
          if (Array.isArray(builds)) {
            buildsArray = builds;
          } else if (builds && Array.isArray(builds.value)) {
            buildsArray = builds.value;
          } else if (builds && builds.length !== undefined) {
            buildsArray = Array.from(builds);
          } else {
            console.warn(`⚠️  Format de réponse inattendu pour les builds du projet ${project.name}`);
            continue;
          }
          
          console.log(`📊 Récupération de ${buildsArray.length} builds pour le projet ${project.name}`);
          
          if (buildsArray.length === 0) {
            console.log(`ℹ️  Aucun build trouvé pour le projet ${project.name}`);
            continue;
          }
          
          for (const build of buildsArray) {
            if (!build || !build.id) {
              console.warn(`⚠️  Build invalide ignoré`);
              continue;
            }
            
            // Vérifier que le pipeline du build est visible
            const buildPipelineId = build.definition?.id?.toString();
            if (!buildPipelineId || !visiblePipelineIds.has(buildPipelineId)) {
              continue; // Ignorer les builds des pipelines non visibles
            }
            
            const buildName = build.definition?.name || build.buildNumber || '';
            const keywords = extractKeywords(buildName);
            
            // Récupérer les work items associés si activé
            let workItems = [];
            if (crawlWorkItems && build.id) {
              try {
                // Utiliser l'API REST pour récupérer les work items associés au build
                // Les work items sont généralement associés via les commits
                if (build.sourceVersion) {
                  try {
                    const gitApi = await webApi.getGitApi();
                    const commit = await gitApi.getCommit(build.sourceVersion, project.id);
                    
                    // Récupérer les work items liés au commit via l'API REST
                    if (commit && commit.commitId) {
                      const workItemTrackingApi = await webApi.getWorkItemTrackingApi();
                      // Utiliser l'API REST pour récupérer les work items associés
                      const orgUrl = organizationUrl.endsWith('/') ? organizationUrl.slice(0, -1) : organizationUrl;
                      const commitUrl = `${orgUrl}/${project.name}/_apis/git/repositories/${build.repository?.id || 'default'}/commits/${commit.commitId}/workItems?api-version=7.1`;
                      
                      try {
                        const response = await axios.get(commitUrl, {
                          headers: {
                            'Authorization': `Basic ${Buffer.from(`:${personalAccessToken}`).toString('base64')}`
                          }
                        });
                        
                        if (response.data && response.data.value && response.data.value.length > 0) {
                          const workItemIds = response.data.value.map(wi => wi.id);
                          if (workItemIds.length > 0) {
                            const workItemsData = await workItemTrackingApi.getWorkItems(workItemIds, project.id, undefined, undefined, ['System.Title', 'System.WorkItemType', 'System.State']);
                            workItems = workItemsData.map(wi => ({
                              id: wi.id?.toString(),
                              title: wi.fields?.['System.Title'] || '',
                              type: wi.fields?.['System.WorkItemType'] || '',
                              state: wi.fields?.['System.State'] || '',
                              url: wi.url || ''
                            }));
                          }
                        }
                      } catch (apiError) {
                        console.debug(`ℹ️  Pas de work items via API REST pour le commit ${commit.commitId}`);
                      }
                    }
                  } catch (error) {
                    console.debug(`ℹ️  Pas de work items via commits pour le build ${build.id}: ${error.message}`);
                  }
                }
              } catch (error) {
                console.warn(`⚠️  Erreur lors de la récupération des work items pour le build ${build.id}:`, error.message);
              }
            }
            
            // Récupérer les logs du build si disponibles
            let buildLogs = null;
            if (crawlLogs && build.id) {
              try {
                const logs = await buildApi.getBuildLogs(project.id, build.id);
                if (logs && logs.length > 0) {
                  // Récupérer le contenu des logs (limiter à 10 derniers pour éviter trop de données)
                  const recentLogs = logs.slice(-10);
                  const logContents = [];
                  
                  for (const log of recentLogs) {
                    try {
                      if (log.id) {
                        const logContent = await buildApi.getBuildLog(project.id, build.id, log.id);
                        if (logContent) {
                          logContents.push({
                            logId: log.id,
                            lineCount: log.lineCount,
                            createdOn: log.createdOn,
                            content: logContent.substring(0, 10000) // Limiter à 10k caractères par log
                          });
                        }
                      }
                    } catch (logError) {
                      // Ignorer les erreurs individuelles de log
                      console.debug(`ℹ️  Log ${log.id} non disponible`);
                    }
                  }
                  
                  if (logContents.length > 0) {
                    buildLogs = JSON.stringify(logContents);
                  }
                }
              } catch (error) {
                // Les logs peuvent ne pas être disponibles pour tous les builds
                console.debug(`ℹ️  Logs non disponibles pour le build ${build.id}: ${error.message}`);
              }
            }
            
            // Déterminer le statut du build
            // Azure DevOps BuildResult enum:
            // None = 0 (pas encore terminé)
            // Succeeded = 1
            // PartiallySucceeded = 2
            // Failed = 3
            // Canceled = 4
            // Azure DevOps BuildStatus enum:
            // None = 0
            // InProgress = 1
            // Completed = 2
            // Cancelling = 4
            // Postponed = 8
            let buildStatus = 'inProgress';
            
            // Debug: afficher les valeurs reçues pour les premiers builds
            if (buildsArray.indexOf(build) < 5) {
              console.log(`🔍 Build ${build.id} (${build.buildNumber}): status=${build.status} (type: ${typeof build.status}), result=${build.result} (type: ${typeof build.result})`);
            }
            
            if (build.status === 2 || build.status === 'completed') {
              // Build terminé, utiliser result
              if (build.result === 1) {
                buildStatus = 'succeeded';
              } else if (build.result === 2) {
                buildStatus = 'partiallySucceeded';
              } else if (build.result === 3) {
                buildStatus = 'failed';
              } else if (build.result === 4) {
                buildStatus = 'canceled';
              } else if (build.result === 0 || build.result === undefined || build.result === null) {
                // Si result est None/undefined mais que le build est terminé, considérer comme failed par défaut
                buildStatus = 'failed';
              }
            } else if (build.status === 1 || build.status === 'inProgress') {
              buildStatus = 'inProgress';
            } else if (build.status === 4 || build.status === 'cancelling') {
              buildStatus = 'canceled';
            } else if (build.status === 8 || build.status === 'postponed') {
              buildStatus = 'canceled';
            }
            
            // Créer ou mettre à jour le log de pipeline
            const pipelineLogData = {
              dataSourceId,
              projectId: project.id,
              projectName: project.name,
              pipelineId: build.definition?.id?.toString() || '',
              pipelineName: build.definition?.name || buildName,
              buildId: build.id?.toString(),
              buildNumber: build.buildNumber || '',
              type: 'pipeline',
              status: buildStatus,
              date: build.startTime || new Date(),
              finishDate: build.finishTime || null,
              requestedBy: build.requestedBy ? {
                id: build.requestedBy.id,
                displayName: build.requestedBy.displayName,
                email: build.requestedBy.uniqueName
              } : null,
              workItems: workItems,
              keywords: keywords,
              logs: buildLogs,
              url: build.url || '',
              branch: build.sourceBranch || '',
              commitHash: build.sourceVersion || '',
              commitMessage: null
            };
            
            await PipelineLog.findOneAndUpdate(
              { dataSourceId, buildId: pipelineLogData.buildId, type: pipelineLogData.type },
              pipelineLogData,
              { upsert: true, new: true }
            );
            
            updates.pipelineLogs.push(pipelineLogData);
            
            // Mettre à jour les groupes de mots-clés
            for (const keyword of keywords) {
              try {
                await KeywordGroup.findOneAndUpdate(
                  { dataSourceId, keyword },
                  {
                    $addToSet: {
                      items: {
                        id: build.id?.toString(),
                        name: buildName,
                        type: 'pipeline'
                      }
                    }
                  },
                  { upsert: true, new: true }
                );
              } catch (error) {
                console.warn(`⚠️  Erreur lors de la mise à jour du groupe de mots-clés "${keyword}":`, error.message);
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️  Erreur lors du crawl des logs pour ${project.name}:`, error.message);
        }
      }
      
      // Crawl des releases/publications si activé
      if (source.config.crawlReleases) {
        try {
          const releaseApi = await webApi.getReleaseApi();
          const releases = await releaseApi.getReleases(project.id, undefined, undefined, undefined, undefined, 50);
          
          for (const release of releases) {
            const releaseName = release.name || '';
            const keywords = extractKeywords(releaseName);
            
            const releaseLogData = {
              dataSourceId,
              projectId: project.id,
              projectName: project.name,
              pipelineId: release.releaseDefinition?.id?.toString() || '',
              pipelineName: release.releaseDefinition?.name || releaseName,
              buildId: release.id?.toString(),
              buildNumber: release.name || '',
              type: 'publication',
              status: release.status === 4 ? 'succeeded' : release.status === 8 ? 'failed' : 'inProgress',
              date: release.createdOn || new Date(),
              finishDate: release.modifiedOn || null,
              requestedBy: release.createdBy ? {
                id: release.createdBy.id,
                displayName: release.createdBy.displayName,
                email: release.createdBy.uniqueName
              } : null,
              workItems: [],
              keywords: keywords,
              logs: null,
              url: release.url || '',
              branch: null,
              commitHash: null,
              commitMessage: null
            };
            
            await PipelineLog.findOneAndUpdate(
              { dataSourceId, buildId: releaseLogData.buildId, type: 'publication' },
              releaseLogData,
              { upsert: true, new: true }
            );
            
            updates.pipelineLogs.push(releaseLogData);
          }
        } catch (error) {
          console.warn(`⚠️  Erreur lors du crawl des releases pour ${project.name}:`, error.message);
        }
      }
    }
    
    // Compter le total de work items
    const totalWorkItems = updates.pipelineLogs.reduce((sum, log) => sum + (log.workItems?.length || 0), 0);
    
    console.log(`✅ Crawl terminé pour "${source.name}":`);
    console.log(`   - ${updates.pipelineLogs.length} logs de pipelines sauvegardés`);
    console.log(`   - ${totalWorkItems} work items associés au total`);
    
    return updates;
  } catch (error) {
    console.error('❌ Erreur lors du crawl Azure DevOps:', error);
    throw error;
  }
};

export default {
  initialCrawl,
  crawl
};
