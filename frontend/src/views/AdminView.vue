<template>
  <div class="admin-view">
    <div class="breadcrumb">
      <span class="breadcrumb-item">📋 Chronicle</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item active">Back Office</span>
    </div>

    <div class="grid grid-2">
      <!-- Formulaire d'ajout d'événement -->
      <div class="card admin-card">
        <div class="card-header">
          <div class="card-icon">📅</div>
          <h3>Ajouter un événement</h3>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">Titre *</label>
            <input 
              type="text" 
              class="form-input"
              v-model="eventForm.title"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Description *</label>
            <textarea 
              class="form-textarea"
              v-model="eventForm.description"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Type *</label>
            <select class="form-select" v-model="eventForm.type" required>
              <option value="maintenance">Maintenance</option>
              <option value="intervention">Intervention</option>
              <option value="incident">Incident</option>
              <option value="announcement">Annonce</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Site *</label>
            <input 
              type="text" 
              class="form-input"
              v-model="eventForm.site"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Application</label>
            <input 
              type="text" 
              class="form-input"
              v-model="eventForm.application"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Date de début *</label>
            <input 
              type="datetime-local" 
              class="form-input"
              v-model="eventForm.startDate"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Date de fin</label>
            <input 
              type="datetime-local" 
              class="form-input"
              v-model="eventForm.endDate"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Impact</label>
            <select class="form-select" v-model="eventForm.impact">
              <option value="low">Faible</option>
              <option value="medium">Moyen</option>
              <option value="high">Élevé</option>
              <option value="critical">Critique</option>
            </select>
          </div>

          <div v-if="submitError" class="error">
            {{ submitError }}
          </div>

          <div v-if="submitSuccess" class="success">
            Événement créé avec succès !
          </div>

          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? 'Création...' : 'Créer l\'événement' }}
          </button>
        </form>
      </div>

      <!-- Formulaire d'ajout de changelog manuel -->
      <div class="card admin-card">
        <div class="card-header">
          <div class="card-icon">📝</div>
          <h3>Ajouter un changelog manuel</h3>
        </div>
        <form @submit.prevent="handleChangelogSubmit">
          <div class="form-group">
            <label class="form-label">Site *</label>
            <input 
              type="text" 
              class="form-input"
              v-model="changelogForm.site"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Application *</label>
            <input 
              type="text" 
              class="form-input"
              v-model="changelogForm.application"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Version *</label>
            <input 
              type="text" 
              class="form-input"
              v-model="changelogForm.version"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Numéro de build *</label>
            <input 
              type="text" 
              class="form-input"
              v-model="changelogForm.buildNumber"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Date du build</label>
            <input 
              type="datetime-local" 
              class="form-input"
              v-model="changelogForm.buildDate"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Modifications</label>
            <div 
              v-for="(change, index) in changelogForm.changes" 
              :key="index"
              class="change-item"
            >
              <div class="grid grid-2">
                <select 
                  class="form-select"
                  v-model="change.type"
                  required
                >
                  <option value="feature">Nouvelle fonctionnalité</option>
                  <option value="fix">Correction</option>
                  <option value="update">Mise à jour</option>
                  <option value="security">Sécurité</option>
                  <option value="breaking">Changement majeur</option>
                </select>
                <input 
                  type="text" 
                  class="form-input"
                  v-model="change.description"
                  placeholder="Description"
                  required
                />
              </div>
            </div>
            <button 
              type="button" 
              class="btn btn-secondary"
              @click="addChange"
              style="margin-top: 0.5rem;"
            >
              + Ajouter une modification
            </button>
          </div>

          <div v-if="changelogSubmitError" class="error">
            {{ changelogSubmitError }}
          </div>

          <div v-if="changelogSubmitSuccess" class="success">
            Changelog créé avec succès !
          </div>

          <button type="submit" class="btn btn-primary" :disabled="changelogSubmitting">
            {{ changelogSubmitting ? 'Création...' : 'Créer le changelog' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useEventsStore } from '../stores/events.js';
import { useChangelogsStore } from '../stores/changelogs.js';

const eventsStore = useEventsStore();
const changelogsStore = useChangelogsStore();

const eventForm = reactive({
  title: '',
  description: '',
  type: 'maintenance',
  site: '',
  application: '',
  startDate: '',
  endDate: '',
  impact: 'medium'
});

const changelogForm = reactive({
  site: '',
  application: '',
  version: '',
  buildNumber: '',
  buildDate: '',
  changes: [{ type: 'update', description: '' }]
});

const submitting = ref(false);
const submitError = ref('');
const submitSuccess = ref(false);

const changelogSubmitting = ref(false);
const changelogSubmitError = ref('');
const changelogSubmitSuccess = ref(false);

const handleSubmit = async () => {
  submitting.value = true;
  submitError.value = '';
  submitSuccess.value = false;

  try {
    const eventData = {
      ...eventForm,
      startDate: new Date(eventForm.startDate).toISOString(),
      endDate: eventForm.endDate ? new Date(eventForm.endDate).toISOString() : undefined
    };

    await eventsStore.createEvent(eventData);
    
    // Reset form
    Object.assign(eventForm, {
      title: '',
      description: '',
      type: 'maintenance',
      site: '',
      application: '',
      startDate: '',
      endDate: '',
      impact: 'medium'
    });
    
    submitSuccess.value = true;
    setTimeout(() => {
      submitSuccess.value = false;
    }, 3000);
  } catch (error) {
    submitError.value = error;
  } finally {
    submitting.value = false;
  }
};

const handleChangelogSubmit = async () => {
  changelogSubmitting.value = true;
  changelogSubmitError.value = '';
  changelogSubmitSuccess.value = false;

  try {
    const changelogData = {
      ...changelogForm,
      buildDate: changelogForm.buildDate 
        ? new Date(changelogForm.buildDate).toISOString() 
        : new Date().toISOString(),
      source: 'manual',
      changes: changelogForm.changes.filter(c => c.description.trim() !== '')
    };

    await changelogsStore.createChangelog(changelogData);
    
    // Reset form
    Object.assign(changelogForm, {
      site: '',
      application: '',
      version: '',
      buildNumber: '',
      buildDate: '',
      changes: [{ type: 'update', description: '' }]
    });
    
    changelogSubmitSuccess.value = true;
    setTimeout(() => {
      changelogSubmitSuccess.value = false;
    }, 3000);
  } catch (error) {
    changelogSubmitError.value = error;
  } finally {
    changelogSubmitting.value = false;
  }
};

const addChange = () => {
  changelogForm.changes.push({ type: 'update', description: '' });
};
</script>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.breadcrumb-item {
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.breadcrumb-item.active {
  color: var(--text-primary);
  font-weight: 600;
}

.breadcrumb-separator {
  color: var(--text-muted);
}

.admin-card {
  border-top: 4px solid var(--primary-color);
  transition: all 0.3s ease;
}

.admin-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-light);
}

.card-icon {
  font-size: 1.75rem;
  line-height: 1;
}

.card-header h3 {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-primary);
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

.success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
  color: var(--success-color);
  padding: 1rem 1.25rem;
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
  border-left: 4px solid var(--success-color);
  font-weight: 500;
}

.change-item {
  margin-bottom: 0.75rem;
  padding: 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-color);
  transition: all 0.2s ease;
}

.change-item:hover {
  border-color: var(--primary-color);
  background: var(--surface-hover);
}

.btn-primary {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>













