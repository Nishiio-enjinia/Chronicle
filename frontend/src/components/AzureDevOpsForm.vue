<template>
  <div class="azure-devops-form">
    <div class="form-header">
      <div class="form-header-content">
        <div class="form-icon">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="4" fill="#0078D4"/>
            <path d="M24 12L12 18V30L24 36L36 30V18L24 12Z" fill="white"/>
            <path d="M24 16L16 20V28L24 32L32 28V20L24 16Z" fill="#0078D4"/>
          </svg>
        </div>
        <h3>{{ editing ? 'Modifier' : 'Configurer' }} Azure DevOps</h3>
      </div>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>

    <form @submit.prevent="handleSubmit" class="form-content">
      <!-- Informations de base -->
      <div class="form-section">
        <h4 class="section-title">Informations de base</h4>
        <div class="form-group">
          <label class="form-label">Nom de la source *</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="form.name" 
            placeholder="Ex: Azure DevOps Production"
            required 
          />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea 
            class="form-textarea" 
            v-model="form.description"
            placeholder="Description de cette source de données"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- Connexion Azure DevOps -->
      <div class="form-section">
        <h4 class="section-title">Connexion Azure DevOps</h4>
        <div class="form-group">
          <label class="form-label">URL de l'organisation *</label>
          <input 
            type="url" 
            class="form-input" 
            v-model="form.config.organizationUrl" 
            placeholder="https://dev.azure.com/votre-organisation"
            required 
          />
          <small class="form-hint">L'URL complète de votre organisation Azure DevOps</small>
        </div>
        <div class="form-group">
          <label class="form-label">Personal Access Token (PAT) *</label>
          <input 
            type="password" 
            class="form-input" 
            v-model="form.config.personalAccessToken" 
            placeholder="Votre PAT Azure DevOps"
            required 
          />
          <small class="form-hint">
            Créez un PAT avec les permissions : Work Items (Read), Build (Read)
          </small>
        </div>
      </div>

      <!-- Sélection des projets -->
      <div class="form-section">
        <h4 class="section-title">Projets à crawler</h4>
        <div class="form-group">
          <div class="discover-projects">
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              @click="discoverProjects"
              :disabled="discoveringProjects || !form.config.organizationUrl || !form.config.personalAccessToken"
            >
              {{ discoveringProjects ? '⏳ Découverte...' : '🔍 Découvrir les projets' }}
            </button>
            <small class="form-hint">Découvre tous les projets disponibles dans l'organisation</small>
          </div>
        </div>
        <div v-if="availableProjects.length > 0" class="form-group">
          <label class="form-label">Sélectionner les projets</label>
          <div class="projects-selector">
            <div class="projects-header">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  :checked="allProjectsSelected"
                  @change="toggleAllProjects"
                />
                <span><strong>Tous les projets</strong></span>
              </label>
            </div>
            <div class="projects-list">
              <label 
                v-for="project in availableProjects" 
                :key="project.id"
                class="checkbox-label project-checkbox"
              >
                <input 
                  type="checkbox" 
                  :value="project.name"
                  v-model="form.config.selectedProjects"
                />
                <span>{{ project.name }}</span>
                <small v-if="project.description" class="project-description">{{ project.description }}</small>
              </label>
            </div>
            <small class="form-hint">
              {{ form.config.selectedProjects.length === 0 
                ? 'Aucun projet sélectionné = tous les projets seront crawles' 
                : `${form.config.selectedProjects.length} projet(s) sélectionné(s)` }}
            </small>
          </div>
        </div>
        <div v-else-if="form.config.organizationUrl && form.config.personalAccessToken" class="form-group">
          <small class="form-hint">Cliquez sur "Découvrir les projets" pour voir la liste des projets disponibles</small>
        </div>
      </div>

      <!-- Options de crawl -->
      <div class="form-section">
        <h4 class="section-title">Options de crawl</h4>
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="form.config.crawlPipelines"
            />
            <span>Crawler les pipelines</span>
          </label>
          <small class="form-hint">Récupère les informations des pipelines de build et release</small>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="form.config.crawlRepositories"
            />
            <span>Crawler les dépôts (repositories)</span>
          </label>
          <small class="form-hint">Récupère les informations des dépôts Git</small>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="form.config.crawlLogs"
            />
            <span>Crawler les logs de pipelines</span>
          </label>
          <small class="form-hint">Récupère les logs détaillés des builds et publications (pour le crawl manuel)</small>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="form.config.crawlWorkItems"
            />
            <span>Crawler les work items associés</span>
          </label>
          <small class="form-hint">Récupère les work items (tickets) liés aux builds (pour le crawl manuel)</small>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="form.config.crawlReleases"
            />
            <span>Crawler les releases/publications</span>
          </label>
          <small class="form-hint">Récupère les informations des releases et publications</small>
        </div>
      </div>

      <!-- Planification -->
      <div class="form-section">
        <h4 class="section-title">Planification du crawl</h4>
        <div class="form-group">
          <label class="form-label">Jours de la semaine *</label>
          <div class="days-selector">
            <label 
              v-for="(day, index) in weekDays" 
              :key="index"
              class="day-checkbox"
            >
              <input 
                type="checkbox" 
                :value="index" 
                v-model="form.schedule.days"
              />
              <span>{{ day }}</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Heures *</label>
          <div class="hours-selector">
            <div class="hours-grid">
              <label 
                v-for="hour in 24" 
                :key="hour - 1"
                class="hour-checkbox"
              >
                <input 
                  type="checkbox" 
                  :value="hour - 1" 
                  v-model="form.schedule.hours"
                />
                <span>{{ String(hour - 1).padStart(2, '0') }}:00</span>
              </label>
            </div>
            <small class="form-hint">Sélectionnez les heures auxquelles le crawl doit s'exécuter</small>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Fuseau horaire</label>
          <select class="form-select" v-model="form.schedule.timezone">
            <option value="Europe/Paris">Europe/Paris</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </select>
        </div>
      </div>

      <!-- Statut -->
      <div class="form-section">
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.isActive" />
            <span>Activer cette source</span>
          </label>
        </div>
      </div>

      <!-- Messages d'erreur/succès -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="$emit('close')">
          Annuler
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Enregistrement...' : (editing ? 'Modifier' : 'Créer') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import api from '../api/client.js';

