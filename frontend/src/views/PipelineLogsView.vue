<template>
  <div class="pipeline-logs-view">

    <!-- Filtres -->
    <div class="filters-compact">
      <div class="filters-header-compact">
        <span class="filters-icon">🔍</span>
        <span class="filters-label">Filtres</span>
      </div>
      <div class="filters-content-compact">
        <!-- Source de données -->
        <div class="filters-row">
          <div class="form-group-compact">
            <label class="form-label-compact">Source</label>
            <div class="search-input-wrapper">
              <div class="search-input-container" :class="{ 'has-badges': filters.dataSourceIds.length > 0 }">
                <!-- Badges des éléments sélectionnés -->
                <div v-if="filters.dataSourceIds.length > 0" class="selected-badges-inline">
                  <span 
                    v-for="sourceId in filters.dataSourceIds" 
                    :key="sourceId"
                    class="selected-badge"
                  >
                    {{ getDataSourceName(sourceId) }}
                    <button 
                      class="badge-remove"
                      @click.stop="removeDataSource(sourceId)"
                      title="Retirer"
                    >
                      ×
                    </button>
                  </span>
                </div>
                <input 
                  type="text" 
                  class="search-input-compact" 
                  :class="{ 'with-badges': filters.dataSourceIds.length > 0 }"
                  :placeholder="filters.dataSourceIds.length > 0 ? '' : 'Rechercher une source...'"
                  v-model="searchDataSource"
                  @focus="showDataSourceDropdown = true"
                  @blur="setTimeout(() => showDataSourceDropdown = false, 200)"
                  @input="showDataSourceDropdown = true"
                />
                <span v-if="isSearchingDataSource" class="search-loading">🔍</span>
              </div>
              <div v-if="showDataSourceDropdown" class="search-dropdown">
                <div 
                  v-for="source in filteredDataSources" 
                  :key="source._id"
                  class="search-dropdown-item"
                  :class="{ 'selected': filters.dataSourceIds.includes(source._id) }"
                  @mousedown.prevent="toggleDataSource(source)"
                >
                  <span class="checkbox-indicator">{{ filters.dataSourceIds.includes(source._id) ? '✓' : '' }}</span>
                  {{ source.name }}
                </div>
                <div 
                  v-if="searchDataSource && filteredDataSources.length === 0"
                  class="search-dropdown-item no-results"
                >
                  Aucun résultat
                </div>
              </div>
            </div>
          </div>

          <!-- Projet -->
          <div class="form-group-compact">
            <label class="form-label-compact">Projet</label>
            <div class="search-input-wrapper">
              <div class="search-input-container" :class="{ 'has-badges': filters.projectIds.length > 0 }">
                <!-- Badges des éléments sélectionnés -->
                <div v-if="filters.projectIds.length > 0" class="selected-badges-inline">
                  <span 
                    v-for="projectId in filters.projectIds" 
                    :key="projectId"
                    class="selected-badge"
                  >
                    {{ getProjectName(projectId) }}
                    <button 
                      class="badge-remove"
                      @click.stop="removeProject(projectId)"
                      title="Retirer"
                    >
                      ×
                    </button>
                  </span>
                </div>
                <input 
                  type="text" 
                  class="search-input-compact" 
                  :class="{ 'with-badges': filters.projectIds.length > 0 }"
                  :placeholder="filters.projectIds.length > 0 ? '' : 'Rechercher un projet...'"
                  v-model="searchProject"
                  @focus="showProjectDropdown = true"
                  @blur="setTimeout(() => showProjectDropdown = false, 200)"
                  @input="showProjectDropdown = true"
                />
                <span v-if="isSearchingProject" class="search-loading">🔍</span>
              </div>
              <div v-if="showProjectDropdown" class="search-dropdown">
                <div 
                  v-for="project in filteredProjects" 
                  :key="project._id"
                  class="search-dropdown-item"
                  :class="{ 'selected': filters.projectIds.includes(project.projectId) }"
                  @mousedown.prevent="toggleProject(project)"
                >
                  <span class="checkbox-indicator">{{ filters.projectIds.includes(project.projectId) ? '✓' : '' }}</span>
                  {{ project.displayName || project.name }}
                </div>
                <div 
                  v-if="searchProject && filteredProjects.length === 0"
                  class="search-dropdown-item no-results"
                >
                  Aucun résultat
                </div>
              </div>
            </div>
          </div>

          <!-- Pipeline -->
          <div class="form-group-compact">
            <label class="form-label-compact">Pipeline</label>
            <div class="search-input-wrapper">
              <div class="search-input-container" :class="{ 'has-badges': filters.pipelineIds.length > 0 }">
                <!-- Badges des éléments sélectionnés -->
                <div v-if="filters.pipelineIds.length > 0" class="selected-badges-inline">
                  <span 
                    v-for="pipelineId in filters.pipelineIds" 
                    :key="pipelineId"
                    class="selected-badge"
                  >
                    {{ getPipelineName(pipelineId) }}
                    <button 
                      class="badge-remove"
                      @click.stop="removePipeline(pipelineId)"
                      title="Retirer"
                    >
                      ×
                    </button>
                  </span>
                </div>
                <input 
                  type="text" 
                  class="search-input-compact" 
                  :class="{ 'with-badges': filters.pipelineIds.length > 0 }"
                  :placeholder="filters.pipelineIds.length > 0 ? '' : 'Rechercher un pipeline...'"
                  v-model="searchPipeline"
                  @focus="showPipelineDropdown = true"
                  @blur="setTimeout(() => showPipelineDropdown = false, 200)"
                  @input="showPipelineDropdown = true"
                />
                <span v-if="isSearchingPipeline" class="search-loading">🔍</span>
              </div>
              <div v-if="showPipelineDropdown" class="search-dropdown">
                <div 
                  v-for="pipeline in filteredPipelines" 
                  :key="pipeline._id"
                  class="search-dropdown-item"
                  :class="{ 'selected': filters.pipelineIds.includes(pipeline.pipelineId) }"
                  @mousedown.prevent="togglePipeline(pipeline)"
                >
                  <span class="checkbox-indicator">{{ filters.pipelineIds.includes(pipeline.pipelineId) ? '✓' : '' }}</span>
                  {{ pipeline.displayName || pipeline.name }}
                </div>
                <div 
                  v-if="searchPipeline && filteredPipelines.length === 0"
                  class="search-dropdown-item no-results"
                >
                  Aucun résultat
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dates -->
        <div class="filters-row">
          <div class="form-group-compact">
            <label class="form-label-compact">Date début</label>
            <input 
              type="date" 
              class="form-input-compact"
              v-model="filters.startDate"
            />
          </div>
          <div class="form-group-compact">
            <label class="form-label-compact">Date fin</label>
            <input 
              type="date" 
              class="form-input-compact"
              v-model="filters.endDate"
            />
          </div>
          <div class="form-group-compact form-group-button">
            <button class="btn btn-secondary btn-xs" @click.stop="resetFilters">
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des logs -->
    <div v-if="loading" class="loading">Chargement...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="error && (error.includes('401') || error.includes('No token'))" class="card">
      <div class="empty-state">
        <div class="empty-icon">🔐</div>
        <h3>Authentification requise</h3>
        <p>Vous devez être connecté pour accéder aux logs de pipelines.</p>
        <p class="empty-hint">Veuillez vous connecter en utilisant le bouton de connexion dans la barre latérale.</p>
      </div>
    </div>
    <div v-else-if="dataSources.length === 0 && !error" class="card">
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>Aucune source de données disponible</h3>
        <p>Il n'y a actuellement aucune source de données Azure DevOps configurée et initialisée.</p>
        <p class="empty-hint">Veuillez configurer une source de données dans le Back Office.</p>
      </div>
    </div>
    <div v-else-if="logs.length === 0 && !loading" class="card">
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Aucun log trouvé</h3>
        <p>Aucun log ne correspond aux filtres sélectionnés.</p>
        <p class="empty-hint">Essayez de modifier les filtres ou de sélectionner une autre source de données.</p>
      </div>
    </div>
    <div v-else class="logs-list">
      <div 
        v-for="log in logs" 
        :key="log._id"
        class="log-card card"
      >
        <div class="log-header">
          <div class="log-title-section">
            <h4>{{ log.pipelineName || log.buildNumber || 'Build sans nom' }}</h4>
            <span class="log-type-badge" :class="log.type || 'pipeline'">
              {{ getLogTypeLabel(log.type || 'pipeline') }}
            </span>
          </div>
          <div class="log-meta">
            <span class="log-date">{{ formatDate(log.date) }}</span>
          </div>
        </div>
        <div class="log-content">
          <div class="log-details">
            <div class="log-detail-item">
              <strong>Projet:</strong> {{ log.projectName }}
            </div>
            <div v-if="log.pipelineName" class="log-detail-item">
              <strong>Pipeline:</strong> {{ log.pipelineName }}
            </div>
            <div v-if="log.buildNumber" class="log-detail-item">
              <strong>Build:</strong> {{ log.buildNumber }}
            </div>
            <div v-if="log.status" class="log-detail-item">
              <strong>Statut:</strong> 
              <span :class="['status-badge', log.status.toLowerCase()]">
                {{ getStatusLabel(log.status) }}
              </span>
            </div>
            <div v-if="log.requestedBy" class="log-detail-item">
              <strong>Demandé par:</strong> {{ log.requestedBy.displayName || log.requestedBy.id }}
            </div>
          </div>
          <div v-if="log.workItems && log.workItems.length > 0" class="work-items">
            <strong>Work Items associés:</strong>
            <div class="work-items-list">
              <span 
                v-for="wi in log.workItems" 
                :key="wi.id"
                class="work-item-badge"
              >
                {{ wi.title || wi.id }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="logs.length > 0" class="pagination">
      <button 
        class="btn btn-secondary"
        @click="previousPage"
        :disabled="pagination.page === 1"
      >
        Précédent
      </button>
      <span>
        Page {{ pagination.page }} sur {{ pagination.pages }}
      </span>
      <button 
        class="btn btn-secondary"
        @click="nextPage"
        :disabled="pagination.page >= pagination.pages"
      >
        Suivant
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import api from '../api/client.js';
import { format } from 'date-fns';
import { smartSearch } from '../services/semanticSearch.js';

const loading = ref(false);
const error = ref('');
const logs = ref([]);
const dataSources = ref([]);
const projects = ref([]);
const pipelines = ref([]);
const isUpdatingFilters = ref(false); // Flag pour éviter les boucles infinies
const isMounted = ref(false); // Flag pour éviter les appels pendant le montage

// Recherches pour les filtres
const searchDataSource = ref('');
const searchProject = ref('');
const searchPipeline = ref('');

// Résultats de recherche sémantique
const semanticDataSourcesResults = ref([]);
const semanticProjectsResults = ref([]);
const semanticPipelinesResults = ref([]);

const isSearchingDataSource = ref(false);
const isSearchingProject = ref(false);
const isSearchingPipeline = ref(false);

// États pour les dropdowns
const showDataSourceDropdown = ref(false);
const showProjectDropdown = ref(false);
const showPipelineDropdown = ref(false);

const filters = ref({
  dataSourceIds: [], // Tableau pour sélection multiple
  projectIds: [], // Tableau pour sélection multiple
  pipelineIds: [], // Tableau pour sélection multiple
  startDate: '',
  endDate: ''
});

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
});


