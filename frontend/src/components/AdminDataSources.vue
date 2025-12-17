<template>
  <div class="admin-data-sources">
    <div class="section-header">
      <h3>📊 Sources de données</h3>
      <button class="btn btn-primary" @click="showTypeSelector = true">
        + Ajouter une source
      </button>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="sources.length === 0" class="empty-state">
      <p>Aucune source de données configurée</p>
    </div>
    <div v-else class="sources-list">
      <div v-for="source in sources" :key="source._id" class="source-card card">
        <div class="source-header">
          <div>
            <h4>{{ source.name }}</h4>
            <span class="source-type">{{ getSourceTypeLabel(source.type) }}</span>
          </div>
          <div class="source-actions">
            <button 
              v-if="source.type === 'azure-devops' && source.initialCrawlCompleted" 
              class="btn btn-primary btn-sm" 
              @click="openDataModal(source)"
            >
              📊 Gérer les données
            </button>
            <button 
              v-if="source.type === 'azure-devops'" 
              class="btn btn-info btn-sm" 
              @click="runInitialCrawl(source._id)"
              :disabled="crawlingInitial === source._id"
            >
              {{ crawlingInitial === source._id ? '⏳ Crawl...' : '🔄 Crawl initial' }}
            </button>
            <button 
              v-if="source.type === 'azure-devops' && source.isActive && source.initialCrawlCompleted" 
              class="btn btn-success btn-sm" 
              @click="runManualCrawl(source._id)"
              :disabled="crawlingManual === source._id"
            >
              {{ crawlingManual === source._id ? '⏳ Crawl...' : '▶️ Crawl manuel' }}
            </button>
            <button class="btn btn-secondary btn-sm" @click="editSource(source)">Modifier</button>
            <button class="btn btn-danger btn-sm" @click="deleteSource(source._id)">Supprimer</button>
          </div>
        </div>
        <p class="source-description">{{ source.description || 'Aucune description' }}</p>
        <div class="source-info">
          <div class="source-status">
            <span :class="['status-badge', source.isActive ? 'active' : 'inactive']">
              {{ source.isActive ? '✓ Actif' : '✗ Inactif' }}
            </span>
          </div>
          <div v-if="source.type === 'azure-devops'" class="schedule-info">
            <div v-if="!source.initialCrawlCompleted" class="initial-crawl-warning">
              <small style="color: var(--warning-color, #f59e0b);">
                ⚠️ Crawl initial non effectué - Les crawls automatiques sont désactivés
              </small>
            </div>
            <div v-else-if="source.schedule" class="schedule-status">
              <small>
                ✅ Crawl initial effectué le {{ formatDate(source.initialCrawlCompletedAt) }}<br>
                Crawl automatique: {{ formatSchedule(source.schedule) }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Type Selector -->
    <div v-if="showTypeSelector" class="modal-overlay" @click.self="closeTypeSelector">
      <DataSourceTypeSelector 
        @select="handleTypeSelect"
        @close="closeTypeSelector"
      />
    </div>

    <!-- Modal Azure DevOps Form -->
    <div v-if="showAzureDevOpsForm" class="modal-overlay" @click.self="closeAzureDevOpsForm">
      <AzureDevOpsForm 
        :source="editingSource"
        @submit="handleAzureDevOpsSubmit"
        @close="closeAzureDevOpsForm"
      />
    </div>

    <!-- Modal Custom Form -->
    <div v-if="showCustomForm" class="modal-overlay" @click.self="closeCustomForm">
      <CustomDataSourceForm 
        :source="editingSource"
        @submit="handleCustomSubmit"
        @close="closeCustomForm"
      />
    </div>

    <!-- Modal Azure DevOps Data -->
    <div v-if="showDataModal" class="modal-overlay" @click.self="closeDataModal">
      <AzureDevOpsDataModal 
        :sourceId="selectedSource?._id"
        :sourceName="selectedSource?.name"
        @close="closeDataModal"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/client.js';
import DataSourceTypeSelector from './DataSourceTypeSelector.vue';
import AzureDevOpsForm from './AzureDevOpsForm.vue';
import CustomDataSourceForm from './CustomDataSourceForm.vue';
import AzureDevOpsDataModal from './AzureDevOpsDataModal.vue';

const sources = ref([]);
const loading = ref(false);
const error = ref('');
const showTypeSelector = ref(false);
const showAzureDevOpsForm = ref(false);
const showCustomForm = ref(false);
const showDataModal = ref(false);
const editingSource = ref(null);
const selectedSource = ref(null);
const crawlingInitial = ref(null);
const crawlingManual = ref(null);
const crawlResult = ref(null);

const fetchSources = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/admin/data-sources');
    sources.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement';
  } finally {
    loading.value = false;
  }
};

