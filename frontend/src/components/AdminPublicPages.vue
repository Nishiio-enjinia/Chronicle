<template>
  <div class="admin-public-pages">
    <div class="section-header">
      <h3>🌐 Pages publiques</h3>
      <button class="btn btn-primary" @click="showAddModal = true">
        + Ajouter une page
      </button>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="pages.length === 0" class="empty-state">
      <p>Aucune page configurée</p>
    </div>
    <div v-else class="pages-list">
      <div v-for="page in pages" :key="page._id" class="page-card card">
        <div class="page-header">
          <div>
            <h4>{{ page.name }}</h4>
            <span class="page-path">{{ page.path }}</span>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" @click="editPage(page)">Modifier</button>
            <button class="btn btn-danger btn-sm" @click="deletePage(page._id)">Supprimer</button>
          </div>
        </div>
        <p class="page-description">{{ page.description || 'Aucune description' }}</p>
        <div class="page-settings">
          <div class="setting-item">
            <span class="setting-label">Accès public:</span>
            <span :class="['status-badge', page.isPublic ? 'active' : 'inactive']">
              {{ page.isPublic ? '✓ Oui' : '✗ Non' }}
            </span>
          </div>
          <div v-if="page.requiredRoles && page.requiredRoles.length > 0" class="setting-item">
            <span class="setting-label">Rôles requis:</span>
            <div class="roles-list">
              <span v-for="role in page.requiredRoles" :key="role" class="role-badge">
                {{ role }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Add/Edit -->
    <div v-if="showAddModal || editingPage" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingPage ? 'Modifier' : 'Ajouter' }} une page</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="savePage" class="modal-form">
          <div class="form-group">
            <label class="form-label">Nom *</label>
            <input type="text" class="form-input" v-model="pageForm.name" required />
          </div>
          <div class="form-group">
            <label class="form-label">Chemin (path) *</label>
            <input type="text" class="form-input" v-model="pageForm.path" required placeholder="/changelogs" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" v-model="pageForm.description"></textarea>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="pageForm.isPublic" />
              Page publique (accessible sans authentification)
            </label>
          </div>
          <div v-if="!pageForm.isPublic" class="form-group">
            <label class="form-label">Rôles requis</label>
            <div class="roles-select">
              <label class="checkbox-label">
                <input type="checkbox" value="admin" v-model="pageForm.requiredRoles" />
                Administrateur
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="user" v-model="pageForm.requiredRoles" />
                Utilisateur
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="guest" v-model="pageForm.requiredRoles" />
                Invité
              </label>
            </div>
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

const pages = ref([]);
const loading = ref(false);
const error = ref('');
const showAddModal = ref(false);
const editingPage = ref(null);
const saving = ref(false);

const pageForm = ref({
  name: '',
  path: '',
  description: '',
  isPublic: false,
  requiredRoles: []
});

const fetchPages = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/admin/public-pages');
    pages.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement';
  } finally {
    loading.value = false;
  }
};

const editPage = (page) => {
  editingPage.value = page;
  pageForm.value = {
    name: page.name,
    path: page.path,
    description: page.description || '',
    isPublic: page.isPublic || false,
    requiredRoles: page.requiredRoles || []
  };
  showAddModal.value = true;
};

const deletePage = async (id) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette page ?')) return;
  
  try {
    await api.delete(`/admin/public-pages/${id}`);
    await fetchPages();
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la suppression';
  }
};

const savePage = async () => {
  saving.value = true;
  try {
    const data = { ...pageForm.value };
    if (data.isPublic) {
      data.requiredRoles = [];
    }
    
    if (editingPage.value) {
      await api.put(`/admin/public-pages/${editingPage.value._id}`, data);
    } else {
      await api.post('/admin/public-pages', data);
    }
    closeModal();
    await fetchPages();
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de l\'enregistrement';
  } finally {
    saving.value = false;
  }
};

const closeModal = () => {
  showAddModal.value = false;
  editingPage.value = null;
  pageForm.value = {
    name: '',
    path: '',
    description: '',
    isPublic: false,
    requiredRoles: []
  };
};

onMounted(() => {
  fetchPages();
});
</script>

<style scoped>
.page-card {
  border-left: 4px solid var(--primary-color);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.page-header h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.page-path {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

.page-description {
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.page-settings {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.setting-label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 120px;
}

.roles-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.role-badge {
  padding: 0.25rem 0.5rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.roles-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
}
</style>