// Fonction pour effectuer la recherche sémantique
const performSemanticSearch = async (query, items, fields, resultRef, loadingRef) => {
  if (!query || query.trim().length === 0) {
    resultRef.value = items;
    return;
  }

  loadingRef.value = true;
  try {
    const results = await smartSearch(query, items, {
      fields,
      threshold: 0.25,
    });
    resultRef.value = results;
  } catch (error) {
    console.error('Erreur recherche sémantique:', error);
    // Fallback sur recherche textuelle
    const search = query.toLowerCase();
    resultRef.value = items.filter(item =>
      fields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(search);
      })
    );
  } finally {
    loadingRef.value = false;
  }
};

// Watchers pour déclencher la recherche sémantique avec debounce
let searchDebounceTimer = null;
const debounceSearch = (query, items, fields, resultRef, loadingRef) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    performSemanticSearch(query, items, fields, resultRef, loadingRef);
  }, 300);
};

// Watcher pour les sources de données
watch([searchDataSource, dataSources], ([query, items]) => {
  debounceSearch(query, items, ['name'], semanticDataSourcesResults, isSearchingDataSource);
}, { immediate: true });

// Watcher pour les projets - filtrer dynamiquement selon les sources sélectionnées
watch([searchProject, projects, () => filters.value.dataSourceIds], ([query, items, dataSourceIds]) => {
  let filtered = items;
  // Si des sources sont sélectionnées, filtrer par ces sources
  // Sinon, afficher tous les projets
  if (dataSourceIds && dataSourceIds.length > 0) {
    filtered = filtered.filter(p => dataSourceIds.includes(p.dataSourceId));
  }
  // Ne pas exclure les projets déjà sélectionnés - ils doivent apparaître avec une coche
  debounceSearch(query, filtered, ['name', 'displayName'], semanticProjectsResults, isSearchingProject);
}, { immediate: true });