const props = defineProps({
  source: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['submit', 'close']);

const editing = ref(!!props.source);
const saving = ref(false);
const error = ref('');
const discoveringProjects = ref(false);
const availableProjects = ref([]);

const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const form = reactive({
  name: props.source?.name || '',
  type: 'azure-devops',
  description: props.source?.description || '',
  config: {
    organizationUrl: props.source?.config?.organizationUrl || '',
    personalAccessToken: props.source?.config?.personalAccessToken || '',
    crawlRepositories: props.source?.config?.crawlRepositories ?? false,
    crawlPipelines: props.source?.config?.crawlPipelines ?? false,
    crawlLogs: props.source?.config?.crawlLogs ?? true,
    crawlWorkItems: props.source?.config?.crawlWorkItems ?? true,
    crawlReleases: props.source?.config?.crawlReleases ?? false,
    selectedProjects: props.source?.config?.selectedProjects ? [...props.source.config.selectedProjects] : []
  },
  schedule: {
    days: props.source?.schedule?.days ? [...props.source.schedule.days] : [1, 2, 3, 4, 5], // Lun-Ven par défaut
    hours: props.source?.schedule?.hours ? [...props.source.schedule.hours] : [9, 12, 15, 18], // 9h, 12h, 15h, 18h par défaut
    timezone: props.source?.schedule?.timezone || 'Europe/Paris'
  },
  isActive: props.source?.isActive ?? true
});

// Charger les projets disponibles si on est en mode édition et qu'on a déjà l'URL et le PAT
if (props.source && props.source._id && props.source.config?.organizationUrl && props.source.config?.personalAccessToken) {
  // Ne pas charger automatiquement, l'utilisateur devra cliquer sur "Découvrir"
  // discoverProjects();
}

const allProjectsSelected = computed(() => {
  return availableProjects.value.length > 0 && 
         form.config.selectedProjects.length === availableProjects.value.length;
});

const toggleAllProjects = (event) => {
  if (event.target.checked) {
    form.config.selectedProjects = availableProjects.value.map(p => p.name);
  } else {
    form.config.selectedProjects = [];
  }
};

const discoverProjects = async () => {
  if (!form.config.organizationUrl || !form.config.personalAccessToken) {
    error.value = 'Veuillez d\'abord remplir l\'URL de l\'organisation et le PAT';
    return;
  }

  discoveringProjects.value = true;
  error.value = '';

  try {
    // Créer une source temporaire pour découvrir les projets
    const tempSource = {
      config: {
        organizationUrl: form.config.organizationUrl,
        personalAccessToken: form.config.personalAccessToken
      }
    };

    // Appel API pour découvrir les projets
    const response = await api.post('/admin/data-sources/discover-projects', {
      config: {
        organizationUrl: form.config.organizationUrl,
        personalAccessToken: form.config.personalAccessToken
      }
    });

    availableProjects.value = response.data.projects || [];

    // Si on est en mode édition et qu'on a déjà des projets sélectionnés, les pré-sélectionner
    if (props.source?.config?.selectedProjects && props.source.config.selectedProjects.length > 0) {
      // Garder seulement les projets qui existent toujours
      form.config.selectedProjects = props.source.config.selectedProjects.filter(
        name => availableProjects.value.some(p => p.name === name)
      );
    }
  } catch (err) {
    const errorMessage = err.response?.data?.error || err.message || 'Erreur lors de la découverte des projets';
    error.value = errorMessage;
    console.error('Erreur découverte projets:', err);
    console.error('Détails:', err.response?.data);
    availableProjects.value = [];
    
    // Afficher une alerte pour informer l'utilisateur
    alert(`❌ Erreur lors de la découverte des projets:\n\n${errorMessage}\n\nVérifiez:\n- L'URL de l'organisation est correcte\n- Le PAT est valide et a les bonnes permissions\n- La connexion réseau fonctionne`);
  } finally {
    discoveringProjects.value = false;
  }
};

const handleSubmit = async () => {
  if (form.schedule.days.length === 0) {
    error.value = 'Veuillez sélectionner au moins un jour';
    return;
  }
  if (form.schedule.hours.length === 0) {
    error.value = 'Veuillez sélectionner au moins une heure';
    return;
  }
  if (!form.config.crawlRepositories && !form.config.crawlPipelines) {
    error.value = 'Veuillez sélectionner au moins une option de crawl (repositories ou pipelines)';
    return;
  }
  
  // Si crawlLogs ou crawlWorkItems est activé, crawlPipelines doit l'être aussi
  if ((form.config.crawlLogs || form.config.crawlWorkItems) && !form.config.crawlPipelines) {
    error.value = 'Pour crawler les logs ou work items, vous devez activer le crawl des pipelines';
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    await emit('submit', { ...form });
  } catch (err) {
    error.value = err.message || 'Erreur lors de l\'enregistrement';
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.azure-devops-form {
  background: var(--surface);
  border-radius: var(--radius-lg);
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 10;
}

.form-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.form-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
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

.form-content {
  padding: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-light);
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-color);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--background);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-primary);
}

.checkbox-label input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.days-selector {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.day-checkbox {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--background);
}

.day-checkbox:hover {
  border-color: var(--primary-color);
  background: var(--surface-hover);
}

.day-checkbox input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.day-checkbox span {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.day-checkbox:has(input:checked) {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.day-checkbox:has(input:checked) span {
  color: white;
}

.hours-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hours-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--background);
}

.hour-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--surface);
  font-size: 0.875rem;
}

.hour-checkbox:hover {
  border-color: var(--primary-color);
  background: var(--surface-hover);
}

.hour-checkbox input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.hour-checkbox span {
  font-weight: 500;
  color: var(--text-primary);
}

.hour-checkbox:has(input:checked) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.hour-checkbox:has(input:checked) span {
  color: white;
}

.discover-projects {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.projects-selector {
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 1rem;
  background: var(--background);
  max-height: 300px;
  overflow-y: auto;
}

.projects-header {
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.project-checkbox {
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--surface);
  transition: background 0.2s ease;
}

.project-checkbox:hover {
  background: var(--surface-hover);
}

.project-description {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-style: italic;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
  padding: 1rem;
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
  border-left: 4px solid var(--danger-color);
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-color);
}

@media (max-width: 768px) {
  .days-selector {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
