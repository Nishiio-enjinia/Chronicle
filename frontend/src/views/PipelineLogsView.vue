<template>
  <div class="pipeline-logs-view">
    <div class="breadcrumb">
      <span class="breadcrumb-item">📋 Chronicle</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item active">Logs Pipelines & Publications</span>
    </div>

    <!-- Filtres avec regroupement par mots-clés -->
    <div class="filters-compact">
      <div class="filters-header-compact" @click="toggleFilters">
        <span class="filters-icon">🔍</span>
        <span class="filters-label">Filtres</span>
        <button class="collapse-btn" :class="{ 'collapsed': filtersCollapsed }">
          <span v-if="filtersCollapsed">▼</span>
          <span v-else>▲</span>
        </button>
      </div>
      <div class="filters-content-compact" :class="{ 'collapsed': filtersCollapsed }">
        <!-- Source de données -->
        <div class="filters-row">
          <div class="form-group-compact">
            <label class="form-label-compact">Source</label>
            <select 
              class="form-select-compact" 
              v-model="filters.dataSourceId"
              @change="handleFilterChange"
            >
              <option value="">Toutes les sources</option>
              <option v-for="source in dataSources" :key="source._id" :value="source._id">
                {{ source.name }}
              </option>
            </select>
          </div>

          <!-- Projet -->
          <div class="form-group-compact">
            <label class="form-label-compact">Projet</label>
            <select 
              class="form-select-compact" 
              v-model="filters.projectId"
              @change="handleFilterChange"
            >
              <option value="">Tous les projets</option>
              <option v-for="project in filteredProjects" :key="project._id" :value="project.projectId">
                {{ project.displayName || project.name }}
              </option>
            </select>
          </div>

          <!-- Pipeline -->
          <div class="form-group-compact">
            <label class="form-label-compact">Pipeline</label>
            <select 
              class="form-select-compact" 
              v-model="filters.pipelineId"
              @change="handleFilterChange"
            >
              <option value="">Tous les pipelines</option>
              <option v-for="pipeline in filteredPipelines" :key="pipeline._id" :value="pipeline.pipelineId">
                {{ pipeline.displayName || pipeline.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Regroupement par mots-clés -->
        <div class="filters-row">
          <div class="form-group-compact keywords-group">
            <label class="form-label-compact">Environnements / Mots-clés</label>
            <div class="keywords-tree">
              <div 
                v-for="keywordGroup in keywordGroups" 
                :key="keywordGroup.keyword"
                class="keyword-group"
              >
                <label class="keyword-parent">
                  <input 
                    type="checkbox" 
                    :checked="isKeywordGroupSelected(keywordGroup.keyword)"
                    @change="toggleKeywordGroup(keywordGroup.keyword)"
                  />
                  <span class="keyword-label">{{ keywordGroup.keyword }}</span>
                  <span class="keyword-count">({{ keywordGroup.items.length }})</span>
                </label>
                <div class="keyword-children">
                  <label 
                    v-for="item in keywordGroup.items" 
                    :key="item.id"
                    class="keyword-child"
                  >
                    <input 
                      type="checkbox" 
                      :value="item.id"
                      v-model="filters.keywords"
                      @change="handleFilterChange"
                    />
                    <span>{{ item.name }}</span>
                  </label>
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
              @change="handleFilterChange"
            />
          </div>
          <div class="form-group-compact">
            <label class="form-label-compact">Date fin</label>
            <input 
              type="date" 
              class="form-input-compact"
              v-model="filters.endDate"
              @change="handleFilterChange"
            />
          </div>
          <div class="form-group-compact">
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
    <div v-else-if="logs.length === 0" class="card">
      <p>Aucun log trouvé avec ces filtres.</p>
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
import { ref, computed, onMounted, watch } from 'vue';
import api from '../api/client.js';
import { format } from 'date-fns';

const filtersCollapsed = ref(false);
const loading = ref(false);
const error = ref('');
const logs = ref([]);
const dataSources = ref([]);
const projects = ref([]);
const pipelines = ref([]);
const keywordGroups = ref([]);

const filters = ref({
  dataSourceId: '',
  projectId: '',
  pipelineId: '',
  keywords: [],
  startDate: '',
  endDate: ''
});

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
});

const toggleFilters = () => {
  filtersCollapsed.value = !filtersCollapsed.value;
};

const filteredProjects = computed(() => {
  if (!filters.value.dataSourceId) return [];
  return projects.value.filter(p => p.dataSourceId === filters.value.dataSourceId);
});

const filteredPipelines = computed(() => {
  if (!filters.value.dataSourceId) return [];
  let filtered = pipelines.value.filter(p => p.dataSourceId === filters.value.dataSourceId);
  if (filters.value.projectId) {
    filtered = filtered.filter(p => p.projectId === filters.value.projectId);
  }
  return filtered;
});