// Watcher pour les pipelines - filtrer dynamiquement selon les sources et projets sélectionnés
watch([searchPipeline, pipelines, () => filters.value.dataSourceIds, () => filters.value.projectIds], 
  ([query, items, dataSourceIds, projectIds]) => {
    let filtered = items;
    // Si des sources sont sélectionnées, filtrer par ces sources
    // Sinon, afficher tous les pipelines
    if (dataSourceIds && dataSourceIds.length > 0) {
      filtered = filtered.filter(p => dataSourceIds.includes(p.dataSourceId));
    }
    if (projectIds && projectIds.length > 0) {
      filtered = filtered.filter(p => projectIds.includes(p.projectId));
    }
    // Ne pas exclure les pipelines déjà sélectionnés - ils doivent apparaître avec une coche
    debounceSearch(query, filtered, ['name', 'displayName'], semanticPipelinesResults, isSearchingPipeline);
  }, { immediate: true });

// Computed properties avec fallback
const filteredDataSources = computed(() => {
  // Ne pas exclure les éléments sélectionnés - ils doivent apparaître avec une coche
  if (!searchDataSource.value) return dataSources.value;
  return semanticDataSourcesResults.value.length > 0 
    ? semanticDataSourcesResults.value 
    : dataSources.value;
});

const filteredProjects = computed(() => {
  // Filtrer dynamiquement en fonction des sources sélectionnées
  // Si aucune source n'est sélectionnée, afficher tous les projets
  let baseFiltered = projects.value;
  if (filters.value.dataSourceIds.length > 0) {
    baseFiltered = baseFiltered.filter(p => filters.value.dataSourceIds.includes(p.dataSourceId));
  }
  
  // Ne pas exclure les projets déjà sélectionnés - ils doivent apparaître avec une coche
  
  if (!searchProject.value) return baseFiltered;
  return semanticProjectsResults.value.length > 0 
    ? semanticProjectsResults.value
    : baseFiltered;
});

