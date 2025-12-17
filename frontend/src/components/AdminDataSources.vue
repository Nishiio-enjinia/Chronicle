<template>
  <div class="admin-data-sources">
    <div class="section-header">
      <h3>📊 Sources de données</h3>
      <button class="btn btn-primary" @click="showAddModal = true">
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
            <span class="source-type">{{ source.type }}</span>
          </div>
          <div class="source-actions">
            <button class="btn btn-secondary btn-sm" @click="editSource(source)">Modifier</button>
            <button class="btn btn-danger btn-sm" @click="deleteSource(source._id)">Supprimer</button>
          </div>
        </div>
        <p class="source-description">{{ source.description || 'Aucune description' }}</p>
        <div class="source-status">
          <span :class="['status-badge', source.isActive ? 'active' : 'inactive']">
            {{ source.isActive ? '✓ Actif' : '✗ Inactif' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Modal Add/Edit -->
    <div v-if="showAddModal || editingSource" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingSource ? 'Modifier' : 'Ajouter' }} une source</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="saveSource" class="modal-form">
          <div class="form-group">
            <label class="form-label">Nom *</label>
            <input type="text" class="form-input" v-model="sourceForm.name" required />
          </div>
          <div class="form-group">
            <label class="form-label">Type *</label>
            <select class="form-select" v-model="sourceForm.type" required>
              <option value="n8n">n8n</option>
              <option value="api">API</option>
              <option value="manual">Manuel</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" v-model="sourceForm.description"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">URL</label>
            <input type="text" class="form-input" v-model="sourceForm.config.url" />
          </div>
          <div class="form-group">
            <label class="form-label">Clé API</label>
            <input type="password" class="form-input" v-model="sourceForm.config.apiKey" />
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="sourceForm.isActive" />
              Actif
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/client.js';

const sources = ref([]);
const loading = ref(false);
const error = ref('');
const showAddModal = ref(false);
const editingSource = ref(null);
const saving = ref(false);

const sourceForm = ref({
  name: '',
  type: 'n8n',
  description: '',
  config: {
    url: '',
    apiKey: ''
  },
  isActive: true
});

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

const editSource = (source) => {
  editingSource.value = source;
  sourceForm.value = {
    name: source.name,
    type: source.type,
    description: source.description || '',
    config: {
      url: source.config?.url || '',
      apiKey: source.config?.apiKey || ''
    },
    isActive: source.isActive
  };
  showAddModal.value = true;
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

const saveSource = async () => {
  saving.value = true;
  try {
    if (editingSource.value) {
      await api.put(`/admin/data-sources/${editingSource.value._id}`, sourceForm.value);
    } else {
      await api.post('/admin/data-sources', sourceForm.value);
    }
    closeModal();
    await fetchSources();
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de l\'enregistrement';
  } finally {
    saving.value = false;
  }
};

const closeModal = () => {
  showAddModal.value = false;
  editingSource.value = null;
  sourceForm.value = {
    name: '',
    type: 'n8n',
    description: '',
    config: {
      url: '',
      apiKey: ''
    },
    isActive: true
  };
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
}

.source-description {
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.source-status {
  display: flex;
  align-items: center;
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