const getSourceTypeLabel = (type) => {
  const labels = {
    'azure-devops': 'Azure DevOps',
    'n8n': 'n8n',
    'api': 'API',
    'manual': 'Manuel',
    'webhook': 'Webhook'
  };
  return labels[type] || type;
};

const formatSchedule = (schedule) => {
  if (!schedule || !schedule.days || !schedule.hours) return 'Non configuré';
  
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const days = schedule.days.map(d => dayNames[d]).join(', ');
  const hours = schedule.hours.map(h => `${String(h).padStart(2, '0')}:00`).join(', ');
  
  return `${days} à ${hours}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date inconnue';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleTypeSelect = (type) => {
  showTypeSelector.value = false;
  editingSource.value = null;
  
  if (type === 'azure-devops') {
    showAzureDevOpsForm.value = true;
  } else {
    showCustomForm.value = true;
  }
};

const editSource = (source) => {
  editingSource.value = source;
  
  if (source.type === 'azure-devops') {
    showAzureDevOpsForm.value = true;
  } else {
    showCustomForm.value = true;
  }
};

const handleAzureDevOpsSubmit = async (formData) => {
  try {
    if (editingSource.value) {
      await api.put(`/admin/data-sources/${editingSource.value._id}`, formData);
    } else {
      await api.post('/admin/data-sources', formData);
    }
    closeAzureDevOpsForm();
    await fetchSources();
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de l\'enregistrement';
    throw err;
  }
};

const handleCustomSubmit = async (formData) => {
  try {
    if (editingSource.value) {
      await api.put(`/admin/data-sources/${editingSource.value._id}`, formData);
    } else {
      await api.post('/admin/data-sources', formData);
    }
    closeCustomForm();
    await fetchSources();
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de l\'enregistrement';
    throw err;
  }
};

const deleteSource = async (id) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette source ?')) return;
  
  try {
    await api.delete(`/admin/data-sources/${id}`);
    await fetchSources();
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la suppression';
  }
};

const closeTypeSelector = () => {
  showTypeSelector.value = false;
};

const closeAzureDevOpsForm = () => {
  showAzureDevOpsForm.value = false;
  editingSource.value = null;
};

const closeCustomForm = () => {
  showCustomForm.value = false;
  editingSource.value = null;
};

const openDataModal = (source) => {
  selectedSource.value = source;
  showDataModal.value = true;
};

const closeDataModal = () => {
  showDataModal.value = false;
  selectedSource.value = null;
};

const runInitialCrawl = async (sourceId) => {
  if (!confirm('Voulez-vous exécuter le crawl initial ? Cela va découvrir tous les projets, pipelines, repositories et utilisateurs, et les sauvegarder pour remplir les filtres. Les crawls automatiques seront ensuite activés.')) {
    return;
  }
  
  crawlingInitial.value = sourceId;
  crawlResult.value = null;
  error.value = '';
  
  try {
    const response = await api.post(`/admin/data-sources/${sourceId}/crawl/initial`);
    crawlResult.value = response.data;
    const data = response.data.data || {};
    alert(`✅ Crawl initial réussi !\n\n- ${data.projects?.length || 0} projets sauvegardés\n- ${data.pipelines?.length || 0} pipelines sauvegardés\n- ${data.repositories?.length || 0} repositories sauvegardés\n- ${data.users?.length || 0} utilisateurs sauvegardés\n\n✅ Les données sont maintenant disponibles pour les filtres.\n✅ Les crawls automatiques sont maintenant activés.`);
    // Rafraîchir la liste pour afficher le statut mis à jour
    await fetchSources();
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du crawl initial';
    alert(`❌ Erreur: ${error.value}`);
  } finally {
    crawlingInitial.value = null;
  }
};

const runManualCrawl = async (sourceId) => {
  if (!confirm('Voulez-vous exécuter un crawl manuel maintenant ?')) {
    return;
  }
  
  crawlingManual.value = sourceId;
  crawlResult.value = null;
  error.value = '';
  
  try {
    const response = await api.post(`/admin/data-sources/${sourceId}/crawl/manual`);
    crawlResult.value = response.data;
    alert(`✅ Crawl manuel réussi !\n\n- ${response.data.data?.pipelines?.length || 0} pipelines mis à jour\n- ${response.data.data?.repositories?.length || 0} repositories mis à jour`);
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du crawl manuel';
    alert(`❌ Erreur: ${error.value}`);
  } finally {
    crawlingManual.value = null;
  }
};

onMounted(() => {
  fetchSources();
});
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.source-card {
  border-left: 4px solid var(--primary-color);
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.source-header h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.source-type {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.source-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-info {
  background: var(--info-color, #3b82f6);
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: var(--info-color-dark, #2563eb);
}

.btn-success {
  background: var(--success-color, #10b981);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: var(--success-color-dark, #059669);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.source-description {
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.source-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.source-status {
  display: flex;
  align-items: center;
}

.schedule-info {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success-color);
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger-color);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--surface);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-form {
  padding: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}
</style>