const filteredPipelines = computed(() => {
  // Filtrer dynamiquement en fonction des sources et projets sélectionnés
  // Si aucune source n'est sélectionnée, afficher tous les pipelines
  let filtered = pipelines.value;
  if (filters.value.dataSourceIds.length > 0) {
    filtered = filtered.filter(p => filters.value.dataSourceIds.includes(p.dataSourceId));
  }
  if (filters.value.projectIds.length > 0) {
    filtered = filtered.filter(p => filters.value.projectIds.includes(p.projectId));
  }
  
  // Ne pas exclure les pipelines déjà sélectionnés - ils doivent apparaître avec une coche
  
  if (!searchPipeline.value) return filtered;
  return semanticPipelinesResults.value.length > 0 
    ? semanticPipelinesResults.value
    : filtered;
});


const getLogTypeLabel = (type) => {
  const labels = {
    'pipeline': 'Pipeline',
    'publication': 'Publication',
    'build': 'Build',
    'release': 'Release'
  };
  return labels[type] || type;
};

const getStatusLabel = (status) => {
  const labels = {
    'succeeded': 'Réussi',
    'failed': 'Échoué',
    'canceled': 'Annulé',
    'inProgress': 'En cours',
    'partiallySucceeded': 'Partiellement réussi'
  };
  return labels[status] || status;
};

