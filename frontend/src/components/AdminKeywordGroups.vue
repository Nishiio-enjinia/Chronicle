<template>
  <div class="admin-keyword-groups">
    <div class="section-header">
      <h3>🔍 Configuration des Filtres</h3>
      <div class="header-actions">
        <select 
          v-model="selectedDataSourceId" 
          class="form-select"
          @change="onDataSourceChange"
        >
          <option value="">Toutes les sources</option>
          <option v-for="source in dataSources" :key="source._id" :value="source._id">
            {{ source.name }}
          </option>
        </select>
        <button 
          class="btn btn-primary" 
          @click="runAIAnalysis"
          :disabled="analyzing || !selectedDataSourceId"
        >
          {{ analyzing ? '🤖 Analyse en cours...' : '🤖 Analyser avec IA' }}
        </button>
        <button 
          class="btn btn-danger" 
          @click="showResetModal = true"
          :disabled="keywordGroups.length === 0 || resetting"
        >
          {{ resetting ? '⏳ Réinitialisation...' : '🗑️ Réinitialiser' }}
        </button>
      </div>
    </div>

    <div v-if="analyzing" class="analysis-status">
      <div class="loading-spinner"></div>
      <p>Analyse des logs en cours... Cette opération peut prendre quelques instants.</p>
    </div>

    <div v-if="analysisResult" class="analysis-result card">
      <div class="result-header">
        <h4>📊 Résultats de l'analyse IA</h4>
        <button class="btn btn-sm btn-secondary" @click="analysisResult = null">Fermer</button>
      </div>
      <div class="result-content">
        <p><strong>{{ analysisResult.keywordsFound }} mots-clés détectés</strong></p>
        <div class="detected-keywords">
          <div 
            v-for="keyword in analysisResult.keywords" 
            :key="keyword.keyword"
            class="keyword-item"
          >
            <span class="keyword-name">{{ keyword.keyword }}</span>
            <span class="keyword-count">{{ keyword.items.length }} items</span>
            <button 
              class="btn btn-sm btn-primary" 
              @click="applyKeywordGroup(keyword)"
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="keywordGroups.length === 0" class="empty-state">
      <p>Aucun groupe de mots-clés configuré</p>
      <p class="empty-hint">Utilisez l'analyse IA pour détecter automatiquement les environnements et mots-clés dans vos logs.</p>
    </div>
    <div v-else class="keyword-groups-list">
      <div v-for="group in keywordGroups" :key="group._id || group.keyword" class="keyword-group-card card">
        <div class="group-header">
          <div class="group-info">
            <h4>{{ group.displayName || group.keyword }}</h4>
            <span class="group-meta">
              {{ group.items.length }} item{{ group.items.length > 1 ? 's' : '' }} • 
              Source: {{ getDataSourceName(group.dataSourceId) }}
            </span>
          </div>
          <div class="group-actions">
            <label class="visibility-toggle">
              <input 
                type="checkbox" 
                :checked="group.isVisible !== false"
                @change="toggleVisibility(group)"
              />
              <span>{{ group.isVisible !== false ? '👁️ Visible' : '🙈 Masqué' }}</span>
            </label>
            <button class="btn btn-secondary btn-sm" @click="editGroup(group)">Modifier</button>
            <button class="btn btn-danger btn-sm" @click="deleteGroup(group._id)">Supprimer</button>
          </div>
        </div>
        <div class="group-items">
          <div 
            v-for="item in group.items" 
            :key="item.id"
            class="item-badge"
          >
            {{ item.name }}
            <span class="item-type">{{ item.type }}</span>
          </div>
          <div v-if="group.items.length === 0" class="no-items">
            Aucun item associé
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Reset -->
    <div v-if="showResetModal" class="modal-overlay" @click.self="showResetModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🗑️ Réinitialiser les groupes de mots-clés</h3>
          <button class="close-btn" @click="showResetModal = false">×</button>
        </div>
        <div class="modal-form">
          <div class="form-group">
            <label class="form-label">Portée de la réinitialisation</label>
            <div class="radio-group">
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="resetScope" 
                  value="selected"
                  :disabled="!selectedDataSourceId"
                />
                <div class="radio-content">
                  <strong>Source sélectionnée uniquement</strong>
                  <small v-if="selectedDataSourceId">
                    {{ getDataSourceName(selectedDataSourceId) }}
                  </small>
                  <small v-else class="text-muted">Aucune source sélectionnée</small>
                </div>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="resetScope" 
                  value="all"
                />
                <div class="radio-content">
                  <strong>Toutes les sources de données</strong>
                  <small>{{ keywordGroups.length }} groupe(s) seront supprimés</small>
                </div>
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showResetModal = false">Annuler</button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="confirmReset"
              :disabled="resetScope === 'selected' && !selectedDataSourceId || resetting"
            >
              {{ resetting ? 'Réinitialisation...' : 'Confirmer la réinitialisation' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Add/Edit -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingGroup ? 'Modifier' : 'Créer' }} un groupe de mots-clés</h3>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>
        <form @submit.prevent="saveGroup" class="modal-form">
          <div class="form-group">
            <label class="form-label">Source de données</label>
            <select 
              v-model="formData.dataSourceId" 
              class="form-select"
              required
            >
              <option value="">Sélectionner une source</option>
              <option v-for="source in dataSources" :key="source._id" :value="source._id">
                {{ source.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Mot-clé / Environnement</label>
            <input 
              type="text" 
              v-model="formData.keyword" 
              class="form-input"
              placeholder="ex: Production, Preprod, Staging"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label">Nom d'affichage (optionnel)</label>
            <input 
              type="text" 
              v-model="formData.displayName" 
              class="form-input"
              placeholder="Nom personnalisé pour l'affichage"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Items associés (IDs séparés par des virgules)</label>
            <textarea 
              v-model="itemsText" 
              class="form-input"
              rows="4"
              placeholder="ID1, ID2, ID3..."
            />
            <small class="form-hint">Entrez les IDs des pipelines/builds à associer à ce mot-clé</small>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="closeEditModal">Annuler</button>
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
import { ref, computed, onMounted } from 'vue';
import api from '../api/client.js';
import { useNotifications } from '../stores/notifications.js';

const loading = ref(false);
const error = ref('');
const keywordGroups = ref([]);
const dataSources = ref([]);
const selectedDataSourceId = ref('');
const analyzing = ref(false);
const analysisResult = ref(null);
const showEditModal = ref(false);
const editingGroup = ref(null);
const saving = ref(false);
const resetting = ref(false);
const showResetModal = ref(false);
const resetScope = ref('selected');

const { notify, confirmAction, addTask, updateTask, removeTask } = useNotifications();

const formData = ref({
  dataSourceId: '',
  keyword: '',
  displayName: '',
  items: []
});

const itemsText = ref('');

const getDataSourceName = (dataSourceId) => {
  const source = dataSources.value.find(s => s._id === dataSourceId);
  return source ? source.name : 'Inconnue';
};

const fetchDataSources = async () => {
  try {
    const response = await api.get('/admin/data-sources');
    dataSources.value = response.data;
    // Ne pas sélectionner automatiquement, laisser l'utilisateur choisir
  } catch (err) {
    console.error('Erreur lors du chargement des sources:', err);
  }
};

const fetchKeywordGroups = async () => {
  loading.value = true;
  error.value = '';
  try {
    const params = selectedDataSourceId.value ? { dataSourceId: selectedDataSourceId.value } : {};
    const response = await api.get('/admin/keyword-groups', { params });
    keywordGroups.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement des groupes';
    console.error('Erreur:', err);
  } finally {
    loading.value = false;
  }
};

const onDataSourceChange = () => {
  fetchKeywordGroups();
};

const runAIAnalysis = async () => {
  if (!selectedDataSourceId.value) {
    notify.warning('Source requise', 'Veuillez sélectionner une source de données');
    return;
  }

  analyzing.value = true;
  analysisResult.value = null;
  error.value = '';

  const taskId = addTask({ label: 'Analyse IA en cours...', progress: 0 });

  try {
    updateTask(taskId, { progress: 30 });
    const response = await api.post(`/admin/keyword-groups/analyze`, {
      dataSourceId: selectedDataSourceId.value
    });
    analysisResult.value = response.data;
    
    updateTask(taskId, { progress: 100 });
    setTimeout(() => removeTask(taskId), 500);
    
    notify.success(
      'Analyse terminée',
      `${response.data.keywordsFound} mots-clés détectés dans ${response.data.logsAnalyzed} logs analysés.`
    );
  } catch (err) {
    removeTask(taskId);
    error.value = err.response?.data?.error || 'Erreur lors de l\'analyse';
    notify.error('Erreur lors de l\'analyse', error.value);
  } finally {
    analyzing.value = false;
  }
};

const applyKeywordGroup = async (keyword) => {
  const taskId = addTask({ label: `Création du groupe "${keyword.keyword}"...` });
  try {
    await api.post('/admin/keyword-groups', {
      dataSourceId: selectedDataSourceId.value,
      keyword: keyword.keyword,
      items: keyword.items
    });
    await fetchKeywordGroups();
    analysisResult.value = null;
    removeTask(taskId);
    notify.success('Groupe créé', `Le groupe de mots-clés "${keyword.keyword}" a été créé avec succès.`);
  } catch (err) {
    removeTask(taskId);
    error.value = err.response?.data?.error || 'Erreur lors de la création';
    notify.error('Erreur', error.value);
  }
};

const toggleVisibility = async (group) => {
  try {
    await api.put(`/admin/keyword-groups/${group._id}`, {
      isVisible: !group.isVisible
    });
    await fetchKeywordGroups();
    notify.info(
      'Visibilité mise à jour',
      `Le groupe "${group.keyword}" est maintenant ${!group.isVisible ? 'visible' : 'masqué'}.`
    );
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la mise à jour';
    notify.error('Erreur', error.value);
  }
};

const editGroup = (group) => {
  editingGroup.value = group;
  formData.value = {
    dataSourceId: group.dataSourceId,
    keyword: group.keyword,
    displayName: group.displayName || '',
    items: group.items || []
  };
  itemsText.value = group.items.map(item => item.id).join(', ');
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingGroup.value = null;
  formData.value = {
    dataSourceId: selectedDataSourceId.value || '',
    keyword: '',
    displayName: '',
    items: []
  };
  itemsText.value = '';
};

const saveGroup = async () => {
  saving.value = true;
  const taskId = addTask({ label: editingGroup.value ? 'Modification du groupe...' : 'Création du groupe...' });
  try {
    // Parser les items depuis le texte
    const itemIds = itemsText.value
      .split(',')
      .map(id => id.trim())
      .filter(id => id);

    // Pour chaque ID, on doit récupérer le nom depuis les pipelines
    // Pour l'instant, on crée des items basiques
    const items = itemIds.map(id => ({
      id: id,
      name: id, // On pourrait améliorer en récupérant le vrai nom
      type: 'pipeline'
    }));

    const payload = {
      ...formData.value,
      items: items
    };

    if (editingGroup.value) {
      await api.put(`/admin/keyword-groups/${editingGroup.value._id}`, payload);
    } else {
      await api.post('/admin/keyword-groups', payload);
    }

    removeTask(taskId);
    closeEditModal();
    await fetchKeywordGroups();
    notify.success(
      editingGroup.value ? 'Groupe modifié' : 'Groupe créé',
      `Le groupe de mots-clés a été ${editingGroup.value ? 'modifié' : 'créé'} avec succès.`
    );
  } catch (err) {
    removeTask(taskId);
    error.value = err.response?.data?.error || 'Erreur lors de l\'enregistrement';
    notify.error('Erreur', error.value);
  } finally {
    saving.value = false;
  }
};

const deleteGroup = async (id) => {
  const confirmed = await confirmAction('Êtes-vous sûr de vouloir supprimer ce groupe de mots-clés ?', 'Supprimer le groupe');
  if (!confirmed) return;
  
  const taskId = addTask({ label: 'Suppression du groupe...' });
  try {
    await api.delete(`/admin/keyword-groups/${id}`);
    removeTask(taskId);
    await fetchKeywordGroups();
    notify.success('Groupe supprimé', 'Le groupe de mots-clés a été supprimé avec succès.');
  } catch (err) {
    removeTask(taskId);
    error.value = err.response?.data?.error || 'Erreur lors de la suppression';
    notify.error('Erreur', error.value);
  }
};

const confirmReset = async () => {
  if (resetScope.value === 'selected' && !selectedDataSourceId.value) {
    notify.warning('Source requise', 'Veuillez sélectionner une source de données');
    return;
  }
  
  let confirmMessage = '';
  let groupsToDelete = [];
  
  if (resetScope.value === 'selected') {
    const sourceName = dataSources.value.find(s => s._id === selectedDataSourceId.value)?.name || 'cette source';
    groupsToDelete = keywordGroups.value.filter(g => g.dataSourceId === selectedDataSourceId.value);
    confirmMessage = `Êtes-vous sûr de vouloir supprimer TOUS les groupes de mots-clés pour "${sourceName}" ?\n\n${groupsToDelete.length} groupe(s) seront supprimés.\n\nCette action est irréversible.`;
  } else {
    groupsToDelete = keywordGroups.value;
    confirmMessage = `Êtes-vous sûr de vouloir supprimer TOUS les groupes de mots-clés de TOUTES les sources de données ?\n\n${groupsToDelete.length} groupe(s) seront supprimés.\n\nCette action est irréversible.`;
  }
  
  if (groupsToDelete.length === 0) {
    notify.info('Aucun groupe', 'Aucun groupe à supprimer');
    showResetModal.value = false;
    return;
  }
  
  const confirmed = await confirmAction(confirmMessage, 'Réinitialiser les groupes');
  if (!confirmed) {
    showResetModal.value = false;
    return;
  }
  
  resetting.value = true;
  error.value = '';
  showResetModal.value = false;
  
  const taskId = addTask({ label: `Suppression de ${groupsToDelete.length} groupe(s)...`, progress: 0 });
  
  try {
    updateTask(taskId, { progress: 50 });
    // Supprimer tous les groupes en parallèle
    await Promise.all(
      groupsToDelete.map(group => api.delete(`/admin/keyword-groups/${group._id}`))
    );
    
    // Réinitialiser aussi les résultats de l'analyse
    analysisResult.value = null;
    
    // Recharger la liste
    await fetchKeywordGroups();
    
    updateTask(taskId, { progress: 100 });
    setTimeout(() => removeTask(taskId), 500);
    
    notify.success('Réinitialisation réussie', `${groupsToDelete.length} groupe(s) de mots-clés supprimé(s) avec succès.`);
  } catch (err) {
    removeTask(taskId);
    error.value = err.response?.data?.error || 'Erreur lors de la réinitialisation';
    notify.error('Erreur', error.value);
  } finally {
    resetting.value = false;
  }
};

onMounted(async () => {
  await fetchDataSources();
  await fetchKeywordGroups();
});
</script>

<style scoped>
.admin-keyword-groups {
  min-height: 400px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.form-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.analysis-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: var(--background);
  border-radius: var(--radius-lg);
  margin-bottom: 1.5rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.analysis-result {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.detected-keywords {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.keyword-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
}

.keyword-name {
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.keyword-count {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.keyword-groups-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.keyword-group-card {
  border-left: 4px solid var(--primary-color);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.group-info h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.group-meta {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.group-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.visibility-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.group-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.item-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--text-primary);
}

.item-type {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--surface);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-xs);
}

.no-items {
  color: var(--text-muted);
  font-style: italic;
  font-size: 0.875rem;
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
  border: 1px solid var(--border-color);
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

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--background);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.empty-hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.radio-option:hover {
  border-color: var(--primary-color);
  background: var(--background);
}

.radio-option input[type="radio"] {
  margin-top: 0.25rem;
  cursor: pointer;
}

.radio-option input[type="radio"]:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.radio-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.radio-content strong {
  color: var(--text-primary);
  font-weight: 600;
}

.radio-content small {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.text-muted {
  color: var(--text-muted);
  font-style: italic;
}
</style>

