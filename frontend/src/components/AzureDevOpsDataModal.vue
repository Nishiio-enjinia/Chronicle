<template>
  <div class="azure-devops-data-modal">
    <div class="modal-header">
      <div class="modal-header-content">
        <div class="modal-icon">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="4" fill="#0078D4"/>
            <path d="M24 12L12 18V30L24 36L36 30V18L24 12Z" fill="white"/>
            <path d="M24 16L16 20V28L24 32L32 28V20L24 16Z" fill="#0078D4"/>
          </svg>
        </div>
        <h3>Gérer les données Azure DevOps</h3>
        <p class="modal-subtitle">{{ sourceName }}</p>
      </div>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>

    <div class="modal-content">
      <!-- Tabs -->
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span class="tab-count">({{ getTabCount(tab.id) }})</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading">Chargement...</div>

      <!-- Error -->
      <div v-else-if="error" class="error-message">{{ error }}</div>

      <!-- Content -->
      <div v-else class="tab-content">
        <!-- Projets -->
        <div v-if="activeTab === 'projects'" class="data-list">
          <div class="list-header">
            <input 
              type="text" 
              class="search-input" 
              placeholder="Rechercher un projet..."
              v-model="searchProjects"
            />
            <button class="btn btn-primary btn-sm" @click="saveAll('projects')" :disabled="saving">
              {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
          <div class="data-items">
            <div 
              v-for="project in filteredProjects" 
              :key="project._id"
              class="data-item"
            >
              <div class="data-item-header">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="project.isVisible"
                    @change="markDirty('projects', project)"
                  />
                  <span>Visible</span>
                </label>
              </div>
              <div class="data-item-content">
                <div class="data-item-field">
                  <label>Nom original</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    :value="project.name"
                    disabled
                  />
                </div>
                <div class="data-item-field">
                  <label>Nom d'affichage</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    v-model="project.displayName"
                    @input="markDirty('projects', project)"
                    placeholder="Nom personnalisé (optionnel)"
                  />
                </div>
                <div class="data-item-field">
                  <label>Description</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    :value="project.description || 'Aucune description'"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pipelines -->
        <div v-if="activeTab === 'pipelines'" class="data-list">
          <div class="list-header">
            <input 
              type="text" 
              class="search-input" 
              placeholder="Rechercher un pipeline..."
              v-model="searchPipelines"
            />
            <select class="form-select" v-model="filterProjectPipeline" @change="loadPipelines">
              <option value="">Tous les projets</option>
              <option v-for="project in projects" :key="project._id" :value="project.projectId">
                {{ project.name }}
              </option>
            </select>
            <button class="btn btn-primary btn-sm" @click="saveAll('pipelines')" :disabled="saving">
              {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
          <div class="data-items">
            <div 
              v-for="pipeline in filteredPipelines" 
              :key="pipeline._id"
              class="data-item"
            >
              <div class="data-item-header">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="pipeline.isVisible"
                    @change="markDirty('pipelines', pipeline)"
                  />
                  <span>Visible</span>
                </label>
              </div>
              <div class="data-item-content">
                <div class="data-item-field">
                  <label>Projet</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    :value="pipeline.projectName"
                    disabled
                  />
                </div>
                <div class="data-item-field">
                  <label>Nom original</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    :value="pipeline.name"
                    disabled
                  />
                </div>
                <div class="data-item-field">
                  <label>Nom d'affichage</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    v-model="pipeline.displayName"
                    @input="markDirty('pipelines', pipeline)"
                    placeholder="Nom personnalisé (optionnel)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Repositories -->
        <div v-if="activeTab === 'repositories'" class="data-list">
          <div class="list-header">
            <input 
              type="text" 
              class="search-input" 
              placeholder="Rechercher un repository..."
              v-model="searchRepositories"
            />
            <select class="form-select" v-model="filterProjectRepository" @change="loadRepositories">
              <option value="">Tous les projets</option>
              <option v-for="project in projects" :key="project._id" :value="project.projectId">
                {{ project.name }}
              </option>
            </select>
            <button class="btn btn-primary btn-sm" @click="saveAll('repositories')" :disabled="saving">
              {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
          <div class="data-items">
            <div 
              v-for="repo in filteredRepositories" 
              :key="repo._id"
              class="data-item"
            >
              <div class="data-item-header">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="repo.isVisible"
                    @change="markDirty('repositories', repo)"
                  />
                  <span>Visible</span>
                </label>
              </div>
              <div class="data-item-content">
                <div class="data-item-field">
                  <label>Projet</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    :value="repo.projectName"
                    disabled
                  />
                </div>
                <div class="data-item-field">
                  <label>Nom original</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    :value="repo.name"
                    disabled
                  />
                </div>
                <div class="data-item-field">
                  <label>Nom d'affichage</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    v-model="repo.displayName"
                    @input="markDirty('repositories', repo)"
                    placeholder="Nom personnalisé (optionnel)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Utilisateurs -->
        <div v-if="activeTab === 'users'" class="data-list">
          <div class="list-header">
            <input 
              type="text" 
              class="search-input" 
              placeholder="Rechercher un utilisateur..."
              v-model="searchUsers"
            />
            <button class="btn btn-primary btn-sm" @click="saveAll('users')" :disabled="saving">
              {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
          <div class="data-items">
            <div 
              v-for="user in filteredUsers" 
              :key="user._id"
              class="data-item"
            >
              <div class="data-item-header">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="user.isVisible"
                    @change="markDirty('users', user)"
                  />
                  <span>Visible</span>
                </label>
              </div>
              <div class="data-item-content">
                <div class="data-item-field">
                  <label>Nom original</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    :value="user.displayName"
                    disabled
                  />
                </div>
                <div class="data-item-field">
                  <label>Email</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    :value="user.email || 'N/A'"
                    disabled
                  />
                </div>
                <div class="data-item-field">
                  <label>Nom d'affichage personnalisé</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    v-model="user.customDisplayName"
                    @input="markDirty('users', user)"
                    placeholder="Nom personnalisé (optionnel)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api/client.js';

const props = defineProps({
  sourceId: {
    type: String,
    required: true
  },
  sourceName: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close']);

const tabs = [
  { id: 'projects', label: 'Projets' },
  { id: 'pipelines', label: 'Pipelines' },
  { id: 'repositories', label: 'Repositories' },
  { id: 'users', label: 'Utilisateurs' }
];

const activeTab = ref('projects');
const loading = ref(false);
const saving = ref(false);
const error = ref('');

const projects = ref([]);
const pipelines = ref([]);
const repositories = ref([]);
const users = ref([]);

const searchProjects = ref('');
const searchPipelines = ref('');
const searchRepositories = ref('');
const searchUsers = ref('');

const filterProjectPipeline = ref('');
const filterProjectRepository = ref('');

const dirtyItems = {
  projects: new Set(),
  pipelines: new Set(),
  repositories: new Set(),
  users: new Set()
};

const filteredProjects = computed(() => {
  if (!searchProjects.value) return projects.value;
  const search = searchProjects.value.toLowerCase();
  return projects.value.filter(p => 
    p.name.toLowerCase().includes(search) ||
    (p.displayName && p.displayName.toLowerCase().includes(search))
  );
});

const filteredPipelines = computed(() => {
  let filtered = pipelines.value;
  if (searchPipelines.value) {
    const search = searchPipelines.value.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search) ||
      (p.displayName && p.displayName.toLowerCase().includes(search))
    );
  }
  return filtered;
});

const filteredRepositories = computed(() => {
  let filtered = repositories.value;
  if (searchRepositories.value) {
    const search = searchRepositories.value.toLowerCase();
    filtered = filtered.filter(r => 
      r.name.toLowerCase().includes(search) ||
      (r.displayName && r.displayName.toLowerCase().includes(search))
    );
  }
  return filtered;
});

const filteredUsers = computed(() => {
  if (!searchUsers.value) return users.value;
  const search = searchUsers.value.toLowerCase();
  return users.value.filter(u => 
    u.displayName.toLowerCase().includes(search) ||
    (u.email && u.email.toLowerCase().includes(search)) ||
    (u.customDisplayName && u.customDisplayName.toLowerCase().includes(search))
  );
});

const getTabCount = (tabId) => {
  switch(tabId) {
    case 'projects': return projects.value.length;
    case 'pipelines': return pipelines.value.length;
    case 'repositories': return repositories.value.length;
    case 'users': return users.value.length;
    default: return 0;
  }
};

const markDirty = (type, item) => {
  dirtyItems[type].add(item._id);
};

const loadProjects = async () => {
  try {
    const response = await api.get(`/admin/data-sources/${props.sourceId}/azure-devops/projects`);
    projects.value = response.data.map(p => ({
      ...p,
      displayName: p.displayName || p.name
    }));
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement des projets';
  }
};

const loadPipelines = async () => {
  try {
    const params = filterProjectPipeline.value ? { projectId: filterProjectPipeline.value } : {};
    const response = await api.get(`/admin/data-sources/${props.sourceId}/azure-devops/pipelines`, { params });
    pipelines.value = response.data.map(p => ({
      ...p,
      displayName: p.displayName || p.name
    }));
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement des pipelines';
  }
};

const loadRepositories = async () => {
  try {
    const params = filterProjectRepository.value ? { projectId: filterProjectRepository.value } : {};
    const response = await api.get(`/admin/data-sources/${props.sourceId}/azure-devops/repositories`, { params });
    repositories.value = response.data.map(r => ({
      ...r,
      displayName: r.displayName || r.name
    }));
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement des repositories';
  }
};

const loadUsers = async () => {
  try {
    const response = await api.get(`/admin/data-sources/${props.sourceId}/azure-devops/users`);
    users.value = response.data.map(u => ({
      ...u,
      customDisplayName: u.customDisplayName || u.displayName
    }));
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement des utilisateurs';
  }
};

const saveAll = async (type) => {
  saving.value = true;
  error.value = '';
  
  try {
    const itemsToUpdate = [];
    const dirtySet = dirtyItems[type];
    
    let items;
    switch(type) {
      case 'projects': items = projects.value; break;
      case 'pipelines': items = pipelines.value; break;
      case 'repositories': items = repositories.value; break;
      case 'users': items = users.value; break;
    }
    
    for (const itemId of dirtySet) {
      const item = items.find(i => i._id === itemId);
      if (item) {
        itemsToUpdate.push({
          _id: item._id,
          displayName: type === 'users' ? item.customDisplayName : item.displayName,
          isVisible: item.isVisible
        });
      }
    }
    
    if (itemsToUpdate.length === 0) {
      saving.value = false;
      return;
    }
    
    // TODO: Créer une route pour mettre à jour en batch
    // Pour l'instant, on met à jour un par un
    for (const update of itemsToUpdate) {
      await api.put(`/admin/data-sources/${props.sourceId}/azure-devops/${type}/${update._id}`, {
        displayName: update.displayName,
        isVisible: update.isVisible
      });
    }
    
    dirtyItems[type].clear();
    alert(`✅ ${itemsToUpdate.length} élément(s) mis à jour avec succès`);
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la sauvegarde';
    alert(`❌ Erreur: ${error.value}`);
  } finally {
    saving.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    await Promise.all([
      loadProjects(),
      loadPipelines(),
      loadRepositories(),
      loadUsers()
    ]);
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement des données';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.azure-devops-data-modal {
  background: var(--surface);
  border-radius: var(--radius-lg);
  max-width: 1200px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-icon {
  width: 32px;
  height: 32px;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--background);
  color: var(--text-primary);
}

.modal-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-bottom: 2px solid var(--border-color);
  overflow-x: auto;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: var(--background);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  border-color: var(--primary-color);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.tab-count {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.8;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--background);
  color: var(--text-primary);
}

.data-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.data-item {
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 1rem;
  background: var(--background);
}

.data-item-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-light);
}

.data-item-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.data-item-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.data-item-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.loading, .error-message {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.error-message {
  color: var(--danger-color);
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--danger-color);
}
</style>