const formatDate = (date) => {
  if (!date) return 'Date inconnue';
  return format(new Date(date), 'dd MMMM yyyy à HH:mm');
};

const fetchDataSources = async () => {
  try {
    const response = await api.get('/admin/data-sources');
    dataSources.value = response.data.filter(s => s.type === 'azure-devops' && s.initialCrawlCompleted);
  } catch (err) {
    // Ne pas afficher d'erreur si c'est une erreur d'authentification (401)
    if (err.response?.status === 401) {
      // L'utilisateur n'est pas authentifié, on laisse le composant gérer l'affichage
      dataSources.value = [];
      return;
    }
    console.error('Erreur lors du chargement des sources:', err);
    error.value = 'Erreur lors du chargement des sources de données';
  }
};

const fetchProjects = async () => {
  try {
    // Si aucune source n'est sélectionnée, charger les projets de toutes les sources
    const sourcesToFetch = filters.value.dataSourceIds.length > 0 
      ? filters.value.dataSourceIds 
      : dataSources.value.map(s => s._id);
    
    if (sourcesToFetch.length === 0) {
      projects.value = [];
      return;
    }
    
    // Charger les projets pour toutes les sources
    const allProjects = [];
    for (const dataSourceId of sourcesToFetch) {
      try {
        const response = await api.get(`/admin/data-sources/${dataSourceId}/azure-devops/projects`);
        const projectsForSource = response.data.filter(p => p.isVisible);
        allProjects.push(...projectsForSource);
      } catch (err) {
        console.error(`Erreur lors du chargement des projets pour la source ${dataSourceId}:`, err);
      }
    }
    projects.value = allProjects;
  } catch (err) {
    console.error('Erreur lors du chargement des projets:', err);
  }
};

const fetchPipelines = async () => {
  try {
    // Si aucune source n'est sélectionnée, charger les pipelines de toutes les sources
    const sourcesToFetch = filters.value.dataSourceIds.length > 0 
      ? filters.value.dataSourceIds 
      : dataSources.value.map(s => s._id);
    
    if (sourcesToFetch.length === 0) {
      pipelines.value = [];
      return;
    }
    
    // Charger les pipelines pour toutes les sources et projets sélectionnés
    const allPipelines = [];
    for (const dataSourceId of sourcesToFetch) {
      try {
        const params = filters.value.projectIds.length > 0 
          ? { projectId: filters.value.projectIds.join(',') } 
          : {};
        const response = await api.get(`/admin/data-sources/${dataSourceId}/azure-devops/pipelines`, { params });
        const pipelinesForSource = response.data.filter(p => p.isVisible);
        allPipelines.push(...pipelinesForSource);
      } catch (err) {
        console.error(`Erreur lors du chargement des pipelines pour la source ${dataSourceId}:`, err);
      }
    }
    pipelines.value = allPipelines;
  } catch (err) {
    console.error('Erreur lors du chargement des pipelines:', err);
  }
};


const fetchLogs = async () => {
  // Éviter les appels multiples simultanés
  if (loading.value) return;
  
  // Ne pas charger si le composant n'est pas encore monté
  if (!isMounted.value) return;
  
  // Ne pas charger si aucune source de données n'est disponible
  if (dataSources.value.length === 0) {
    logs.value = [];
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const params = {
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
      page: pagination.value.page,
      limit: pagination.value.limit
    };
    
    // Ajouter les sources sélectionnées (multi-sélection)
    // Si aucune source n'est sélectionnée, on charge tout (pas de filtre)
    if (filters.value.dataSourceIds.length > 0) {
      params.dataSourceId = filters.value.dataSourceIds.join(',');
    }
    
    // Ajouter les projets sélectionnés (multi-sélection)
    if (filters.value.projectIds.length > 0) {
      params.projectId = filters.value.projectIds.join(',');
    }
    
    // Ajouter les pipelines sélectionnés (multi-sélection)
    if (filters.value.pipelineIds.length > 0) {
      params.pipelineId = filters.value.pipelineIds.join(',');
    }
    
    // Nettoyer les paramètres vides
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || (Array.isArray(params[key]) && params[key].length === 0)) {
        delete params[key];
      }
    });
    
    const response = await api.get('/pipeline-logs', { params });
    logs.value = response.data.data || [];
    pagination.value = response.data.pagination || pagination.value;
  } catch (err) {
    // Ne pas afficher d'erreur si c'est une erreur d'authentification (401)
    if (err.response?.status === 401) {
      error.value = 'Authentification requise';
      logs.value = [];
      pagination.value = {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      };
      return;
    }
    error.value = err.response?.data?.error || 'Erreur lors du chargement des logs';
    console.error('Erreur lors du chargement des logs:', err);
    // En cas d'erreur, vider les logs pour éviter les affichages incorrects
    logs.value = [];
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    };
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = async () => {
  // Éviter les appels multiples simultanés
  if (isUpdatingFilters.value) return;
  
  isUpdatingFilters.value = true;
  pagination.value.page = 1;
  await fetchLogs();
  await nextTick();
  isUpdatingFilters.value = false;
};