const isKeywordGroupSelected = (keyword) => {
  const group = keywordGroups.value.find(kg => kg.keyword === keyword);
  if (!group) return false;
  return group.items.every(item => filters.value.keywords.includes(item.id));
};

const toggleKeywordGroup = (keyword) => {
  const group = keywordGroups.value.find(kg => kg.keyword === keyword);
  if (!group) return;
  
  const allSelected = group.items.every(item => filters.value.keywords.includes(item.id));
  
  if (allSelected) {
    // Décocher tous
    filters.value.keywords = filters.value.keywords.filter(
      id => !group.items.some(item => item.id === id)
    );
  } else {
    // Cocher tous
    const newKeywords = group.items.map(item => item.id);
    filters.value.keywords = [...new Set([...filters.value.keywords, ...newKeywords])];
  }
  
  handleFilterChange();
};

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
    console.error('Erreur lors du chargement des sources:', err);
  }
};

const fetchProjects = async () => {
  if (!filters.value.dataSourceId) {
    projects.value = [];
    return;
  }
  try {
    const response = await api.get(`/admin/data-sources/${filters.value.dataSourceId}/azure-devops/projects`);
    projects.value = response.data.filter(p => p.isVisible);
  } catch (err) {
    console.error('Erreur lors du chargement des projets:', err);
  }
};

const fetchPipelines = async () => {
  if (!filters.value.dataSourceId) {
    pipelines.value = [];
    return;
  }
  try {
    const params = filters.value.projectId ? { projectId: filters.value.projectId } : {};
    const response = await api.get(`/admin/data-sources/${filters.value.dataSourceId}/azure-devops/pipelines`, { params });
    pipelines.value = response.data.filter(p => p.isVisible);
  } catch (err) {
    console.error('Erreur lors du chargement des pipelines:', err);
  }
};

const fetchKeywordGroups = async () => {
  try {
    const params = filters.value.dataSourceId ? { dataSourceId: filters.value.dataSourceId } : {};
    const response = await api.get('/pipeline-logs/keywords', { params });
    keywordGroups.value = response.data;
    
    // Si aucun groupe n'existe, créer des groupes par défaut
    if (keywordGroups.value.length === 0) {
      keywordGroups.value = [
        {
          keyword: 'Preprod',
          items: []
        },
        {
          keyword: 'Staging',
          items: []
        },
        {
          keyword: 'Production',
          items: []
        }
      ];
    }
  } catch (err) {
    console.error('Erreur lors du chargement des groupes de mots-clés:', err);
    // Créer des groupes par défaut en cas d'erreur
    keywordGroups.value = [
      {
        keyword: 'Preprod',
        items: []
      },
      {
        keyword: 'Staging',
        items: []
      },
      {
        keyword: 'Production',
        items: []
      }
    ];
  }
};

const fetchLogs = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const params = {
      ...filters.value,
      keywords: filters.value.keywords.join(','),
      page: pagination.value.page,
      limit: pagination.value.limit
    };
    
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
    error.value = err.response?.data?.error || 'Erreur lors du chargement des logs';
    console.error('Erreur lors du chargement des logs:', err);
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = async () => {
  pagination.value.page = 1;
  await fetchLogs();
  await fetchPipelines();
};

const resetFilters = async () => {
  filters.value = {
    dataSourceId: '',
    projectId: '',
    pipelineId: '',
    keywords: [],
    startDate: '',
    endDate: ''
  };
  await handleFilterChange();
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

watch(() => filters.value.dataSourceId, async () => {
  await fetchProjects();
  await fetchPipelines();
  await fetchKeywordGroups();
  await handleFilterChange();
});

watch(() => filters.value.projectId, async () => {
  await fetchPipelines();
  await handleFilterChange();
});

onMounted(async () => {
  await fetchDataSources();
  await fetchKeywordGroups();
  await fetchLogs();
});
</script>

<style scoped>
.pipeline-logs-view {
  padding: 2rem;
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

.filters-content-compact.collapsed {
  display: none;
}

.filters-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.keywords-group {
  width: 100%;
}

.keywords-tree {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-color);
}

.keyword-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.keyword-parent {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  transition: background 0.2s ease;
}

.keyword-parent:hover {
  background: var(--surface-hover);
}

.keyword-label {
  flex: 1;
}

.keyword-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 400;
}

.keyword-children {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-left: 2rem;
  padding: 0.5rem;
  background: var(--surface);
  border-radius: var(--radius-sm);
}

.keyword-child {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: var(--background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.keyword-child:hover {
  border-color: var(--primary-color);
  background: var(--surface-hover);
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

.collapse-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  transition: color 0.2s ease;
}

.collapse-btn:hover {
  color: var(--text-primary);
}

.filters-icon {
  font-size: 1rem;
}

.filters-label {
  font-weight: 600;
  color: var(--text-primary);
}
</style>