// Fonctions pour sélectionner et désélectionner les filtres (multi-sélection)
const toggleDataSource = (source) => {
  const index = filters.value.dataSourceIds.indexOf(source._id);
  if (index > -1) {
    // Retirer de la sélection
    filters.value.dataSourceIds.splice(index, 1);
    // Réinitialiser les filtres dépendants si plus de sources
    if (filters.value.dataSourceIds.length === 0) {
      filters.value.projectIds = [];
      filters.value.pipelineIds = [];
      searchProject.value = '';
      searchPipeline.value = '';
    } else {
      // Nettoyer les projets et pipelines qui ne sont plus valides
      updateDependentFilters();
    }
  } else {
    // Ajouter à la sélection
    filters.value.dataSourceIds.push(source._id);
  }
  searchDataSource.value = '';
  showDataSourceDropdown.value = false;
  handleFilterChange();
};

const removeDataSource = (sourceId) => {
  const index = filters.value.dataSourceIds.indexOf(sourceId);
  if (index > -1) {
    filters.value.dataSourceIds.splice(index, 1);
    // Réinitialiser les filtres dépendants si plus de sources
    if (filters.value.dataSourceIds.length === 0) {
      filters.value.projectIds = [];
      filters.value.pipelineIds = [];
      searchProject.value = '';
      searchPipeline.value = '';
    } else {
      updateDependentFilters();
    }
    handleFilterChange();
  }
};

const toggleProject = (project) => {
  const index = filters.value.projectIds.indexOf(project.projectId);
  if (index > -1) {
    // Retirer de la sélection
    filters.value.projectIds.splice(index, 1);
    // Nettoyer les pipelines qui ne sont plus valides
    updateDependentFilters();
  } else {
    // Ajouter à la sélection
    filters.value.projectIds.push(project.projectId);
  }
  searchProject.value = '';
  showProjectDropdown.value = false;
  handleFilterChange();
};

const removeProject = (projectId) => {
  const index = filters.value.projectIds.indexOf(projectId);
  if (index > -1) {
    filters.value.projectIds.splice(index, 1);
    updateDependentFilters();
    handleFilterChange();
  }
};

const togglePipeline = (pipeline) => {
  const index = filters.value.pipelineIds.indexOf(pipeline.pipelineId);
  if (index > -1) {
    // Retirer de la sélection
    filters.value.pipelineIds.splice(index, 1);
  } else {
    // Ajouter à la sélection
    filters.value.pipelineIds.push(pipeline.pipelineId);
  }
  searchPipeline.value = '';
  showPipelineDropdown.value = false;
  handleFilterChange();
};

const removePipeline = (pipelineId) => {
  const index = filters.value.pipelineIds.indexOf(pipelineId);
  if (index > -1) {
    filters.value.pipelineIds.splice(index, 1);
    handleFilterChange();
  }
};

// Fonction pour mettre à jour les filtres dépendants
const updateDependentFilters = () => {
  // Nettoyer les projets qui ne sont plus dans les sources sélectionnées
  if (filters.value.dataSourceIds.length > 0) {
    filters.value.projectIds = filters.value.projectIds.filter(projectId => {
      const project = projects.value.find(p => p.projectId === projectId);
      return project && filters.value.dataSourceIds.includes(project.dataSourceId);
    });
  }
  
  // Nettoyer les pipelines qui ne sont plus dans les sources/projets sélectionnés
  if (filters.value.dataSourceIds.length > 0 || filters.value.projectIds.length > 0) {
    filters.value.pipelineIds = filters.value.pipelineIds.filter(pipelineId => {
      const pipeline = pipelines.value.find(p => p.pipelineId === pipelineId);
      if (!pipeline) return false;
      if (filters.value.dataSourceIds.length > 0 && !filters.value.dataSourceIds.includes(pipeline.dataSourceId)) {
        return false;
      }
      if (filters.value.projectIds.length > 0 && !filters.value.projectIds.includes(pipeline.projectId)) {
        return false;
      }
      return true;
    });
  }
};

// Fonctions pour obtenir les noms des éléments sélectionnés
const getDataSourceName = (id) => {
  const source = dataSources.value.find(s => s._id === id);
  return source ? source.name : '';
};

const getProjectName = (projectId) => {
  const project = projects.value.find(p => p.projectId === projectId);
  return project ? (project.displayName || project.name) : '';
};

const getPipelineName = (pipelineId) => {
  const pipeline = pipelines.value.find(p => p.pipelineId === pipelineId);
  return pipeline ? (pipeline.displayName || pipeline.name) : '';
};

const resetFilters = async () => {
  if (isUpdatingFilters.value) return;
  
  isUpdatingFilters.value = true;
  filters.value = {
    dataSourceIds: [],
    projectIds: [],
    pipelineIds: [],
    startDate: '',
    endDate: ''
  };
  searchDataSource.value = '';
  searchProject.value = '';
  searchPipeline.value = '';
  projects.value = [];
  pipelines.value = [];
  await nextTick();
  await handleFilterChange();
  isUpdatingFilters.value = false;
};

const previousPage = async () => {
  if (pagination.value.page > 1) {
    pagination.value.page--;
    await fetchLogs();
  }
};

const nextPage = async () => {
  if (pagination.value.page < pagination.value.pages) {
    pagination.value.page++;
    await fetchLogs();
  }
};

watch(() => filters.value.dataSourceIds, async (newValue, oldValue) => {
  // Éviter les appels inutiles si la valeur n'a pas vraiment changé
  if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return;
  if (isUpdatingFilters.value) return;
  if (!isMounted.value) return;
  
  isUpdatingFilters.value = true;
  
  // Mettre à jour les filtres dépendants
  updateDependentFilters();
  
  // Toujours charger les projets et pipelines (même si aucune source n'est sélectionnée)
  await fetchProjects();
  await fetchPipelines();
  await nextTick();
  await handleFilterChange();
  
  await nextTick();
  isUpdatingFilters.value = false;
}, { deep: true, immediate: false });

watch(() => filters.value.projectIds, async (newValue, oldValue) => {
  // Éviter les appels inutiles si la valeur n'a pas vraiment changé
  if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return;
  if (isUpdatingFilters.value) return;
  if (!isMounted.value) return;
  
  isUpdatingFilters.value = true;
  
  // Mettre à jour les filtres dépendants
  updateDependentFilters();
  
  if (filters.value.dataSourceIds.length > 0) {
    await fetchPipelines();
    await nextTick();
    await handleFilterChange();
  }
  
  await nextTick();
  isUpdatingFilters.value = false;
}, { deep: true, immediate: false });

watch(() => filters.value.pipelineIds, async (newValue, oldValue) => {
  // Éviter les appels inutiles si la valeur n'a pas vraiment changé
  if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return;
  if (isUpdatingFilters.value) return;
  if (!isMounted.value) return;
  
  isUpdatingFilters.value = true;
  await handleFilterChange();
  await nextTick();
  isUpdatingFilters.value = false;
}, { deep: true, immediate: false });

watch(() => filters.value.startDate, async (newValue, oldValue) => {
  if (newValue === oldValue) return;
  if (isUpdatingFilters.value) return;
  if (!isMounted.value) return;
  
  isUpdatingFilters.value = true;
  await handleFilterChange();
  await nextTick();
  isUpdatingFilters.value = false;
}, { immediate: false });

watch(() => filters.value.endDate, async (newValue, oldValue) => {
  if (newValue === oldValue) return;
  if (isUpdatingFilters.value) return;
  if (!isMounted.value) return;
  
  isUpdatingFilters.value = true;
  await handleFilterChange();
  await nextTick();
  isUpdatingFilters.value = false;
}, { immediate: false });


onMounted(async () => {
  isMounted.value = true;
  await fetchDataSources();
  
  // Si une seule source existe, la sélectionner par défaut
  // Sinon, laisser vide pour afficher toutes les données
  if (dataSources.value.length === 1) {
    filters.value.dataSourceIds = [dataSources.value[0]._id];
  }
  
  // Charger les projets et pipelines (tous si aucune source sélectionnée)
  await fetchProjects();
  await fetchPipelines();
  
  // Charger tous les logs (avec ou sans filtres)
  if (dataSources.value.length > 0) {
    await fetchLogs();
  } else {
    logs.value = [];
  }
});
</script>

<style scoped>
.pipeline-logs-view {
  padding: 0;
}

.filters-compact {
  background: var(--surface);
  border-radius: var(--radius-lg);
  margin-bottom: 2rem;
  border: 2px solid var(--border-color);
}

.filters-header-compact {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  cursor: pointer;
  user-select: none;
}

.filters-content-compact {
  padding: 1.5rem;
  border-top: 2px solid var(--border-color);
}

.filters-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}


.logs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.log-card {
  border-left: 4px solid var(--primary-color);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.log-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.log-title-section h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.log-type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.log-type-badge.pipeline {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.log-type-badge.publication {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.log-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.log-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.log-content {
  color: var(--text-secondary);
}

.log-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-light);
}

.log-detail-item {
  font-size: 0.875rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.succeeded {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.status-badge.failed {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-badge.inprogress {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.work-items {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-light);
}

.work-items-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.work-item-badge {
  padding: 0.25rem 0.75rem;
  background: var(--background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Styles pour les filtres compacts */
.form-group-compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 150px;
}

.form-group-button {
  justify-content: flex-end;
}

.form-group-button .btn {
  align-self: flex-start;
  margin-top: 1.625rem; /* Aligne avec les inputs : label (0.75rem) + gap (0.5rem) + hauteur label (~0.375rem) */
}

.form-label-compact {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-input-compact,
.form-select-compact {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  background-color: var(--background);
  color: var(--text-primary);
  transition: all 0.2s ease;
  width: 100%;
}

.form-input-compact:focus,
.form-select-compact:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
}

.form-select-compact {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cbd5e1' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}

/* Styles pour les champs de recherche */
.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-input-container {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  padding-right: 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: var(--background);
  transition: all 0.2s ease;
  min-height: 2.5rem;
}

.search-input-container:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
}

.search-input-container.has-badges {
  padding: 0.375rem 0.75rem;
  padding-right: 2.5rem;
}

.selected-badges-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.search-input-compact {
  flex: 1;
  min-width: 150px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.8125rem;
  color: var(--text-primary);
  padding: 0;
  margin: 0;
}

.search-input-compact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-loading {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.875rem;
  pointer-events: none;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: var(--background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.search-dropdown-item {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 0.8125rem;
}

.search-dropdown-item:hover {
  background: var(--surface-hover);
}

.search-dropdown-item.selected {
  background: var(--primary-color);
  color: white;
}

.search-dropdown-item.no-results {
  color: var(--text-secondary);
  cursor: default;
  font-style: italic;
}

.clear-selected-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s ease;
  z-index: 10;
}

.clear-selected-btn:hover {
  color: var(--text-primary);
}

/* Styles pour les badges de sélection multiple */
.selected-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.badge-remove {
  background: none;
  border: none;
  color: white;
  font-size: 1.125rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  margin: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.badge-remove:hover {
  background: rgba(255, 255, 255, 0.2);
}


.checkbox-indicator {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.5rem;
  text-align: center;
  line-height: 1.25rem;
  font-weight: bold;
  color: var(--primary-color);
}


.filters-icon {
  font-size: 1rem;
}

.filters-label {
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.empty-state p {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 1rem;
}
</style>
